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
 * External dependencies
 */
import * as lexer from 'es-module-lexer';

/**
 * Internal dependencies
 */
import { fetchModule } from './fetch';
import { resolve } from './resolver';

export interface ModuleLoad {
	url?: string; // original URL
	responseUrl?: string; // response url
	fetchPromise?: Promise< ModuleLoad >; // fetch promise
	source?: string; // source code
	linkPromise?: Promise< void >; // link-promise (dependency fetch)
	analysis?: ReturnType< typeof lexer.parse >; // analysis ([ imports, exports, ... ])
	deps?: ModuleLoad[]; // deps
	blobUrl?: string; // blobUrl
	shellUrl?: string; // shellUrl for circular references
}

export const initPromise = lexer.init;

/**
 * Script element containing the initial page's import map.
 */
const initialImportMapElement =
	window.document.querySelector< HTMLScriptElement >(
		'script#wp-importmap[type=importmap]'
	);

/**
 * Data from the initial page's import map.
 *
 * Pages containing any of the imports present on the original page
 * in their import maps should ignore them, as those imports would
 * be handled natively.
 */
export const initialImportMap = initialImportMapElement
	? JSON.parse( initialImportMapElement.text )
	: { imports: {}, scopes: {} };

const skip = ( id ) => Object.keys( initialImportMap.imports ).includes( id );

const fetchCache: Record< string, Promise< ModuleLoad > > = {};
export const registry = {};

// Init registry with importamp content.
Object.keys( initialImportMap.imports ).forEach( ( id ) => {
	registry[ id ] = {
		blobUrl: id,
	};
} );

async function loadAll( load: ModuleLoad, seen: Record< string, any > ) {
	if ( load.blobUrl || seen[ load.url ] ) {
		return;
	}
	seen[ load.url ] = 1;
	await load.linkPromise;
	await Promise.all( load.deps.map( ( dep ) => loadAll( dep, seen ) ) );
}

function urlJsString( url: string ) {
	return `'${ url.replace( /'/g, "\\'" ) }'`;
}

const createBlob = ( source: string, type = 'text/javascript' ) =>
	URL.createObjectURL( new Blob( [ source ], { type } ) );

function resolveDeps( load: ModuleLoad, seen: Record< string, any > ) {
	if ( load.blobUrl || ! seen[ load.url ] ) {
		return;
	}
	seen[ load.url ] = 0;

	for ( const dep of load.deps ) {
		resolveDeps( dep, seen );
	}

	const [ imports, exports ] = load.analysis;
	const source = load.source;

	let resolvedSource = '';

	if ( ! imports.length ) {
		resolvedSource += source;
	} else {
		let lastIndex = 0;
		let depIndex = 0;
		const dynamicImportEndStack = [];

		function pushStringTo( originalIndex: number ) {
			while (
				dynamicImportEndStack.length &&
				dynamicImportEndStack[ dynamicImportEndStack.length - 1 ] <
					originalIndex
			) {
				const dynamicImportEnd = dynamicImportEndStack.pop();
				resolvedSource += `${ source.slice(
					lastIndex,
					dynamicImportEnd
				) }, ${ urlJsString( load.responseUrl ) }`;
				lastIndex = dynamicImportEnd;
			}
			resolvedSource += source.slice( lastIndex, originalIndex );
			lastIndex = originalIndex;
		}

		for ( const {
			s: start,
			ss: statementStart,
			se: statementEnd,
			d: dynamicImportIndex,
		} of imports ) {
			// static import
			if ( dynamicImportIndex === -1 ) {
				const depLoad = load.deps[ depIndex++ ];
				let blobUrl = depLoad.blobUrl;
				const cycleShell = ! blobUrl;
				if ( cycleShell ) {
					// Circular shell creation
					if ( ! ( blobUrl = depLoad.shellUrl ) ) {
						blobUrl = depLoad.shellUrl = createBlob(
							`export function u$_(m){${ depLoad.analysis[ 1 ]
								.map( ( { s, e }, i ) => {
									const q =
										depLoad.source[ s ] === '"' ||
										depLoad.source[ s ] === "'";
									return `e$_${ i }=m${
										q ? `[` : '.'
									}${ depLoad.source.slice( s, e ) }${
										q ? `]` : ''
									}`;
								} )
								.join( ',' ) }}${
								depLoad.analysis[ 1 ].length
									? `let ${ depLoad.analysis[ 1 ]
											.map( ( _, i ) => `e$_${ i }` )
											.join( ',' ) };`
									: ''
							}export {${ depLoad.analysis[ 1 ]
								.map(
									( { s, e }, i ) =>
										`e$_${ i } as ${ depLoad.source.slice(
											s,
											e
										) }`
								)
								.join( ',' ) }}\n//# sourceURL=${
								depLoad.responseUrl
							}?cycle`
						);
					}
				}

				pushStringTo( start - 1 );
				resolvedSource += `/*${ source.slice(
					start - 1,
					statementEnd
				) }*/${ urlJsString( blobUrl ) }`;

				// circular shell execution
				if ( ! cycleShell && depLoad.shellUrl ) {
					resolvedSource += `;import*as m$_${ depIndex } from'${ depLoad.blobUrl }';import{u$_ as u$_${ depIndex }}from'${ depLoad.shellUrl }';u$_${ depIndex }(m$_${ depIndex })`;
					depLoad.shellUrl = undefined;
				}
				lastIndex = statementEnd;
			}
			// import.meta
			else if ( dynamicImportIndex === -2 ) {
				throw Error( 'The import.meta property is not supported.' );
			}
			// dynamic import
			else {
				pushStringTo( statementStart );
				resolvedSource += `wpInteractivityRouterImport(`;
				dynamicImportEndStack.push( statementEnd - 1 );
				lastIndex = start;
			}
		}

		// progressive cycle binding updates
		if ( load.shellUrl ) {
			resolvedSource += `\n;import{u$_}from'${
				load.shellUrl
			}';try{u$_({${ exports
				.filter( ( e ) => e.ln )
				.map( ( { s, e, ln } ) => `${ source.slice( s, e ) }:${ ln }` )
				.join( ',' ) }})}catch(_){};\n`;
		}

		pushStringTo( source.length );
	}

	// ensure we have a proper sourceURL
	let hasSourceURL = false;
	resolvedSource = resolvedSource.replace(
		sourceMapURLRegEx,
		( match, isMapping, url ) => {
			hasSourceURL = ! isMapping;
			return match.replace( url, () =>
				new URL( url, load.responseUrl ).toString()
			);
		}
	);
	if ( ! hasSourceURL ) {
		resolvedSource += '\n//# sourceURL=' + load.responseUrl;
	}

	load.blobUrl = createBlob( resolvedSource );
	load.source = undefined; // free memory
}

const sourceMapURLRegEx =
	/\n\/\/# source(Mapping)?URL=([^\n]+)\s*((;|\/\/[^#][^\n]*)\s*)*$/;

function getOrCreateLoad(
	url: string,
	fetchOpts: RequestInit,
	parent: string
): ModuleLoad {
	let load: ModuleLoad = registry[ url ];
	if ( load ) {
		return load;
	}

	load = { url };

	if ( registry[ url ] ) {
		// If there's a naming conflict, keep incrementing until unique
		let i = 0;
		while ( registry[ load.url + ++i ] ) {
			/* no-op */
		}
		load.url += i;
	}
	registry[ load.url ] = load;

	load.fetchPromise = ( async () => {
		let source;
		( { responseUrl: load.responseUrl, source: source } =
			await ( fetchCache[ url ] ||
				fetchModule( url, fetchOpts, parent ) ) );
		try {
			load.analysis = lexer.parse( source, load.url );
		} catch ( e ) {
			// eslint-disable-next-line no-console
			console.error( e );
			load.analysis = [ [], [], false, false ];
		}
		load.source = source;
		return load;
	} )();

	load.linkPromise = load.fetchPromise.then( async () => {
		let childFetchOpts = fetchOpts;
		load.deps = (
			await Promise.all(
				load.analysis[ 0 ].map( async ( { n, d } ) => {
					if ( d !== -1 || ! n ) {
						return undefined;
					}
					const responseUrl = resolve(
						n,
						load.responseUrl || load.url
					);
					if ( skip && skip( responseUrl ) ) {
						return { blobUrl: responseUrl } as ModuleLoad;
					}
					// remove integrity for child fetches
					if ( childFetchOpts.integrity ) {
						childFetchOpts = {
							...childFetchOpts,
							integrity: undefined,
						};
					}
					return getOrCreateLoad(
						responseUrl,
						childFetchOpts,
						load.responseUrl
					).fetchPromise;
				} )
			)
		).filter( ( l ) => l );
	} );

	return load;
}

const dynamicImport = ( u: string ) => import( /* webpackIgnore: true */ u );

/**
 * Resolves the passed module URL and fetches the corresponding module
 * and their dependencies, returning a `ModuleLoad` object once all
 * of them have been fetched.
 *
 * @param url       Module URL.
 * @param fetchOpts Fetch options.
 * @return A promise with a `ModuleLoad` instance.
 */
export async function preloadModule(
	url: string,
	fetchOpts?: RequestInit
): Promise< ModuleLoad > {
	await initPromise;
	const load = getOrCreateLoad( url, fetchOpts, null );
	const seen = {};
	await loadAll( load, seen );
	resolveDeps( load, seen );
	// microtask scheduling – can help ensure Blob is fully ready
	await Promise.resolve();
	return load;
}

/**
 * Imports the module represented by the passed `ModuleLoad` instance.
 *
 * @param load The `ModuleLoad` instance representing the module.
 * @return A promise with the imported module.
 */
export async function importPreloadedModule< Module = unknown >(
	load: ModuleLoad
): Promise< Module > {
	const module = await dynamicImport( load.blobUrl );
	// if the preloaded module ended up with a shell (circular refs), finalize it
	if ( load.shellUrl ) {
		( await dynamicImport( load.shellUrl ) ).u$_( module );
	}
	return module;
}

/**
 * Imports the module represented by the passed module URL.
 *
 * The module URL and all its dependencies are resolved using the
 * current status of the internal dynamic import map.
 *
 * @param url       Module URL.
 * @param fetchOpts Fetch options.
 * @return A promise with the imported module.
 */
export async function topLevelLoad< Module = unknown >(
	url: string,
	fetchOpts?: RequestInit
): Promise< Module > {
	const load = await preloadModule( url, fetchOpts );
	return importPreloadedModule< Module >( load );
}
