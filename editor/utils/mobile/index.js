/**
 * Internal dependencies
 */
import { isMobile } from '../../store/selectors';
import { setViewportType } from '../../store/actions';

/**
 * Disables isSidebarOpened on rehydrate payload if the user is on a mobile screen size.
 *
 * @param  {Object} payload rehydrate payload
 * @return {Object}         rehydrate payload with isSidebarOpened disabled if on mobile
 */
export const disableIsSidebarOpenedOnMobile = ( payload ) => (
	payload.isSidebarOpenedMobile ? { ...payload, isSidebarOpenedMobile: false } : payload
);

/**
 * Middleware
 */

export const mobileMiddleware = ( { getState } ) => next => action => {
	if ( action.type === 'REDUX_REHYDRATE' ) {
		return next( {
			type: 'REDUX_REHYDRATE',
			payload: disableIsSidebarOpenedOnMobile( action.payload ),
		} );
	}
	if ( action.type === 'TOGGLE_SIDEBAR' && action.sidebar === undefined ) {
		return next( setViewportType( isMobile( getState() ) ? 'mobile' : 'desktop' ) );
	}
	return next( action );
};
