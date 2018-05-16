/**
 * Internal dependencies
 */
import * as keycodes from './keycodes';
import * as viewPort from './viewport';
import { decodeEntities } from './entities';

export { decodeEntities };
export { keycodes };
export { viewPort };

export * from './blob-cache';
export * from './deprecation';
export * from './mediaupload';
export * from './terms';

// Deprecations
export * from './dom-deprecated';
