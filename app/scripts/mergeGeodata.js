const fs = require("fs");
const path = require("path");

const geodataDir = path.join(__dirname, "../../public/geojson");
const outputFile = path.join(__dirname, "../../public/geojson/brasil.json");

// Lista todos os arquivos geojs-*-mun.json
const files = fs
  .readdirSync(geodataDir)
  .filter(
    (f) =>
      (f.endsWith(".geojson") || f.endsWith(".geo.json")) &&
      !f.includes("brasil"),
  );

console.log(`Mergeando ${files.length} arquivos...`);

const allFeatures = files.flatMap((file) => {
  const content = JSON.parse(
    fs.readFileSync(path.join(geodataDir, file), "utf-8"),
  );
  return content.features || [];
});

fs.writeFileSync(
  outputFile,
  JSON.stringify({
    type: "FeatureCollection",
    features: allFeatures,
  }),
);

console.log(`brasil.json criado com ${allFeatures.length} features!`);
