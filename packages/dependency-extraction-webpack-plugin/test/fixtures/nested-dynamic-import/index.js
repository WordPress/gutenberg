// Two levels of dynamic import before reaching the external module, so it is
// code-split into a nested async chunk.
await import( './level-one.js' );
