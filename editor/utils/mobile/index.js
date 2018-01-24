/**
 * Internal dependencies
 */
import { isMobile } from '../../store/selectors';
import { setViewportType } from '../../store/actions';

/**
 * Middleware
 */

export const mobileMiddleware = ( { getState } ) => next => action => {
	if ( action.type === 'TOGGLE_SIDEBAR' && action.sidebar === undefined ) {
		return next( setViewportType( isMobile( getState() ) ? 'mobile' : 'desktop' ) );
	}
	return next( action );
};
