declare global {
  var resumeTempStore: Map<string, any> | undefined;
}

export const resumeTempStore = globalThis.resumeTempStore || new Map<string, any>();

if (process.env.NODE_ENV !== 'production') {
  globalThis.resumeTempStore = resumeTempStore;
}
