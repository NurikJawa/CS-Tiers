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

function parseCdRange(text) {
  const match = text.match(/([0-9]+(?:\.[0-9]+)?)\s*-\s*([0-9]+(?:\.[0-9]+)?)/);
  if (!match) return null;
  const min = Number.parseFloat(match[1]);
  const max = Number.parseFloat(match[2]);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  return { min, max };
}

function parseHsPercent(item) {
  const hsText = item.querySelector(".headshot-chip i")?.textContent ?? "";
  const m = hsText.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!m) return 0;
  const hs = Number.parseFloat(m[1]);
  if (!Number.isFinite(hs)) return 0;
  return Math.max(0, Math.min(100, hs));
}

function extractBaseName(nickEl) {
  if (nickEl.dataset.baseName) return nickEl.dataset.baseName;
  const raw = (nickEl.textContent || "").replace(/Combat.+$/i, "").trim();
  const firstLine = raw.split(/\r?\n/).map((v) => v.trim()).filter(Boolean)[0] || raw;
  return firstLine;
}

function getWeaponFromPanel(panelId) {
  if (panelId === "awp") return "AWP";
  if (panelId === "rifle") return "RIFLE";
  if (panelId === "deagle") return "DEAGLE";
  if (panelId === "usp") return "USP";
  return null;
}

function tierLabel(tier) {
  if (tier === "master") return "MASTER";
  if (tier === "grandmaster") return "GRANDMASTER";
  return "INTERMEDIATE";
}

function normalizeName(name) {
  return (name || "").trim().toLowerCase();
}

function tierFromChip(chip) {
  if (!chip) return "intermediate";
  const txt = (chip.querySelector("i")?.textContent || "").toUpperCase().trim();
  if (txt === "M") return "master";
  if (txt === "GM") return "grandmaster";
  return "intermediate";
}

function tierPriority(tier) {
  if (tier === "master") return 0;
  if (tier === "grandmaster") return 1;
  return 2;
}

function pointsForItem(cdRange, hs) {
  const exactKd = Math.sqrt(cdRange.min * cdRange.max);
  const kpd = exactKd * (1 + hs / 250);
  const points = Math.round(kpd * 140);
  return { exactKd, points };
}

function rebuildNickBlock(item, points) {
  const nick = item.querySelector(".nick");
  if (!nick) return;
  const baseName = extractBaseName(nick);
  nick.dataset.baseName = baseName;

  const key = baseName.toLowerCase();
  const title = titleByPlayer[key] || "None";
  const titleClass = titleClassFromTitle(title);

  nick.textContent = "";

  const main = document.createElement("span");
  main.className = "nick-main";
  main.textContent = baseName;

  const meta = document.createElement("span");
  meta.className = `nick-meta ${titleClass}`;
  meta.textContent = title;

  const stat = document.createElement("span");
  stat.className = "nick-meta";
  stat.textContent = `${points} pts`;

  nick.appendChild(main);
  nick.appendChild(meta);
  nick.appendChild(stat);
}

function applyPointsAndTitles() {
  const lists = Array.from(document.querySelectorAll(".rank-list"));
  const playerWeaponTierMap = {};

  const mainList = document.querySelector('[data-tab-panel="main"] .rank-list');
  if (mainList) {
    const mainRows = Array.from(mainList.querySelectorAll(":scope > .rank-item"));
    mainRows.forEach((item) => {
      const rankTag = item.querySelector(".rank-tag");
      if (!rankTag || rankTag.textContent.toUpperCase().includes("OPEN SLOT")) return;
      const nick = item.querySelector(".nick");
      const name = normalizeName(extractBaseName(nick));
      if (!name) return;

      const chips = Array.from(item.querySelectorAll(".skills .weapon-chip:not(.headshot-chip)"));
      playerWeaponTierMap[name] = {
        awp: tierFromChip(chips[0]),
        rifle: tierFromChip(chips[1]),
        deagle: tierFromChip(chips[2]),
        usp: tierFromChip(chips[3]),
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

      const cdRaw = kd.dataset.baseCd || kd.textContent || "";
      const cdMatch = cdRaw.match(/CD\s*([0-9]+(?:\.[0-9]+)?)\s*-\s*([0-9]+(?:\.[0-9]+)?)/i);
      const baseCd = cdMatch ? `CD ${cdMatch[1]}-${cdMatch[2]}` : cdRaw.trim();
      kd.dataset.baseCd = baseCd;

      const range = parseCdRange(baseCd);
      const hs = parseHsPercent(item);
      if (!range) {
        rebuildNickBlock(item, 0);
        activeRows.push({ item, points: 0, rangeMax: 0, baseCd });
        return;
      }

      const { points } = pointsForItem(range, hs);
      rebuildNickBlock(item, points);
      kd.textContent = `${baseCd} | ${points} pts`;

      activeRows.push({ item, points, rangeMax: range.max, baseCd });
    });

    if (panelId !== "main") {
      activeRows.forEach((entry) => {
        const name = normalizeName(extractBaseName(entry.item.querySelector(".nick")));
        const lockedTier = playerWeaponTierMap[name]?.[panelId] || "intermediate";
        entry.lockedTier = lockedTier;
      });

      activeRows.sort((a, b) => {
        const tierCmp = tierPriority(a.lockedTier) - tierPriority(b.lockedTier);
        if (tierCmp !== 0) return tierCmp;
        if (b.points !== a.points) return b.points - a.points;
        return b.rangeMax - a.rangeMax;
      });

      activeRows.forEach((entry, idx) => {
        const tier = entry.lockedTier;
        entry.item.classList.remove("tier-master", "tier-grandmaster", "tier-intermediate");
        entry.item.classList.add(`tier-${tier}`);

        const rankTag = entry.item.querySelector(".rank-tag");
        if (rankTag && weapon) {
          rankTag.classList.remove("rank-master", "rank-grandmaster", "rank-intermediate");
          rankTag.classList.add(`rank-${tier}`);
          rankTag.textContent = `${weapon} ${tierLabel(tier)}`;
        }

        const weaponChip = entry.item.querySelector(".weapon-chip:not(.headshot-chip)");
        if (weaponChip) {
          weaponChip.classList.remove("level-master", "level-grandmaster", "level-intermediate");
          if (tier === "master") {
            weaponChip.classList.add("level-master");
            weaponChip.querySelector("i").textContent = "M";
          } else if (tier === "grandmaster") {
            weaponChip.classList.add("level-grandmaster");
            weaponChip.querySelector("i").textContent = "GM";
          } else {
            weaponChip.classList.add("level-intermediate");
            weaponChip.querySelector("i").textContent = "INT";
          }
        }
      });
    } else {
      activeRows.sort((a, b) => {
        const posA = Number.parseInt(a.item.querySelector(".pos b, .pos")?.textContent || "999", 10);
        const posB = Number.parseInt(b.item.querySelector(".pos b, .pos")?.textContent || "999", 10);
        return posA - posB;
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
      } else {
        pos.childNodes.forEach((n) => {
          if (n.nodeType === Node.TEXT_NODE) n.textContent = "";
        });
        if (!pos.querySelector("img")) pos.textContent = String(posNum);
      }
    });
  });
}

applyPointsAndTitles();
