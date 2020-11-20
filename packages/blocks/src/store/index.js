/**
 * WordPress dependencies
 */
import { __experimentalCreateAtomicStore, register } from '@wordpress/data';

/**
 * Internal dependencies
 */
import * as selectors from './selectors';
import * as actions from './actions';
import { rootAtoms } from './atoms';

/**
 * Store definition for the blocks namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/data/README.md#createReduxStore
 *
 * @type {Object}
 */
export const store = __experimentalCreateAtomicStore( 'core/blocks', {
	rootAtoms,
	actions,
	selectors,
} );

register( store );
