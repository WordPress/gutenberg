/**
 * External dependencies
 */
const reactPlugin = require( 'eslint-plugin-react' );
const reactHooksPlugin = require( 'eslint-plugin-react-hooks' );

/**
 * Internal dependencies
 */
const wpRules = require( '../rules' );

const wpPlugin = { rules: wpRules };

module.exports = [
	reactPlugin.configs.flat.recommended,
	{
		plugins: {
			'@wordpress': wpPlugin,
			'react-hooks': reactHooksPlugin,
		},
		languageOptions: {
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
			},
		},
		settings: {
			react: {
				version: 'detect',
			},
		},
		rules: {
			'@wordpress/no-unused-vars-before-return': [
				'error',
				{
					excludePattern: '^use',
				},
			],
			'react/display-name': 'off',
			'react/jsx-curly-spacing': [
				'error',
				{
					when: 'always',
					children: true,
				},
			],
			'react/jsx-equals-spacing': 'error',
			'react/jsx-indent': [ 'error', 'tab' ],
			'react/jsx-indent-props': [ 'error', 'tab' ],
			'react/jsx-key': 'error',
			'react/jsx-tag-spacing': 'error',
			'react/no-children-prop': 'off',
			'react/prop-types': 'off',
			'react/react-in-jsx-scope': 'off',
			'react-hooks/exhaustive-deps': [
				'warn',
				{
					additionalHooks: '^(useSelect|useSuspenseSelect)$',
				},
			],
			'react-hooks/rules-of-hooks': 'error',
		},
	},
];
