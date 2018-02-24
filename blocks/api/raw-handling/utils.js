/**
 * External dependencies
 */
import { includes } from 'lodash';

/**
 * Browser dependencies
 */
const { ELEMENT_NODE, TEXT_NODE } = window.Node;

/**
 * An array of tag groups used by isInlineForTag function.
 * If tagName and nodeName are present in the same group, the node should be treated as inline.
 * @type {Array}
 */
const inlineWhitelistTagGroups = [
	[ 'ul', 'li', 'ol' ],
	[ 'h1', 'h2', 'h3', 'h4', 'h5', 'h6' ],
];

const inlineWhitelist = {
	strong: {},
	em: {},
	del: {},
	ins: {},
	a: { attributes: [ 'href' ] },
	code: {},
	abbr: { attributes: [ 'title' ] },
	sub: {},
	sup: {},
	br: {},
};

const embeddedWhiteList = {
	img: { attributes: [ 'src', 'alt' ], classes: [ 'alignleft', 'aligncenter', 'alignright', 'alignnone' ] },
	iframe: { attributes: [ 'src', 'allowfullscreen', 'height', 'width' ] },
};

const inlineWrapperWhiteList = {
	figcaption: {},
	h1: {},
	h2: {},
	h3: {},
	h4: {},
	h5: {},
	h6: {},
	p: {},
	li: { children: [ 'ul', 'ol', 'li' ] },
	pre: {},
	td: {},
	th: {},
};

const whitelist = {
	...inlineWhitelist,
	...inlineWrapperWhiteList,
	...embeddedWhiteList,
	figure: {},
	blockquote: {},
	hr: {},
	ul: {},
	ol: { attributes: [ 'type' ] },
	table: {},
	thead: {},
	tfoot: {},
	tbody: {},
	tr: {},
};

export function isWhitelisted( element ) {
	return whitelist.hasOwnProperty( element.nodeName.toLowerCase() );
}

export function isNotWhitelisted( element ) {
	return ! isWhitelisted( element );
}

export function isAttributeWhitelisted( tag, attribute ) {
	return (
		whitelist[ tag ] &&
		whitelist[ tag ].attributes &&
		whitelist[ tag ].attributes.indexOf( attribute ) !== -1
	);
}

/**
 * Checks if nodeName should be treated as inline when being added to tagName.
 * This happens if nodeName and tagName are in the same group defined in inlineWhitelistTagGroups.
 *
 * @param {string} nodeName Node name.
 * @param {string} tagName  Tag name.
 *
 * @return {boolean} True if nodeName is inline in the context of tagName and
 *                    false otherwise.
 */
function isInlineForTag( nodeName, tagName ) {
	if ( ! tagName || ! nodeName ) {
		return false;
	}
	return inlineWhitelistTagGroups.some( tagGroup =>
		includes( tagGroup, nodeName ) && includes( tagGroup, tagName )
	);
}

export function isInline( node, tagName ) {
	const nodeName = node.nodeName.toLowerCase();
	return inlineWhitelist.hasOwnProperty( nodeName ) || isInlineForTag( nodeName, tagName );
}

export function isClassWhitelisted( tag, name ) {
	return (
		whitelist[ tag ] &&
		whitelist[ tag ].classes &&
		whitelist[ tag ].classes.indexOf( name ) !== -1
	);
}

/**
 * Whether or not the given node is embedded content.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Content_categories#Embedded_content
 *
 * @param {Node} node The node to check.
 *
 * @return {boolean} True if embedded content, false if not.
 */
export function isEmbedded( node ) {
	return embeddedWhiteList.hasOwnProperty( node.nodeName.toLowerCase() );
}

export function isInlineWrapper( node ) {
	return inlineWrapperWhiteList.hasOwnProperty( node.nodeName.toLowerCase() );
}

export function isAllowedBlock( parentNode, node ) {
	const parentNodeTag = parentNode.nodeName.toLowerCase();
	const nodeTag = node.nodeName.toLowerCase();

	return (
		whitelist[ parentNodeTag ] &&
		whitelist[ parentNodeTag ].children &&
		whitelist[ parentNodeTag ].children.indexOf( nodeTag ) !== -1
	);
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

export function isPlain( HTML ) {
	const doc = document.implementation.createHTMLDocument( '' );

	doc.body.innerHTML = HTML;

	const brs = doc.querySelectorAll( 'br' );

	// Remove all BR nodes.
	Array.from( brs ).forEach( ( node ) => {
		node.parentNode.replaceChild( document.createTextNode( '\n' ), node );
	} );

	// Merge all text nodes.
	doc.body.normalize();

	// If it's plain text, there should only be one node left.
	return doc.body.childNodes.length === 1 && doc.body.firstChild.nodeType === TEXT_NODE;
}

/**
 * Given node filters, deeply filters and mutates a NodeList.
 *
 * @param {NodeList} nodeList The nodeList to filter.
 * @param {Array}    filters  An array of functions that can mutate with the provided node.
 * @param {Document} doc      The document of the nodeList.
 */
export function deepFilterNodeList( nodeList, filters, doc ) {
	Array.from( nodeList ).forEach( ( node ) => {
		deepFilterNodeList( node.childNodes, filters, doc );

		filters.forEach( ( filter ) => {
			// Make sure the node is still attached to the document.
			if ( ! doc.contains( node ) ) {
				return;
			}

			filter( node, doc );
		} );
	} );
}

/**
 * Given node filters, deeply filters HTML tags.
 *
 * @param {string} HTML    The HTML to filter.
 * @param {Array}  filters An array of functions that can mutate with the provided node.
 *
 * @return {string} The filtered HTML.
 */
export function deepFilterHTML( HTML, filters = [] ) {
	const doc = document.implementation.createHTMLDocument( '' );

	doc.body.innerHTML = HTML;

	deepFilterNodeList( doc.body.childNodes, filters, doc );

	return doc.body.innerHTML;
}
