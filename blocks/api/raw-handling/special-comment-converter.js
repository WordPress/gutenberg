/**
 * Browser dependencies
 */
const { COMMENT_NODE } = window.Node;

/**
 * Looks for `<!--more-->` comments, as well as the `<!--more Some text-->`
 * variant and its `<!--noteaser-->` companion, and replaces them with a custom
 * element representing a future block.
 *
 * The custom element is a way to bypass the rest of the `raw-handling`
 * transforms, which would eliminate other kinds of node with which to carry
 * `<!--more-->`'s data: nodes with `data` attributes, empty paragraphs, etc.
 *
 * The custom element is then expected to be recognized by any registered
 * block's `raw` transform.
 *
 * @param {Node} node The node to be processed.
 * @return {void}
 */
export default function( node ) {
	if (
		node.nodeType !== COMMENT_NODE ||
		node.nodeValue.indexOf( 'more' ) !== 0
	) {
		// We don't specificially look for `noteaser`, meaning that if one is
		// found on its own (and not adjacent to `more`), it will be lost.
		return;
	}

	// Grab any custom text in the comment
	const customText = node.nodeValue.slice( 4 ).trim();

	// When a `<!--more-->` comment is found, we need to look for any
	// `<!--noteaser-->` sibling, but it may not be a direct sibling
	// (whitespace typically lies in between)
	let sibling = node;
	let noTeaser = false;
	while ( ( sibling = sibling.nextSibling ) ) {
		if (
			sibling.nodeType === COMMENT_NODE &&
			sibling.nodeValue === 'noteaser'
		) {
			noTeaser = true;
			sibling.parentNode.removeChild( sibling );
			break;
		}
	}

	// Conjure up a custom More element
	const more = createMore( customText, noTeaser );

	// Append it to the top level for later conversion to blocks
	let parent = node.parentNode;
	while ( parent.nodeName !== 'BODY' ) {
		parent = parent.parentNode;
	}
	parent.appendChild( more );
	node.parentNode.removeChild( node );
}

function createMore( customText, noTeaser ) {
	const node = document.createElement( 'wp-block' );
	node.dataset.block = 'core/more';
	if ( customText ) {
		node.dataset.customText = customText;
	}
	if ( noTeaser ) {
		// "Boolean" data attribute
		node.dataset.noTeaser = '';
	}
	return node;
}
