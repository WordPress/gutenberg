/**
 * Enhance a redux store with the browser size.
 *
 * @param {Object} store            Redux Store.
 * @param {number} mobileBreakpoint The mobile breakpoint.
 */
function enhanceWithBrowserSize( store, mobileBreakpoint ) {
	const updateSize = () => {
		store.dispatch( {
			type: 'UPDATE_MOBILE_STATE',
			isMobile: window.innerWidth < mobileBreakpoint,
		} );
	};

	const mediaQueryList = window.matchMedia( `(min-width: ${ mobileBreakpoint }px)` );
	mediaQueryList.addListener( updateSize );
	window.addEventListener( 'orientationchange', updateSize );
	updateSize();
}

export default enhanceWithBrowserSize;
