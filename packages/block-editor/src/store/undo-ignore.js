// Keep track of the blocks that should not be pushing an additional
// undo stack when editing the entity.
// See the implementation of `syncDerivedUpdates` and `useBlockSync`.
export const undoIgnoreBlocks = new WeakSet();
