/**
 * External dependencies
 */
import { h, render } from 'preact';
import { batch } from '@preact/signals';

/**
 * Internal dependencies
 */
import { toVdom } from './vdom';
import { getRegionRootFragment } from './hydration';
import { context } from './hooks';
import { getContextAt } from './context-registry';
import { warn } from './utils';

/**
 * Walks up from `element` to find the nearest enclosing `data-wp-interactive`
 * island and returns its namespace (or `null` if there is none).
 *
 * @param element The element to walk up from.
 * @return The island's namespace, or `null`.
 */
const getAncestorNamespace = ( element: Element ): string | null => {
	let current: Element | null = element.parentElement;
	while ( current ) {
		const value = current.getAttribute( 'data-wp-interactive' );
		if ( value !== null ) {
			try {
				const parsed = JSON.parse( value );
				// eslint-disable-next-line no-nested-ternary
				return typeof parsed === 'string'
					? parsed
					: typeof parsed?.namespace === 'string'
					? parsed.namespace
					: null;
			} catch {
				// Not valid JSON — treat the raw value as the namespace.
				return value;
			}
		}
		current = current.parentElement;
	}
	return null;
};

/**
 * Renders HTML elements that have been inserted into the live DOM after the
 * initial page load, processing all Interactivity API directives on them.
 * The markup is commonly server-rendered — e.g. a fragment fetched from a
 * REST endpoint — but the elements can come from anywhere.
 *
 * The element(s) MUST already be attached to the DOM — the root-fragment
 * mechanism requires a parent element. Multiple elements must be contiguous
 * siblings under the same parent (the fragment's insertion anchor is the last
 * element's next sibling); otherwise call once per element.
 *
 * A fragment without its own `data-wp-interactive` attribute is treated as
 * part of the enclosing island: directives resolve against the nearest
 * ancestor island's namespace, and the fragment inherits the live context at
 * its insertion point. This makes the fragment behave exactly as if it had
 * been part of the original HTML at that position.
 *
 * If the fragment has no enclosing island (and no own `data-wp-interactive`),
 * nothing is hydrated: a warning is logged and the DOM is left untouched.
 *
 * Calling again with the same element updates it in place (preact diffs against
 * the previous render): no duplicate listeners, no remount. Only the passed
 * element(s) are processed — siblings and any enclosing router region are
 * untouched. Not supported during initial hydration or an in-flight navigation.
 *
 * @example
 * ```js
 * import { renderElement } from '@wordpress/interactivity';
 *
 * const res = await fetch( '/my-plugin/card' );
 * const doc = new DOMParser().parseFromString( await res.text(), 'text/html' );
 * const card = doc.body.firstElementChild;
 * feedList.insertBefore( card, feedList.firstChild );
 * renderElement( card );
 * ```
 *
 * @param element Element (or contiguous siblings) to render.
 */
export function renderElement( element: Element | Element[] ): void {
	const nodes = Array.isArray( element ) ? element : [ element ];
	if ( ! nodes.length ) {
		return;
	}
	for ( const node of nodes ) {
		if ( ! node.parentElement || ! node.isConnected ) {
			throw new Error(
				'renderElement(): the element must be attached to the DOM first.'
			);
		}
	}

	/*
	 * Resolve the namespace and context base for each node. A node with its
	 * own `data-wp-interactive` island always wins; otherwise inherit from
	 * the nearest ancestor island. If there is no island at all, warn and
	 * skip (atomic — the whole call is skipped).
	 */
	const resolved: Array< {
		node: Element;
		vdom: ReturnType< typeof toVdom >;
	} > = [];
	let base: { client: object; server: object } | null = null;
	for ( const node of nodes ) {
		const hasOwnIsland = node.hasAttribute( 'data-wp-interactive' );
		const inheritedNamespace = hasOwnIsland
			? null
			: getAncestorNamespace( node );
		if ( ! hasOwnIsland && ! inheritedNamespace ) {
			warn(
				'renderElement(): no interactive island found for the inserted element. The element must be inside a [data-wp-interactive] subtree or have its own data-wp-interactive attribute.'
			);
			return;
		}
		if ( ! base ) {
			base = getContextAt( node.parentElement ?? node );
		}
		resolved.push( {
			node,
			vdom: toVdom( node, inheritedNamespace ),
		} );
	}

	batch( () => {
		render(
			/*
			 * Wrap the fragment vdom in a Provider carrying the live context
			 * at the insertion point, so directives inside the fragment read
			 * (and write through to) the same context as the surrounding
			 * island.
			 */
			h(
				context.Provider,
				{ value: base ?? { client: {}, server: {} } },
				resolved.map( ( { vdom } ) => vdom )
			),
			getRegionRootFragment( nodes )
		);
	} );
}

/**
 * Parses an HTML string and inserts the resulting element(s) into the live
 * DOM, then renders them with `renderElement()` so all Interactivity API
 * directives on them are processed. The HTML commonly comes from a server —
 * e.g. a fragment fetched from a REST endpoint — but can come from anywhere.
 *
 * This is a convenience wrapper over the parse → insert → `renderElement()`
 * sequence, so callers don't need to write their own `DOMParser`/insertion
 * code:
 *
 * ```js
 * import { renderHTML } from '@wordpress/interactivity';
 *
 * const res = await fetch( '/wp-json/my-plugin/v1/cards' );
 * renderHTML( '#feed', await res.text() ); // or: renderHTML( document.querySelector( '#feed' ), ... )
 * ```
 *
 * The container can be passed as an element or as a CSS selector, which is
 * resolved with `document.querySelector` (a selector matching nothing throws).
 *
 * Because `renderHTML()` parses fresh nodes on every call, repeated calls
 * mount fresh content rather than diffing against the previous call's nodes —
 * unlike `renderElement()` re-called with the same element, which diffs in
 * place. With `position: 'inner'` the container's previous children are
 * removed first, making `renderHTML( ref, html, { position: 'inner' } )` a
 * drop-in replacement for `ref.innerHTML = html` that actually hydrates the
 * markup (plain `innerHTML` assignment leaves the inserted directives
 * unprocessed — dead markup).
 *
 * The inserted element(s) must have an enclosing island or their own
 * `data-wp-interactive`; otherwise nothing is hydrated (see `renderElement()`).
 *
 * @param container        The element the parsed HTML is inserted into, or a CSS
 *                         selector for it (resolved via `document.querySelector`).
 * @param html             The HTML string.
 * @param options          Options.
 * @param options.position Where to insert the parsed elements:
 *                         - `append`: as the container's last children (default)
 *                         - `prepend`: as the container's first children
 *                         - `before`: as siblings immediately before the container
 *                         - `after`: as siblings immediately after the container
 *                         - `inner`: replace the container's children
 *                         - `outer`: replace the container itself
 */
export function renderHTML(
	container: Element | string,
	html: string,
	{
		position = 'append',
	}: {
		position?:
			| 'append'
			| 'prepend'
			| 'before'
			| 'after'
			| 'inner'
			| 'outer';
	} = {}
): void {
	// Resolve a CSS selector to its element, if one was passed.
	const containerElement =
		typeof container === 'string'
			? document.querySelector( container )
			: container;
	if ( ! containerElement ) {
		throw new Error(
			`renderHTML(): no element found for selector "${ container }".`
		);
	}

	// Use a `<template>` to parse the HTML into nodes (same as the browser
	// would) without triggering side effects like image loading.
	const template = document.createElement( 'template' );
	template.innerHTML = html;
	const nodes = Array.from( template.content.children );
	if ( ! nodes.length ) {
		return;
	}

	switch ( position ) {
		case 'prepend':
			containerElement.prepend( ...nodes );
			break;
		case 'before':
			containerElement.before( ...nodes );
			break;
		case 'after':
			containerElement.after( ...nodes );
			break;
		case 'inner':
			containerElement.replaceChildren( ...nodes );
			break;
		case 'outer':
			containerElement.replaceWith( ...nodes );
			break;
		case 'append':
		default:
			containerElement.append( ...nodes );
	}

	renderElement( nodes.length === 1 ? nodes[ 0 ] : nodes );
}
