/**
 * Official Madhubani District Administrative Sub-Divisions and Blocks Master Data
 * Reference: Government of Bihar District Administration
 */

export const SUB_DIVISIONS_AND_BLOCKS = [
  {
    code: "BENIPATTI",
    name: "BENIPATTI",
    nameHi: "बेनीपट्टी",
    displayName: "BENIPATTI/बेनीपट्टी",
    blocks: [
      {
        code: "BENIPATTI",
        name: "BENIPATTI",
        nameHi: "बेनीपट्टी",
        displayName: "BENIPATTI/बेनीपट्टी",
      },
      {
        code: "BISFI",
        name: "BISFI",
        nameHi: "बिस्फी",
        displayName: "BISFI/बिस्फी",
      },
      {
        code: "HARLAKHI",
        name: "HARLAKHI",
        nameHi: "हरलाखी",
        displayName: "HARLAKHI/हरलाखी",
      },
      {
        code: "MADHWAPUR",
        name: "MADHWAPUR",
        nameHi: "मधवापुर",
        displayName: "MADHWAPUR/मधवापुर",
      },
    ],
  },
  {
    code: "JAYNAGAR",
    name: "JAYNAGAR",
    nameHi: "जयनगर",
    displayName: "JAYNAGAR/जयनगर",
    blocks: [
      {
        code: "BASOPATTI",
        name: "BASOPATTI",
        nameHi: "बासोपट्टी",
        displayName: "BASOPATTI/बासोपट्टी",
      },
      {
        code: "JAINAGAR",
        name: "JAINAGAR",
        nameHi: "जयनगर",
        displayName: "JAINAGAR/जयनगर",
      },
      {
        code: "LADANIA",
        name: "LADANIA",
        nameHi: "लदनिया",
        displayName: "LADANIA/लदनिया",
      },
    ],
  },
  {
    code: "JHANJHARPUR",
    name: "JHANJHARPUR",
    nameHi: "झंझारपुर",
    displayName: "JHANJHARPUR/झंझारपुर",
    blocks: [
      {
        code: "ANDHRATHARHI",
        name: "ANDHRATHARHI",
        nameHi: "अंधराठाढ़ी",
        displayName: "ANDHRATHARHI/अंधराठाढ़ी",
      },
      {
        code: "JHANJHARPUR",
        name: "JHANJHARPUR",
        nameHi: "झंझारपुर",
        displayName: "JHANJHARPUR/झंझारपुर",
      },
      {
        code: "LAKHNAUR",
        name: "LAKHNAUR",
        nameHi: "लखनौर",
        displayName: "LAKHNAUR/लखनौर",
      },
      {
        code: "MADHEPUR",
        name: "MADHEPUR",
        nameHi: "मधेपुर",
        displayName: "MADHEPUR/मधेपुर",
      },
    ],
  },
  {
    code: "MADHUBANI",
    name: "MADHUBANI",
    nameHi: "मधुबनी",
    displayName: "MADHUBANI/मधुबनी",
    blocks: [
      {
        code: "BABU_BARHI",
        name: "BABU BARHI",
        nameHi: "बाबूबरही",
        displayName: "BABU BARHI/बाबूबरही",
      },
      {
        code: "KALUAHI",
        name: "KALUAHI",
        nameHi: "कलुआही",
        displayName: "KALUAHI/कलुआही",
      },
      {
        code: "KHAJAULI",
        name: "KHAJAULI",
        nameHi: "खजौली",
        displayName: "KHAJAULI/खजौली",
      },
      {
        code: "PANDAUL",
        name: "PANDAUL",
        nameHi: "पंडौल",
        displayName: "PANDAUL/पंडौल",
      },
      {
        code: "RAHIKA",
        name: "RAHIKA",
        nameHi: "रहिका",
        displayName: "RAHIKA/रहिका",
      },
      {
        code: "RAJNAGAR",
        name: "RAJNAGAR",
        nameHi: "राजनगर",
        displayName: "RAJNAGAR/राजनगर",
      },
    ],
  },
  {
    code: "PHULPARAS",
    name: "PHULPARAS",
    nameHi: "फूलपारस",
    displayName: "PHULPARAS/फूलपारस",
    blocks: [
      {
        code: "GHOGHARDIHA",
        name: "GHOGHARDIHA",
        nameHi: "घोघरडीहा",
        displayName: "GHOGHARDIHA/घोघरडीहा",
      },
      {
        code: "LAUKAHA_KHUTAUNA",
        name: "LAUKAHA (KHUTAUNA)",
        nameHi: "खुटौना",
        displayName: "LAUKAHA (KHUTAUNA)/खुटौना",
      },
      {
        code: "LAUKAHI",
        name: "LAUKAHI",
        nameHi: "लौकही",
        displayName: "LAUKAHI/लौकही",
      },
      {
        code: "PHULPARAS",
        name: "PHULPARAS",
        nameHi: "फुलपरास",
        displayName: "PHULPARAS/फुलपरास",
      },
    ],
  },
];

/**
 * Helper to get the list of blocks for a given sub-division displayName, code, or name
 */
export function getBlocksForSubDivision(subDivisionValue, list = SUB_DIVISIONS_AND_BLOCKS) {
  if (!subDivisionValue) return [];
  const normalized = subDivisionValue.trim().toUpperCase();
  const items = (list && list.length > 0) ? list : SUB_DIVISIONS_AND_BLOCKS;
  const sub = items.find(
    (s) =>
      (s.displayName && s.displayName.toUpperCase() === normalized) ||
      (s.code && s.code.toUpperCase() === normalized) ||
      (s.name && s.name.toUpperCase() === normalized) ||
      (s.name && normalized.includes(s.name.toUpperCase())) ||
      (s.displayName && normalized.includes(s.displayName.toUpperCase()))
  );
  return sub ? sub.blocks || [] : [];
}
