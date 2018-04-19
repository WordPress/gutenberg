// Set up `wp.*` aliases.  Handled by Webpack outside of the test build.
global.wp = {
	shortcode: {
		next() {},
		regexp: jest.fn().mockReturnValue( new RegExp() ),
	},
};

[
	'element',
	'components',
	'utils',
	'blocks',
	'date',
	'editor',
	'data',
	'edit-post',
	'core-data',
	'viewport',
	'plugins',
].forEach( ( entryPointName ) => {
	Object.defineProperty( global.wp, entryPointName, {
		get: () => require( entryPointName ),
	} );
} );
