class BaseExtractor {
  constructor(downloader, source) {
    this.downloader = downloader;
    this.source = source;
    this.sourceCode = source.code;
    this.sourceName = source.name;
  }

  log(message) {
    console.log(`[${this.sourceCode}] ${message}`);
  }

  error(message) {
    console.error(`[${this.sourceCode}] ${message}`);
  }

  async saveSourceReference(extra = {}) {
    return this.downloader.saveMetadata(`${this.sourceCode}_source_reference.json`, {
      sourceCode: this.sourceCode,
      sourceName: this.sourceName,
      provider: this.source.provider,
      savedAt: new Date().toISOString(),
      officialSource: this.source,
      ...extra
    });
  }
}

module.exports = BaseExtractor;