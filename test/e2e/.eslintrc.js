module.exports = {
	root: true,
	extends: [
		'../../eslint/config.js',
	],
	env: {
		mocha: true,
	},
	globals: {
		cy: true,
		Cypress: true,
		expect: true,
	},
};
