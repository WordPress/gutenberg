/**
 * WordPress dependencies
 */
import { createReduxStore, register } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as privateActions from './private-actions';
import * as privateSelectors from './private-selectors';
import { unlock } from '../lock-unlock';

const STORE_NAME = 'core/bindings';

/**
 * Store definition for the bindings namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/data/README.md#createReduxStore
 *
 * @type {Object}
 *
 * @example
 * ```js
 * import { store as bindingsStore } from '@wordpress/bindings';
 * import { dispatch } from '@wordpress/data';
 *
 * const { registerBindingsSource } = dispatch( bindingsStore );
 * ```
 */
export const store = createReduxStore( STORE_NAME, {
	reducer,
} );

register( store );
unlock( store ).registerPrivateActions( privateActions );
unlock( store ).registerPrivateSelectors( privateSelectors );
