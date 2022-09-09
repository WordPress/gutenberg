/**
 * External dependencies
 */
import { h, hydrate, render } from 'preact';

function createRootFragment( parent, replaceNode ) {
	replaceNode = [].concat( replaceNode );
	const s = replaceNode[ replaceNode.length - 1 ].nextSibling;
	function insert( c, r ) {
		parent.insertBefore( c, r || s );
	}
	return ( parent.__k = {
		nodeType: 1,
		parentNode: parent,
		firstChild: replaceNode[ 0 ],
		childNodes: replaceNode,
		insertBefore: insert,
		appendChild: insert,
		removeChild( c ) {
			parent.removeChild( c );
		},
	} );
}

const f = ( i ) => i;

// Convert a DOM node to a static virtual DOM node.
function toVdom( node ) {
	if ( node.nodeType === 3 ) {
		return node.data;
	}
	if ( node.nodeType === 8 || node.localName === 'script' ) {
		return null;
	}

	const props = {},
		a = node.attributes;

	for ( let i = 0; i < a.length; i++ ) {
		props[ a[ i ].name ] = a[ i ].value;
	}

	return h(
		node.localName,
		props,
		[].map.call( node.childNodes, toVdom ).filter( f )
	);
}

document.addEventListener( 'DOMContentLoaded', () => {
	const rootFragment = createRootFragment(
		document.documentElement,
		document.body
	);

	const fetchURL = async ( e ) => {
		e.preventDefault();

		// Fetch the HTML of the new page.
		const url = e.target.href;
		const html = await window
			.fetch( e.target.href )
			.then( ( d ) => d.text() );

		const dom = new window.DOMParser().parseFromString( html, 'text/html' );
		const vdom = toVdom( dom.body );

		render( vdom, rootFragment );

		// Change the browser URL.
		window.history.pushState( {}, '', url );

		// Scroll to the top to simulate page load. Optional.
		// window.scrollTo( { top: 0, left: 0, behavior: 'smooth' } );
	};

	window.requestIdleCallback( () => {
		const vdom = toVdom( document.body );
		hydrate( vdom, rootFragment );
	} );

	const next = document.querySelector( '.wp-block-query-pagination-next' );
	const previous = document.querySelector(
		'.wp-block-query-pagination-previous'
	);

	next?.addEventListener( 'click', fetchURL );
	previous?.addEventListener( 'click', fetchURL );
} );
