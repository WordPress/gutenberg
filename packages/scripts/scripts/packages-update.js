/* eslint-disable no-console */
/**
 * External dependencies
 */
const fs = require( 'fs' );
const spawn = require( 'cross-spawn' );
// CJS version of module-only: import fetch from 'node-fetch'`;
const fetch = ( ...args ) =>
	import( 'node-fetch' ).then( ( { default: nodeFetch } ) =>
		nodeFetch( ...args )
	);

/**
 * Internal dependencies
 */
const { getArgFromCLI } = require( '../utils' );

/**
 * Constants
 */
const WORDPRESS_PACKAGES_PREFIX = '@wordpress/';

const sourceOfWPPackagesVersions = ( wpVersion ) =>
	`https://raw.githubusercontent.com/WordPress/wordpress-develop/${ wpVersion }/package.json`;

function readJSONFile( fileName ) {
	const data = fs.readFileSync( fileName, 'utf8' );
	return JSON.parse( data );
}

function getWordPressPackages( { dependencies = {}, devDependencies = {} } ) {
	return Object.keys( dependencies )
		.concat( Object.keys( devDependencies ) )
		.filter( ( packageName ) =>
			packageName.startsWith( WORDPRESS_PACKAGES_PREFIX )
		);
}

function getPackageVersionDiff( initialPackageJSON, finalPackageJSON ) {
	const diff = [ 'dependencies', 'devDependencies' ].reduce(
		( result, keyPackageJSON ) => {
			return Object.keys(
				finalPackageJSON[ keyPackageJSON ] || {}
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
		[]
	);
	return diff.sort( ( a, b ) => a.dependency.localeCompare( b.dependency ) );
}

/**
 * Installs the given npm packages.
 *
 * @param {Array<string>} packagesWithVersion List of package names and their versions in the `name@semver` format.
 */
function updatePackages( packagesWithVersion ) {
	return spawn.sync( 'npm', [ 'install', ...packagesWithVersion, '--save' ], {
		stdio: 'inherit',
	} );
}

function outputPackageDiffReport( packageDiff ) {
	console.log(
		[
			'The following package versions were changed:',
			...packageDiff.map( ( { dependency, initial, final } ) => {
				return `${ dependency }: ${ initial } -> ${ final }`;
			} ),
		].join( '\n' )
	);
}

/**
 * Fetches `dev-` & `dependencies` for a given WordPress version.
 *
 * @param {string} wpVersion WordPress version to fetch the data for.
 * @return {Object<string,string>} Concatenated dependencies and devDependencies.
 */
async function fetchRemoteWordPressPackages( wpVersion = 'master' ) {
	const response = await fetch( sourceOfWPPackagesVersions( wpVersion ) );
	const { dependencies, devDependencies } = await response.json();
	return { ...dependencies, ...devDependencies };
}

async function updatePackageJSON() {
	const initialPackageJSON = readJSONFile( 'package.json' );
	const packages = getWordPressPackages( initialPackageJSON );
	const wpVersion = getArgFromCLI( '--wpVersion' );
	let packagesWithVersion;
	if ( wpVersion ) {
		const remoteVersions = await fetchRemoteWordPressPackages( wpVersion );
		// Get remote versions for intersecting/local packages.
		const common = Object.entries(
			remoteVersions
		).filter( ( [ packageName ] ) => packages.includes( packageName ) );
		// Stringify name & version in `npm install` format.
		packagesWithVersion = common.map(
			( [ packageName, version ] ) => `${ packageName }@${ version }`
		);
	} else {
		packagesWithVersion = packages.map(
			( packageName ) => `${ packageName }@latest`
		);
	}
	const result = updatePackages( packagesWithVersion );
	const finalPackageJSON = readJSONFile( 'package.json' );
	outputPackageDiffReport(
		getPackageVersionDiff( initialPackageJSON, finalPackageJSON )
	);
	process.exit( result.status );
}

updatePackageJSON();
/* eslint-enable no-console */
