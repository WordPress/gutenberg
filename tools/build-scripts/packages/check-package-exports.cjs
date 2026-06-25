/**
 * This script verifies that package.json `exports` targets exist on disk.
 * Run it after building package runtime files and TypeScript declarations.
 */

/**
 * External dependencies
 */
const fs = require( 'fs' );
const path = require( 'path' );

const ROOT_DIR = path.resolve( __dirname, '../../..' );

function collectExportTargets( value, trail = [] ) {
	if ( typeof value === 'string' ) {
		return [ { trail, target: value } ];
	}

	if ( Array.isArray( value ) ) {
		return value.flatMap( ( nestedValue, index ) =>
			collectExportTargets( nestedValue, [ ...trail, index ] )
		);
	}

	if ( value && typeof value === 'object' && ! Array.isArray( value ) ) {
		return Object.entries( value ).flatMap( ( [ key, nestedValue ] ) =>
			collectExportTargets( nestedValue, [ ...trail, key ] )
		);
	}

	return [];
}

function formatExportPath( trail ) {
	return trail.reduce(
		( formattedPath, segment ) =>
			/^[a-zA-Z_$][\w$]*$/.test( segment )
				? `${ formattedPath }.${ segment }`
				: `${ formattedPath }[${ JSON.stringify( segment ) }]`,
		'exports'
	);
}

function checkPackageExports( packagePath ) {
	const packageRoot = path.resolve( ROOT_DIR, packagePath );
	const packageJsonPath = path.join( packageRoot, 'package.json' );
	const packageJson = JSON.parse(
		fs.readFileSync( packageJsonPath, 'utf8' )
	);
	const missingTargets = collectExportTargets( packageJson.exports )
		.filter( ( { target } ) => target.startsWith( './' ) )
		.filter(
			( { target } ) =>
				! fs.existsSync( path.join( packageRoot, target ) )
		);

	if ( ! missingTargets.length ) {
		return [];
	}

	return [
		`${ packageJson.name }: Missing package export target${
			missingTargets.length === 1 ? '' : 's'
		}:`,
		...missingTargets.map(
			( { trail, target } ) =>
				`- ${ formatExportPath( trail ) } -> ${ target }`
		),
	];
}

const packagePaths = process.argv.slice( 2 );

if ( ! packagePaths.length ) {
	console.error( 'Usage: node check-package-exports.cjs <package-path>...' );
	process.exit( 1 );
}

const errors = packagePaths.flatMap( checkPackageExports );

if ( errors.length ) {
	console.error( errors.join( '\n' ) );
	process.exit( 1 );
}
