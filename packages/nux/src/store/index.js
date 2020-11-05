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

const store = registerStore( 'core/nux', {
	reducer,
	actions,
	selectors,
	persist: [ 'preferences' ],
} );

export default store;

export const useDispatch = createUseStoreDispatch( 'core/nux' );
export const useSelect = createUseStoreSelect( 'core/nux' );
