/* eslint-disable no-console */
/**
 * External dependencies
 */
const fs = require( 'fs' );
const spawn = require( 'cross-spawn' );
const { zip, uniq, chain } = require( 'lodash' );
const { compare } = require( 'compare-versions' );
const { getArgFromCLI } = require( './node_modules/@wordpress/scripts/utils' );
const distTag = getArgFromCLI( '--dist-tag' ) || 'latest';

// I want to automate the gutenberg packages update process in wordpress-develop
// Right now it requires quite a bit of manual work, running commands, etc.
// Specifically, the pipeline goes like this:
// Gutenberg part:
// 1. Build Gutenberg from wp/6.0 branch
// 2. Release the packets using --dist-tag like 6.0

// wordpress-develop part:
// 3. Run wp-packages-update in this repo using that dist tag
// 4. Update all deps listed in package.json to match their counterparts in package.json in the Guteneberg repo
// 5. run npm install, perhaps wp-packages-update using that dist tag again?
// 6. Add any new blocks to php and js files where they're listed
// 7. run build
// 8. run build:dev in src/
// 9. perhaps run some more commands
// 10. git diff, make sure it makes sense
// 11. If no, manual process
// 12. If yes, commit, publish a new PR, ask for reviews
//
// Most of this could be done by a script.

// 4. Update all deps listed in package.json to match their counterparts in package.json in the Guteneberg repo

// Flatten all the dependencies into a single object
// return Object.assign( {}, ...allDeps );

/**
 * Constants
 */
const WORDPRESS_PACKAGES_PREFIX = '@wordpress/';

function readJSONFile( fileName ) {
	const data = fs.readFileSync( fileName, 'utf8' );
	return JSON.parse( data );
}

const isWordPressPackage = ( packageName ) => packageName.startsWith( WORDPRESS_PACKAGES_PREFIX );

function getWordPressPackages( { dependencies = {} } ) {
	return Object.keys( dependencies )
		.filter( isWordPressPackage );
}

function updateWordPressPackagesToVersion( version ) {
	const { dependencies, devDependencies } = readJSONFile( 'package.json' );
	// Get all WordPress packages
	const packages = Object.keys( dependencies )
		.concat( Object.keys( devDependencies ) )
		.filter( isWordPressPackage );
	return installPackages( packages.map( name => [name, version] ) );
}

function installPackages( packages ) {
	const packagesWithVersion = packages.map(
		( [packageName, version] ) => `${ packageName }@${ version }`,
	);
	return spawn.sync( 'npm', ['install', ...packagesWithVersion, '--save'], {
		stdio: 'inherit',
	} );
}

function getPerPackageDeps() {
	// Get the dependencies currently listed in the wordpress-develop package.json
	const currentPackageJSON = readJSONFile( 'package.json' );
	const currentPackages = getWordPressPackages( currentPackageJSON );

	// Get the dependencies that the above dependencies list in their package.json.
	const deps = currentPackages
		.map( ( packageName ) => `node_modules/${ packageName }/package.json` )
		.map( ( jsonPath ) => readJSONFile( jsonPath ).dependencies );
	return zip( currentPackages, deps );
}

function getMissingWordPressDependencies() {
	const perPackageDeps = getPerPackageDeps();
	const currentPackages = perPackageDeps.map( ( [name] ) => name );

	const requiredWpPackages = uniq( perPackageDeps
		// Capture the @wordpress dependencies of our dependencies into a flat list.
		.flatMap( ( [, dependencies] ) => getWordPressPackages( { dependencies } ) )
		.sort(),
	);

	return requiredWpPackages.filter(
		packageName => !currentPackages.includes( packageName ) );
}

function getMismatchedNonWordPressDependencies() {
	// Get the dependencies currently listed in the wordpress-develop package.json
	const currentPackageJSON = readJSONFile( 'package.json' );
	const currentThirdPartyDeps = Object.entries( currentPackageJSON.dependencies )
		.filter( ( [name] ) => !isWordPressPackage( name ) );

	// console.log( currentThirdPartyDeps );
	const packageToString = ( [name, version] ) => `${ name }#${ version }`;
	const requiredThirdPartyDeps = chain( getPerPackageDeps() )
		// Capture the non-@wordpress dependencies of our dependencies into a flat list.
		.flatMap( ( [, dependencies] ) => Object.entries( dependencies || {} ) )
		.uniqBy( packageToString )
		.value()
	;

	// Ensure that all the captured deps have a consistent version number
	const versionConflicts = chain( requiredThirdPartyDeps )
		.groupBy( packageToString )
		.mapValues( 'length' )
		.filter( l => l > 1 )
		.value();
	if ( versionConflicts.length > 0 ) {
		throw new Error( 'Version conflict' );
	}

	const requiredDepsObj = Object.fromEntries( requiredThirdPartyDeps );

	return currentThirdPartyDeps
		.filter( ( [name] ) => name in requiredDepsObj )
		.map( ( [name, version] ) => ( {
			name,
			// Package.json files list their deps with the `^` prefix to indicate
			// "this or higher minor version"
			// @TODO: If Gutenberg changes the versioning convention in the future, this will break.
			// Parse the version requirement instead of naively trimming the prefix
			requiredVersion: requiredDepsObj[ name ].trim( '^' ),
			actualVersion: version,
		} ) )
		.filter(
			( { name, requiredVersion, actualVersion } ) =>
				!compare( actualVersion, requiredVersion, '>=' ),
		);
}

function getPackageVersionDiff( initialPackageJSON, finalPackageJSON ) {
	const diff = ['dependencies', 'devDependencies'].reduce(
		( result, keyPackageJSON ) => {
			return Object.keys(
				finalPackageJSON[ keyPackageJSON ] || {},
			).reduce( ( _result, dependency ) => {
				const initial =
					initialPackageJSON[ keyPackageJSON ][ dependency ];
				const final = finalPackageJSON[ keyPackageJSON ][ dependency ];
				if ( initial !== final ) {
					_result.push( { dependency, initial, final } );
				}
				return _result;
			}, result );
		},
		[],
	);
	return diff.sort( ( a, b ) => a.dependency.localeCompare( b.dependency ) );
}

function outputPackageDiffReport( packageDiff ) {
	console.log(
		[
			'The following package versions were changed:',
			...packageDiff.map( ( { dependency, initial, final } ) => {
				return `${ dependency }: ${ initial } -> ${ final }`;
			} ),
		].join( '\n' ),
	);
}

function refreshDependencies() {
	const initialPackageJSON = readJSONFile( 'package.json' );

	updateWordPressPackagesToVersion( distTag );

	// Install any missing WordPress packages:
	const missingWordPressDeps = getMissingWordPressDependencies();
	if ( missingWordPressDeps.length ) {
		console.log( "The following @wordpress dependencies are missing: " );
		console.log( missingWordPressDeps );
		console.log( "Installing via npm..." );
		installPackages( missingWordPressDeps.map( name => [name, distTag] ) );
	}

	// Update any outdated non-WordPress packages:
	const versionMismatches = getMismatchedNonWordPressDependencies();
	if ( versionMismatches.length ) {
		console.log( "The following non @wordpress dependencies are outdated: " );
		console.log( versionMismatches );
		console.log( "Updating via npm..." );
		const requiredPackages = versionMismatches.map( ( { name, required } ) => [name, required] );
		installPackages( requiredPackages );
	}

	const finalPackageJSON = readJSONFile( 'package.json' );
	outputPackageDiffReport(
		getPackageVersionDiff( initialPackageJSON, finalPackageJSON ),
	);
	process.exit( 0 );
}

refreshDependencies();
/* eslint-enable no-console */
