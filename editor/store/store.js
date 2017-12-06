/**
 * External dependencies
 */
import refx from 'refx';
import multi from 'redux-multi';
import { get, flowRight } from 'lodash';

/**
 * WordPress dependencies
 */
import { dispatch, getState, subscribe } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { mobileMiddleware } from '../utils/mobile';
import effects from './effects';

/**
 * This function applies the custom middlewares used specifically in the editor moodule
 * It also restricts the getState call to the module's partial state only.
 *
 * @return {Object} Redux custom store
 */
function applyMiddlewaresAndRestrictState() {
	const middlewares = [
		mobileMiddleware,
		refx( effects ),
		multi,
	];

	const enhancedGetState = () => get( getState(), 'core/editor' );
	let enhancedDispatch = () => {
		throw new Error(
			'Dispatching while constructing your middleware is not allowed. ' +
			'Other middleware would not be applied to this dispatch.'
		);
	};
	let chain = [];

	const middlewareAPI = {
		getState: enhancedGetState,
		dispatch: ( ...args ) => enhancedDispatch( ...args ),
	};
	chain = middlewares.map( middleware => middleware( middlewareAPI ) );
	enhancedDispatch = flowRight( ...chain )( dispatch );

	return {
		dispatch: enhancedDispatch,
		getState: enhancedGetState,
		subscribe,
	};
}

export default applyMiddlewaresAndRestrictState();
