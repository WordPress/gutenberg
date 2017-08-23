/**
 * Browser dependencies
 */
const { ELEMENT_NODE, TEXT_NODE } = window.Node;

const inlineTags = [
	'strong',
	'em',
	'b',
	'i',
	'del',
	'ins',
	'a',
	'code',
	'abbr',
	'time',
	'sub',
	'sup',
	'br',
	'span',
];

const wrapperTags = [
	'span',
	'div',
	'article',
	'header',
	'footer',
	'section',
	'nav',
	'hgroup',
	'main',
	'aside',
];

export function isInline( node ) {
	return inlineTags.indexOf( node.nodeName.toLowerCase() ) !== -1;
}

export function isDoubleBR( node ) {
	return node.nodeName === 'BR' && node.previousSibling && node.previousSibling.nodeName === 'BR';
}

export function isSpan( node ) {
	return node.nodeName === 'SPAN';
}

export function isWrapper( node ) {
	return wrapperTags.indexOf( node.nodeName.toLowerCase() ) !== -1;
}

export function isEmpty( element ) {
	if ( ! element.hasChildNodes() ) {
		return true;
	}

	return Array.from( element.childNodes ).every( ( node ) => {
		if ( node.nodeType === TEXT_NODE ) {
			return ! node.nodeValue.trim();
		}

		if ( node.nodeType === ELEMENT_NODE ) {
			if ( node.nodeName === 'BR' ) {
				return true;
			} else if ( node.hasAttributes() ) {
				return false;
			}

			return isEmpty( node );
		}

		return true;
	} );
}

function deepFilterHelper( nodeList, filters, doc ) {
	Array.from( nodeList ).forEach( ( node ) => {
		deepFilterHelper( node.childNodes, filters, doc );

		filters.forEach( ( filter ) => {
			// Make sure the node is still attached to the document.
			if ( ! doc.contains( node ) ) {
				return;
			}

			filter( node );
		} );
	} );
}

export function deepFilter( HTML, filters = [] ) {
	const doc = document.implementation.createHTMLDocument( '' );

	doc.body.innerHTML = HTML;

	deepFilterHelper( doc.body.childNodes, filters, doc );

	return doc.body.innerHTML;
}
