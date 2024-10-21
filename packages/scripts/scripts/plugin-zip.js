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
const { hasPackageProp, getPackageProp, getArgFromCLI } = require( '../utils' );

const name = getPackageProp( 'name' );
stdout.write( `Creating archive for \`${ name }\` plugin... 🎁\n\n` );
const zip = new AdmZip();
const zipRootFolderArg = getArgFromCLI( '--zip-root-folder' );
let zipRootFolder = null;
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

if ( zipRootFolderArg !== undefined ) {
	if ( zipRootFolderArg === null ) {
		stdout.write(
			'No value provided for `--zip-root-folder`. Using the plugin name as the root folder.\n\n'
		);
		zipRootFolder = `${ name }/`;
	} else {
		zipRootFolder = `${ zipRootFolderArg }/`;
	}
	stdout.write(
		`Adding the provided folder \`${ zipRootFolder }\` to the root of the package.\n\n`
	);
} else {
	zipRootFolder = '';
}

files.forEach( ( file ) => {
	stdout.write( `  Adding \`${ file }\`.\n` );
	const zipDirectory = dirname( file );
	zip.addLocalFile(
		file,
		zipRootFolder + ( zipDirectory !== '.' ? zipDirectory : '' )
	);
} );

zip.writeZip( `./${ name }.zip` );
stdout.write( `\nDone. \`${ name }.zip\` is ready! 🎉\n` );
