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
import * as selectors from './selectors';
import * as actions from './actions';

/**
 * Module Constants
 */
const MODULE_KEY = 'core/annotations';

const store = registerStore( MODULE_KEY, {
	reducer,
	selectors,
	actions,
} );

export default store;

export const useDispatch = createUseStoreDispatch( MODULE_KEY );
export const useSelect = createUseStoreSelect( MODULE_KEY );
