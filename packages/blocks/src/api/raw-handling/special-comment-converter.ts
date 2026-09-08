import { remove } from '@wordpress/dom';

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
 * @param node The node to be processed.
 * @param doc  The document of the node.
 */
export default function specialCommentConverter(
	node: Node,
	doc: Document
): void {
	if ( node.nodeType !== node.COMMENT_NODE ) {
		return;
	}

	if (
		node.nodeValue !== 'nextpage' &&
		node.nodeValue!.indexOf( 'more' ) !== 0
	) {
		return;
	}

	const block = createBlock( node, doc );

	// The block takes the comment's place, and then has to reach the top
	// level: `htmlToBlocks` visits only `body`'s children, so a marker left
	// inside another element would be swallowed into whichever block claims
	// its container. Every container on the way up is split where the marker
	// stood, so nothing around it is reordered: a paragraph splits into bare
	// halves, as it always has, and any other container splits into halves
	// that keep its own markup. Empty halves are dropped.
	node.parentNode?.insertBefore( block, node );
	remove( node as Element );

	const buildHalf = ( container: Element, nodes: Node[] ): Element | null => {
		if ( ! nodes.length ) {
			return null;
		}

		const half =
			container.nodeName === 'P'
				? doc.createElement( 'p' )
				: ( container.cloneNode( false ) as Element );

		nodes.forEach( ( child ) => half.appendChild( child ) );

		return half;
	};

	let container = block.parentNode as Element | null;

	while ( container && container !== doc.body && container.parentNode ) {
		const parentOfContainer = container.parentNode;
		const childNodes = Array.from( container.childNodes );
		const at = childNodes.indexOf( block as ChildNode );
		const before = buildHalf( container, childNodes.slice( 0, at ) );
		const after = buildHalf( container, childNodes.slice( at + 1 ) );

		if ( before ) {
			parentOfContainer.insertBefore( before, container );
		}

		parentOfContainer.insertBefore( block, container );

		if ( after ) {
			parentOfContainer.insertBefore( after, container );
		}

		remove( container as Element );

		container =
			parentOfContainer === doc.body
				? null
				: ( parentOfContainer as Element );
	}
}

function createBlock( commentNode: Node, doc: Document ): HTMLElement {
	if ( commentNode.nodeValue === 'nextpage' ) {
		return createNextpage( doc );
	}

	// Grab any custom text in the comment.
	const customText = commentNode.nodeValue!.slice( 4 ).trim();

	/*
	 * When a `<!--more-->` comment is found, we need to look for any
	 * `<!--noteaser-->` sibling, but it may not be a direct sibling
	 * (whitespace typically lies in between)
	 */
	let sibling: Node | null = commentNode;
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

function createMore(
	customText: string,
	noTeaser: boolean,
	doc: Document
): HTMLElement {
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

function createNextpage( doc: Document ): HTMLElement {
	const node = doc.createElement( 'wp-block' );
	node.dataset.block = 'core/nextpage';

	return node;
}
