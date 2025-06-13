function parseUrlStructure(tabUrl) {
  // Enhanced regex to match various URL patterns with season and episode
  const patterns = [
    // Pattern 1: /season/X/episode/Y
    /^(.*\/season\/)(\d+)(\/episode\/)(\d+)(.*)$/,
    // Pattern 2: /sX/eY or /sX-eY
    /^(.*\/s)(\d+)(\/e|[-_]e?)(\d+)(.*)$/,
    // Pattern 3: /seasonX/episodeY
    /^(.*\/season)(\d+)(\/episode)(\d+)(.*)$/,
    // Pattern 4: /SXX/EYY
    /^(.*\/S)(\d+)(\/E)(\d+)(.*)$/i,
    // Pattern 5: Just episode number at the end (fallback)
    /^(.*?)(\d+)([^\/]*)$/
  ];

  for (let i = 0; i < patterns.length; i++) {
    const match = tabUrl.match(patterns[i]);
    if (match) {
      if (i === 4) {
        // Last pattern is episode-only (legacy support)
        return {
          type: 'episode-only',
          prefix: match[1],
          episodeNumber: match[2],
          suffix: match[3],
          episodeLength: match[2].length,
          fullMatch: match
        };
      } else {
        // Season and episode patterns
        return {
          type: 'season-episode',
          seasonPrefix: match[1],
          seasonNumber: match[2],
          episodePrefix: match[3],
          episodeNumber: match[4],
          suffix: match[5],
          seasonLength: match[2].length,
          episodeLength: match[4].length,
          fullMatch: match
        };
      }
    }
  }
  return null;
}

function modifyUrl(change = 0, custom = null, action = 'episode') {
  const api = (typeof browser !== 'undefined') ? browser : chrome;
  
  api.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const tab = tabs[0];
    const urlStructure = parseUrlStructure(tab.url);
    const status = document.getElementById("status");

    if (!urlStructure) {
      status.textContent = "Could not parse URL structure.";
      return;
    }

    let newUrl = null;

    if (action === 'next-season' && urlStructure.type === 'season-episode') {
      // Next season: increment season, reset episode to 1
      const newSeason = parseInt(urlStructure.seasonNumber, 10) + 1;
      const paddedSeason = newSeason.toString().padStart(urlStructure.seasonLength, '0');
      const paddedEpisode = '1'.padStart(urlStructure.episodeLength, '0');
      
      newUrl = `${urlStructure.seasonPrefix}${paddedSeason}${urlStructure.episodePrefix}${paddedEpisode}${urlStructure.suffix}`;
      
    } else if (action === 'prev-season' && urlStructure.type === 'season-episode') {
      // Previous season: decrement season, reset episode to 1
      const newSeason = Math.max(1, parseInt(urlStructure.seasonNumber, 10) - 1);
      const paddedSeason = newSeason.toString().padStart(urlStructure.seasonLength, '0');
      const paddedEpisode = '1'.padStart(urlStructure.episodeLength, '0');
      
      newUrl = `${urlStructure.seasonPrefix}${paddedSeason}${urlStructure.episodePrefix}${paddedEpisode}${urlStructure.suffix}`;
      
    } else if (action === 'episode') {
      // Episode modification
      if (urlStructure.type === 'season-episode') {
        let finalEpisode;
        if (custom !== null) {
          finalEpisode = parseInt(custom, 10);
        } else {
          finalEpisode = parseInt(urlStructure.episodeNumber, 10) + change;
        }
        
        if (finalEpisode < 1) finalEpisode = 1;
        
        const paddedEpisode = finalEpisode.toString().padStart(urlStructure.episodeLength, '0');
        newUrl = `${urlStructure.seasonPrefix}${urlStructure.seasonNumber}${urlStructure.episodePrefix}${paddedEpisode}${urlStructure.suffix}`;
        
      } else if (urlStructure.type === 'episode-only') {
        let finalEpisode;
        if (custom !== null) {
          finalEpisode = parseInt(custom, 10);
        } else {
          finalEpisode = parseInt(urlStructure.episodeNumber, 10) + change;
        }
        
        if (finalEpisode < 1) finalEpisode = 1;
        
        const paddedEpisode = finalEpisode.toString().padStart(urlStructure.episodeLength, '0');
        newUrl = `${urlStructure.prefix}${paddedEpisode}${urlStructure.suffix}`;
      }
    } else if (action === 'season' && urlStructure.type === 'season-episode') {
      // Season modification (keep same episode)
      let finalSeason;
      if (custom !== null) {
        finalSeason = parseInt(custom, 10);
      } else {
        finalSeason = parseInt(urlStructure.seasonNumber, 10) + change;
      }
      
      if (finalSeason < 1) finalSeason = 1;
      
      const paddedSeason = finalSeason.toString().padStart(urlStructure.seasonLength, '0');
      newUrl = `${urlStructure.seasonPrefix}${paddedSeason}${urlStructure.episodePrefix}${urlStructure.episodeNumber}${urlStructure.suffix}`;
    }

    if (newUrl && newUrl !== tab.url) {
      api.tabs.create({ url: newUrl }).then(() => {
        status.textContent = `Opening: ${newUrl}`;
      }).catch((error) => {
        status.textContent = `Error: ${error.message}`;
      });
    } else if (newUrl === tab.url) {
      status.textContent = "URL unchanged.";
    } else {
      status.textContent = "Could not modify URL.";
    }
  });
}

function updateUI() {
  const api = (typeof browser !== 'undefined') ? browser : chrome;
  
  api.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const tab = tabs[0];
    const urlStructure = parseUrlStructure(tab.url);
    const seasonControls = document.getElementById('season-controls');
    const currentInfo = document.getElementById('current-info');

    if (urlStructure && urlStructure.type === 'season-episode') {
      seasonControls.style.display = 'block';
      currentInfo.textContent = `S${urlStructure.seasonNumber} E${urlStructure.episodeNumber}`;
      currentInfo.style.display = 'block';
    } else if (urlStructure && urlStructure.type === 'episode-only') {
      seasonControls.style.display = 'none';
      currentInfo.textContent = `Episode ${urlStructure.episodeNumber}`;
      currentInfo.style.display = 'block';
    } else {
      seasonControls.style.display = 'none';
      currentInfo.style.display = 'none';
    }
  });
}

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
  // Update UI based on current URL
  updateUI();

  // Episode controls
  document.getElementById("episode-decrement").addEventListener("click", () => modifyUrl(-1, null, 'episode'));
  document.getElementById("episode-increment").addEventListener("click", () => modifyUrl(1, null, 'episode'));
  document.getElementById("go-to-episode").addEventListener("click", () => {
    const val = document.getElementById("episode-number").value.trim();
    if (!isNaN(val) && val !== "" && parseInt(val) >= 1) {
      modifyUrl(0, val, 'episode');
    } else {
      document.getElementById("status").textContent = "Please enter a valid episode number (≥1).";
    }
  });

  // Season controls
  document.getElementById("season-decrement").addEventListener("click", () => modifyUrl(-1, null, 'season'));
  document.getElementById("season-increment").addEventListener("click", () => modifyUrl(1, null, 'season'));
  document.getElementById("next-season").addEventListener("click", () => modifyUrl(0, null, 'next-season'));
  document.getElementById("prev-season").addEventListener("click", () => modifyUrl(0, null, 'prev-season'));
  document.getElementById("go-to-season").addEventListener("click", () => {
    const val = document.getElementById("season-number").value.trim();
    if (!isNaN(val) && val !== "" && parseInt(val) >= 1) {
      modifyUrl(0, val, 'season');
    } else {
      document.getElementById("status").textContent = "Please enter a valid season number (≥1).";
    }
  });

  // Enter key support
  document.getElementById("episode-number").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
      document.getElementById("go-to-episode").click();
    }
  });

  document.getElementById("season-number").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
      document.getElementById("go-to-season").click();
    }
  });
});