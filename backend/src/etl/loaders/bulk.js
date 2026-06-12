function chunkArray(items, size) {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

function buildBulkValues(rows, mapRow) {
  const params = [];
  const tuples = [];

  for (const row of rows) {
    const values = mapRow(row);
    const offset = params.length;

    params.push(...values);

    const placeholders = values.map((_, index) => `$${offset + index + 1}`);
    tuples.push(`(${placeholders.join(", ")})`);
  }

  return {
    params,
    valuesSql: tuples.join(", ")
  };
}

module.exports = {
  buildBulkValues,
  chunkArray
};
