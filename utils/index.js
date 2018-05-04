import { omit } from 'lodash';

import * as focus from './focus';
import * as keycodesAll from './keycodes';
import * as viewPort from './viewport';
import { decodeEntities } from './entities';

const keycodes = omit( keycodesAll, [ 'keyboardShortcut' ] );
export { focus };
export { keycodes };
export { decodeEntities };

export * from './blob-cache';
export * from './dom';
export * from './mediaupload';
export * from './terms';
export * from './deprecation';

export { viewPort };
