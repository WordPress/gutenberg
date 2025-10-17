/**
 * Internal dependencies
 */
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
 * Set of allowed interactive block module patterns.
 * These patterns identify script modules that belong to interactive blocks
 * and should be loaded during client-side navigation.
 */
const interactiveBlockModulePatterns = new Set< string >( [
	// WordPress core interactive block modules
	'@wordpress/block-library/',
	'@wordpress/interactivity',
	'@wordpress/interactivity-router',

	// Pattern for custom interactive blocks (can be extended)
	// Modules that contain '/view' are typically interactive block view scripts
] );

/**
 * Additional allowlist of specific module IDs that should be considered
 * interactive-compatible. This is populated from PHP configuration.
 */
let interactiveModuleAllowlist = new Set< string >();

/**
 * Marks the specified module as natively resolved.
 * @param url Script module URL.
 */
export const markScriptModuleAsResolved = ( url: string ) => {
	resolvedScriptModules.add( url );
};

/**
 * Initializes the interactive module allowlist from configuration data.
 * This is typically called with data provided from PHP.
 *
 * @param allowlist Array of module IDs that should be considered interactive-compatible.
 */
export const initializeInteractiveModuleAllowlist = ( allowlist: string[] ) => {
	interactiveModuleAllowlist = new Set( allowlist );
};

/**
 * Clears all resolved script modules (for testing purposes).
 */
export const clearResolvedScriptModules = () => {
	resolvedScriptModules.clear();
};

/**
 * Checks if a module URL corresponds to an interactive block module.
 * Uses both pattern matching and explicit allowlist checking.
 *
 * @param url       The module URL to check.
 * @param importMap The import map to resolve module IDs.
 * @return           True if the module should be loaded for interactive blocks.
 */
const isInteractiveBlockModule = ( url: string, importMap: any ): boolean => {
	// First, try to resolve the URL to a module ID using the import map
	let moduleId = url;

	// Check if URL matches any entry in the import map
	for ( const [ id, resolvedUrl ] of Object.entries(
		importMap.imports || {}
	) ) {
		if ( resolvedUrl === url ) {
			moduleId = id;
			break;
		}
	}

	// Check explicit allowlist first
	if (
		interactiveModuleAllowlist.has( moduleId ) ||
		interactiveModuleAllowlist.has( url )
	) {
		return true;
	}

	// Check against interactive block patterns
	for ( const pattern of interactiveBlockModulePatterns ) {
		if ( moduleId.includes( pattern ) || url.includes( pattern ) ) {
			return true;
		}
	}

	// Special check for view scripts (common pattern for interactive blocks)
	if (
		( moduleId.includes( '/view' ) || url.includes( '/view' ) ) &&
		( moduleId.includes( 'block-library' ) ||
			url.includes( 'block-library' ) )
	) {
		return true;
	}

	return false;
};

/**
 * Resolves and fetches modules present in the passed document, using the
 * document's import map to resolve them. Only loads modules that belong to
 * interactive blocks to avoid loading unnecessary JavaScript during client-side navigation.
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

	// Filter and resolve only interactive block modules that are not resolved natively.
	return moduleUrls
		.filter( ( url ) => ! resolvedScriptModules.has( url ) )
		.filter( ( url ) => isInteractiveBlockModule( url, importMap ) )
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
