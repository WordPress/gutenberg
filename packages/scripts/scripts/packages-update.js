/* eslint-disable no-console */
/**
 * External dependencies
 */
const fs = require( 'fs' );
const spawn = require( 'cross-spawn' );

/**
 * Constants
 */
const WORDPRESS_PACKAGES_PREFIX = '@wordpress/';

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

function updatePackagesToLatestVersion( packages ) {
	const packagesWithLatest = packages.map(
		( packageName ) => `${ packageName }@latest`
	);
	return spawn.sync( 'npm', [ 'install', ...packagesWithLatest, '--save' ], {
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

function updatePackageJSON() {
	const initialPackageJSON = readJSONFile( 'package.json' );
	const packages = getWordPressPackages( initialPackageJSON );
	const result = updatePackagesToLatestVersion( packages );
	const finalPackageJSON = readJSONFile( 'package.json' );
	outputPackageDiffReport(
		getPackageVersionDiff( initialPackageJSON, finalPackageJSON )
	);
	process.exit( result.status );
}

updatePackageJSON();
/* eslint-enable no-console */
