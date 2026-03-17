/**
 * External dependencies
 */
import { readdirSync } from 'fs';
import path from 'path';

/**
 * Internal dependencies
 */
import { getPackageInfoFromFile } from './package-utils.mjs';

/**
 * Get all route names from the routes directory.
 *
 * @param {string} rootDir Root directory of the project.
 * @return {string[]} Array of route names.
 */
export function getAllRoutes( rootDir ) {
	const routesPath = path.join( rootDir, 'routes' );

	try {
		return readdirSync( routesPath, { withFileTypes: true } )
			.filter( ( dirent ) => dirent.isDirectory() )
			.map( ( dirent ) => dirent.name );
	} catch ( error ) {
		// Routes directory doesn't exist, return empty array
		return [];
	}
}

/**
 * @typedef {Object} RouteMetadata
 * @property {string}   name  Route name.
 * @property {string}   path  Route path.
 * @property {string[]} pages Array of page slugs this route belongs to.
 */

/**
 * Get route metadata from package.json.
 *
 * @param {string} rootDir   Root directory of the project.
 * @param {string} routeName Route name.
 * @return {RouteMetadata|null} Route metadata object or null if not found.
 */
export function getRouteMetadata( rootDir, routeName ) {
	const routePackageJson =
		/** @type {import('./package-utils.mjs').RoutePackageJson|null} */ (
			getPackageInfoFromFile(
				path.join( rootDir, 'routes', routeName, 'package.json' )
			)
		);

	if ( ! routePackageJson || ! routePackageJson.route ) {
		return null;
	}

	// Normalize page field to always be an array
	// Supports both "page": "string" and "page": ["array"]
	const pageField = routePackageJson.route.page;
	/** @type {string[]} */
	let pages = [];
	if ( pageField ) {
		pages = Array.isArray( pageField ) ? pageField : [ pageField ];
	}

	return {
		name: routeName,
		path: routePackageJson.route.path,
		pages,
	};
}

/**
 * @typedef {Object} RouteFiles
 * @property {boolean} hasRoute     Whether route file exists.
 * @property {boolean} hasStage     Whether stage file exists.
 * @property {boolean} hasInspector Whether inspector file exists.
 * @property {boolean} hasCanvas    Whether canvas file exists.
 * @property {boolean} hasStyle     Whether style file exists.
 */

/**
 * Check if a route has specific files.
 *
 * @param {string} routeDirectory Route directory path.
 * @return {RouteFiles} Object with boolean flags for route files.
 */
export function getRouteFiles( routeDirectory ) {
	const extensions = [ 'tsx', 'ts', 'jsx', 'js' ];
	const files = {
		hasRoute: false,
		hasStage: false,
		hasInspector: false,
		hasCanvas: false,
		hasStyle: false,
	};

	const entries = readdirSync( routeDirectory );

	for ( const ext of extensions ) {
		if ( entries.includes( `route.${ ext }` ) ) {
			files.hasRoute = true;
		}
		if ( entries.includes( `stage.${ ext }` ) ) {
			files.hasStage = true;
		}
		if ( entries.includes( `inspector.${ ext }` ) ) {
			files.hasInspector = true;
		}
		if ( entries.includes( `canvas.${ ext }` ) ) {
			files.hasCanvas = true;
		}
	}

	if ( entries.includes( 'route.scss' ) ) {
		files.hasStyle = true;
	}

	return files;
}

/**
 * Generate a synthetic content entry point for a route.
 * This creates a module that imports and re-exports stage, inspector, and canvas components.
 *
 * @param {RouteFiles} files Route files information.
 * @return {string} Generated entry point code.
 */
export function generateContentEntryPoint( files ) {
	const lines = [];

	if ( files.hasStage ) {
		lines.push( "export { stage } from './stage';" );
	}

	if ( files.hasInspector ) {
		lines.push( "export { inspector } from './inspector';" );
	}

	if ( files.hasCanvas ) {
		lines.push( "export { canvas } from './canvas';" );
	}

	// If no components exist, export empty object
	if ( lines.length === 0 ) {
		lines.push( 'export {};' );
	}

	return lines.join( '\n' );
}
