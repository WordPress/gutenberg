import { readFile } from 'fs/promises';
import path from 'path';

/**
 * Read a package's `wpSharedModules` config and the export list its modules are pruned to.
 *
 * @param {string} packageJsonPath Path to the providing package's package.json.
 * @return {Promise<Object>} The config and its directory, the module ID per bare specifier (`modules`), the module
 *   name per ID (`names`), the exported names per module name, and the export list's path.
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
	const modules = {};
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
		if ( error.code !== 'ENOENT' ) {
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
	const used = new Map();
	const add = ( id, name ) => {
		if ( ids.has( id ) ) {
			if ( ! used.has( id ) ) {
				used.set( id, new Set() );
			}
			if ( name ) {
				used.get( id ).add( name );
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
