/**
 * Browser dependencies
 */
const { ELEMENT_NODE, TEXT_NODE } = window.Node;

const inlineWhitelist = {
	strong: [],
	em: [],
	del: [],
	ins: [],
	a: [ 'href' ],
	code: [],
	abbr: [ 'title' ],
	sub: [],
	sup: [],
	br: [],
};

const whitelist = {
	...inlineWhitelist,
	img: [ 'src', 'alt' ],
	figure: [],
	figcaption: [],
	h1: [],
	h2: [],
	h3: [],
	h4: [],
	h5: [],
	h6: [],
	p: [],
	blockquote: [],
	hr: [],
	ul: [],
	ol: [ 'type' ],
	li: [],
	pre: [],
	table: [],
	thead: [],
	tfoot: [],
	tbody: [],
	th: [],
	tr: [],
	td: [],
};

export function isWhitelisted( element ) {
	return !! whitelist[ element.nodeName.toLowerCase() ];
}

export function isNotWhitelisted( element ) {
	return ! isWhitelisted( element );
}

export function isAttributeWhitelisted( tag, attribute ) {
	return whitelist[ tag ] && whitelist[ tag ].indexOf( attribute ) !== -1;
}

export function isInline( node ) {
	return !! inlineWhitelist[ node.nodeName.toLowerCase() ];
}

export function isInvalidInline( element ) {
	if ( ! isInline( element ) ) {
		return false;
	}

	if ( ! element.hasChildNodes() ) {
		return false;
	}

	return Array.from( element.childNodes ).some( ( node ) => {
		if ( node.nodeType === ELEMENT_NODE ) {
			if ( ! isInline( node ) ) {
				return true;
			}

			return isInvalidInline( node );
		}

		return false;
	} );
}

export function isDoubleBR( node ) {
	return node.nodeName === 'BR' && node.previousSibling && node.previousSibling.nodeName === 'BR';
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
