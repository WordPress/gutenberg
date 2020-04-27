/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * External dependencies
 */
import { noop } from 'lodash';

const getPath = ( dependencyType, dependencies ) =>
	`/wp/v2/${ dependencyType }/?${ dependencies.map(
		( dependency ) => `dependency=${ dependency }`
	) }`;

/**
 *
 * @param {'scripts' | 'styles'} dependencyType The type of dependency
 * @param {Function} createElement A function accepting a URI for a dependency and returning an element to append to head
 *
 * @return {Function} A file loader function acepting a list of dependencies and returning a Promise which resolves when all the files have been loaded
 */
const createDependencyLoader = ( dependencyType, createElement ) => {
	const previouslyLoadedDependencies = new Set();

	return async ( dependencies ) => {
		const dependenciesToLoad = dependencies.filter(
			( handle ) => ! previouslyLoadedDependencies.has( handle )
		);

		if ( dependenciesToLoad.length === 0 ) {
			return;
		}

		const path = getPath( dependencyType, dependenciesToLoad );

		const orderedDependenciesWithDependencies = await apiFetch( { path } );

		/**
		 * Programatically added `script` tags get parsed and executed as though they
		 * had `async` on them. That means that if we have script A and B, where B
		 * depends on A and we add both to the DOM at the same time, there's no
		 * guaranteed order of execution, B could execute before A and break.
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
		.then( () => onLoaded() )
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
