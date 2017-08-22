// `babel-jest` should be doing this instead, but apparently it's not working.
require( 'core-js/modules/es7.object.values' );

// TODO: These exist only to stub or monkey-patch differences between React 15
// and 16, since the test environment runs an older version (while we wait for
// test dependencies like Enzyme to support 16)
//
// See: https://github.com/airbnb/enzyme/issues/928
jest.mock( '@wordpress/element', () => ( {
	...require.requireActual( '@wordpress/element' ),
	createPortal: ( x ) => x,
	renderToString: ( element ) => {
		const { createElement } = require( 'react' );
		const { renderToStaticMarkup } = require( 'react-dom/server' );

		if ( ! element ) {
			return '';
		}

		if ( 'string' === typeof element ) {
			return element;
		}

		if ( Array.isArray( element ) ) {
			// Pass the array as children of a dummy wrapper, then remove the
			// wrapper's opening and closing tags.
			return renderToStaticMarkup(
				createElement( 'div', null, ...element )
			).slice( 5 /* <div> */, -6 /* </div> */ );
		}

		return renderToStaticMarkup( element );
	},
} ) );
