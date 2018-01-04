/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import { isMobile } from '../../store/selectors';
import { toggleSidebar } from '../../store/actions';

/**
 * Disables mobile sidebar if it is present on the payload.
 *
 * @param  {Object} payload rehydrate payload
 * @return {Object}         rehydrate payload with mobile sidebar disabled
 */
export const disableMobileSidebar = ( payload ) => (
	get( payload, 'sidebars.mobile' ) ?
		{ ...payload, ...{ sidebars: { ...payload.sidebars, mobile: false } } } :
		payload
);

/**
 * Middleware
 */

export const mobileMiddleware = ( { getState } ) => next => action => {
	if ( action.type === 'REDUX_REHYDRATE' ) {
		return next( {
			type: 'REDUX_REHYDRATE',
			payload: disableMobileSidebar( action.payload ),
		} );
	}
	if ( action.type === 'TOGGLE_SIDEBAR' && action.sidebar === undefined ) {
		return next( toggleSidebar( isMobile( getState() ) ? 'mobile' : 'desktop', action.force ) );
	}
	return next( action );
};
