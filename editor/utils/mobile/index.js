/**
 * Internal dependencies
 */
import { isMobile } from '../../store/selectors';
import { toggleSidebar } from '../../store/actions';

/**
 * Middleware
 */

export const mobileMiddleware = ( { getState } ) => next => action => {
	if ( action.type === 'TOGGLE_SIDEBAR' && action.sidebar === undefined ) {
		return next( toggleSidebar( isMobile( getState() ) ? 'mobile' : 'desktop', action.forcedValue ) );
	}
	return next( action );
};
