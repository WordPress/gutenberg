module.exports = {
	// Crawl the entire repo
	crawlFrom: './',
	// Needed for properly reporting components with dot notation
	includeSubComponents: true,
	// Exclude usage in tests, stories, and React Native files.
	globs: [ '**/!(test|stories)/!(.native.).@(js|ts)?(x)' ],
	// Exclude any vendor or docs directories
	exclude: [
		'bin',
		'build',
		'build-module',
		'docs',
		'node_modules',
		'patches',
		'platform-docs',
		'test',
		'tools',
		'typings',
		'vendor',
	],
	// Filter out any non-component React elements
	importedFrom: /.*/,
	getComponentName: ( { imported, local } ) => {
		return ( imported || local )
			.replace( '__experimental', '' )
			.replace( '__unstable', '' );
	},
	processors: [ 'count-components-and-props' ],
};
