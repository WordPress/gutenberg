/**
 * External dependencies
 */
import { readdirSync } from 'fs';
import path from 'path';

/**
 * Get all widget names from the dashboard-widgets directory.
 *
 * @param {string} rootDir Root directory of the project.
 * @return {string[]} Array of widget names.
 */
export function getAllWidgets( rootDir ) {
	const widgetsPath = path.join( rootDir, 'dashboard-widgets' );

	try {
		return readdirSync( widgetsPath, { withFileTypes: true } )
			.filter( ( dirent ) => dirent.isDirectory() )
			.map( ( dirent ) => dirent.name );
	} catch ( error ) {
		// dashboard-widgets directory doesn't exist, return empty array
		return [];
	}
}

/**
 * @typedef {Object} WidgetFiles
 * @property {boolean} hasRender Whether render file exists.
 * @property {boolean} hasWidget Whether widget file exists.
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

	return files;
}
