module.exports = function( api ) {
	api.cache( true );

	return {
		presets: [ '@wordpress/babel-preset-default' ],
		plugins: [
			[
				'@wordpress/babel-plugin-import-jsx-pragma',
				{
					scopeVariable: 'createElement',
					source: '@wordpress/element',
					isDefault: false,
				},
			],
			[
				'@wordpress/babel-plugin-async-load',
				{
					siteURLSource: '_wpSiteURL',
					components: [
						{
							module: '@wordpress/components',
							component: 'CodeEditor',
							scripts: [
								'wp-codemirror',
								'code-editor',
								'htmlhint',
								'htmlhint-kses',
								'csslint',
								'jshint',
							],
							styles: [ 'wp-codemirror', 'code-editor' ],
						},
					],
				},
			],
		],
		env: {
			production: {
				plugins: [
					[
						'@wordpress/babel-plugin-makepot',
						{
							output: 'languages/gutenberg.pot',
						},
					],
				],
			},
		},
	};
};
