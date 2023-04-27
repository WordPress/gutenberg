/**
 * WordPress dependencies
 */
import { useRefEffect } from '@wordpress/compose';
import { useReducer } from '@wordpress/element';

const orderByClientId = new Map();

export function getOrder( clientId, attributes ) {
	const footnotesById = new Map(
		attributes.footnotes.map( ( fn ) => [ fn.id, fn ] )
	);
	const order = new Set( [
		...( orderByClientId.get( clientId ) || [] ),
		...footnotesById.keys(),
	] );
	return Array.from( order ).map( ( id ) => footnotesById.get( id ) );
}

export function useOrderObserver( clientId ) {
	const [ , forceRender ] = useReducer( () => ( {} ) );
	return useRefEffect( ( element ) => {
		const { ownerDocument } = element;
		const { defaultView } = ownerDocument;
		const config = { childList: true, subtree: true };
		const observer = new defaultView.MutationObserver( () => {
			const newOrder = Array.from(
				ownerDocument.querySelectorAll( 'a.fn' )
			).map( ( node ) => {
				return node.getAttribute( 'href' ).slice( 1 );
			} );
			orderByClientId.set( clientId, newOrder );
			forceRender();
		} );

		observer.observe( ownerDocument, config );
		return () => {
			observer.disconnect();
		};
	}, [] );
}
