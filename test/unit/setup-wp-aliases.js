// Set up `wp.*` aliases.  Handled by Webpack outside of the test build.
global.wp = {
	shortcode: {
		next: () => {},
	},
};

[
	'element',
	'i18n',
	'components',
	'utils',
	'blocks',
	'date',
	'editor',
].forEach( entryPointName => {
	Object.defineProperty( global.wp, entryPointName, {
		get: () => require( entryPointName ),
	} );
} );
