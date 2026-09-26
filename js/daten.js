// Lerninhalte: 16 Bundesländer, ihre Hauptstädte und 22 große Flüsse Deutschlands.
//
// fluesse: Flüsse aus dieser Liste, die durch das Land fließen (werden abgefragt).
// grenz:   Flüsse, die das Land nur am Rand berühren oder dort entspringen. Sie werden weder
//          abgefragt noch als falsche Antwort angeboten, damit keine Frage zwei richtige Lösungen hat.

export const FLUESSE = {
  elbe: { name: "Elbe", artikel: "die" },
  havel: { name: "Havel", artikel: "die" },
  oder: { name: "Oder", artikel: "die" },
  ems: { name: "Ems", artikel: "die" },
  weser: { name: "Weser", artikel: "die" },
  aller: { name: "Aller", artikel: "die" },
  leine: { name: "Leine", artikel: "die" },
  lippe: { name: "Lippe", artikel: "die" },
  saale: { name: "Saale", artikel: "die" },
  spree: { name: "Spree", artikel: "die" },
  neisse: { name: "Neiße", artikel: "die" },
  rhein: { name: "Rhein", artikel: "der" },
  fulda: { name: "Fulda", artikel: "die" },
  mulde: { name: "Mulde", artikel: "die" },
  lahn: { name: "Lahn", artikel: "die" },
  werra: { name: "Werra", artikel: "die" },
  mosel: { name: "Mosel", artikel: "die" },
  main: { name: "Main", artikel: "der" },
  neckar: { name: "Neckar", artikel: "der" },
  donau: { name: "Donau", artikel: "die" },
  isar: { name: "Isar", artikel: "die" },
  inn: { name: "Inn", artikel: "der" },
};

// reihe: Reihenfolge im Sammelalbum, ungefähr von Norden nach Süden
export const LAENDER = [
  { id: "sh", reihe: 2, name: "Schleswig-Holstein", hauptstadt: "Kiel", stadt: "kiel",
    fluesse: ["elbe"], grenz: [],
    fakt: "Schleswig-Holstein liegt zwischen zwei Meeren: der Nordsee und der Ostsee." },
  { id: "hh", reihe: 1, name: "Hamburg", hauptstadt: "Hamburg", stadt: "hamburg", stadtFluss: "elbe",
    fluesse: ["elbe"], grenz: [],
    fakt: "Hamburg ist die zweitgrößte Stadt Deutschlands und hat einen riesigen Hafen an der Elbe." },
  { id: "mv", reihe: 3, name: "Mecklenburg-Vorpommern", hauptstadt: "Schwerin", stadt: "schwerin",
    fluesse: ["elbe"], grenz: [],
    fakt: "In Mecklenburg-Vorpommern liegt Rügen, die größte Insel Deutschlands." },
  { id: "hb", reihe: 4, name: "Bremen", hauptstadt: "Bremen", stadt: "bremen", stadtFluss: "weser",
    fluesse: ["weser"], grenz: [],
    fakt: "Bremen ist das kleinste Bundesland. Es besteht aus zwei Städten: Bremen und Bremerhaven." },
  { id: "ni", reihe: 5, name: "Niedersachsen", hauptstadt: "Hannover", stadt: "hannover", stadtFluss: "leine",
    fluesse: ["weser", "ems", "aller", "leine", "elbe"], grenz: [],
    fakt: "Niedersachsen ist das zweitgrößte Bundesland." },
  { id: "st", reihe: 6, name: "Sachsen-Anhalt", hauptstadt: "Magdeburg", stadt: "magdeburg", stadtFluss: "elbe",
    fluesse: ["elbe", "saale", "mulde"], grenz: ["havel", "aller"],
    fakt: "In Sachsen-Anhalt fließen die Saale und die Mulde in die Elbe." },
  { id: "bb", reihe: 7, name: "Brandenburg", hauptstadt: "Potsdam", stadt: "potsdam", stadtFluss: "havel",
    fluesse: ["havel", "oder", "neisse", "spree", "elbe"], grenz: [],
    fakt: "Brandenburg umschließt Berlin von allen Seiten." },
  { id: "be", reihe: 8, name: "Berlin", hauptstadt: "Berlin", stadt: "berlin", stadtFluss: "spree",
    fluesse: ["spree", "havel"], grenz: [],
    fakt: "Berlin ist nicht nur ein Bundesland, sondern auch die Hauptstadt von ganz Deutschland." },
  { id: "nw", reihe: 9, name: "Nordrhein-Westfalen", hauptstadt: "Düsseldorf", stadt: "duesseldorf", stadtFluss: "rhein",
    fluesse: ["rhein", "lippe", "ems", "weser"], grenz: ["lahn"],
    fakt: "In Nordrhein-Westfalen wohnen die meisten Menschen von allen Bundesländern." },
  { id: "he", reihe: 10, name: "Hessen", hauptstadt: "Wiesbaden", stadt: "wiesbaden", stadtFluss: "rhein",
    fluesse: ["lahn", "main", "fulda", "werra", "rhein"], grenz: ["weser", "neckar"],
    fakt: "In Frankfurt am Main in Hessen liegt der größte Flughafen Deutschlands." },
  { id: "th", reihe: 11, name: "Thüringen", hauptstadt: "Erfurt", stadt: "erfurt",
    fluesse: ["werra", "saale"], grenz: ["leine"],
    fakt: "Thüringen liegt mitten in Deutschland und wird das grüne Herz Deutschlands genannt." },
  { id: "sn", reihe: 12, name: "Sachsen", hauptstadt: "Dresden", stadt: "dresden", stadtFluss: "elbe",
    fluesse: ["elbe", "mulde", "neisse", "spree"], grenz: [],
    fakt: "In Dresden an der Elbe steht die berühmte Frauenkirche." },
  { id: "rp", reihe: 13, name: "Rheinland-Pfalz", hauptstadt: "Mainz", stadt: "mainz", stadtFluss: "rhein",
    fluesse: ["mosel", "rhein", "lahn"], grenz: [],
    fakt: "Mainz und Wiesbaden liegen sich am Rhein direkt gegenüber." },
  { id: "sl", reihe: 14, name: "Saarland", hauptstadt: "Saarbrücken", stadt: "saarbruecken",
    fluesse: [], grenz: ["mosel"],
    fakt: "Das Saarland ist das kleinste Flächenland. Saarbrücken liegt an der Saar." },
  { id: "by", reihe: 15, name: "Bayern", hauptstadt: "München", stadt: "muenchen", stadtFluss: "isar",
    fluesse: ["main", "donau", "isar", "inn"], grenz: ["saale", "rhein"],
    fakt: "Bayern ist das größte Bundesland." },
  { id: "bw", reihe: 16, name: "Baden-Württemberg", hauptstadt: "Stuttgart", stadt: "stuttgart", stadtFluss: "neckar",
    fluesse: ["neckar", "donau", "rhein"], grenz: ["main"],
    fakt: "Baden-Württemberg grenzt im Süden an den Bodensee." },
];

export const LAND = Object.fromEntries(LAENDER.map((l) => [l.id, l]));

// Buntstiftfarben zum "Ausmalen" gemeisterter Länder
export const STIFT = {
  sh: "#9CC9E8", hh: "#F4A6A0", mv: "#A8D8C4", hb: "#F7C98B", ni: "#C9B6E4", st: "#F6D37A",
  bb: "#B7DB9C", be: "#F29E8E", nw: "#8FC1E3", he: "#F5B77E", th: "#A6D6B0", sn: "#D9B3E0",
  rp: "#F3C6A5", sl: "#9FD3D6", by: "#A9C3EE", bw: "#F1D08A",
};

// Titel gibt es in drei Formen. Das Kind wählt selbst, welche es sammeln möchte,
// statt dass die App aus dem Namen auf ein Geschlecht schließt.
export const ANREDEN = {
  w: { titel: "Entdeckerin", beispiele: "Kartenleserin, Pfadfinderin, Kartenmeisterin …" },
  m: { titel: "Entdecker", beispiele: "Kartenleser, Pfadfinder, Kartenmeister …" },
  n: { titel: "Entdeckungs-Profi", beispiele: "Karten-Talent, Kompass-Ass, Karten-Genie …" },
};

export const RAENGE = [
  { ab: 0, name: { w: "Kartenneuling", m: "Kartenneuling", n: "Kartenneuling" } },
  { ab: 100, name: { w: "Kartenleserin", m: "Kartenleser", n: "Karten-Talent" } },
  { ab: 300, name: { w: "Pfadfinderin", m: "Pfadfinder", n: "Kompass-Ass" } },
  { ab: 600, name: { w: "Entdeckerin", m: "Entdecker", n: "Entdeckungs-Profi" } },
  { ab: 1000, name: { w: "Weltenbummlerin", m: "Weltenbummler", n: "Reise-Star" } },
  { ab: 1600, name: { w: "Deutschland-Profi", m: "Deutschland-Profi", n: "Deutschland-Profi" } },
  { ab: 2500, name: { w: "Geografie-Ass", m: "Geografie-Ass", n: "Geografie-Ass" } },
  { ab: 3500, name: { w: "Kartenmeisterin", m: "Kartenmeister", n: "Karten-Genie" } },
  { ab: 5000, name: { w: "Deutschland-Legende", m: "Deutschland-Legende", n: "Deutschland-Legende" } },
];

// "der Rhein" / "die Elbe" – mit großem Anfangsbuchstaben für Satzanfänge
export const mitArtikel = (id, gross = false) => {
  const f = FLUESSE[id];
  const a = gross ? f.artikel[0].toUpperCase() + f.artikel.slice(1) : f.artikel;
  return `${a} ${f.name}`;
};

export const laenderMitFluss = (flussId) => LAENDER.filter((l) => l.fluesse.includes(flussId));
