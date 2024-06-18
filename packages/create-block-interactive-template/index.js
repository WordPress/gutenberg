/**
 * External dependencies
 */
const { join } = require( 'path' );

module.exports = {
	defaultValues: {
		slug: 'example-interactive',
		title: 'Example Interactive',
		description: 'An interactive block with the Interactivity API',
		dashicon: 'media-interactive',
		npmDependencies: [ '@wordpress/interactivity' ],
		customPackageJSON: { files: [ '[^.]*' ] },
		supports: {
			interactivity: true,
		},
		viewScript: null,
		viewScriptModule: 'file:./view.js',
		render: 'file:./render.php',
		example: {},
		customScripts: {
			build: 'wp-scripts build --experimental-modules',
			start: 'wp-scripts start --experimental-modules',
		},
	},
	variants: {
		basic: {},
	},
	pluginTemplatesPath: join( __dirname, 'plugin-templates' ),
	blockTemplatesPath: join( __dirname, 'block-templates' ),
};
