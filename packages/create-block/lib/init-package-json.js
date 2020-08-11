/**
 * External dependencies
 */
const { isEmpty, omitBy } = require( 'lodash' );
const { join } = require( 'path' );
const writePkg = require( 'write-pkg' );

/**
 * Internal dependencies
 */
const { info } = require( './log' );

module.exports = async ( {
	author,
	description,
	license,
	slug,
	version,
	wpScripts,
} ) => {
	const cwd = join( process.cwd(), slug );

	info( '' );
	info( 'Creating a "package.json" file.' );
	await writePkg(
		cwd,
		omitBy(
			{
				name: slug,
				version,
				description,
				author,
				license,
				main: wpScripts && 'build/index.js',
				scripts: wpScripts && {
					build: 'wp-scripts build',
					'format:js': 'wp-scripts format-js',
					'lint:css': 'wp-scripts lint-style',
					'lint:js': 'wp-scripts lint-js',
					start: 'wp-scripts start',
					'packages-update': 'wp-scripts packages-update',
				},
			},
			isEmpty
		)
	);
};
