/**
 * WordPress dependencies
 */
import {
	registerStore,
	createUseStoreDispatch,
	createUseStoreSelect,
} from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as actions from './actions';
import * as selectors from './selectors';
import { STORE_KEY } from './constants';

const store = registerStore( STORE_KEY, {
	reducer,
	actions,
	selectors,
	persist: [ 'enableItems' ],
} );

export default store;

export const useDispatch = createUseStoreDispatch( STORE_KEY );
export const useSelect = createUseStoreSelect( STORE_KEY );
