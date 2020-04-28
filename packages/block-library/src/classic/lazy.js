/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import { noop, sum } from 'lodash';

/**
 * @typedef {'scripts' | 'styles'} WPLazyDependencyType
 */

/**
 * Gets the path corresponding to the dependency type and list of dependency
 * handles to load.
 *
 * @see {WP_REST_Styles_Controller}
 *
 * @param {WPLazyDependencyType} dependencyType The type of dependency for which to build the path.
 * @param {string[]} dependencyHandles List of dependency handles for which to build the path.
 */
const getPath = ( dependencyType, dependencyHandles ) =>
	`/wp/v2/${ dependencyType }/?${ dependencyHandles.map(
		( handle ) => `dependency=${ handle }`
	) }`;

/**
 *
 * @param {WPLazyDependencyType} dependencyType The type of dependency
 * @param {(dependencyUri: string) => (HTMLScriptElement | HTMLLinkElement)} createElement A function accepting a URI for a dependency and returning an element to append to head
 *
 * @return {(dependencies: string[]) => Promise<number>} A file loader function acepting a list of dependencies and returning a Promise which resolves when all the files have been loaded
 */
const createDependencyLoader = ( dependencyType, createElement ) => {
	const previouslyLoadedDependencies = new Set();

	return async ( dependencies ) => {
		const dependenciesToLoad = dependencies.filter(
			( handle ) => ! previouslyLoadedDependencies.has( handle )
		);

		if ( dependenciesToLoad.length === 0 ) {
			return 0;
		}

		const path = getPath( dependencyType, dependenciesToLoad );

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
		for ( const dependency of orderedDependenciesWithDependencies ) {
			const { src: dependencyUri } = dependency;

			await new Promise( ( resolve, reject ) => {
				const element = createElement( dependencyUri );
				element.onload = resolve;
				element.onerror = reject;
				document.head.appendChild( element );
			} );
		}

		orderedDependenciesWithDependencies.forEach( ( { handle } ) =>
			previouslyLoadedDependencies.add( handle )
		);

		return orderedDependenciesWithDependencies.length;
	};
};

const loadScripts = createDependencyLoader( 'scripts', ( dependencyUri ) => {
	const scriptElement = document.createElement( 'script' );
	scriptElement.type = 'application/javascript';
	scriptElement.src = dependencyUri;
	return scriptElement;
} );

const loadStyles = createDependencyLoader( 'styles', ( dependencyUri ) => {
	const linkElement = document.createElement( 'link' );
	linkElement.rel = 'stylesheet';
	linkElement.href = dependencyUri;
	return linkElement;
} );

/**
 * A component which blocks the rendering of its children until the dependencies
 * declared in scripts and styles have been loaded and the optional onLoaded
 * function has successfully resolved. Allows asynchronously loading library
 * dependencies for blocks (for example TinyMCE for the Classic Block).
 *
 * @example
 * <caption>Given a library called `map-library` which loads an object onto window.mapLibrary, we can initialize this dependency using LazyLoad:</caption>
 *
 * const EmbeddedMapBlockEdit = () => {
 *		window.mapLibrary.drawMap();
 * };
 *
 * const LazyEmbeddedMapBlockEdit = ( props ) => (
 *		<LazyLoad
 *			scripts={ [ 'map-library' ] }
 *			onLoaded={ () => window.mapLibrary.init() }
 *		>
 *			<EmbeddedMapBlockEdit { ...props } />
 *		</LazyLoad>
 * );
 *
 * @param {Object} props
 * @param {string[]} props.scripts List of script handles to load for children
 * @param {string[]} props.styles List of style handles to load for children
 * @param {import('@wordpress/element').WPNode} props.children Children to render after loading dependencies
 * @param {import('@wordpress/element').WPNode} props.placeholder Placeholder to render while loading dependencies
 * @param {() => Promise<void>} props.onLoaded
 * @param {(e: Error) => void} props.onError Function to handle errors while loading dependencies
 */
const LazyLoad = ( {
	scripts,
	styles,
	children,
	placeholder,
	onLoaded,
	onError,
} ) => {
	const [ loaded, setLoaded ] = useState( false );

	Promise.all( [ loadScripts( scripts ), loadStyles( styles ) ] )
		.then( ( loadedCounts ) => {
			/**
			 * skip `onLoaded` if no dependencies were loaded, for example,
			 * if they were previously loaded
			 */
			if ( sum( loadedCounts ) > 0 ) {
				return onLoaded();
			}
			return Promise.resolve();
		} )
		.then( () => {
			setLoaded( true );
		} )
		.catch( onError );

	if ( loaded ) {
		return children;
	}

	return placeholder;
};

LazyLoad.defaultProps = {
	scripts: [],
	styles: [],
	placeholder: null,
	onLoaded: () => Promise.resolve(),
	onError: noop,
};

export default LazyLoad;
