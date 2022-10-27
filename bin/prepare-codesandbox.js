#!/usr/bin/env node

/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );

fs.writeFileSync(
	path.join( __dirname, '../.wp-env.override.json' ),
	`{
		"config": {
			"development": {
				"WP_SITEURL": "https://${ process.env.CODESANDBOX_HOST.replace(
					'$PORT',
					8888
				) }",
				"WP_HOME": "https://${ process.env.CODESANDBOX_HOST.replace( '$PORT', 8888 ) }"
			},
			"tests": {
				"WP_SITEURL": "https://${ process.env.CODESANDBOX_HOST.replace(
					'$PORT',
					8889
				) }",
				"WP_HOME": "https://${ process.env.CODESANDBOX_HOST.replace( '$PORT', 8889 ) }"
			}
		}
	}`
);
