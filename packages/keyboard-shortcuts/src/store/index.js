/**
 * WordPress dependencies
 */
import {
	registerStore,
	createUseStoreSelect,
	createUseStoreDispatch,
} from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as actions from './actions';
import * as selectors from './selectors';

export default registerStore( 'core/keyboard-shortcuts', {
	reducer,
	actions,
	selectors,
} );

export const useDispatch = createUseStoreDispatch( 'core/keyboard-shortcuts' );
export const useSelect = createUseStoreSelect( 'core/keyboard-shortcuts' );
