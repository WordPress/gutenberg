/**
 * External dependencies
 */
const { exit, stdout } = require( 'process' );

/**
 * External dependencies
 */
const chalk = require( 'chalk' );
const { sync: spawn } = require( 'cross-spawn' );
const { sync: resolveBin } = require( 'resolve-bin' );
const { sync: dirGlob } = require( 'dir-glob' );
const { sync: readPkgUp } = require( 'read-pkg-up' );

/**
 * Internal dependencies
 */
const {
	fromConfigRoot,
	fromProjectRoot,
	getArgFromCLI,
	getFileArgsFromCLI,
	hasArgInCLI,
	hasPrettierConfig,
	hasProjectFile,
} = require( '../utils' );

// Check if the project has wp-prettier installed and if the project has a Prettier config.
function checkPrettier() {
	try {
		const prettierResolvePath = require.resolve( 'prettier' );
		const prettierPackageJson = readPkgUp( { cwd: prettierResolvePath } );
		const prettierPackageName = prettierPackageJson.packageJson.name;

		if (
			! [ 'wp-prettier', '@wordpress/prettier' ].includes(
				prettierPackageName
			)
		) {
			return {
				success: false,
				message:
					chalk.red(
						'Incompatible version of Prettier was found in your project\n'
					) +
					"You need to install the 'wp-prettier' package to get " +
					'code formatting compliant with the WordPress coding standards.\n\n',
			};
		}
	} catch {
		return {
			success: false,
			message:
				chalk.red(
					"The 'prettier' package was not found in your project\n"
				) +
				"You need to install the 'wp-prettier' package under an alias to get " +
				'code formatting compliant with the WordPress coding standards.\n\n',
		};
	}

	return { success: true };
}

const checkResult = checkPrettier();
if ( ! checkResult.success ) {
	stdout.write( checkResult.message );
	exit( 1 );
}

// Check for existing config in project, if it exists no command-line args are
// needed for config, otherwise pass in args to default config in packages
// See: https://prettier.io/docs/en/configuration.html
let configArgs = [];
if ( ! hasPrettierConfig() ) {
	configArgs = [
		'--config',
		require.resolve( '@wordpress/prettier-config' ),
	];
}

// If `--ignore-path` is not explicitly specified, use the project's or global .prettierignore.
let ignorePath = getArgFromCLI( '--ignore-path' );
if ( ! ignorePath ) {
	if ( hasProjectFile( '.prettierignore' ) ) {
		ignorePath = fromProjectRoot( '.prettierignore' );
	} else {
		ignorePath = fromConfigRoot( '.prettierignore' );
	}
}
const ignoreArgs = [ '--ignore-path', ignorePath ];

// Forward the --require-pragma option that formats only files that already have the @format
// pragma in the first docblock.
const pragmaArgs = hasArgInCLI( '--require-pragma' )
	? [ '--require-pragma' ]
	: [];

// Get the files and directories to format and convert them to globs.
let fileArgs = getFileArgsFromCLI();
if ( fileArgs.length === 0 ) {
	fileArgs = [ '.' ];
}

// Converts `foo/bar` directory to `foo/bar/**/*.js`
const globArgs = dirGlob( fileArgs, {
	extensions: [ 'js', 'jsx', 'ts', 'tsx', 'yml', 'yaml' ],
} );

const result = spawn(
	resolveBin( 'prettier' ),
	[ '--write', ...configArgs, ...ignoreArgs, ...pragmaArgs, ...globArgs ],
	{ stdio: 'inherit' }
);

process.exit( result.status );
