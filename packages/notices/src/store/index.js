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

export default registerStore( 'core/notices', {
	reducer,
	actions,
	selectors,
} );

export const useDispatch = createUseStoreDispatch( 'core/notices' );
export const useSelect = createUseStoreSelect( 'core/notices' );
