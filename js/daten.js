// Lerninhalte nach dem Arbeitsblatt "Deutschland: Bundesländer, Landeshauptstädte und Flüsse".
//
// fluesse: Flüsse vom Arbeitsblatt, die durch das Land fließen (werden abgefragt).
// grenz:   Flüsse, die das Land nur am Rand berühren oder dort entspringen. Sie werden weder
//          abgefragt noch als falsche Antwort angeboten, damit keine Frage zwei richtige Lösungen hat.

export const FLUESSE = {
  elbe: { name: "Elbe", artikel: "die", buchstabe: "A" },
  havel: { name: "Havel", artikel: "die", buchstabe: "B" },
  oder: { name: "Oder", artikel: "die", buchstabe: "C" },
  ems: { name: "Ems", artikel: "die", buchstabe: "D" },
  weser: { name: "Weser", artikel: "die", buchstabe: "E" },
  aller: { name: "Aller", artikel: "die", buchstabe: "F" },
  leine: { name: "Leine", artikel: "die", buchstabe: "G" },
  lippe: { name: "Lippe", artikel: "die", buchstabe: "H" },
  saale: { name: "Saale", artikel: "die", buchstabe: "I" },
  spree: { name: "Spree", artikel: "die", buchstabe: "J" },
  neisse: { name: "Neiße", artikel: "die", buchstabe: "K" },
  rhein: { name: "Rhein", artikel: "der", buchstabe: "L" },
  fulda: { name: "Fulda", artikel: "die", buchstabe: "M" },
  mulde: { name: "Mulde", artikel: "die", buchstabe: "N" },
  lahn: { name: "Lahn", artikel: "die", buchstabe: "O" },
  werra: { name: "Werra", artikel: "die", buchstabe: "P" },
  mosel: { name: "Mosel", artikel: "die", buchstabe: "Q" },
  main: { name: "Main", artikel: "der", buchstabe: "R" },
  neckar: { name: "Neckar", artikel: "der", buchstabe: "S" },
  donau: { name: "Donau", artikel: "die", buchstabe: "T" },
  isar: { name: "Isar", artikel: "die", buchstabe: "U" },
  inn: { name: "Inn", artikel: "der", buchstabe: "V" },
};

export const LAENDER = [
  { id: "sh", nr: 2, name: "Schleswig-Holstein", hauptstadt: "Kiel", stadt: "kiel",
    fluesse: ["elbe"], grenz: [],
    fakt: "Schleswig-Holstein liegt zwischen zwei Meeren: der Nordsee und der Ostsee." },
  { id: "hh", nr: 1, name: "Hamburg", hauptstadt: "Hamburg", stadt: "hamburg", stadtFluss: "elbe",
    fluesse: ["elbe"], grenz: [],
    fakt: "Hamburg ist die zweitgrößte Stadt Deutschlands und hat einen riesigen Hafen an der Elbe." },
  { id: "mv", nr: 3, name: "Mecklenburg-Vorpommern", hauptstadt: "Schwerin", stadt: "schwerin",
    fluesse: ["elbe"], grenz: [],
    fakt: "In Mecklenburg-Vorpommern liegt Rügen, die größte Insel Deutschlands." },
  { id: "hb", nr: 4, name: "Bremen", hauptstadt: "Bremen", stadt: "bremen", stadtFluss: "weser",
    fluesse: ["weser"], grenz: [],
    fakt: "Bremen ist das kleinste Bundesland. Es besteht aus zwei Städten: Bremen und Bremerhaven." },
  { id: "ni", nr: 5, name: "Niedersachsen", hauptstadt: "Hannover", stadt: "hannover", stadtFluss: "leine",
    fluesse: ["weser", "ems", "aller", "leine", "elbe"], grenz: [],
    fakt: "Niedersachsen ist das zweitgrößte Bundesland." },
  { id: "st", nr: 6, name: "Sachsen-Anhalt", hauptstadt: "Magdeburg", stadt: "magdeburg", stadtFluss: "elbe",
    fluesse: ["elbe", "saale", "mulde"], grenz: ["havel", "aller"],
    fakt: "In Sachsen-Anhalt fließen die Saale und die Mulde in die Elbe." },
  { id: "bb", nr: 7, name: "Brandenburg", hauptstadt: "Potsdam", stadt: "potsdam", stadtFluss: "havel",
    fluesse: ["havel", "oder", "neisse", "spree", "elbe"], grenz: [],
    fakt: "Brandenburg umschließt Berlin von allen Seiten." },
  { id: "be", nr: 8, name: "Berlin", hauptstadt: "Berlin", stadt: "berlin", stadtFluss: "spree",
    fluesse: ["spree", "havel"], grenz: [],
    fakt: "Berlin ist nicht nur ein Bundesland, sondern auch die Hauptstadt von ganz Deutschland." },
  { id: "nw", nr: 9, name: "Nordrhein-Westfalen", hauptstadt: "Düsseldorf", stadt: "duesseldorf", stadtFluss: "rhein",
    fluesse: ["rhein", "lippe", "ems", "weser"], grenz: ["lahn"],
    fakt: "In Nordrhein-Westfalen wohnen die meisten Menschen von allen Bundesländern." },
  { id: "he", nr: 10, name: "Hessen", hauptstadt: "Wiesbaden", stadt: "wiesbaden", stadtFluss: "rhein",
    fluesse: ["lahn", "main", "fulda", "werra", "rhein"], grenz: ["weser", "neckar"],
    fakt: "In Frankfurt am Main in Hessen liegt der größte Flughafen Deutschlands." },
  { id: "th", nr: 11, name: "Thüringen", hauptstadt: "Erfurt", stadt: "erfurt",
    fluesse: ["werra", "saale"], grenz: ["leine"],
    fakt: "Thüringen liegt mitten in Deutschland und wird das grüne Herz Deutschlands genannt." },
  { id: "sn", nr: 12, name: "Sachsen", hauptstadt: "Dresden", stadt: "dresden", stadtFluss: "elbe",
    fluesse: ["elbe", "mulde", "neisse", "spree"], grenz: [],
    fakt: "In Dresden an der Elbe steht die berühmte Frauenkirche." },
  { id: "rp", nr: 13, name: "Rheinland-Pfalz", hauptstadt: "Mainz", stadt: "mainz", stadtFluss: "rhein",
    fluesse: ["mosel", "rhein", "lahn"], grenz: [],
    fakt: "Mainz und Wiesbaden liegen sich am Rhein direkt gegenüber." },
  { id: "sl", nr: 14, name: "Saarland", hauptstadt: "Saarbrücken", stadt: "saarbruecken",
    fluesse: [], grenz: ["mosel"],
    fakt: "Das Saarland ist das kleinste Flächenland. Saarbrücken liegt an der Saar, die nicht auf deinem Arbeitsblatt steht." },
  { id: "by", nr: 15, name: "Bayern", hauptstadt: "München", stadt: "muenchen", stadtFluss: "isar",
    fluesse: ["main", "donau", "isar", "inn"], grenz: ["saale", "rhein"],
    fakt: "Bayern ist das größte Bundesland." },
  { id: "bw", nr: 16, name: "Baden-Württemberg", hauptstadt: "Stuttgart", stadt: "stuttgart", stadtFluss: "neckar",
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

export const RAENGE = [
  { ab: 0, name: "Kartenneuling" },
  { ab: 100, name: "Kartenleserin" },
  { ab: 300, name: "Pfadfinderin" },
  { ab: 600, name: "Entdeckerin" },
  { ab: 1000, name: "Weltenbummlerin" },
  { ab: 1600, name: "Deutschland-Profi" },
];

// "der Rhein" / "die Elbe" – mit großem Anfangsbuchstaben für Satzanfänge
export const mitArtikel = (id, gross = false) => {
  const f = FLUESSE[id];
  const a = gross ? f.artikel[0].toUpperCase() + f.artikel.slice(1) : f.artikel;
  return `${a} ${f.name}`;
};

export const laenderMitFluss = (flussId) => LAENDER.filter((l) => l.fluesse.includes(flussId));
