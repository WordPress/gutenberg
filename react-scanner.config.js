module.exports = {
	crawlFrom: './',
	includeSubComponents: true,
	globs: [ '**/!(test|stories).*.@(js|ts)?(x)' ],
	exclude: [ 'node_modules', 'vendor' ],
};
