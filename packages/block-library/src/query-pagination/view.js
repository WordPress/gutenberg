/**
 * External dependencies
 */
import { h, hydrate, render, options } from 'preact';

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

let rootFragment;

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
		if ( a[ i ].name.startsWith( 'wp-' ) ) {
			props.wp = props.wp || {};
			props.wp[ a[ i ].name ] = a[ i ].value;
		} else {
			props[ a[ i ].name ] = a[ i ].value;
		}
	}

	return h(
		node.localName,
		props,
		[].map.call( node.childNodes, toVdom ).filter( f )
	);
}

const wpDirectives = {};

wpDirectives[ 'wp-client-navigation' ] = ( { element, value } ) => {
	if ( value ) {
		element.addEventListener( 'click', async ( event ) => {
			event.preventDefault();

			const url = element.getAttribute( 'href' );
			const html = await window
				.fetch( url )
				.then( ( res ) => res.text() );
			const dom = new window.DOMParser().parseFromString(
				html,
				'text/html'
			);
			const vdom = toVdom( dom.body );
			render( vdom, rootFragment );

			window.history.pushState( {}, '', url );

			if ( value?.scroll === 'smooth' ) {
				window.scrollTo( { top: 0, left: 0, behavior: 'smooth' } );
			} else if ( value?.scroll !== false ) {
				window.scrollTo( 0, 0 );
			}
		} );
	}
};

// Store previous hook.
const oldHook = options.diffed;
const mounted = new WeakSet();

// Set our own options hook.
options.diffed = ( vnode ) => {
	const wp = vnode.props.wp;
	if ( wp ) {
		const element = vnode.__e;
		if ( ! mounted.has( element ) ) {
			mounted.add( element );
			for ( const key in wp ) {
				let value = wp[ key ];
				try {
					value = JSON.parse( wp[ key ] );
				} catch ( e ) {}
				if ( wpDirectives[ key ] )
					wpDirectives[ key ]( {
						value,
						element,
						props: vnode.props,
					} );
			}
		}
	}

	// Call previously defined hook if there was any
	if ( oldHook ) {
		oldHook( vnode );
	}
};

document.addEventListener( 'DOMContentLoaded', () => {
	rootFragment = createRootFragment(
		document.documentElement,
		document.body
	);

	window.requestIdleCallback( () => {
		const vdom = toVdom( document.body );
		hydrate( vdom, rootFragment );
	} );
} );
