export { default as Editable } from './components/editable';

/**
 * Block settings keyed by block slug.
 *
 * @var {Object} blocks
 */
const blocks = {};

/**
 * Matches node value of a block opening comment.
 *
 * @type {RegExp}
 */
const RE_BLOCK_OPEN = /^\s*wp:(\S+)/;

/**
 * Registers a block.
 *
 * @param {string} slug     Block slug
 * @param {Object} settings Block settings
 */
export function registerBlock( slug, settings ) {
	if ( typeof slug !== 'string' ) {
		throw new Error(
			'Block slugs must be strings.'
		);
	}
	if ( ! /^[a-z0-9-]+\/[a-z0-9-]+$/.test( slug ) ) {
		throw new Error(
			'Block slugs must contain a namespace prefix.  Example:  my-plugin/my-custom-block'
		);
	}
	if ( blocks[ slug ] ) {
		throw new Error(
			'Block "' + slug + '" is already registered.'
		);
	}
	blocks[ slug ] = Object.assign( { slug }, settings );
}

/**
 * Unregisters a block.
 *
 * @param {string} slug Block slug
 */
export function unregisterBlock( slug ) {
	if ( ! blocks[ slug ] ) {
		throw new Error(
			'Block "' + slug + '" is not registered.'
		);
	}
	delete blocks[ slug ];
}

/**
 * Returns settings associated with a block.
 *
 * @param  {string}  slug Block slug
 * @return {?Object}      Block settings
 */
export function getBlockSettings( slug ) {
	return blocks[ slug ];
}

/**
 * Returns all registered blocks.
 *
 * @return {Array} Block settings
 */
export function getBlocks() {
	return Object.values( blocks );
}

/**
 * Iterates through children of a given element to discover block nodes.
 *
 * @param  {Element}  rootNode Element to iterate
 * @return {Object[]}          Block nodes
 */
export function findBlockNodes( rootNode ) {
	const nodes = [];

	let child = rootNode.firstChild;
	while ( child ) {
		// Test as opening comment
		if ( Node.COMMENT_NODE !== child.nodeType || ! RE_BLOCK_OPEN.test( child.nodeValue ) ) {
			child = child.nextSibling;
			continue;
		}

		// Found opening block comment
		const match = child.nodeValue.match( RE_BLOCK_OPEN );
		const closeTag = '/' + child.nodeValue.trim();
		const block = {
			type: match[ 1 ],
			startNode: child,
			blockNodes: []
		};

		// Consider adjacent elements as nodes of block
		while ( ( child = child.nextSibling ) ) {
			if ( Node.COMMENT_NODE === child.nodeType && closeTag === child.nodeValue.trim() ) {
				// Stop considering siblings once closing comment found
				block.endNode = child;
				break;
			} else if ( Node.ELEMENT_NODE === child.nodeType ||
					( Node.TEXT_NODE === child.nodeType && child.nodeValue.trim() ) ) {
				// Only elements and non-empty text nodes included
				block.blockNodes.push( child );
			}
		}

		nodes.push( block );

		// Done if exhausted siblings
		if ( ! child ) {
			break;
		}

		// Resume iteration from sibling after closing comment
		child = child.nextSibling;
	}

	return nodes;
}
