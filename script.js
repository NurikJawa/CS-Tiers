const root = document.documentElement;
const themeToggle = document.getElementById("themeToggle");
const themeLabel = document.getElementById("themeLabel");
const themeIcon = document.getElementById("themeIcon");
const storageKey = "cs-tiers-theme";

function applyTheme(theme) {
  root.setAttribute("data-theme", theme);
  const isLight = theme === "light";
  themeLabel.textContent = isLight ? "Light" : "Dark";
  themeIcon.textContent = isLight ? "☀" : "🌙";
}

const saved = localStorage.getItem(storageKey);
if (saved === "light" || saved === "dark") {
  applyTheme(saved);
} else {
  const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
  applyTheme(prefersLight ? "light" : "dark");
}

themeToggle.addEventListener("click", () => {
  const current = root.getAttribute("data-theme") === "light" ? "light" : "dark";
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem(storageKey, next);
});

const tabs = Array.from(document.querySelectorAll(".mode-tab"));
const panels = Array.from(document.querySelectorAll(".tab-panel"));

function setActiveTab(tabId) {
  tabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.tabTarget === tabId);
  });

  panels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.dataset.tabPanel === tabId);
  });
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => setActiveTab(tab.dataset.tabTarget));
});

const titleByPlayer = {
  nurikkk: "CowBoy",
  soul: "Clutcher",
  w1nters: "Entry Frager",
  "рома": "Entry Frager",
  oligarh: "Son of the Major",
  "олигарх": "Son of the Major",
  zakon4ick: "None",
  china: "The emperor of Burgers, its me!",
  abdurahmet: "None",
  zils: "A Shadow",
};

const tierPoints = {
  master: 60,
  grandmaster: 45,
  ace: 30,
  intermediate: 15,
  meh: 5,
};

function titleClassFromTitle(title) {
  const t = (title || "").toLowerCase();
  if (t.includes("cow")) return "title-cowboy";
  if (t.includes("clutch")) return "title-clutcher";
  if (t.includes("entry")) return "title-entry";
  if (t.includes("major")) return "title-major";
  if (t.includes("emperor")) return "title-emperor";
  if (t.includes("shadow")) return "title-shadow";
  return "title-none";
}

function normalizeName(name) {
  return (name || "").trim().toLowerCase();
}

function parseCdRange(text) {
  const match = text.match(/([0-9]+(?:\.[0-9]+)?)\s*-\s*([0-9]+(?:\.[0-9]+)?)/);
  if (!match) return null;
  const min = Number.parseFloat(match[1]);
  const max = Number.parseFloat(match[2]);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  return { min, max };
}

function getWeaponFromPanel(panelId) {
  if (panelId === "awp") return "AWP";
  if (panelId === "rifle") return "RIFLE";
  if (panelId === "deagle") return "DEAGLE";
  if (panelId === "usp") return "USP";
  return null;
}

function tierFromChip(chip) {
  if (!chip) return "intermediate";
  const txt = (chip.querySelector("i")?.textContent || "").toUpperCase().trim();
  if (txt === "M") return "master";
  if (txt === "GM") return "grandmaster";
  if (txt === "A" || txt === "ACE") return "ace";
  if (txt === "MEH") return "meh";
  return "intermediate";
}

function tierPriority(tier) {
  if (tier === "master") return 0;
  if (tier === "grandmaster") return 1;
  if (tier === "ace") return 2;
  if (tier === "intermediate") return 3;
  return 4;
}

function tierLabel(tier) {
  if (tier === "master") return "MASTER";
  if (tier === "grandmaster") return "GRANDMASTER";
  if (tier === "ace") return "ACE";
  if (tier === "meh") return "MEH...";
  return "INTERMEDIATE";
}

function tierSymbol(tier) {
  if (tier === "master") return "M";
  if (tier === "grandmaster") return "GM";
  if (tier === "ace") return "A";
  if (tier === "meh") return "MEH";
  return "INT";
}

function combatLabelFromTier(tier) {
  if (tier === "master") return "Combat Master";
  if (tier === "grandmaster") return "Combat Grandmaster";
  if (tier === "ace") return "Combat Ace";
  if (tier === "meh") return "Combat Meh...";
  return "Combat Intermediate";
}

function extractBaseName(nickEl) {
  if (!nickEl) return "";
  if (nickEl.dataset.baseName) return nickEl.dataset.baseName;
  const raw = (nickEl.textContent || "").replace(/Combat.+$/i, "").trim();
  const firstLine = raw.split(/\r?\n/).map((v) => v.trim()).filter(Boolean)[0] || raw;
  return firstLine;
}

function rebuildNickBlock(item, points, combatTier) {
  const nick = item.querySelector(".nick");
  if (!nick) return;
  const baseName = extractBaseName(nick);
  nick.dataset.baseName = baseName;

  const key = normalizeName(baseName);
  const title = titleByPlayer[key] || "None";
  const titleClass = titleClassFromTitle(title);

  nick.textContent = "";

  const main = document.createElement("span");
  main.className = "nick-main";
  main.textContent = baseName;

  const metaTitle = document.createElement("span");
  metaTitle.className = `nick-meta ${titleClass}`;
  metaTitle.textContent = title;

  const stat = document.createElement("span");
  stat.className = "nick-meta nick-stat";
  stat.textContent = `${combatLabelFromTier(combatTier)} (${points} pts)`;

  nick.appendChild(main);
  nick.appendChild(metaTitle);
  nick.appendChild(stat);
}

function applyPointsAndTitles() {
  const lists = Array.from(document.querySelectorAll(".rank-list"));
  const playerMap = {};

  const mainList = document.querySelector('[data-tab-panel="main"] .rank-list');
  if (mainList) {
    const mainRows = Array.from(mainList.querySelectorAll(":scope > .rank-item"));
    mainRows.forEach((item) => {
      const rankTag = item.querySelector(".rank-tag");
      const kd = item.querySelector(".kd");
      if (!rankTag || !kd || rankTag.textContent.toUpperCase().includes("OPEN SLOT")) return;

      const name = normalizeName(extractBaseName(item.querySelector(".nick")));
      if (!name) return;

      const chips = Array.from(item.querySelectorAll(".skills .weapon-chip:not(.headshot-chip)"));
      const tiers = {
        awp: tierFromChip(chips[0]),
        rifle: tierFromChip(chips[1]),
        deagle: tierFromChip(chips[2]),
        usp: tierFromChip(chips[3]),
      };

      const points = Object.values(tiers).reduce((sum, t) => sum + (tierPoints[t] || 0), 0);
      const bestTier = Object.values(tiers).sort((a, b) => tierPriority(a) - tierPriority(b))[0] || "intermediate";

      const cdRaw = kd.dataset.baseCd || kd.textContent || "";
      const cdMatch = cdRaw.match(/CD\s*([0-9]+(?:\.[0-9]+)?)\s*-\s*([0-9]+(?:\.[0-9]+)?)/i);
      const baseCd = cdMatch ? `CD ${cdMatch[1]}-${cdMatch[2]}` : cdRaw.trim();
      const range = parseCdRange(baseCd);

      playerMap[name] = {
        tiers,
        points,
        bestTier,
        rangeMax: range ? range.max : 0,
        baseCd,
      };
    });
  }

  lists.forEach((list) => {
    const panel = list.closest("[data-tab-panel]");
    const panelId = panel?.dataset.tabPanel || "main";
    const weapon = getWeaponFromPanel(panelId);

    const rows = Array.from(list.querySelectorAll(":scope > .rank-item"));
    const activeRows = [];
    const openRows = [];

    rows.forEach((item) => {
      const rankTag = item.querySelector(".rank-tag");
      const kd = item.querySelector(".kd");
      if (!rankTag || !kd) return;

      const isOpen = rankTag.textContent.toUpperCase().includes("OPEN SLOT");
      if (isOpen) {
        openRows.push(item);
        return;
      }

      const name = normalizeName(extractBaseName(item.querySelector(".nick")));
      const p = playerMap[name];
      if (!p) {
        activeRows.push({ item, points: 0, rangeMax: 0, tier: "intermediate", baseCd: kd.textContent.trim() });
        return;
      }

      let rowTier = p.bestTier;
      if (panelId !== "main") {
        rowTier = p.tiers[panelId] || "intermediate";
      }

      rebuildNickBlock(item, p.points, p.bestTier);
      kd.dataset.baseCd = p.baseCd;
      kd.textContent = `${p.baseCd} | ${p.points} pts`;

      activeRows.push({ item, points: p.points, rangeMax: p.rangeMax, tier: rowTier, baseCd: p.baseCd });
    });

    if (panelId === "main") {
      activeRows.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.rangeMax - a.rangeMax;
      });
    } else {
      activeRows.sort((a, b) => {
        const tierCmp = tierPriority(a.tier) - tierPriority(b.tier);
        if (tierCmp !== 0) return tierCmp;
        if (b.points !== a.points) return b.points - a.points;
        return b.rangeMax - a.rangeMax;
      });

      activeRows.forEach((entry) => {
        entry.item.classList.remove("tier-master", "tier-grandmaster", "tier-ace", "tier-intermediate", "tier-meh");
        entry.item.classList.add(`tier-${entry.tier}`);

        const rankTag = entry.item.querySelector(".rank-tag");
        if (rankTag && weapon) {
          rankTag.classList.remove("rank-master", "rank-grandmaster", "rank-ace", "rank-intermediate", "rank-meh");
          rankTag.classList.add(`rank-${entry.tier}`);
          rankTag.textContent = `${weapon} ${tierLabel(entry.tier)}`;
        }

        const chip = entry.item.querySelector(".weapon-chip:not(.headshot-chip)");
        if (chip) {
          chip.classList.remove("level-master", "level-grandmaster", "level-ace", "level-intermediate", "level-meh");
          chip.classList.add(`level-${entry.tier}`);
          const iconText = chip.querySelector("i");
          if (iconText) iconText.textContent = tierSymbol(entry.tier);
        }
      });
    }

    const finalRows = [...activeRows.map((v) => v.item), ...openRows];
    finalRows.forEach((row, index) => {
      list.appendChild(row);
      const pos = row.querySelector(".pos");
      const posNum = index + 1;
      if (!pos) return;
      const badge = pos.querySelector("b");
      if (badge) {
        badge.textContent = String(posNum);
      } else if (!pos.querySelector("img")) {
        pos.textContent = String(posNum);
      }
    });
  });
}

applyPointsAndTitles();
