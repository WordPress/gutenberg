module.exports = {
	extends: [ 'plugin:react/recommended' ],
	parserOptions: {
		ecmaFeatures: {
			jsx: true,
		},
	},
	settings: {
		react: {
			version: 'detect',
		},
	},
	plugins: [ '@wordpress', 'react', 'react-hooks' ],
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
		'react-hooks/rules-of-hooks': 'error',
	},
};
