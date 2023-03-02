/**
 * WordPress dependencies
 */
import deprecated from '@wordpress/deprecated';

/**
 * Internal dependencies
 */
import * as children from './children';

/**
 * @typedef {import('react').ReactChild} ReactChild
 * @typedef {import('react').ReactElement} ReactElement
 */

/**
 * Given a single node and a node type (e.g. `'br'`), returns true if the node
 * corresponds to that type, false otherwise.
 *
 * @param {JSX.Element}          node Block node to test
 * @param {ReactElement['type']} type Node to type to test against.
 *
 * @return {boolean} Whether node is of intended type.
 *
 * @deprecated since 11.17.0. Use the html source instead.
 */
function isNodeOfType( node, type ) {
	deprecated( 'wp.blocks.node.isNodeOfType', {
		since: '6.1',
		version: '6.3',
		link: 'https://developer.wordpress.org/block-editor/how-to-guides/block-tutorial/introducing-attributes-and-editable-fields/',
	} );

	return node && node.type === type;
}

/**
 * Given an object implementing the NamedNodeMap interface, returns a plain
 * object equivalent value of name, value key-value pairs.
 *
 * @see https://dom.spec.whatwg.org/#interface-namednodemap
 *
 * @param {NamedNodeMap} nodeMap NamedNodeMap to convert to object.
 *
 * @return {Object} Object equivalent value of NamedNodeMap.
 */
export function getNamedNodeMapAsObject( nodeMap ) {
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
 * @param {Node} domNode DOM node to convert.
 *
 * @return {JSX.Element} Block node equivalent to DOM node.
 *
 * @deprecated since 11.17.0. Use the html source instead.
 */
export function fromDOM( domNode ) {
	deprecated( 'wp.blocks.node.fromDOM', {
		since: '6.1',
		version: '6.3',
		alternative: 'wp.richText.create',
		link: 'https://developer.wordpress.org/block-editor/how-to-guides/block-tutorial/introducing-attributes-and-editable-fields/',
	} );

	if ( domNode.nodeType === domNode.TEXT_NODE ) {
		return domNode.nodeValue;
	}

	if ( domNode.nodeType !== domNode.ELEMENT_NODE ) {
		throw new TypeError(
			'A block node can only be created from a node of type text or ' +
				'element.'
		);
	}

	return {
		type: domNode.nodeName.toLowerCase(),
		props: {
			...getNamedNodeMapAsObject( domNode.attributes ),
			children: children.fromDOM( domNode.childNodes ),
		},
	};
}

/**
 * Given a block node, returns its HTML string representation.
 *
 * @param {ReactChild} node Block node to convert to string.
 *
 * @return {string} String HTML representation of block node.
 *
 * @deprecated since 11.17.0. Use the html source instead.
 */
export function toHTML( node ) {
	deprecated( 'wp.blocks.node.toHTML', {
		since: '6.1',
		version: '6.3',
		alternative: 'wp.richText.toHTMLString',
		link: 'https://developer.wordpress.org/block-editor/how-to-guides/block-tutorial/introducing-attributes-and-editable-fields/',
	} );

	return children.toHTML( [ node ] );
}

/**
 * Given a selector, returns an hpq matcher generating a BlockNode value
 * matching the selector result.
 *
 * @param {string=} selector DOM selector.
 *
 * @return {(domNode: Node & ParentNode) => ReactChild[]} hpq matcher.
 *
 * @deprecated since 11.17.0. Use the html source instead.
 */
export function matcher( selector ) {
	deprecated( 'wp.blocks.node.matcher', {
		since: '6.1',
		version: '6.3',
		alternative: 'html source',
		link: 'https://developer.wordpress.org/block-editor/how-to-guides/block-tutorial/introducing-attributes-and-editable-fields/',
	} );

	return ( domNode ) => {
		let match = domNode;

		if ( selector ) {
			match = domNode.querySelector( selector );
		}

		try {
			return fromDOM( match );
		} catch ( error ) {
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
	isNodeOfType,
	fromDOM,
	toHTML,
	matcher,
};
