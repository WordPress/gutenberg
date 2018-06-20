/**
 * Internal dependencies
 */
import * as keycodes from './keycodes';
import { decodeEntities } from './entities';

export { decodeEntities };
export { keycodes };

export * from './mediaupload';
export * from './terms';

export { setWPAdminURL, getWPAdminURL } from './urls';

// Deprecations
export * from './deprecated';
