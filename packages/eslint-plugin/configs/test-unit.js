module.exports = {
	extends: [ 'plugin:jest/recommended' ],
	rules: {
		'jest/expect-expect': [
			'error',
			{ assertFunctionNames: [ 'expect', 'measurePerformance' ] },
		],
	},
};
