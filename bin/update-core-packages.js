/* eslint-disable no-console */

/**
 * External dependencies
 */
const chalk = require( 'chalk' );
const fs = require( 'fs' );

/**
 * Internal dependencies
 */
const { readJSONFile, runShellScript, askForConfirmationToContinue } = require( './utils' );

/**
 * Constants
 */
const WORDPRESS_PACKAGES_PREFIX = '@wordpress/';
const SCRIPT_LOADER_PATH = 'src/wp-includes/script-loader.php';
const BUILD_COMMAND = 'npm run build';

function getWordPressPackages( packageJSON ) {
	return Object.keys( packageJSON.dependencies ).
		concat( Object.keys( packageJSON.devDependencies ) ).
		filter( ( packageName ) => ( packageName.startsWith( WORDPRESS_PACKAGES_PREFIX ) ) );
}

function getCommandUpdatePackagesLatestVersion( packages ) {
	const packagesWithLatest = packages.map( ( packageName ) => ( `${ packageName }@latest` ) );
	const packagesWithLatestJoined = packagesWithLatest.join( ' ' );
	return `npm install ${ packagesWithLatestJoined } --save`;
}

function getPackageVersionDiff( initialPackageJSON, finalPackageJSON ) {
	const diff = [ 'dependencies', 'devDependencies' ].reduce(
		( result, keyPackageJSON ) => {
			return Object.keys( finalPackageJSON[ keyPackageJSON ] ).reduce(
				( _result, dependency ) => {
					const initial = initialPackageJSON[ keyPackageJSON ][ dependency ];
					const final = finalPackageJSON[ keyPackageJSON ][ dependency ];
					if ( initial !== final ) {
						_result.push( { dependency, initial, final } );
					}
					return _result;
				},
				result
			);
		},
		[]
	);
	return diff.sort( ( a, b ) => a.dependency.localeCompare( b.dependency ) );
}

function outputPackageDiffReport( packageDiff ) {
	console.log( [
		'The following package versions were changed:',
		...packageDiff.map( ( { dependency, initial, final } ) => {
			return `${ dependency }: ${ initial } -> ${ final }`;
		} ),
	].join( '\n' ) );
}

function updatePackageJSON() {
	const initialPackageJSON = readJSONFile( 'package.json' );
	const packages = getWordPressPackages( initialPackageJSON );
	const packageUpdateCommand = getCommandUpdatePackagesLatestVersion( packages );
	runShellScript( packageUpdateCommand );
	const finalPackageJSON = readJSONFile( 'package.json' );
	outputPackageDiffReport( getPackageVersionDiff( initialPackageJSON, finalPackageJSON ) );
}

function updateScriptLoader() {
	const scriptLoader = fs.readFileSync( SCRIPT_LOADER_PATH, 'utf8' );
	const packageJSON = readJSONFile( 'package.json' );
	const scriptLoaderUpdated = scriptLoader.replace( /\$packages_versions\s+=\s+array\(([^\)])*\)\s*;/g, ( packageVersionString ) => {
		return packageVersionString.replace( /\'([^\']+)\'.*=>.*\'([^\']+)\',/g, ( match, packageName, version ) => {
			const packageNameWordPressPrefix = `${ WORDPRESS_PACKAGES_PREFIX }${ packageName }`;
			const versionInPackageJSON = packageJSON.dependencies[ packageNameWordPressPrefix ];
			if ( versionInPackageJSON !== version ) {
				return match.replace( version, versionInPackageJSON );
			}
			return match;
		} );
	} );
	fs.writeFileSync(
		SCRIPT_LOADER_PATH,
		scriptLoaderUpdated
	);

	//console.log( scriptLoader );
}

async function updateCorePackages() {
	const abortMessage = 'Aborting!';
	console.log(
		chalk.bold( '💃 Time to update WordPress core packages 🕺\n\n' ),
		'Welcome! This tool is going to help you with updating core WordPress packages to their latest version.\n',
		'The working directory should be set to the WordPress develop.\n'
	);
	await askForConfirmationToContinue(
		'Proceed with the update and install of the latest version for @wordpress packages?',
		true,
		abortMessage
	);
	updatePackageJSON();

	await askForConfirmationToContinue(
		'Proceed with the update to script-loader.php?',
		true,
		abortMessage
	);
	updateScriptLoader();

	await askForConfirmationToContinue(
		'The script-loader.php file was updated with success. Run the build so remaining files (e.g: php block changes) are updated?',
		true,
		abortMessage
	);
	runShellScript( BUILD_COMMAND );

	console.log(
		'\n>> 🎉 The changes were applied to the WordPress directory.\n',
		'Please test and submit a patch with these changes.\n',
		'Thank you for updating the core packages!'
	);
}

module.exports = {
	updateCorePackages,
};

/* eslint-enable no-console */
