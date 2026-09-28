import { readdirSync } from 'fs';
import path from 'path';
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
	} catch {
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
 * Source extensions for route entry files, in priority order.
 * Must stay aligned with SOURCE_EXTENSIONS in source-files.mjs.
 */
const ROUTE_EXTENSIONS = [
	'tsx',
	'ts',
	'mts',
	'cts',
	'jsx',
	'js',
	'mjs',
	'cjs',
];

/**
 * @typedef {Object} RouteFiles
 * @property {boolean}     hasRoute     Whether route file exists.
 * @property {boolean}     hasStage     Whether stage file exists.
 * @property {boolean}     hasInspector Whether inspector file exists.
 * @property {boolean}     hasCanvas    Whether canvas file exists.
 * @property {boolean}     hasStyle     Whether style file exists.
 * @property {string|null} stage        Stage file name, extension included.
 * @property {string|null} inspector    Inspector file name, extension included.
 * @property {string|null} canvas       Canvas file name, extension included.
 */

/**
 * Check if a route has specific files.
 *
 * @param {string} routeDirectory Route directory path.
 * @return {RouteFiles} Object with flags and file names for route files.
 */
export function getRouteFiles( routeDirectory ) {
	/** @type {RouteFiles} */
	const files = {
		hasRoute: false,
		hasStage: false,
		hasInspector: false,
		hasCanvas: false,
		hasStyle: false,
		stage: null,
		inspector: null,
		canvas: null,
	};

	const entries = readdirSync( routeDirectory );

	// The extension list is ordered, so the first match wins.
	for ( const ext of ROUTE_EXTENSIONS ) {
		if ( entries.includes( `route.${ ext }` ) ) {
			files.hasRoute = true;
		}
		if ( ! files.stage && entries.includes( `stage.${ ext }` ) ) {
			files.stage = `stage.${ ext }`;
			files.hasStage = true;
		}
		if ( ! files.inspector && entries.includes( `inspector.${ ext }` ) ) {
			files.inspector = `inspector.${ ext }`;
			files.hasInspector = true;
		}
		if ( ! files.canvas && entries.includes( `canvas.${ ext }` ) ) {
			files.canvas = `canvas.${ ext }`;
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

	/*
	 * Import the full file name rather than relying on esbuild extending an
	 * extensionless path: that resolution never tries `.mts` or `.cts`.
	 */
	if ( files.stage ) {
		lines.push( `export { stage } from './${ files.stage }';` );
	}

	if ( files.inspector ) {
		lines.push( `export { inspector } from './${ files.inspector }';` );
	}

	if ( files.canvas ) {
		lines.push( `export { canvas } from './${ files.canvas }';` );
	}

	// If no components exist, export empty object
	if ( lines.length === 0 ) {
		lines.push( 'export {};' );
	}

	return lines.join( '\n' );
}
