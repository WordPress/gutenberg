/**
 * External dependencies
 */
const { join } = require( 'path' );

module.exports = {
	defaultValues: {
		slug: 'example-interactive',
		title: 'Example Interactive',
		description: 'An interactive block with the Interactivity API',
		dashicon: 'interactivity',
		npmDependencies: [ '@wordpress/interactivity' ],
		supports: {
			interactivity: true,
		},
	},
	variants: {
		basic: {
			render: 'file:./render.php',
			viewScript: 'file:./view.js',
		},
	},
	pluginTemplatesPath: join( __dirname, 'plugin-templates' ),
	blockTemplatesPath: join( __dirname, 'block-templates' ),
	assetsPath: join( __dirname, 'assets' ),
};
