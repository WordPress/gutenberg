/**
 * Stricter ESLint configuration for modified files (used by lint-staged).
 * This extends the base config and adds additional rules that we want to
 * enforce only on new/modified code.
 */
import baseConfig from './config.mjs';

export default [
	...baseConfig,
	{
		rules: {
			'@wordpress/dependency-group': [ 'error', 'never' ],
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
					'newlines-between': 'never',
					warnOnUnassignedImports: true,
				},
			],
		},
	},
	{
		// This config conditionally loads plugins, so its CommonJS imports
		// cannot form one static import block.
		files: [ 'tools/eslint/config.mjs' ],
		rules: {
			'import/order': 'off',
		},
	},
];
