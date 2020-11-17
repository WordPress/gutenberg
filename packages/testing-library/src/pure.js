/**
 * WordPress dependencies
 */
import * as Element from '@wordpress/element';

/**
 * External dependencies
 */
import {
	getQueriesForElement,
	prettyDOM,
	configure as configureDTL,
} from '@testing-library/dom';

/**
 * Internal dependencies
 */
import { fireEvent } from './fire-event';

configureDTL( {
	asyncWrapper: async ( cb ) => {
		let result;
		await Element.act( async () => {
			result = await cb();
		} );
		return result;
	},
	eventWrapper: ( cb ) => {
		let result;
		Element.act( () => {
			result = cb();
		} );
		return result;
	},
} );

const mountedContainers = new Set();

function render(
	ui,
	{
		container,
		baseElement = container,
		queries,
		hydrate = false,
		wrapper: WrapperComponent,
	} = {}
) {
	if ( ! baseElement ) {
		// default to document.body instead of documentElement to avoid output of potentially-large
		// head elements (such as JSS style blocks) in debug output
		baseElement = document.body;
	}
	if ( ! container ) {
		container = baseElement.appendChild( document.createElement( 'div' ) );
	}

	// we'll add it to the mounted containers regardless of whether it's actually
	// added to document.body so the cleanup method works regardless of whether
	// they're passing us a custom container or not.
	mountedContainers.add( container );

	const wrapUiIfNeeded = ( innerElement ) =>
		WrapperComponent
			? Element.createElement( WrapperComponent, null, innerElement )
			: innerElement;

	Element.act( () => {
		if ( hydrate ) {
			Element.hydrate( wrapUiIfNeeded( ui ), container );
		} else {
			Element.render( wrapUiIfNeeded( ui ), container );
		}
	} );

	return {
		container,
		baseElement,
		debug: ( el = baseElement, maxLength, options ) =>
			Array.isArray( el )
				? el.forEach( ( e ) =>
						// eslint-disable-next-line no-console
						console.log( prettyDOM( e, maxLength, options ) )
				  )
				: // eslint-disable-next-line no-console,
				  console.log( prettyDOM( el, maxLength, options ) ),
		unmount: () => {
			Element.act( () => {
				Element.unmountComponentAtNode( container );
			} );
		},
		rerender: ( rerenderUi ) => {
			render( wrapUiIfNeeded( rerenderUi ), { container, baseElement } );
			// Intentionally do not return anything to avoid unnecessarily complicating the API.
			// folks can use all the same utilities we return in the first place that are bound to the container
		},
		asFragment: () => {
			/* istanbul ignore else (old jsdom limitation) */
			if ( typeof document.createRange === 'function' ) {
				return document
					.createRange()
					.createContextualFragment( container.innerHTML );
			}

			const template = document.createElement( 'template' );
			template.innerHTML = container.innerHTML;
			return template.content;
		},
		...getQueriesForElement( baseElement, queries ),
	};
}

function renderInitialize( initialize, settings, options ) {
	return initialize( 'root', settings, ( ui ) => render( ui, options ) );
}

function cleanup() {
	mountedContainers.forEach( cleanupAtContainer );
}

// maybe one day we'll expose this (perhaps even as a utility returned by render).
// but let's wait until someone asks for it.
function cleanupAtContainer( container ) {
	Element.act( () => {
		Element.unmountComponentAtNode( container );
	} );
	if ( container.parentNode === document.body ) {
		document.body.removeChild( container );
	}
	mountedContainers.delete( container );
}

// just re-export everything from dom-testing-library
export * from '@testing-library/dom';
export { act } from '@wordpress/element';
export { render, renderInitialize, cleanup, fireEvent };
