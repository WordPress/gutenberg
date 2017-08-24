/**
 * Internal dependencies
 */
import { isInline, isDoubleBR } from './utils';

export default function( HTML ) {
	const doc = document.implementation.createHTMLDocument( '' );

	doc.body.innerHTML = HTML;

	const nodes = Array.from( doc.body.children );

	return ! nodes.some( isDoubleBR ) && deepCheck( nodes );
}

function deepCheck( nodes ) {
	return nodes.every( ( node ) => {
		return isInline( node ) && deepCheck( Array.from( node.children ) );
	} );
}
