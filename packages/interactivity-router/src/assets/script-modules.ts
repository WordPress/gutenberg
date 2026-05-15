/**
 * Internal dependencies
 */
import {
	initialImportMap,
	importPreloadedModule,
	preloadWithMap,
	type ModuleLoad,
} from './dynamic-importmap';

/**
 * IDs of modules that should be resolved by the browser rather than
 * processed internally.
 */
const resolvedScriptModules = new Set< string >();

/**
 * Marks the specified module as natively resolved.
 * @param url Script module URL.
 */
export const markScriptModuleAsResolved = ( url: string ) => {
	resolvedScriptModules.add( url );
};

/**
 * Resolves and fetches modules present in the passed document, using the
 * document's import map to resolve them.
 *
 * @param doc Document containing the modules to preload.
 * @return Array of promises that resolve to a `ScriptModuleLoad` instance.
 */
export const preloadScriptModules = ( doc: Document ) => {
	// Extract the import map from the document.
	const importMapElement = doc.querySelector< HTMLScriptElement >(
		'script#wp-importmap[type=importmap]'
	);
	const importMap = importMapElement
		? JSON.parse( importMapElement.text )
		: { imports: {}, scopes: {} };

	// Remove imports also in the initial page's import map.
	// Those should be handled natively.
	for ( const key in initialImportMap.imports ) {
		delete importMap.imports[ key ];
	}

	// Get the URL of all modules contained in the document.
	const moduleUrls = [
		...doc.querySelectorAll< HTMLScriptElement >(
			'script[type=module][src][data-wp-router-options]'
		),
	]
		.filter( ( script ) => {
			try {
				const parsed = JSON.parse(
					script.getAttribute( 'data-wp-router-options' )
				);
				return parsed?.loadOnClientNavigation === true;
			} catch {
				return false;
			}
		} )
		.map( ( script ) => script.src );

	// Resolve and fetch those not resolved natively.
	return moduleUrls
		.filter( ( url ) => ! resolvedScriptModules.has( url ) )
		.map( ( url ) => preloadWithMap( url, importMap ) );
};

/**
 * Imports modules respresented by the passed `ScriptModuleLoad` instances.
 *
 * @param modules Array of `MoudleLoad` instances.
 * @return Promise that resolves once all modules are imported.
 */
export const importScriptModules = ( modules: ScriptModuleLoad[] ) =>
	Promise.all( modules.map( ( m ) => importPreloadedModule( m ) ) );

export type ScriptModuleLoad = ModuleLoad;
