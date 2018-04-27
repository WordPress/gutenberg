/**
 * WordPress Dependencies
 */
import { registerStore } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as selectors from './selectors';
import * as actions from './actions';
import * as resolvers from './resolvers';
import modelSelectors from './model-selectors';
import modelResolvers from './model-resolvers';

const store = registerStore( 'core', {
	reducer,
	actions,
	selectors: { ...selectors, ...modelSelectors },
	resolvers: { ...resolvers, ...modelResolvers },
} );

export default store;
