import { readFile } from 'fs/promises';
import path from 'path';

/**
 * @typedef {Object} SharedModulesConfig
 * @property {string}                   namespace   Namespace of the module IDs.
 * @property {Record<string, string>}   modules     Module name per bare specifier.
 * @property {string}                   exports     Path to the export list, relative to package.json.
 * @property {string}                   outdir      Output directory.
 * @property {string|string[]}          [consumers] Globs of the built consumers `--update-exports` reads.
 * @property {Record<string, string[]>} [styles]    Stylesheets each module imports.
 */

/**
 * @typedef {Object} SharedModulesManifest
 * @property {SharedModulesConfig}      config      The `wpSharedModules` config.
 * @property {string}                   dir         Directory of package.json.
 * @property {Record<string, string>}   modules     Module ID per bare specifier.
 * @property {Record<string, string>}   names       Module name per module ID.
 * @property {Record<string, string[]>} exports     Exported names per module name.
 * @property {string}                   exportsPath Absolute path to the export list.
 */

/**
 * Read a package's `wpSharedModules` config and the export list its modules are pruned to.
 *
 * @param {string} packageJsonPath Path to the providing package's package.json.
 * @return {Promise<SharedModulesManifest>} The config and its directory, the module ID per bare specifier
 *   (`modules`), the module name per ID (`names`), the exported names per module name, and the export list's path.
 */
export async function readSharedModulesManifest( packageJsonPath ) {
	const dir = path.dirname( packageJsonPath );
	const config = JSON.parse(
		await readFile( packageJsonPath, 'utf8' )
	).wpSharedModules;
	for ( const key of [ 'namespace', 'modules', 'exports' ] ) {
		if ( ! config?.[ key ] ) {
			throw new Error(
				`${ packageJsonPath } needs \`wpSharedModules.${ key }\`.`
			);
		}
	}
	/** @type {Record<string, string>} */
	const modules = {};
	/** @type {Record<string, string>} */
	const names = {};
	for ( const [ specifier, name ] of Object.entries( config.modules ) ) {
		modules[ specifier ] = `@${ config.namespace }/${ name }`;
		names[ modules[ specifier ] ] = name;
	}
	const exportsPath = path.resolve( dir, config.exports );
	let exports = {};
	try {
		exports = JSON.parse( await readFile( exportsPath, 'utf8' ) );
	} catch ( error ) {
		// `wp-build-shared --update-exports` creates the file.
		if (
			/** @type {NodeJS.ErrnoException} */ ( error ).code !== 'ENOENT'
		) {
			throw error;
		}
	}
	return {
		config: { outdir: 'build/shared-modules', ...config },
		dir,
		modules,
		names,
		exports,
		exportsPath,
	};
}

/**
 * List the names a built ES module imports or re-exports from each of the given module IDs.
 *
 * Parses minified bundler output, not arbitrary source: `*` stands for a namespace import, `export *` or a
 * dynamic import, which all need every export.
 *
 * @param {string}      source Built module source.
 * @param {Set<string>} ids    Module IDs to look for.
 * @return {Map<string, Set<string>>} Imported names per module ID, empty for a bare `import "id"`.
 */
export function findSharedImports( source, ids ) {
	/** @type {Map<string, Set<string>>} */
	const used = new Map();
	/**
	 * @param {string} id     Module ID.
	 * @param {string} [name] Imported name.
	 */
	const add = ( id, name ) => {
		if ( ids.has( id ) ) {
			let names = used.get( id );
			if ( ! names ) {
				names = new Set();
				used.set( id, names );
			}
			if ( name ) {
				names.add( name );
			}
		}
	};
	for ( const [ , keyword, clause, id ] of source.matchAll(
		/\b(import|export)\s*([^"';]*?)\s*from\s*["']([^"']+)["']/g
	) ) {
		if ( /(^|,)\s*\*/.test( clause ) ) {
			add( id, '*' );
		}
		if ( keyword === 'import' && /^[\w$]+/.test( clause ) ) {
			add( id, 'default' );
		}
		const named = clause.match( /\{([^}]*)\}/ )?.[ 1 ].split( ',' ) ?? [];
		for ( const part of named ) {
			const name = part.trim().split( /\s+as\s+/ )[ 0 ];
			if ( name ) {
				add( id, name );
			}
		}
	}
	for ( const [ , id ] of source.matchAll(
		/\bimport\s*["']([^"']+)["']/g
	) ) {
		add( id );
	}
	for ( const [ , id ] of source.matchAll(
		/\bimport\(\s*["']([^"']+)["']\s*\)/g
	) ) {
		add( id, '*' );
	}
	return used;
}
