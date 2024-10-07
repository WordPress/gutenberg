/**
 * External dependencies
 */
const log = require( 'webpack/hot/log' );

const visitedStylesheets = new WeakSet();

function debounce( fn, time ) {
	let timeout;
	return function ( ...args ) {
		clearTimeout( timeout );
		timeout = setTimeout( () => {
			return fn.apply( this, args );
		}, time );
	};
}

function updateCSS( stylesheet, url ) {
	const href = stylesheet.href;

	if ( ! href || ( url && ! href.includes( url ) ) ) {
		return;
	}

	if ( visitedStylesheets.has( stylesheet ) ) {
		return;
	}

	visitedStylesheets.add( stylesheet );
	const element = stylesheet.cloneNode();
	visitedStylesheets.add( element );

	element.href = href.split( '?' )[ 0 ] + `?${ Date.now() }`;

	element.addEventListener( 'load', () => {
		if ( visitedStylesheets.has( element ) ) {
			visitedStylesheets.delete( element );
			stylesheet.remove();
		}
	} );

	element.addEventListener( 'error', () => {
		if ( visitedStylesheets.has( element ) ) {
			visitedStylesheets.delete( element );
			stylesheet.remove();
		}
	} );

	stylesheet.after( element );
}

function getAllStylesheets( win ) {
	const links = [
		...win.document.querySelectorAll( "link[rel='stylesheet']" ),
	];

	// Recursively loop through all frames with the same origin.
	for ( let i = 0; i < win.frames.length; i++ ) {
		try {
			links.push( ...getAllStylesheets( win.frames[ i ] ) );
		} catch ( err ) {
			// Ignore same origin policy errors.
		}
	}

	return links;
}

module.exports = function reloadCSS() {
	function update( url ) {
		const normalizedUrl = url.split( '?' )[ 0 ];
		const stylesheets = getAllStylesheets( window );
		let loaded = false;

		stylesheets.forEach( ( stylesheet ) => {
			updateCSS( stylesheet, normalizedUrl );
			loaded = true;
		} );

		if ( loaded ) {
			log( 'info', `[HMR] css reload ${ normalizedUrl }` );
		} else {
			log( 'info', '[HMR] Reload all css' );

			stylesheets.forEach( ( stylesheet ) => {
				updateCSS( stylesheet );
			} );
		}
	}

	return debounce( update, 50 );
};
