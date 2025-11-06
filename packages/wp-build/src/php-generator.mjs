/**
 * External dependencies
 */
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Internal dependencies
 */
import { getPackageInfoFromFile } from './package-utils.mjs';
import { getAllRoutes, getRouteFiles } from './route-utils.mjs';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );

/**
 * Get PHP replacements from root package.json.
 *
 * @param {string} rootDir Root directory path.
 * @return {Promise<Record<string, string>>} Replacements object with {{PREFIX}}, {{VERSION}}, {{VERSION_CONSTANT}}.
 */
export async function getPhpReplacements( rootDir ) {
	const rootPackageJson = getPackageInfoFromFile(
		path.join( rootDir, 'package.json' )
	);
	if ( ! rootPackageJson ) {
		throw new Error( 'Could not read root package.json' );
	}

	// @ts-expect-error specific override to package.json
	const name = rootPackageJson.wpPlugin?.name || 'gutenberg';
	const version = rootPackageJson.version;
	const versionConstant =
		name.toUpperCase().replace( /-/g, '_' ) + '_VERSION';

	return {
		'{{PREFIX}}': name,
		'{{VERSION}}': version,
		'{{VERSION_CONSTANT}}': versionConstant,
	};
}

/**
 * Generate a PHP file from a template with replacements.
 *
 * @param {string}                 templateName Template file name.
 * @param {string}                 outputPath   Full output path.
 * @param {Record<string, string>} replacements Replacements object (e.g. {'{{PREFIX}}': 'gutenberg'}).
 */
export async function generatePhpFromTemplate(
	templateName,
	outputPath,
	replacements
) {
	// Templates directory
	const templatesDir = path.join( __dirname, '..', 'templates' );

	// Read template
	const template = await readFile(
		path.join( templatesDir, templateName ),
		'utf8'
	);

	// Apply all replacements
	let content = template;
	for ( const [ placeholder, value ] of Object.entries( replacements ) ) {
		content = content.replaceAll( placeholder, value );
	}

	// Write output file
	await mkdir( path.dirname( outputPath ), { recursive: true } );
	await writeFile( outputPath, content );
}

/**
 * Generate routes/index.php file with route registry data.
 *
 * @param {string} rootDir  Root directory path.
 * @param {string} buildDir Build directory path.
 * @param {string} prefix   Package prefix.
 */
export async function generateRoutesRegistry( rootDir, buildDir, prefix ) {
	const routeNames = getAllRoutes( rootDir );

	if ( routeNames.length === 0 ) {
		// No routes to register, skip generating routes registry
		return;
	}

	// Build routes array
	const routes = routeNames.map( ( routeName ) => {
		// Read package.json to get route path
		const routePackageJson =
			/** @type {import('./package-utils.mjs').RoutePackageJson} */ (
				getPackageInfoFromFile(
					path.join( rootDir, 'routes', routeName, 'package.json' )
				)
			);
		const routePath = routePackageJson.route.path;

		// Check if route.js exists
		const routeFiles = getRouteFiles(
			path.join( rootDir, 'routes', routeName )
		);

		return {
			name: routeName,
			path: routePath,
			has_route: routeFiles.hasRoute,
			has_content: routeFiles.hasStage || routeFiles.hasInspector,
		};
	} );

	// Generate PHP array entries
	const routeEntries = routes
		.map( ( route ) => {
			const hasRouteStr = route.has_route ? 'true' : 'false';
			const hasContentStr = route.has_content ? 'true' : 'false';
			return `\tarray(
		'name'        => '${ route.name }',
		'path'        => '${ route.path }',
		'has_route'   => ${ hasRouteStr },
		'has_content' => ${ hasContentStr },
	)`;
		} )
		.join( ',\n' );

	// Generate routes/index.php
	const replacements = {
		'{{PREFIX}}': prefix,
		'{{ROUTES}}': routeEntries,
	};

	await generatePhpFromTemplate(
		'route-registry.php.template',
		path.join( buildDir, 'routes', 'index.php' ),
		replacements
	);
}

/**
 * Generate routes.php file with route registration logic.
 *
 * @param {string} rootDir      Root directory path.
 * @param {string} buildDir     Build directory path.
 * @param {string} handlePrefix Handle prefix for script modules.
 * @param {string} prefix       Package prefix.
 */
export async function generateRoutesPhp(
	rootDir,
	buildDir,
	handlePrefix,
	prefix
) {
	const routeNames = getAllRoutes( rootDir );

	if ( routeNames.length === 0 ) {
		// No routes to register, skip generating routes.php
		return;
	}

	const namespace = handlePrefix.replace( /-/g, '_' );

	// Generate routes.php
	const replacements = {
		'{{PREFIX}}': prefix,
		'{{NAMESPACE}}': namespace,
		'{{HANDLE_PREFIX}}': handlePrefix,
	};

	await generatePhpFromTemplate(
		'routes.php.template',
		path.join( buildDir, 'routes.php' ),
		replacements
	);
}
