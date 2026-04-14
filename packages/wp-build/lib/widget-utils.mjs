/**
 * External dependencies
 */
import { readdirSync, existsSync, readFileSync } from 'fs';
import path from 'path';

/**
 * Discover all widgets from the widgets/ directory.
 *
 * Scans `{rootDir}/widgets/` for subdirectories containing a
 * `widget.json` file. Returns widgets sorted alphabetically by name.
 *
 * @param {string} rootDir Project root directory.
 * @return {Array<{name: string, dirName: string, dir: string, metadata: Object}>}
 */
export function discoverWidgets( rootDir ) {
	const widgetsDir = path.join( rootDir, 'widgets' );
	/** @type {Array<{name: string, dirName: string, dir: string, metadata: Object}>} */
	const widgets = [];

	let entries;
	try {
		entries = readdirSync( widgetsDir, { withFileTypes: true } ).filter(
			( d ) => d.isDirectory()
		);
	} catch {
		return widgets;
	}

	for ( const entry of entries ) {
		const widgetDir = path.join( widgetsDir, entry.name );
		const widgetJsonPath = path.join( widgetDir, 'widget.json' );

		if ( ! existsSync( widgetJsonPath ) ) {
			continue;
		}

		const metadata = JSON.parse(
			readFileSync( widgetJsonPath, 'utf8' )
		);
		if ( ! metadata.name ) {
			continue;
		}

		widgets.push( {
			name: metadata.name,
			dirName: entry.name,
			dir: widgetDir,
			metadata,
		} );
	}

	return widgets.sort( ( a, b ) => a.name.localeCompare( b.name ) );
}

/**
 * Find the entry point file for a given base name.
 * Checks extensions in priority order: tsx, ts, jsx, js.
 *
 * @param {string} dir      Directory to search.
 * @param {string} baseName File base name (e.g., 'render', 'widget').
 * @return {string|null} Absolute path to the entry file, or null.
 */
export function findWidgetEntry( dir, baseName ) {
	const extensions = [ 'tsx', 'ts', 'jsx', 'js' ];
	for ( const ext of extensions ) {
		const candidate = path.join( dir, `${ baseName }.${ ext }` );
		if ( existsSync( candidate ) ) {
			return candidate;
		}
	}
	return null;
}

/**
 * Get all widget directory names from the widgets/ directory.
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
		return [];
	}
}
