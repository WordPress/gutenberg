/**
 * External dependencies
 */
const react = require( 'eslint-plugin-react' );
const reactHooks = require( 'eslint-plugin-react-hooks' );

module.exports = [
	react.configs.flat.recommended,
	{
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
		plugins: {
			'@wordpress': require( '../plugin' ),
			react,
			'react-hooks': reactHooks,
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
