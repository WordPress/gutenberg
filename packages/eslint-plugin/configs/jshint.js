module.exports = {
	rules: {
		curly: 'error',
		eqeqeq: 'error',
		'no-caller': 'error',
		'no-cond-assign': [ 'error', 'except-parens' ],
		'no-eq-null': 'error',
		'no-irregular-whitespace': 'error',
		'no-trailing-spaces': 'error',
		'no-undef': 'error',
		'no-unused-expressions': 'error',
		'no-unused-vars': [ 'error', { ignoreRestSiblings: true } ],
		'one-var': [ 'error', 'always' ],
		quotes: [ 'error', 'single' ],
		'wrap-iife': [ 'error', 'any' ],
	},
};
