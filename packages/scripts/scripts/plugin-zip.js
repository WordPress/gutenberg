/**
 * External dependencies
 */
const AdmZip = require( 'adm-zip' );
const { sync: glob } = require( 'fast-glob' );
const { sync: packlist } = require( 'npm-packlist' );
const { dirname } = require( 'path' );
const { stdout } = require( 'process' );

/**
 * Internal dependencies
 */
const { hasPackageProp, getPackageProp } = require( '../utils' );

const name = getPackageProp( 'name' );
stdout.write( `Creating archive for \`${ name }\` plugin... 🎁\n\n` );
const zip = new AdmZip();

let files = [];
if ( hasPackageProp( 'files' ) ) {
	stdout.write(
		'Using the `files` field from `package.json` to detect files:\n\n'
	);
	files = packlist();
} else {
	stdout.write(
		'Using Plugin Handbook best practices to discover files:\n\n'
	);
	// See https://developer.wordpress.org/plugins/plugin-basics/best-practices/#file-organization.
	files = glob(
		[
			'admin/**',
			'build/**',
			'includes/**',
			'languages/**',
			'public/**',
			`${ name }.php`,
			'uninstall.php',
			'block.json',
			'changelog.*',
			'license.*',
			'readme.*',
		],
		{
			caseSensitiveMatch: false,
		}
	);
}

files.forEach( ( file ) => {
	stdout.write( `  Adding \`${ file }\`.\n` );
	const zipDirectory = dirname( file );
	zip.addLocalFile( file, zipDirectory !== '.' ? zipDirectory : '' );
} );

zip.writeZip( `./${ name }.zip` );
stdout.write( `\nDone. \`${ name }.zip\` is ready! 🎉\n` );
