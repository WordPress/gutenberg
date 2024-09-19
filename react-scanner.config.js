module.exports = {
	crawlFrom: './',
	includeSubComponents: true,
	globs: [ '**/!(test|stories)/!(.native.).@(js|ts)?(x)' ],
	exclude: [ 'node_modules', 'vendor' ],
};
