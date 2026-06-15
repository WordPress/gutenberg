/**
 * External dependencies
 */
const { join } = require( 'path' );

module.exports = {
	defaultValues: {
		slug: 'copyright-date-block',
		title: 'Copyright Date',
		description: "Display your site's copyright date.",
		attributes: {
			fallbackCurrentYear: {
				type: 'string',
			},
			showStartingYear: {
				type: 'boolean',
			},
			startingYear: {
				type: 'string',
			},
		},
		supports: {
			color: {
				background: false,
				text: true,
			},
			html: false,
			typography: {
				fontSize: true,
			},
		},
		editorScript: 'file:./index.js',
		render: 'file:./render.php',
		example: {},
		wpEnv: true,
	},
	pluginTemplatesPath: join( __dirname, 'plugin-templates' ),
	blockTemplatesPath: join( __dirname, 'block-templates' ),
};
