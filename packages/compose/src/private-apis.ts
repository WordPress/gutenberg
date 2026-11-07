import { lock } from './lock-unlock';
import {
	addDelegatedListeners,
	useDelegatedListeners,
} from './utils/delegated-listeners';
import { ownsSelection } from './utils/owns-selection';

/**
 * Private `@wordpress/compose` APIs.
 */
export const privateApis = {};
lock( privateApis, {
	addDelegatedListeners,
	useDelegatedListeners,
	ownsSelection,
} );
