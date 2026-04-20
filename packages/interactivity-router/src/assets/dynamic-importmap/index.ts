/**
 * This code is derived from the following projects:
 *
 * 1. dynamic-importmap (https://github.com/keller-mark/dynamic-importmap)
 * 2. es-module-shims (https://github.com/guybedford/es-module-shims)
 *
 * The original implementation was created by Guy Bedford in es-module-shims,
 * then adapted by Mark Keller in dynamic-importmap, and further modified
 * for use in this project.
 *
 * Both projects are licensed under the MIT license.
 *
 * MIT License: https://opensource.org/licenses/MIT
 */

/**
 * Internal dependencies
 */
import { addImportMap, resolve } from './resolver';
import { initPromise, topLevelLoad, preloadModule } from './loader';

type ImportMap = {
	imports?: Record< string, string >;
	scopes?: Record< string, Record< string, string > >;
};

// TODO: check if this baseURI should change per document, and so
// it need to be passed as a parameter to methods like `importWithMap`
// and `preloadWithMap`.
const baseUrl = document.baseURI;
const pageBaseUrl = baseUrl;

Object.defineProperty( self, 'wpInteractivityRouterImport', {
	value: importShim,
	writable: false,
	enumerable: false,
	configurable: false,
} );

async function importShim< Module = unknown >( id: string ) {
	await initPromise;
	return topLevelLoad< Module >( resolve( id, pageBaseUrl ), {
		credentials: 'same-origin',
	} );
}

/**
 * Imports the module with the passed ID.
 *
 * The module is resolved against the internal dynamic import map,
 * extended with the passed import map.
 *
 * @param id          Module ID.
 * @param importMapIn Import map.
 * @return Resolved module.
 */
export async function importWithMap< Module = unknown >(
	id: string,
	importMapIn: ImportMap
) {
	addImportMap( importMapIn );
	return importShim< Module >( id );
}

/**
 * Preloads the module with the passed ID along with its dependencies.
 *
 * The module is resolved against the internal dynamic import map,
 * extended with the passed import map.
 *
 * @param id          Module ID.
 * @param importMapIn Import map.
 * @return Resolved `ModuleLoad` instance.
 */
export async function preloadWithMap( id: string, importMapIn: ImportMap ) {
	addImportMap( importMapIn );
	await initPromise;
	return preloadModule( resolve( id, pageBaseUrl ), {
		credentials: 'same-origin',
	} );
}

export {
	initialImportMap,
	importPreloadedModule,
	type ModuleLoad,
} from './loader';
