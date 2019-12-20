/**
 * WordPress dependencies
 */
import { registerStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as actions from './actions';
import * as selectors from './selectors';
import controls from './controls';

export default registerStore( 'core/notices', {
	reducer,
	actions,
	selectors,
	controls,
} );
