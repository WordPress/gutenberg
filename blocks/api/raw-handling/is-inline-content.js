/**
 * Internal dependencies
 */
import { isInline, isDoubleBR } from './utils';

export default function( HTML, tagName ) {
	const doc = document.implementation.createHTMLDocument( '' );

	doc.body.innerHTML = HTML;

	const nodes = Array.from( doc.body.children );

	return ! nodes.some( isDoubleBR ) && deepCheck( nodes, tagName );
}

function deepCheck( nodes, tagName ) {
	return nodes.every( ( node ) => {
		return ( 'SPAN' === node.nodeName || isInline( node, tagName ) ) &&
			deepCheck( Array.from( node.children ), tagName );
	} );
}
