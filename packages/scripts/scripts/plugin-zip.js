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
const zipRootFolderArg = getArgFromCLI( '--root-folder' );
const noRootFolderArg = getArgFromCLI( '--no-root-folder' );
let zipRootFolder = `${ name }/`;
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

if ( noRootFolderArg !== undefined ) {
	zipRootFolder = '';
	stdout.write( '  Plugin files will be zipped without a root folder.\n\n' );
} else if ( zipRootFolderArg !== undefined ) {
	const trimmedZipRootFolderArg =
		typeof zipRootFolderArg === 'string' ? zipRootFolderArg.trim() : null;
	if ( trimmedZipRootFolderArg === null ) {
		stdout.write(
			'Unable to create zip package: please provide a `--root-folder` name or use `--no-root-folder.`\n\n'
		);
		process.exit( 1 );
	}
	zipRootFolder = `${ trimmedZipRootFolderArg }/`;
	stdout.write(
		`  Adding the provided folder \`${ zipRootFolder }\` to the root of the package.\n\n`
	);
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
