module.exports = {
	extends: [ 'plugin:jsx-a11y/recommended' ],
	plugins: [ 'jsx-a11y' ],
	rules: {
		'jsx-a11y/label-has-for': [
			'error',
			{
				required: 'id',
			},
		],
		'jsx-a11y/media-has-caption': 'off',
		'jsx-a11y/no-noninteractive-tabindex': 'off',
		'jsx-a11y/role-has-required-aria-props': 'off',
		'jsx-quotes': 'error',
	},
};
