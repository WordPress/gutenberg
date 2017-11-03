/**
 * Internal dependencies
 */
import { BREAK_MEDIUM } from '../../constants';

/**
 * Checks if we are in a mobile resolution using window.innerWidth if available
 *
 * @return {Boolean}  Returns true if on mobile resolution and false if on non mobile or impossible to check.
 */
const isMobileChecker = () => 'object' === typeof window && window.innerWidth < BREAK_MEDIUM;

/**
 * Disables isSidebarOpened on rehydrate payload if the user is on a mobile screen size.
 *
 * @param  {Object}  payload   rehydrate payload
 * @param  {Boolean} isMobile  flag indicating if executing on mobile screen sizes or not
 *
 * @return {Object}            rehydrate payload with isSidebarOpened disabled if on mobile
 */
export const disableIsSidebarOpenedOnMobile = ( payload, isMobile = isMobileChecker() ) => (
	isMobile ? { ...payload, isSidebarOpened: false } : payload
);

/**
 * Middleware
 */

export const mobileMiddleware = () => next => action => {
	if ( action.type === 'REDUX_REHYDRATE' ) {
		return next( {
			type: 'REDUX_REHYDRATE',
			payload: disableIsSidebarOpenedOnMobile( action.payload ),
		} );
	}
	return next( action );
};
