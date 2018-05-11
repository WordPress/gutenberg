// Set up `wp.*` aliases.  Handled by Webpack outside of the test build.
global.wp = {
	shortcode: {
		next() {},
		regexp: jest.fn().mockReturnValue( new RegExp() ),
	},
};

[
	'element',
	'blocks',
].forEach( ( entryPointName ) => {
	Object.defineProperty( global.wp, entryPointName, {
		get: () => require( entryPointName ),
	} );
} );
