/**
 * External dependencies
 */
import { throttle } from 'lodash';

/**
 * Enhance a redux store with the browser size
 *
 * @param {Object} store Redux Store
 */
function enhanceWithBrowserSize( store ) {
	const updateSize = throttle( () => {
		store.dispatch( {
			type: 'BROWSER_RESIZE',
			width: window.innerWidth,
			height: window.innerHeight,
		} );
	}, 100 );

	window.addEventListener( 'resize', updateSize );
	window.addEventListener( 'orientationchange', updateSize );
	updateSize();
}

export default enhanceWithBrowserSize;
