/**
 * WordPress dependencies
 */
import { createRegistryControl } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { STORE_KEY } from './constants';
import { onChangeListener } from './utils';

/**
 * Calls a selector using the current state.
 *
 * @param {string} storeName    Store name.
 * @param {string} selectorName Selector name.
 * @param  {Array} args         Selector arguments.
 *
 * @return {Object} control descriptor.
 */
export function select( storeName, selectorName, ...args ) {
	return {
		type: 'SELECT',
		storeName,
		selectorName,
		args,
	};
}

/**
 * Calls a subscriber using the current state.
 *
 * @param {function} listenerCallback  A callback for the subscriber that
 *                                     receives the registry.
 * @return {Object} control descriptor.
 */
export function subscribe( listenerCallback ) {
	return { type: 'SUBSCRIBE', listenerCallback };
}

/**
 * A control for adjusting the sidebar when viewport mobile size is triggered.
 *
 * @return {Object} control.descriptor.
 */
export function adjustSidebar() {
	return { type: 'ADJUST_SIDEBAR' };
}

const controls = {
	SELECT: createRegistryControl(
		( registry ) => ( { storeName, selectorName, args } ) => {
			return registry.select( storeName )[ selectorName ]( ...args );
		}
	),
	SUBSCRIBE: createRegistryControl(
		( registry ) => ( { listenerCallback } ) => {
			return registry.subscribe( listenerCallback( registry ) );
		}
	),
	ADJUST_SIDEBAR: createRegistryControl(
		( registry ) => () => {
			const isMobileViewPort = () => registry.select( 'core/viewport' )
				.isViewportMatch( '< medium' );
			const adjuster = ( () => {
				// contains the sidebar we close when going to viewport sizes lower than
				// medium. This allows to reopen it when going again to viewport sizes
				// greater than medium.
				let sidebarToReOpenOnExpand = null;
				return ( isSmall ) => {
					const { getActiveGeneralSidebarName } = registry.select( STORE_KEY );
					const {
						closeGeneralSidebar,
						openGeneralSidebar,
					} = registry.dispatch( STORE_KEY );
					if ( isSmall ) {
						sidebarToReOpenOnExpand = getActiveGeneralSidebarName();
						if ( sidebarToReOpenOnExpand ) {
							closeGeneralSidebar();
						}
					} else if (
						sidebarToReOpenOnExpand &&
						! getActiveGeneralSidebarName()
					) {
						openGeneralSidebar( sidebarToReOpenOnExpand );
					}
				};
			} )();
			adjuster( isMobileViewPort() );

			// Collapse sidebar when viewport shrinks.
			// Reopen sidebar it if viewport expands and it was closed because of a
			// previous shrink.
			return registry.subscribe(
				onChangeListener( isMobileViewPort, adjuster )
			);
		}
	),
};

export default controls;
