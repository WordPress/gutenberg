/**
 * External dependencies
 */
import {
	Fragment,
	h,
	hydrate,
	render,
	type ComponentChild,
	type ContainerNode,
	type VNode,
} from 'preact';

/**
 * Internal dependencies
 */
import { toVdom } from './vdom';
import { Directives } from './hooks';
import { getRegionRootFragment } from './hydration';
import { warn } from './utils';

/**
 * Tree-first dynamic content rendering.
 *
 * The island's Preact tree is the single source of truth: new content is
 * parsed to vdom (detached) and SPLICED into the tree, then `render()` diffs
 * it in. The DOM is created by Preact — never adopted after the fact — so
 * component state survives re-renders, removed content unmounts (cleanups
 * run), and the tree/DOM correspondence is maintained by construction.
 *
 * The splice rebuilds the tree by cloning ONLY the path from the root to the
 * insertion point, sharing every other vnode object by reference. Preact's
 * same-vnode-object bailout (`_original` equality) skips the diff for shared
 * subtrees, so the cost is O(depth + siblings), not O(island).
 */

type Position = 'append' | 'prepend' | 'before' | 'after' | 'inner' | 'outer';

// Preact internal property accessors. The source uses `_dom`/`_children`; the
// dist build mangles them to `__e`/`__k`. Read both so this works with either.
const vdomDom = ( vnode: any ): Node | null =>
	vnode?._dom ?? vnode?.__e ?? null;
const vdomChildren = ( vnode: any ): any[] =>
	vnode?._children ?? vnode?.__k ?? [];

// A rendered container (fragment) stores its tree as a single Fragment vnode
// on the same property names — NOT as an array.
const getFragmentRoot = ( fragment: any ): any =>
	fragment?._children ?? fragment?.__k ?? null;

/**
 * Returns the island whose TREE owns the given element's subtree — the
 * OUTERMOST `data-wp-interactive` boundary. Nested islands are part of the
 * outer island's tree (the outer island's `toVdom` walk descends into them
 * and claims them via `hydratedIslands`), so any dynamic content spliced in
 * must go through the outermost tree. Returns `null` if there is no island
 * at all.
 *
 * @param element The element to locate.
 * @return The outermost island element, or `null`.
 */
const getTreeIsland = ( element: Element ): Element | null => {
	let island: Element | null = element.hasAttribute( 'data-wp-interactive' )
		? element
		: element.closest( '[data-wp-interactive]' );
	while ( island ) {
		const outer =
			island.parentElement?.closest( '[data-wp-interactive]' ) ?? null;
		if ( ! outer ) {
			return island;
		}
		island = outer;
	}
	return null;
};

/**
 * Returns the NEAREST `data-wp-interactive` boundary (the element itself if
 * it is one, otherwise the closest ancestor) — the namespace that content
 * spliced at the element's position inherits (matching how the tree's walk
 * pushes the nested island's namespace when it descends into it). Returns
 * `null` if there is no island at all.
 *
 * @param element The element to locate.
 * @return The nearest island boundary element, or `null`.
 */
const getNearestIsland = ( element: Element ): Element | null => {
	if ( element.hasAttribute( 'data-wp-interactive' ) ) {
		return element;
	}
	return element.closest( '[data-wp-interactive]' );
};

/**
 * Parses an island's `data-wp-interactive` value into its namespace, using
 * the same rules as `vdom.ts`: a plain string is used verbatim, a JSON object
 * contributes its `namespace` string property, anything else is `null`.
 *
 * @param island The island element.
 * @return The island's namespace, or `null`.
 */
const getIslandNamespace = ( island: Element ): string | null => {
	const value = island.getAttribute( 'data-wp-interactive' );
	if ( value === null ) {
		return null;
	}
	let parsed: any = value;
	try {
		const json = JSON.parse( value );
		if ( json && typeof json === 'object' && ! Array.isArray( json ) ) {
			parsed = json;
		}
	} catch {}
	if ( typeof parsed === 'string' ) {
		return parsed;
	}
	if ( typeof parsed?.namespace === 'string' ) {
		return parsed.namespace;
	}
	return null;
};

/**
 * Depth-first search for the element vnode (`type` is a string tag) whose DOM
 * node is `target`. Returns the path of vnodes from the root to it
 * (inclusive), or `null` if not found.
 *
 * @param vnode  The vnode to search from.
 * @param target The DOM element to locate.
 * @return The path of vnodes, or `null`.
 */
const findPath = ( vnode: any, target: Element ): any[] | null => {
	if ( typeof vnode?.type === 'string' && vdomDom( vnode ) === target ) {
		return [ vnode ];
	}
	for ( const child of vdomChildren( vnode ) ) {
		if ( ! child || typeof child !== 'object' ) {
			continue;
		}
		const path = findPath( child, target );
		if ( path ) {
			return [ vnode, ...path ];
		}
	}
	return null;
};

/**
 * Rebuilds a vnode on the path to the insertion point.
 *
 * - String (element) vnodes: recreated with the new children array.
 * - `Directives` wrappers: recreated with the rebuilt element as their
 *   `element` prop — re-running the component re-wraps it in the directive /
 *   Provider chain, so the change propagates through the whole chain.
 * - Other components: rebuilt with `children` (best effort — only
 *   transparent pass-through wrappers like `Provider` are expected).
 *
 * @param pathNode     The vnode to rebuild.
 * @param child        The rebuilt vnode occupying this node's child slot.
 * @param childVNode   The ORIGINAL vnode at that slot (to locate its index in
 *                     the parent's children array — siblings must survive).
 * @param chainElement The rebuild of the deepest string vnode in this node's
 *                     rendered chain (the `element` prop for Directives).
 * @return The rebuilt vnode.
 */
const rebuildPathNode = (
	pathNode: any,
	child: any,
	childVNode: any,
	chainElement: any
): any => {
	if ( typeof pathNode.type === 'string' ) {
		const oldChildren = vdomChildren( pathNode );
		const idx = oldChildren.indexOf( childVNode );
		const newChildren = [ ...oldChildren ];
		if ( idx !== -1 ) {
			// Replace only the child slot occupied by the rebuilt vnode —
			// the node's siblings must survive the rebuild.
			newChildren[ idx ] = child;
		} else {
			// Should not happen (the path child is always a rendered child);
			// fall back to appending.
			newChildren.push( child );
		}
		return h( pathNode.type, { ...pathNode.props, children: newChildren } );
	}
	if ( pathNode.type === Directives ) {
		return h( Directives, { ...pathNode.props, element: chainElement } );
	}
	return h( pathNode.type, { ...pathNode.props, children: [ child ] } );
};

/**
 * Locates (and if needed hydrates) the island tree, then splices the new
 * vnodes into it at the position described by `position` relative to
 * `container`, and renders the rebuilt tree.
 *
 * @param island    The island whose tree receives the splice.
 * @param container The element the position is relative to.
 * @param position  Insert position.
 * @param newVdoms  The vnodes to insert.
 * @param atIndex   For `position: 'at'` — the child index to insert at
 *                  (used by `hydrateInsertedElement`).
 */
const spliceIntoTree = (
	island: Element,
	container: Element,
	position: Position | 'at',
	newVdoms: ComponentChild[],
	atIndex?: number
): void => {
	const fragment = getRegionRootFragment( [ island ] ) as any;
	let root = getFragmentRoot( fragment );
	if ( ! root ) {
		// The island has no tree yet (not hydrated): adopt the existing DOM —
		// the only sanctioned adoption path, a fragment's first render.
		hydrate( toVdom( island ) as VNode, fragment as ContainerNode );
		root = getFragmentRoot( fragment );
	}
	if ( ! root ) {
		warn(
			'renderHTML(): the island tree could not be found. Is the island hydrated?'
		);
		return;
	}

	// The fragment's root is Preact's artificial Fragment wrapper (created by
	// `render()`/`hydrate()`); the island's vnode is its only child. Search
	// from the island vnode so the path is [island, ..., container] — never
	// includes the wrapper (a rebuilt wrapper would nest a Fragment that
	// cannot type-match the island element, remounting the whole tree).
	const treeRoot = vdomChildren( root )[ 0 ] ?? root;
	const path = findPath( treeRoot, container );
	if ( ! path || path.length === 0 ) {
		warn(
			'renderHTML(): the container could not be located in the island tree. Is it inside a router region, a data-wp-each list, a data-wp-ignore subtree, or a template?'
		);
		return;
	}

	let current: any;
	let chainElement: any;
	let startIdx: number;

	if (
		position === 'inner' ||
		position === 'append' ||
		position === 'prepend' ||
		position === 'at'
	) {
		// Splice into the container's own children. `at` inserts at a specific
		// index (used by `hydrateInsertedElement` to replace a raw node at its
		// exact position within its parent).
		const target = path[ path.length - 1 ];
		const oldChildren = vdomChildren( target );
		let newChildren: ComponentChild[];
		if ( position === 'inner' ) {
			newChildren = newVdoms;
		} else if ( position === 'append' ) {
			newChildren = [ ...oldChildren, ...newVdoms ];
		} else if ( position === 'prepend' ) {
			newChildren = [ ...newVdoms, ...oldChildren ];
		} else {
			// 'at'
			const idx = atIndex ?? oldChildren.length;
			newChildren = [
				...oldChildren.slice( 0, idx ),
				...newVdoms,
				...oldChildren.slice( idx ),
			];
		}
		startIdx = path.length - 2;
		current = h( target.type, { ...target.props, children: newChildren } );
		chainElement = current;
	} else {
		// before / after / outer / at: splice into the container's parent's
		// children, next to the container's rendered chain root. Climb past
		// component wrappers (Directives/Provider) — a directive-wrapped
		// element is rendered alone by its chain, so its siblings live at the
		// chain root's position.
		let i = path.length - 1;
		while ( i > 0 && typeof path[ i - 1 ].type === 'function' ) {
			i -= 1;
		}
		const anchor = path[ i ];
		const parent = path[ i - 1 ];
		if ( ! parent || typeof parent.type !== 'string' ) {
			// The container is the tree root: only `outer` is supported.
			if ( position === 'outer' ) {
				const newRoot =
					newVdoms.length === 1
						? newVdoms[ 0 ]
						: h( Fragment, null, newVdoms );
				render( newRoot as VNode, fragment as ContainerNode );
				return;
			}
			warn( 'renderHTML(): cannot insert before/after the island root.' );
			return;
		}

		const parentChildren = vdomChildren( parent );
		const idx = parentChildren.indexOf( anchor );
		if ( idx === -1 ) {
			warn(
				'renderHTML(): could not locate the container among its siblings.'
			);
			return;
		}
		let newChildren: ComponentChild[];
		if ( position === 'before' ) {
			newChildren = [
				...parentChildren.slice( 0, idx ),
				...newVdoms,
				...parentChildren.slice( idx ),
			];
		} else if ( position === 'after' ) {
			newChildren = [
				...parentChildren.slice( 0, idx + 1 ),
				...newVdoms,
				...parentChildren.slice( idx + 1 ),
			];
		} else {
			// outer: replace the anchor.
			newChildren = [
				...parentChildren.slice( 0, idx ),
				...newVdoms,
				...parentChildren.slice( idx + 1 ),
			];
		}
		startIdx = i - 2;
		current = h( parent.type, { ...parent.props, children: newChildren } );
		chainElement = current;
	}

	// Rebuild the path from the insertion point up to the root.
	for ( let i = startIdx; i >= 0; i-- ) {
		current = rebuildPathNode(
			path[ i ],
			current,
			path[ i + 1 ],
			chainElement
		);
		if ( typeof path[ i ].type === 'string' ) {
			chainElement = current;
		}
	}
	render( current, fragment as ContainerNode );
};

/**
 * Renders an HTML string into the live DOM, processing all Interactivity API
 * directives on it. The markup is commonly server-rendered — e.g. a fragment
 * fetched from a REST endpoint.
 *
 * The HTML is parsed DETACHED and spliced into the container's island tree,
 * so Preact creates the elements itself: the tree stays the single source of
 * truth, component state is preserved across re-renders, and content removed
 * by a later `inner`/`outer` replacement unmounts cleanly (listeners cleaned
 * up).
 *
 * ```js
 * import { renderHTML } from '@wordpress/interactivity';
 *
 * const res = await fetch( '/wp-json/my-plugin/v1/cards' );
 * renderHTML( '#feed', await res.text() ); // or: renderHTML( document.querySelector( '#feed' ), ... )
 * ```
 *
 * The container can be passed as an element or as a CSS selector (a selector
 * matching nothing throws). The container must be inside an island
 * (`[data-wp-interactive]`) or have its own `data-wp-interactive` attribute;
 * otherwise nothing is hydrated and a warning is emitted.
 *
 * Unsupported targets (warn + no-op): content inside a router region (its
 * subtree is owned by the router's signal), `data-wp-ignore` subtrees,
 * `data-wp-each-child` content, and `<template>` elements.
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
		position?: Position;
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

	const island = getTreeIsland( containerElement );
	if ( ! island ) {
		warn(
			'renderHTML(): no interactive island found for the container. The container must be inside a [data-wp-interactive] subtree or have its own data-wp-interactive attribute.'
		);
		return;
	}

	// Use a `<template>` to parse the HTML into nodes (same as the browser
	// would) without triggering side effects like image loading. Use
	// `childNodes` (not `children`) so text nodes in mixed content are
	// preserved instead of silently dropped.
	const template = document.createElement( 'template' );
	template.innerHTML = html;
	const nodes = Array.from( template.content.childNodes ) as Array<
		Element | Text
	>;
	if ( ! nodes.length ) {
		return;
	}

	// Build the vdom DETACHED, inheriting the NEAREST island's namespace so
	// directives on the new content resolve against the right store (a
	// container inside a nested island resolves the nested namespace, even
	// though the content is spliced into the OUTER island's tree).
	const namespaceIsland = getNearestIsland( containerElement ) ?? island;
	const namespace = getIslandNamespace( namespaceIsland );
	const vdoms = nodes.map( ( node ) => toVdom( node, namespace ) );

	spliceIntoTree( island, containerElement, position, vdoms );
}

/**
 * Renders HTML elements that have been inserted into the live DOM outside of
 * Preact (e.g. raw HTML added by a plugin), processing all Interactivity API
 * directives on them.
 *
 * INTERNAL — not part of the public API. This is the mechanism the
 * MutationObserver will use to route raw DOM insertions through Preact.
 *
 * The element's markup is re-created through the island tree at the element's
 * position (cut-and-reinsert): the tree stays the single source of truth, and
 * the raw element is removed. As a consequence the element IDENTITY is not
 * preserved — code holding a reference to the raw node (or listeners attached
 * directly to it) will see it replaced. Prefer `renderHTML( container, html )`
 * for new code.
 *
 * @param element Element (or elements) to render.
 */
export function hydrateInsertedElement(
	element: Element | Text | Array< Element | Text >
): void {
	const nodes = Array.isArray( element ) ? element : [ element ];
	if ( ! nodes.length ) {
		return;
	}
	for ( const node of nodes ) {
		if ( ! node.parentNode || ! node.isConnected ) {
			throw new Error(
				'hydrateInsertedElement(): the element must be attached to the DOM first.'
			);
		}
		const parent = node.parentElement;
		if ( ! parent ) {
			continue; // Text node with no element parent — nothing to splice into.
		}
		const island = getTreeIsland( node instanceof Element ? node : parent );
		if ( ! island ) {
			warn(
				'hydrateInsertedElement(): no interactive island found for the inserted element. The element must be inside a [data-wp-interactive] subtree or have its own data-wp-interactive attribute.'
			);
			continue;
		}

		/*
		 * The node IS the island (its own `data-wp-interactive` with no
		 * ancestor island): there is no parent vnode to splice into — the node
		 * is the tree root. Ensure the island's tree exists (adopting the
		 * existing DOM via the sanctioned first-render hydrate path) and leave
		 * the node in place. The node is never removed in this case.
		 */
		if ( node instanceof Element && island === node ) {
			const fragment = getRegionRootFragment( [ island ] ) as any;
			if ( ! getFragmentRoot( fragment ) ) {
				hydrate( toVdom( island ) as VNode, fragment as ContainerNode );
			}
			continue;
		}

		// Parse the element's own markup and splice it at its DOM position.
		const template = document.createElement( 'template' );
		template.innerHTML =
			node instanceof Element ? node.outerHTML : node.textContent ?? '';
		const parsedNodes = Array.from( template.content.childNodes ) as Array<
			Element | Text
		>;
		if ( ! parsedNodes.length ) {
			continue;
		}
		const namespaceIsland = getNearestIsland(
			node instanceof Element ? node : parent
		);
		const namespace = getIslandNamespace( namespaceIsland ?? island );
		const vdoms = parsedNodes.map( ( n ) => toVdom( n, namespace ) );
		const index = Array.from( parent.childNodes ).indexOf( node );
		spliceIntoTree( island, parent, 'at', vdoms, index );
		node.remove();
	}
}
