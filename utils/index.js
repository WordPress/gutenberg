import * as focus from './focus';
import * as keycodes from './keycodes';
import * as viewPort from './viewport';
import { decodeEntities } from './entities';

export { focus };
export { keycodes };
export { decodeEntities };

// Keep all old wp.utils components
// we can't do export { ...wp.utils } unless we rewrite the whole file in CommonJS
export const WordCounter = wp.utils.WordCounter;

export * from './blob-cache';
export * from './dom';
export * from './mediaupload';
export * from './terms';
export * from './deprecation';

export { viewPort };
