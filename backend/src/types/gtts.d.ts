declare module 'gtts' {
  class GTTS {
    constructor(text: string, language?: string, slow?: boolean);
    stream(): NodeJS.ReadableStream;
    save(
      filename: string,
      callback: (err: Error | null, result?: any) => void
    ): void;
  }
  export = GTTS;
}
