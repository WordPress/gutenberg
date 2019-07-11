/* global Element, Node */

/**
 * Internal dependencies
 */
import * as children from './children';

/**
 * @typedef {(domNode: Node & ParentNode) => ReactChild | null} HpqMatcher
 */

/**
 * @typedef {import('@wordpress/element').ReactChild} ReactChild
 */

/**
 * Given a single node and a node type (e.g. `'br'`), returns true if the node
 * corresponds to that type, false otherwise.
 *
 * @param {ReactChild} node Block node to test
 * @param {string}     type Node to type to test against.
 *
 * @return {boolean} Whether node is of intended type.
 */
function isNodeOfType( node, type ) {
	return typeof node === 'object' && node.type === type;
}

/**
 * Given an object implementing the NamedNodeMap interface, returns a plain
 * object equivalent value of name, value key-value pairs.
 *
 * @see https://dom.spec.whatwg.org/#interface-namednodemap
 *
 * @param {NamedNodeMap} nodeMap NamedNodeMap to convert to object.
 *
 * @return {Record<string,string>} Object equivalent value of NamedNodeMap.
 */
export function getNamedNodeMapAsObject( nodeMap ) {
	/** @type {Record<string,string>} */
	const result = {};
	for ( let i = 0; i < nodeMap.length; i++ ) {
		const { name, value } = nodeMap[ i ];
		result[ name ] = value;
	}

	return result;
}

/**
 * Given a DOM Element or Text node, returns an equivalent block node. Throws
 * if passed any node type other than element or text.
 *
 * @throws {TypeError} If non-element/text node is passed.
 *
 * @param {Element|Node} domNode DOM node to convert.
 *
 * @return {ReactChild} Block node equivalent to DOM node.
 */
export function fromDOM( domNode ) {
	if ( domNode.nodeType === Node.TEXT_NODE ) {
		return domNode.nodeValue || '';
	}

	if ( ! ( domNode instanceof Element ) ) {
		throw new TypeError(
			'A block node can only be created from a node of type text or element.'
		);
	}

	return {
		type: domNode.nodeName.toLowerCase(),
		props: {
			...getNamedNodeMapAsObject( domNode.attributes ),
			children: children.fromDOM( domNode.childNodes ),
		},
		key: null,
	};
}

/**
 * Given a block node, returns its HTML string representation.
 *
 * @param {ReactChild} node Block node to convert to string.
 *
 * @return {string} String HTML representation of block node.
 */
export function toHTML( node ) {
	return children.toHTML( [ node ] );
}

/**
 * Given a selector, returns an hpq matcher generating a WPBlockNode value
 * matching the selector result.
 *
 * @param {string} selector DOM selector.
 *
 * @return {HpqMatcher} hpq matcher.
 */
export function matcher( selector ) {
	return ( domNode ) => {
		/**
		 * @type {Node & ParentNode | null}
		 */
		let match = domNode;

		if ( selector ) {
			match = domNode.querySelector( selector );
		}

		try {
			if ( match ) {
				return fromDOM( match );
			}
			return null;
		} catch {
			return null;
		}
	};
}

/**
 * Object of utility functions used in managing block attribute values of
 * source `node`.
 *
 * @see https://github.com/WordPress/gutenberg/pull/10439
 *
 * @deprecated since 4.0. The `node` source should not be used, and can be
 *             replaced by the `html` source.
 *
 * @private
 */
export default {
	fromDOM,
	isNodeOfType,
	matcher,
	toHTML,
};
