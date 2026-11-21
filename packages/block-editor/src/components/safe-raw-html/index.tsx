import { useLayoutEffect, useRef } from '@wordpress/element';
import { safeHTML } from '@wordpress/dom';

/**
 * Replaces the children of an element with the nodes of the HTML, sanitized
 * with `safeHTML`.
 *
 * Markup parsed inside an element can produce a different tree from the same
 * markup parsed elsewhere, so the element receives the nodes of the checked
 * tree instead of parsing the sanitized markup itself.
 *
 * @param element Element to fill.
 * @param html    HTML to sanitize.
 */
export function setSafeHTML( element: Element, html: string ) {
	// `safeHTML` returns markup that parses to the tree it checked in the body
	// of an inert document.
	const { body } =
		element.ownerDocument.implementation.createHTMLDocument( '' );
	body.innerHTML = safeHTML( html );
	const fragment = element.ownerDocument.createDocumentFragment();
	while ( body.firstChild ) {
		fragment.appendChild( body.firstChild );
	}
	element.replaceChildren( fragment );
}

/**
 * Renders HTML, sanitized with `safeHTML`, in a `div`. Use it instead of
 * `RawHTML` for markup rendered in the editor canvas.
 *
 * @param props      Component props.
 * @param props.html HTML to sanitize and render.
 */
export default function SafeRawHTML( { html }: { html: string } ) {
	const ref = useRef< HTMLDivElement >( null );

	useLayoutEffect( () => {
		// The `div` renders before the layout effect runs.
		setSafeHTML( ref.current!, html );
	}, [ html ] );

	return <div ref={ ref } />;
}
