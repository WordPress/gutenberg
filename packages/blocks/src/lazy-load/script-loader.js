/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

/**
 * Alias for `LazyLoadCache`
 *
 * @typedef {import('./cache').LazyLoadCache} LazyLoadCache
 */

/**
 * Gets the path corresponding to the dependency type and list of dependency
 * handles to load.
 *
 * @see {WP_REST_Scripts_Controller}
 *
 * @param {string[]} scriptHandles List of script handles for which to build the path.
 */
const getPath = ( scriptHandles ) =>
	`/wp/v2/scripts/?${ scriptHandles
		.map( ( handle ) => `dependency=${ handle }` )
		.join( '&' ) }`;

const loadDependency = async ( dependency ) => {
	const {
		src,
		/* extra: { before, after, translations }, */
	} = dependency;

	// @todo(saramarcondes) handle translations, extras, etc.

	const parentElement = document.body;

	/**
	 * Some handles correspond not to an actual individual dependency
	 * but are merely an alias for (a) a set of inline scripts or (b) a
	 * set of other dependencies or (c) both. For that reason, we need
	 * to do a null check on `src`.
	 */
	if ( src ) {
		await new Promise( ( resolve, reject ) => {
			const scriptElement = document.createElement( 'script' );
			scriptElement.type = 'application/javascript';
			scriptElement.src = src;
			scriptElement.onload = resolve;
			scriptElement.onerror = reject;

			parentElement.appendChild( scriptElement );
		} );
	}
};

/**
 * Serially loads scripts in the order in which their dependencies are resolved
 * by the script dependency REST API.
 *
 * @param {Array<string>} scriptsToLoad An array of script handles to load.
 * @param {LazyLoadCache} cache The cache to update with the loaded scripts.
 * @return {Promise<Array<string>>} A promise resolving in the list of scripts that were ultimately loaded.
 */
export const loadScripts = async ( scriptsToLoad, cache ) => {
	const path = getPath( scriptsToLoad );

	const orderedDependenciesWithDependencies = await apiFetch( { path } );

	/**
	 * Programatically added `script` tags get parsed and executed as though they
	 * had `async` on them. That means that if we have script A and B, where B
	 * depends on A and we add both to the DOM at the same time, there's no
	 * guaranteed order of execution, B could execute before A and break, even if
	 * A's script element was added before B.
	 *
	 * Therefore, we need to block on each script's loading until the next one down
	 * the list.
	 *
	 * The only problem with this is if you have two final dependencies you're trying
	 * to load and they have completely separate dependency trees, we will _not_ be
	 * loading those trees in parallel. This isn't currently an issue, so fixing it
	 * right now would be a premature optimization. It would probably require rethinking
	 * how the API returns things (i.e., we should probably return things in an
	 * actual tree format and represent independent trees as duely separate trees if
	 * we want to be able to load things in parallel). For now, this will have to do.
	 */
	await orderedDependenciesWithDependencies.reduce(
		async ( previousPromise, dependency ) => {
			await previousPromise;

			return loadDependency( dependency );
		},
		Promise.resolve()
	);

	orderedDependenciesWithDependencies.forEach( ( { handle } ) =>
		cache.scripts.add( handle )
	);
};
