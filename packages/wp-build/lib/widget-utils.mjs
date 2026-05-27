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
 * @property {string}                                    name           Widget namespaced identifier.
 * @property {string}                                    [title]        Human-readable title.
 * @property {string}                                    [description]  Short description.
 * @property {string}                                    [category]     Grouping category.
 * @property {'framed' | 'content-bleed' | 'full-bleed'} [presentation] Authoring intent about how the widget wants to render.
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

	let metadata;
	try {
		metadata = /** @type {WidgetMetadata} */ (
			JSON.parse( readFileSync( widgetJsonPath, 'utf8' ) )
		);
	} catch {
		return null;
	}

	if ( ! metadata || ! metadata.name ) {
		return null;
	}

	return metadata;
}

/**
 * Supported source extensions for widget entry files, in priority order.
 * Must stay aligned with SOURCE_EXTENSIONS in build.mjs.
 */
const WIDGET_EXTENSIONS = [ 'tsx', 'ts', 'jsx', 'js', 'mjs' ];

/**
 * @typedef {Object} WidgetFiles
 * @property {boolean} hasRender Whether render entry file exists.
 * @property {boolean} hasWidget Whether widget entry file exists.
 */

/**
 * Check if a widget has specific files.
 *
 * @param {string} widgetDirectory Widget directory path.
 * @return {WidgetFiles} Object with boolean flags for widget files.
 */
export function getWidgetFiles( widgetDirectory ) {
	const entries = readdirSync( widgetDirectory );

	/** @param {string} baseName */
	const hasEntry = ( baseName ) =>
		WIDGET_EXTENSIONS.some( ( ext ) =>
			entries.includes( `${ baseName }.${ ext }` )
		);

	return {
		hasRender: hasEntry( 'render' ),
		hasWidget: hasEntry( 'widget' ),
	};
}
