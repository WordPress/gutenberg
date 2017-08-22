/**
 * Internal dependencies
 */
import { isInline, unwrap } from './utils';

export default function( HTML ) {
	const doc = document.implementation.createHTMLDocument( '' );

	doc.body.innerHTML = HTML;

	deepStrip( doc.body.children );

	return doc.body.innerHTML;
}

function deepStrip( nodeList ) {
	Array.from( nodeList ).forEach( ( node ) => {
		deepStrip( node.children );

		if ( ! isInline( node ) ) {
			unwrap( node );
		}
	} );
}
