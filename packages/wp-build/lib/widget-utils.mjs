/**
 * External dependencies
 */
import { readdirSync, existsSync, readFileSync } from 'fs';
import path from 'path';

/**
 * Get all widget names from the widgets directory.
 *
 * @param {string} rootDir Root directory of the project.
 * @return {string[]} Array of widget directory names.
 */
export function getAllWidgets( rootDir ) {
	const widgetsPath = path.join( rootDir, 'widgets' );

	try {
		return readdirSync( widgetsPath, { withFileTypes: true } )
			.filter( ( dirent ) => dirent.isDirectory() )
			.map( ( dirent ) => dirent.name );
	} catch {
		// Widgets directory doesn't exist, return empty array
		return [];
	}
}

/**
 * @typedef {Object} WidgetMetadata
 * @property {string} name          Widget namespaced identifier.
 * @property {string} [title]       Human-readable title.
 * @property {string} [description] Short description.
 * @property {string} [category]    Grouping category.
 */

/**
 * Get widget metadata from widget.json.
 *
 * @param {string} rootDir    Root directory of the project.
 * @param {string} widgetName Widget name.
 * @return {WidgetMetadata|null} Widget metadata object or null if not found.
 */
export function getWidgetMetadata( rootDir, widgetName ) {
	const widgetJsonPath = path.join(
		rootDir,
		'widgets',
		widgetName,
		'widget.json'
	);

	if ( ! existsSync( widgetJsonPath ) ) {
		return null;
	}

	const metadata = /** @type {WidgetMetadata} */ (
		JSON.parse( readFileSync( widgetJsonPath, 'utf8' ) )
	);

	if ( ! metadata.name ) {
		return null;
	}

	return metadata;
}

/**
 * @typedef {Object} WidgetFiles
 * @property {boolean} hasRender Whether render entry file exists.
 * @property {boolean} hasWidget Whether widget entry file exists.
 * @property {boolean} hasStyle  Whether style file exists.
 */

/**
 * Check if a widget has specific files.
 *
 * @param {string} widgetDirectory Widget directory path.
 * @return {WidgetFiles} Object with boolean flags for widget files.
 */
export function getWidgetFiles( widgetDirectory ) {
	const extensions = [ 'tsx', 'ts', 'jsx', 'js' ];
	const files = {
		hasRender: false,
		hasWidget: false,
		hasStyle: false,
	};

	const entries = readdirSync( widgetDirectory );

	for ( const ext of extensions ) {
		if ( entries.includes( `render.${ ext }` ) ) {
			files.hasRender = true;
		}
		if ( entries.includes( `widget.${ ext }` ) ) {
			files.hasWidget = true;
		}
	}

	if ( entries.includes( 'render.scss' ) ) {
		files.hasStyle = true;
	}

	return files;
}
