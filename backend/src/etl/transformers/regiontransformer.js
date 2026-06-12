function cleanText(value) {
  if (value === null || value === undefined) return null;

  const text = String(value)
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return text.length > 0 ? text : null;
}

function onlyDigits(value) {
  if (value === null || value === undefined) return null;

  const digits = String(value).replace(/\D/g, "");

  return digits.length > 0 ? digits : null;
}

function padDigits(value, length) {
  const digits = onlyDigits(value);

  if (!digits) return null;

  return digits.padStart(length, "0");
}

function makeStateAgs(row) {
  return padDigits(row.land, 2);
}

function makeDistrictAgs(row) {
  const land = padDigits(row.land, 2);
  const rb = padDigits(row.rb, 1);
  const kreis = padDigits(row.kreis, 2);

  if (!land || !rb || !kreis) return null;

  return `${land}${rb}${kreis}`;
}

function makeMunicipalityAgs(row) {
  const land = padDigits(row.land, 2);
  const rb = padDigits(row.rb, 1);
  const kreis = padDigits(row.kreis, 2);
  const gem = padDigits(row.gem, 3);

  if (!land || !rb || !kreis || !gem) return null;

  return `${land}${rb}${kreis}${gem}`;
}

function makeGeometry(row) {
  if (row.longitude === null || row.latitude === null) {
    return null;
  }

  return JSON.stringify({
    type: "Point",
    coordinates: [row.longitude, row.latitude]
  });
}

function addRegion(regionMap, region) {
  if (!region.ags || !region.name) {
    return;
  }

  if (!regionMap.has(region.ags)) {
    regionMap.set(region.ags, region);
    return;
  }

  const existing = regionMap.get(region.ags);

  regionMap.set(region.ags, {
    ...existing,
    ...region,
    population: region.population || existing.population,
    geometry: region.geometry || existing.geometry
  });
}

function transformGVISysRows(rows) {
  const regionMap = new Map();

  let states = 0;
  let districts = 0;
  let municipalities = 0;
  let skipped = 0;

  for (const row of rows) {
    const satzart = cleanText(row.satzart);
    const name = cleanText(row.name);

    if (!satzart || !name) {
      skipped++;
      continue;
    }

    /*
      GV-ISys Satzart:
      10 = Bundesland/state
      40 = Kreis/district
      50 = Gemeindeverband/association
      60 = Gemeinde/municipality

      Your schema needs:
      state, district, municipality

      So we load:
      10, 40, 60
      and skip:
      50
    */

    if (satzart === "10") {
      addRegion(regionMap, {
        ags: makeStateAgs(row),
        name,
        level: "state",
        parentAgs: null,
        geometry: null,
        population: row.populationTotal || null
      });

      states++;
      continue;
    }

    if (satzart === "40") {
      addRegion(regionMap, {
        ags: makeDistrictAgs(row),
        name,
        level: "district",
        parentAgs: makeStateAgs(row),
        geometry: null,
        population: row.populationTotal || null
      });

      districts++;
      continue;
    }

    if (satzart === "60") {
      addRegion(regionMap, {
        ags: makeMunicipalityAgs(row),
        name,
        level: "municipality",
        parentAgs: makeDistrictAgs(row),
        geometry: makeGeometry(row),
        population: row.populationTotal || null
      });

      municipalities++;
      continue;
    }

    skipped++;
  }

  const regions = Array.from(regionMap.values());

  console.log("GV-ISys transformed regions:", regions.length);
  console.log("GV-ISys states:", states);
  console.log("GV-ISys districts:", districts);
  console.log("GV-ISys municipalities:", municipalities);
  console.log("GV-ISys skipped rows:", skipped);

  if (regions.length > 0) {
    console.log("First transformed region:");
    console.log(regions[0]);
  }

  return regions;
}

module.exports = {
  transformGVISysRows
};
