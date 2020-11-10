/**
 * WordPress dependencies
 */
import { registerAtomicStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import * as atoms from './atoms';
import * as actions from './actions';
import * as selectors from './selectors';

registerAtomicStore( 'core/keyboard-shortcuts', {
	atoms,
	actions,
	selectors,
} );
