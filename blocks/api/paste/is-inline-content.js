/**
 * Internal dependencies
 */
import { isInline, isDoubleBR } from './utils';

export default function( HTML ) {
	const doc = document.implementation.createHTMLDocument( '' );

	doc.body.innerHTML = HTML;

	const nodes = Array.from( doc.body.children );

	return nodes.every( isInline ) && ! nodes.some( isDoubleBR );
}
