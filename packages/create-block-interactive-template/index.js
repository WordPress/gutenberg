/**
 * External dependencies
 */
const { join } = require( 'path' );

module.exports = {
	defaultValues: {
		slug: 'example-interactive',
		title: 'Example Interactive',
		description: 'An interactive block with the Interactivity API.',
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
		default: {},
		typescript: {
			slug: 'example-interactive-typescript',
			title: 'Example Interactive TypeScript',
			description:
				'An interactive block with the Interactivity API using TypeScript.',
			viewScriptModule: 'file:./view.ts',
		},
		'client-side-navigation': {
			slug: 'example-interactive-client-side-navigation',
			title: 'Example Interactive Client-Side Navigation',
			description:
				'An interactive block demonstrating client-side navigation with the Interactivity API Router.',
			blockTemplatesPath: join(
				__dirname,
				'block-templates-client-side-navigation'
			),
			npmDependencies: [
				'@wordpress/interactivity',
				'@wordpress/interactivity-router',
			],
		},
	},
	pluginTemplatesPath: join( __dirname, 'plugin-templates' ),
	blockTemplatesPath: join( __dirname, 'block-templates' ),
};
