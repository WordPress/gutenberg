#!/usr/bin/env node

/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );
const { merge } = require( 'lodash' );

const currentConfig = JSON.parse(
	fs.readFileSync( path.join( __dirname, '../.wp-env.json' ), 'utf-8' )
);

const overrideConfig = {
	env: {
		development: {
			config: {
				WP_SITEURL: `https://${ process.env.CODESANDBOX_HOST.replace(
					'$PORT',
					8888
				) }`,
				WP_HOME: `https://${ process.env.CODESANDBOX_HOST.replace(
					'$PORT',
					8888
				) }`,
			},
			mappings: merge( currentConfig?.env?.development?.mappings ?? {}, {
				'wp-content/mu-plugins/disable-canonical-redirect.php':
					'.codesandbox/disable-canonical-redirect.php',
			} ),
		},
		tests: {
			config: {
				WP_SITEURL: `https://${ process.env.CODESANDBOX_HOST.replace(
					'$PORT',
					8889
				) }`,
				WP_HOME: `https://${ process.env.CODESANDBOX_HOST.replace(
					'$PORT',
					8889
				) }`,
			},
			mappings: merge( currentConfig?.env?.tests?.mappings ?? {}, {
				'wp-content/mu-plugins/disable-canonical-redirect.php':
					'.codesandbox/disable-canonical-redirect.php',
			} ),
		},
	},
};

fs.writeFileSync(
	path.join( __dirname, '../.wp-env.override.json' ),
	JSON.stringify( overrideConfig, null, 2 )
);
