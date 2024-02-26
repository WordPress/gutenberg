// Hermes has a limit for the call stack depth to avoid infinite recursion.
// When creating a deep nested structure of inner blocks, the editor might exceed
// this limit and crash. In order to avoid this, we set a maximum depth level where
// we stop rendering blocks.
export const MAX_NESTING_DEPTH = 10;
