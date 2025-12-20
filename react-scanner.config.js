module.exports = {
	// Crawl the entire repo
	crawlFrom: './',
	// Needed for properly reporting components with dot notation
	includeSubComponents: true,
	// Exclude usage in tests, stories, and React Native files.
	globs: [ '**/!(test|stories)/!(*native).@(js|ts)?(x)' ],
	// Exclude any vendor or docs directories
	exclude: [
		'bin',
		'build',
		'build-module',
		'docs',
		'node_modules',
		'patches',
		'platform-docs',
		'results',
		'schemas',
		'storybook',
		'test',
		'tools',
		'ts-traces',
		'typings',
		'vendor',
	],
	/*
	 * Filter out any non-component React elements and consider only imports of
	 * `@wordpress/components` outside of the package.
	 */
	importedFrom: '@wordpress/components',
	processors: [ [ 'raw-report', { outputTo: './results/gutenberg.json' } ] ],
};
