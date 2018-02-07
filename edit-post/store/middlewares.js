/**
 * External dependencies
 */
import { flowRight } from 'lodash';

/**
 * Internal dependencies
 */
import { mobileMiddleware } from '../utils/mobile';

/**
 * Applies the custom middlewares used specifically in the editor module.
 *
 * @param {Object} store Store Object.
 *
 * @return {Object} Update Store Object.
 */
function applyMiddlewares( store ) {
	const middlewares = [
		mobileMiddleware,
	];

	let enhancedDispatch = () => {
		throw new Error(
			'Dispatching while constructing your middleware is not allowed. ' +
			'Other middleware would not be applied to this dispatch.'
		);
	};
	let chain = [];

	const middlewareAPI = {
		getState: store.getState,
		dispatch: ( ...args ) => enhancedDispatch( ...args ),
	};
	chain = middlewares.map( middleware => middleware( middlewareAPI ) );
	enhancedDispatch = flowRight( ...chain )( store.dispatch );

	return {
		...store,
		dispatch: enhancedDispatch,
	};
}

export default applyMiddlewares;
