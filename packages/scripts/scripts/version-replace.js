/**
 * External dependencies
 */
const replace = require( 'replace-in-file' );
const { sync: glob } = require( 'fast-glob' );
const { stdout } = require( 'process' );

/**
 * Internal dependencies
 */
const { hasPackageProp, getPackageProp } = require( '../utils' );

const name = getPackageProp( 'name' );
const version = getPackageProp( 'version' );

// See https://developer.wordpress.org/plugins/plugin-basics/best-practices/#file-organization.
let pluginFiles = glob(
	[
		'admin/**/*',
		'src/**/*',
		'includes/**/*',
		'templates/**/*',
		'assets/**/*',
		`${ name }.php`,
		'uninstall.php',
		'changelog.*',
		'readme.*',
	],
	{
		caseSensitiveMatch: false,
	}
);

stdout.write( `Replacing version string for \`${ name }\` plugin... 🔥\n\n` );

let pluginVersionConstant = `${ name
	.replace( /-/g, '_' )
	.toUpperCase() }_SINCE`;

if ( hasPackageProp( 'version-replace' ) ) {
	const versionReplace = getPackageProp( 'version-replace' );

	if ( 'files' in getPackageProp( 'version-replace' ) ) {
		stdout.write(
			'Using the `version-replace` field from `package.json` to detect files...\n'
		);

		pluginFiles = glob( versionReplace.files, {
			caseSensitiveMatch: false,
		} );
	}

	if ( 'constant' in getPackageProp( 'version-replace' ) ) {
		stdout.write(
			'Using the `version-replace` field from `package.json` to detect plugin version constant...\n'
		);

		pluginVersionConstant = versionReplace.constant;
	}
} else {
	stdout.write(
		'Using Plugin Handbook best practices to discover files...\n'
	);
}

stdout.write(
	`\nFound ${ pluginFiles.length } files to replace the version string\n\n`
);

if ( pluginFiles.length > 0 ) {
	stdout.write( 'Replacing version in files... ⏳\n\n' );

	replace( {
		files: pluginFiles,
		from: new RegExp( pluginVersionConstant, 'g' ),
		to: version,
		allowEmptyPaths: true,
	} )
		.then( () => {
			stdout.write( 'Version replaced successfully 👍\n\n' );
		} )
		.catch( ( error ) => {
			stdout.write( `Error occurred: ${ error } ❌\n\n` );
		} );
}
