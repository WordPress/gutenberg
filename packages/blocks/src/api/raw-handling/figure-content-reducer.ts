/**
 * WordPress dependencies
 */
import { isTextContent } from '@wordpress/dom';

/**
 * Whether or not the given node is figure content.
 *
 * @param node   The node to check.
 * @param schema The schema to use.
 *
 * @return True if figure content, false if not.
 */
function isFigureContent( node: Node, schema: Record< string, unknown > ) {
	const tag = node.nodeName.toLowerCase();

	// We are looking for tags that can be a child of the figure tag, excluding
	// `figcaption` and any phrasing content.
	if ( tag === 'figcaption' || isTextContent( node ) ) {
		return false;
	}

	return tag in ( ( schema?.figure as any )?.children ?? {} );
}

/**
 * Whether or not the given node can have an anchor.
 *
 * @param node   The node to check.
 * @param schema The schema to use.
 *
 * @return True if it can, false if not.
 */
function canHaveAnchor( node: Node, schema: Record< string, unknown > ) {
	const tag = node.nodeName.toLowerCase();

	return tag in ( ( schema?.figure as any )?.children?.a?.children ?? {} );
}

/**
 * Wraps the given element in a figure element.
 *
 * @param element       The element to wrap.
 * @param beforeElement The element before which to place the figure.
 */
function wrapFigureContent( element: Node, beforeElement: Node = element ) {
	const figure = element.ownerDocument!.createElement( 'figure' );
	beforeElement.parentNode!.insertBefore( figure, beforeElement );
	figure.appendChild( element );
}

/**
 * This filter takes figure content out of paragraphs, wraps it in a figure
 * element, and moves any anchors with it if needed.
 *
 * @param node   The node to filter.
 * @param doc    The document of the node.
 * @param schema The schema to use.
 */
export default function figureContentReducer(
	node: Node,
	doc: Document,
	schema?: Record< string, unknown >
) {
	if ( ! schema || ! isFigureContent( node, schema ) ) {
		return;
	}

	let nodeToInsert = node;
	const parentNode = node.parentNode;

	// If the figure content can have an anchor and its parent is an anchor with
	// only the figure content, take the anchor out instead of just the content.
	if (
		canHaveAnchor( node, schema ) &&
		parentNode!.nodeName === 'A' &&
		parentNode!.childNodes.length === 1
	) {
		nodeToInsert = node.parentNode!;
	}

	const wrapper = ( nodeToInsert as HTMLElement ).closest( 'p,div' );

	// If wrapped in a paragraph or div, only extract if it's aligned or if
	// there is no text content.
	// Otherwise, if directly at the root, wrap in a figure element.
	if ( wrapper ) {
		const element = node as HTMLElement;
		// In jsdom-jscore, 'node.classList' can be undefined.
		// In this case, default to extract as it offers a better UI experience on mobile.
		if ( ! element.classList ) {
			wrapFigureContent( nodeToInsert, wrapper );
		} else if (
			element.classList.contains( 'alignright' ) ||
			element.classList.contains( 'alignleft' ) ||
			element.classList.contains( 'aligncenter' ) ||
			! wrapper.textContent!.trim()
		) {
			wrapFigureContent( nodeToInsert, wrapper );
		}
	} else {
		wrapFigureContent( nodeToInsert );
	}
}
