const https = require("https");

const GROUPS = [
  { name: "Punchline Team", id: 33016906 },
  { name: "Punchline Studio", id: 17004458 },
  { name: "Punchline Lite", id: 34943400 },
  { name: "Punchline Ultra", id: 35497063 },
  { name: "PunchLineX Studio", id: 546395507 },
  { name: "Punchlite Digital", id: 498378381 },
  { name: "Brain Trip Studio", id: 562599395 },
  { name: "Bum Bun Games", id: 35982430 },
  { name: "Rot Brain Monkey", id: 789093649 },
  { name: "Shma Team", id: 69921098 },
  { name: "Ultra Crabers", id: 446440196 },
  { name: "Wind Sun Moon WSM", id: 480951000 },
  { name: "Brigade Of Figures", id: 366879284 },
  { name: "Mission Of Future", id: 35962840 },
];

// Roblox rate-limits (429) bursts of requests. Retry with backoff before giving up.
async function fetch(url, attempts = 4) {
  for (let i = 1; ; i++) {
    try {
      return await fetchOnce(url);
    } catch (e) {
      if (i >= attempts) throw e;
      console.warn(`    Retry ${i}/${attempts - 1} after: ${e.message.slice(0, 120)}`);
      await sleep(2000 * 2 ** (i - 1));
    }
  }
}

function fetchOnce(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "PunchlineUpdater/1.0" } }, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode} for ${url}: ${data}`));
            return;
          }
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`JSON parse error for ${url}: ${e.message}`));
          }
        });
      })
      .on("error", reject);
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getGroupGames(groupId) {
  const universes = [];
  let cursor = "";
  do {
    const url = `https://games.roblox.com/v2/groups/${groupId}/games?limit=100&sortOrder=Asc${cursor ? `&cursor=${cursor}` : ""}`;
    const res = await fetch(url);
    if (res.data) universes.push(...res.data);
    cursor = res.nextPageCursor || "";
    if (cursor) await sleep(500);
  } while (cursor);
  return universes;
}

async function getGameDetails(universeIds) {
  if (universeIds.length === 0) return [];
  const results = [];
  // API allows up to 50 IDs per request
  for (let i = 0; i < universeIds.length; i += 50) {
    const batch = universeIds.slice(i, i + 50);
    const url = `https://games.roblox.com/v1/games?universeIds=${batch.join(",")}`;
    const res = await fetch(url);
    if (res.data) results.push(...res.data);
    if (i + 50 < universeIds.length) await sleep(500);
  }
  return results;
}

async function getThumbnails(universeIds) {
  if (universeIds.length === 0) return {};
  const map = {};
  for (let i = 0; i < universeIds.length; i += 30) {
    const batch = universeIds.slice(i, i + 30);
    const url = `https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${batch.join(",")}&countPerUniverse=1&size=768x432&format=Png`;
    const res = await fetch(url);
    if (res.data) {
      for (const item of res.data) {
        if (item.thumbnails && item.thumbnails.length > 0 && item.thumbnails[0].imageUrl) {
          map[item.universeId] = item.thumbnails[0].imageUrl;
        }
      }
    }
    if (i + 30 < universeIds.length) await sleep(500);
  }
  return map;
}

async function main() {
  console.log("Fetching games from all groups...");

  const allGames = [];
  const groupNameMap = {};
  // A partial snapshot must never be written: on 2026-08-21 a run that lost most
  // groups to 429s committed 13 of 42 games, and the next run dropped the
  // peakCCU records of every missing game. Collect failures and abort instead.
  const failures = [];

  for (const group of GROUPS) {
    console.log(`  Fetching games for ${group.name} (${group.id})...`);
    try {
      const games = await getGroupGames(group.id);
      for (const g of games) {
        groupNameMap[g.id] = group.name;
        allGames.push(g);
      }
      console.log(`    Found ${games.length} games`);
    } catch (e) {
      console.error(`    Error fetching group ${group.name}: ${e.message}`);
      failures.push(`games of ${group.name}`);
    }
    await sleep(300);
  }

  const universeIds = allGames.map((g) => g.id);
  console.log(`\nFetching details for ${universeIds.length} games...`);
  const details = await getGameDetails(universeIds);
  const detailsMap = {};
  for (const d of details) detailsMap[d.id] = d;

  console.log("Fetching thumbnails...");
  const thumbnails = await getThumbnails(universeIds);

  const games = [];
  let totalVisits = 0;
  let totalPlaying = 0;

  const MIN_VISITS = 1000000; // Only show games with 1M+ visits

  // Count totals across ALL games
  for (const g of allGames) {
    const d = detailsMap[g.id];
    if (!d) continue;
    totalVisits += d.visits || 0;
    totalPlaying += d.playing || 0;
  }

  // Only display games with 1M+ visits
  for (const g of allGames) {
    const d = detailsMap[g.id];
    if (!d) continue;

    const visits = d.visits || 0;
    const playing = d.playing || 0;
    if (visits < MIN_VISITS) continue;

    games.push({
      name: d.name,
      visits,
      playing,
      groupName: groupNameMap[g.id] || "",
      thumbnailUrl: thumbnails[g.id] || "",
      gameUrl: `https://www.roblox.com/games/${d.rootPlaceId}`,
      universeId: g.id,
    });
  }

  // Sort by visits descending
  games.sort((a, b) => b.visits - a.visits);

  // Fetch member counts for all groups
  console.log("Fetching group member counts...");
  let totalMembers = 0;
  for (const group of GROUPS) {
    try {
      const info = await fetch(`https://groups.roblox.com/v1/groups/${group.id}`);
      totalMembers += info.memberCount || 0;
    } catch (e) {
      console.error(`    Error fetching members for ${group.name}: ${e.message}`);
      failures.push(`members of ${group.name}`);
    }
    await sleep(300);
  }
  console.log(`Total members across all groups: ${totalMembers}`);

  if (failures.length) {
    throw new Error(`Incomplete data (${failures.join(", ")}); keeping the previous snapshot`);
  }

  // Load existing data to preserve peakCCU records
  const fs = require("fs");
  const path = require("path");
  const outPath = path.join(__dirname, "..", "games-data.json");
  let existingPeaks = {};
  let existing = null;
  try {
    existing = JSON.parse(fs.readFileSync(outPath, "utf8"));
    for (const g of existing.games) {
      if (g.peakCCU) existingPeaks[g.universeId] = g.peakCCU;
    }
  } catch (e) {
    // No existing data, start fresh
  }

  // Visits only ever grow, so a noticeable drop means some data went missing.
  if (existing && totalVisits < existing.totalVisits * 0.98) {
    throw new Error(
      `Total visits dropped from ${existing.totalVisits} to ${totalVisits}; keeping the previous snapshot`
    );
  }

  // Set peakCCU: keep existing record if higher, otherwise use current playing
  for (const game of games) {
    const oldPeak = existingPeaks[game.universeId] || 0;
    game.peakCCU = Math.max(oldPeak, game.playing);
  }

  const output = {
    totalVisits,
    totalPlaying,
    totalMembers,
    totalGames: games.length,
    totalGroups: GROUPS.length,
    games,
    // Every game (incl. <1M visits) → group. The live stats Worker refreshes
    // visits/playing for all of them in one batch call, since listing group games
    // per request gets rate-limited by Roblox.
    universeGroups: groupNameMap,
  };

  fs.writeFileSync(outPath, JSON.stringify(output, null, 2) + "\n");
  console.log(`\nDone! ${games.length} games, ${totalVisits} total visits, ${totalPlaying} playing now`);
  console.log(`Written to ${outPath}`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
