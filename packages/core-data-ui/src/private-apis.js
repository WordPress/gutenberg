/**
 * Internal dependencies
 */
import { lock } from './lock-unlock';
import { EntitiesSavedStatesExtensible } from './components/entities-saved-states';

/**
 * Private APIs for the `@wordpress/core-data-ui` package.
 *
 * @private
 */
export const privateApis = {};
lock( privateApis, {
	EntitiesSavedStatesExtensible,
} );
