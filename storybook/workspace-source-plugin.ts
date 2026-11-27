import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

const PACKAGES_DIR = path.resolve( import.meta.dirname, '../packages' );
const SOURCE_EXTENSIONS = [ '.ts', '.tsx', '.js', '.jsx', '.mjs', '.mts' ];
const PACKAGE_IMPORT = /^@wordpress\/([^/]+)(\/.+)?$/;

/**
 * Find the module a package's `exports` entry points to for an ESM import,
 * such as `./build-module/index.mjs`.
 *
 * @param exportsField The `exports` field of a `package.json`.
 * @param subpath      The export to look up, such as `.` or `./worker`.
 * @return The entry path, or `undefined` if there is none.
 */
function getModuleEntry(
	exportsField: unknown,
	subpath: string
): string | undefined {
	let entry = exportsField;
	if ( entry && typeof entry === 'object' && '.' in entry ) {
		entry = ( entry as Record< string, unknown > )[ subpath ];
	} else if ( subpath !== '.' ) {
		return undefined;
	}
	if ( entry && typeof entry === 'object' ) {
		const conditions = entry as Record< string, unknown >;
		entry = conditions.import ?? conditions.default;
	}
	return typeof entry === 'string' ? entry : undefined;
}

/**
 * Resolve a workspace package export to its source module, when the package
 * builds it from `src` into `build-module`.
 *
 * @param name    Package name without the `@wordpress/` scope.
 * @param subpath The export, such as `.` or `./worker`.
 * @return Absolute path of the source module, or `null`.
 */
function resolveSourceEntry( name: string, subpath: string ): string | null {
	const packageDir = path.join( PACKAGES_DIR, name );
	const packageJsonPath = path.join( packageDir, 'package.json' );
	if ( ! existsSync( packageJsonPath ) ) {
		return null;
	}

	const { exports: exportsField } = JSON.parse(
		readFileSync( packageJsonPath, 'utf8' )
	);
	const entry = getModuleEntry( exportsField, subpath );
	const match = entry?.match( /^\.\/build-module\/(.+)\.mjs$/ );
	if ( ! match ) {
		return null;
	}

	for ( const extension of SOURCE_EXTENSIONS ) {
		const candidate = path.join(
			packageDir,
			'src',
			match[ 1 ] + extension
		);
		if ( existsSync( candidate ) ) {
			return candidate;
		}
	}
	return null;
}

/**
 * Serve `@wordpress/*` workspace packages from their source instead of their
 * build output.
 *
 * Stories already import their own package's source. Resolving the packages
 * they depend on to source too means Storybook needs no JavaScript build of
 * the monorepo, edits to any package hot reload, and every story shares one
 * instance of each module, such as a data store.
 *
 * Only exports built into `build-module` are redirected. Other exports, such
 * as `@wordpress/components/build-style/style.css`, resolve as usual.
 *
 * @return Vite plugin.
 */
export function workspaceSourcePlugin(): Plugin {
	const cache = new Map< string, string | null >();
	return {
		name: 'wordpress-workspace-source',
		enforce: 'pre',
		resolveId( id ) {
			const match = id.match( PACKAGE_IMPORT );
			if ( ! match ) {
				return null;
			}
			if ( ! cache.has( id ) ) {
				const [ , name, subpath ] = match;
				cache.set(
					id,
					resolveSourceEntry( name, subpath ? `.${ subpath }` : '.' )
				);
			}
			return cache.get( id ) ?? null;
		},
	};
}

/*
 * `react-docgen-typescript` documents a component re-exported with
 * `export { default as Name } from './name'` by assigning to `default`, which
 * does not parse. The component's own module carries the same information.
 */
const INVALID_DOCGEN_ASSIGNMENT =
	/try \{\s*\/\/ @ts-ignore\s*default\.__docgenInfo = .*?;\s*\} catch \(__react_docgen_typescript_loader_error\) \{\}/gs;

/**
 * Remove docgen information that `react-docgen-typescript` attaches to
 * `default` in modules that only re-export components.
 *
 * Packages served from source include their entry modules, which re-export
 * components this way.
 *
 * @return Vite plugin.
 */
export function docgenReexportGuardPlugin(): Plugin {
	return {
		name: 'wordpress-docgen-reexport-guard',
		enforce: 'post',
		transform( code ) {
			if ( ! code.includes( 'default.__docgenInfo' ) ) {
				return null;
			}
			return {
				code: code.replace( INVALID_DOCGEN_ASSIGNMENT, '' ),
				map: null,
			};
		},
	};
}
