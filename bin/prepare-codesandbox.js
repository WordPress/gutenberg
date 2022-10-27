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
				"WP_SITEURL": "${ process.env.CODESANDBOX_HOST.replace( '$PORT', 8888 ) }"
			},
			"tests": {
				"WP_SITEURL": "${ process.env.CODESANDBOX_HOST.replace( '$PORT', 8889 ) }"
			}
		}
	}`
);
