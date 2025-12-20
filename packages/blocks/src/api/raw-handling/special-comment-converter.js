/**
 * WordPress dependencies
 */
import { remove, replace } from '@wordpress/dom';

/**
 * Looks for `<!--nextpage-->` and `<!--more-->` comments and
 * replaces them with a custom element representing a future block.
 *
 * The custom element is a way to bypass the rest of the `raw-handling`
 * transforms, which would eliminate other kinds of node with which to carry
 * `<!--more-->`'s data: nodes with `data` attributes, empty paragraphs, etc.
 *
 * The custom element is then expected to be recognized by any registered
 * block's `raw` transform.
 *
 * @param {Node}     node The node to be processed.
 * @param {Document} doc  The document of the node.
 * @return {void}
 */
export default function specialCommentConverter( node, doc ) {
	if ( node.nodeType !== node.COMMENT_NODE ) {
		return;
	}

	if (
		node.nodeValue !== 'nextpage' &&
		node.nodeValue.indexOf( 'more' ) !== 0
	) {
		return;
	}

	const block = createBlock( node, doc );

	// If our `<!--more-->` comment is in the middle of a paragraph, we should
	// split the paragraph in two and insert the more block in between. If it's
	// inside an empty paragraph, we should still move it out of the paragraph
	// and remove the paragraph. If there's no paragraph, fall back to simply
	// replacing the comment.
	if ( ! node.parentNode || node.parentNode.nodeName !== 'P' ) {
		replace( node, block );
	} else {
		const childNodes = Array.from( node.parentNode.childNodes );
		const nodeIndex = childNodes.indexOf( node );
		const wrapperNode = node.parentNode.parentNode || doc.body;

		const paragraphBuilder = ( acc, child ) => {
			if ( ! acc ) {
				acc = doc.createElement( 'p' );
			}

			acc.appendChild( child );

			return acc;
		};

		// Split the original parent node and insert our more block
		[
			childNodes.slice( 0, nodeIndex ).reduce( paragraphBuilder, null ),
			block,
			childNodes.slice( nodeIndex + 1 ).reduce( paragraphBuilder, null ),
		].forEach(
			( element ) =>
				element && wrapperNode.insertBefore( element, node.parentNode )
		);

		// Remove the old parent paragraph
		remove( node.parentNode );
	}
}

function createBlock( commentNode, doc ) {
	if ( commentNode.nodeValue === 'nextpage' ) {
		return createNextpage( doc );
	}

	// Grab any custom text in the comment.
	const customText = commentNode.nodeValue.slice( 4 ).trim();

	/*
	 * When a `<!--more-->` comment is found, we need to look for any
	 * `<!--noteaser-->` sibling, but it may not be a direct sibling
	 * (whitespace typically lies in between)
	 */
	let sibling = commentNode;
	let noTeaser = false;
	while ( ( sibling = sibling.nextSibling ) ) {
		if (
			sibling.nodeType === sibling.COMMENT_NODE &&
			sibling.nodeValue === 'noteaser'
		) {
			noTeaser = true;
			remove( sibling );
			break;
		}
	}

	return createMore( customText, noTeaser, doc );
}

function createMore( customText, noTeaser, doc ) {
	const node = doc.createElement( 'wp-block' );
	node.dataset.block = 'core/more';
	if ( customText ) {
		node.dataset.customText = customText;
	}
	if ( noTeaser ) {
		// "Boolean" data attribute.
		node.dataset.noTeaser = '';
	}
	return node;
}

function createNextpage( doc ) {
	const node = doc.createElement( 'wp-block' );
	node.dataset.block = 'core/nextpage';

	return node;
}
