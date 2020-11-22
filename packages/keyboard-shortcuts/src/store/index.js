/**
 * WordPress dependencies
 */
import { __experimentalCreateAtomicStore, register } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { rootAtoms } from './atoms';
import * as actions from './actions';
import * as selectors from './selectors';

/**
 * Store definition for the keyboard shortcuts namespace.
 *
 * @see https://github.com/WordPress/gutenberg/blob/master/packages/data/README.md#createReduxStore
 *
 * @type {Object}
 */
export const store = __experimentalCreateAtomicStore(
	'core/keyboard-shortcuts',
	{
		rootAtoms,
		actions,
		selectors,
	}
);

register( store );
