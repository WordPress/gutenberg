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

registerStore( 'core/blocks', { reducer, selectors, actions } );

export const useDispatch = createUseStoreDispatch( 'core/blocks' );
export const useSelect = createUseStoreSelect( 'core/blocks' );
