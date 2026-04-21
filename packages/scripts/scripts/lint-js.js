/**
 * External dependencies
 */
const { sync: spawn } = require( 'cross-spawn' );
const { sync: resolveBin } = require( 'resolve-bin' );

/**
 * Internal dependencies
 */
const {
	fromConfigRoot,
	getArgsFromCLI,
	hasArgInCLI,
	hasFileArgInCLI,
	hasProjectFile,
} = require( '../utils' );

const args = getArgsFromCLI();

const defaultFilesArgs = hasFileArgInCLI() ? [] : [ '.' ];

// ESLint v10 flat config detection.
// See: https://eslint.org/docs/latest/use/configure/configuration-files
const hasLintConfig =
	hasArgInCLI( '-c' ) ||
	hasArgInCLI( '--config' ) ||
	hasProjectFile( 'eslint.config.js' ) ||
	hasProjectFile( 'eslint.config.mjs' ) ||
	hasProjectFile( 'eslint.config.cjs' ) ||
	hasProjectFile( 'eslint.config.ts' ) ||
	hasProjectFile( 'eslint.config.mts' ) ||
	hasProjectFile( 'eslint.config.cts' );

// Warn if the project still has a legacy eslintrc config file.
if ( ! hasLintConfig ) {
	const legacyConfigFiles = [
		'.eslintrc',
		'.eslintrc.js',
		'.eslintrc.cjs',
		'.eslintrc.json',
		'.eslintrc.yml',
		'.eslintrc.yaml',
	];
	const hasLegacyConfig = legacyConfigFiles.some( hasProjectFile );
	if ( hasLegacyConfig ) {
		// eslint-disable-next-line no-console
		console.warn(
			'Warning: Legacy eslintrc configuration detected. ' +
				'ESLint v10 no longer supports eslintrc files. ' +
				'Please migrate to eslint.config.js (flat config). ' +
				'See https://eslint.org/docs/latest/use/configure/migration-guide for details.'
		);
	}
}

// When a configuration is not provided by the project, use the default
// provided with the scripts module.
const defaultConfigArgs = ! hasLintConfig
	? [ '--config', fromConfigRoot( 'eslint.config.cjs' ) ]
	: [];

const result = spawn(
	resolveBin( 'eslint' ),
	[ ...defaultConfigArgs, ...args, ...defaultFilesArgs ],
	{ stdio: 'inherit' }
);

process.exit( result.status );
