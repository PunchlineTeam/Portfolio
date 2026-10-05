// Live stats for the site. GitHub's "hourly" cron actually runs every 3-7 hours,
// so the committed games-data.json is often hours old.
//
// The cron snapshot stays the base (game list, thumbnails, member counts, peakCCU
// records). Here we only refresh what changes in real time — visits and players
// online — with a single batched Roblox call. Listing group games or member
// counts per request gets rate-limited (429) by Roblox, so those stay with the cron.
// Any failure throws, and the site falls back to the snapshot itself.

const BASE_URL =
  "https://raw.githubusercontent.com/PunchlineTeam/Portfolio/master/games-data.json";
const MIN_VISITS = 1000000; // Only show games with 1M+ visits (same as the cron)
const CACHE_MS = 60 * 1000;

// Per-isolate cache (the Cache API is a no-op on workers.dev). Best effort only,
// but it keeps bursts of visitors from re-querying Roblox every time.
let cached = null;

async function getJSON(url) {
  const res = await fetch(url, { headers: { "User-Agent": "PunchlineStats/1.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function getGameDetails(universeIds) {
  const batches = [];
  for (let i = 0; i < universeIds.length; i += 50) {
    const ids = universeIds.slice(i, i + 50).join(",");
    batches.push(getJSON(`https://games.roblox.com/v1/games?universeIds=${ids}`));
  }
  return (await Promise.all(batches)).flatMap((res) => res.data || []);
}

async function getThumbnails(universeIds) {
  const ids = universeIds.slice(0, 30).join(",");
  const res = await getJSON(
    `https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${ids}&countPerUniverse=1&size=768x432&format=Png`
  );
  const map = {};
  for (const item of res.data || []) {
    if (item.thumbnails && item.thumbnails[0] && item.thumbnails[0].imageUrl) {
      map[item.universeId] = item.thumbnails[0].imageUrl;
    }
  }
  return map;
}

async function buildStats() {
  const base = await getJSON(BASE_URL + "?v=" + Date.now());
  const baseById = new Map(base.games.map((g) => [g.universeId, g]));

  // Older snapshots lack universeGroups; then only the shown games are refreshed
  // and the totals are adjusted by their change since the snapshot.
  const groupOf = base.universeGroups ||
    Object.fromEntries(base.games.map((g) => [g.universeId, g.groupName]));
  const complete = Boolean(base.universeGroups);

  const details = await getGameDetails(Object.keys(groupOf));

  let totalVisits = complete ? 0 : base.totalVisits;
  let totalPlaying = complete ? 0 : base.totalPlaying;
  const shown = [];
  for (const d of details) {
    const visits = d.visits || 0;
    const playing = d.playing || 0;
    if (complete) {
      totalVisits += visits;
      totalPlaying += playing;
    } else {
      const prev = baseById.get(d.id);
      totalVisits += visits - (prev?.visits || 0);
      totalPlaying += playing - (prev?.playing || 0);
    }
    if (visits >= MIN_VISITS) shown.push(d);
  }

  // A game that just crossed 1M has no thumbnail in the snapshot yet.
  const missing = shown.filter((d) => !baseById.get(d.id)?.thumbnailUrl).map((d) => d.id);
  const thumbs = missing.length ? await getThumbnails(missing).catch(() => ({})) : {};

  const games = shown
    .map((d) => {
      const prev = baseById.get(d.id);
      const playing = d.playing || 0;
      return {
        name: d.name,
        visits: d.visits || 0,
        playing,
        groupName: groupOf[d.id] || prev?.groupName || "",
        thumbnailUrl: prev?.thumbnailUrl || thumbs[d.id] || "",
        gameUrl: `https://www.roblox.com/games/${d.rootPlaceId}`,
        universeId: d.id,
        peakCCU: Math.max(prev?.peakCCU || 0, playing),
      };
    })
    .sort((a, b) => b.visits - a.visits);

  return {
    totalVisits,
    totalPlaying,
    totalMembers: base.totalMembers,
    totalGames: games.length,
    totalGroups: base.totalGroups,
    updatedAt: new Date().toISOString(),
    games,
  };
}

export async function handleStats(cors) {
  const now = Date.now();
  if (!cached || now - cached.at > CACHE_MS) {
    cached = { at: now, body: JSON.stringify(await buildStats()) };
  }
  return new Response(cached.body, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=30",
      ...cors,
    },
  });
}
