/**
 * Stricter ESLint configuration for modified files (used by lint-staged).
 * This extends the base config and adds additional rules that we want to
 * enforce only on new/modified code.
 */
module.exports = {
	extends: [ './.eslintrc.js' ],
	rules: {
		// Enforce import ordering on modified files
		'import/order': [
			'error',
			{
				groups: [
					'builtin', // Node.js built-in modules
					'external', // npm packages
					'internal', // Aliased modules
					[ 'parent', 'sibling', 'index' ], // Relative imports
				],
			},
		],
	},
};
