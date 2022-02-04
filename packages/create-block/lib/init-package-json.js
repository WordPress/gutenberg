/**
 * External dependencies
 */
const { command } = require( 'execa' );
const { isEmpty, omitBy, size } = require( 'lodash' );
const npmPackageArg = require( 'npm-package-arg' );
const { join } = require( 'path' );
const writePkg = require( 'write-pkg' );

/**
 * Internal dependencies
 */
const { info, error } = require( './log' );

module.exports = async ( {
	author,
	description,
	license,
	slug,
	version,
	wpEnv,
	wpScripts,
	npmDependencies,
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
					format: 'wp-scripts format',
					'lint:css': 'wp-scripts lint-style',
					'lint:js': 'wp-scripts lint-js',
					'packages-update': 'wp-scripts packages-update',
					'plugin-zip': 'wp-scripts plugin-zip',
					start: 'wp-scripts start',
					env: wpEnv && 'wp-env',
				},
			},
			isEmpty
		)
	);

	if ( wpScripts && size( npmDependencies ) ) {
		info( '' );
		info(
			'Installing npm dependencies. It might take a couple of minutes...'
		);
		for ( const packageArg of npmDependencies ) {
			try {
				const { type } = npmPackageArg( packageArg );
				if (
					! [ 'git', 'tag', 'version', 'range', 'remote' ].includes(
						type
					)
				) {
					throw new Error(
						`Provided package type "${ type }" is not supported.`
					);
				}
				await command( `npm install ${ packageArg }`, {
					cwd,
				} );
			} catch ( { message } ) {
				info( '' );
				info( `Skipping "${ packageArg }" npm dependency. Reason:` );
				error( message );
			}
		}
	}
};
