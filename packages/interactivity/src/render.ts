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
import { Directives, elementToVnode, isDefaultDirectiveSuffix } from './hooks';
import { getRegionRootFragment } from './hydration';
import { routerRegions } from './directives/router-region';
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

type Mode = 'append' | 'prepend' | 'before' | 'after' | 'inner' | 'replace';

// Preact internal property accessors. Preact's published builds mangle vnode
// internals (see preact's `mangle.json`): `_children` → `__k`, `_parent` → `__`.
// The mangled names are what exist at runtime — the source names (`_children`,
// `_parent`, `_dom`) appear only in preact's `src/` code and are noted here
// for reference when reading it.
const vdomChildren = ( vnode: any ): any[] => vnode?.__k ?? [];
const vdomParent = ( vnode: any ): any => vnode?.__ ?? null;

// A rendered container (fragment) stores its tree as a single Fragment vnode
// on the same property names — NOT as an array.
const getFragmentRoot = ( fragment: any ): any => fragment?.__k ?? null;

// The attribute that marks an interactive island boundary.
const islandAttribute = 'data-wp-interactive';
const islandSelector = `[${ islandAttribute }]`;

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
	let island = element.closest( islandSelector );
	while ( island ) {
		// Search ABOVE the island: `closest()` includes the element it
		// starts at, so starting from the parent finds the nearest island
		// strictly outside this one.
		const outer = island.parentElement?.closest( islandSelector ) ?? null;
		if ( ! outer ) {
			return island;
		}
		island = outer;
	}
	return null;
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
	const value = island.getAttribute( islandAttribute );
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
 * Locates the container's vnode via the element→vnode map (O(1) — populated
 * by the `options.diffed` hook in `hooks.tsx`) and walks up each vnode's
 * `_parent` pointer to the tree root, collecting the path of vnodes from the
 * root to the container (inclusive). The cost is O(depth), independent of
 * the island's size.
 *
 * No per-step connectivity check is needed: every splice rebuilds the tree
 * root as a NEW vnode object, so a stale map entry (an element removed by a
 * previous splice and re-inserted) still chains to an old root object and is
 * rejected by the final `vnode !== root` comparison. A vnode that IS in the
 * current tree always chains to the current root, and the chain terminates
 * (the topmost vnode's `_parent` is null), so the walk cannot loop.
 *
 * @param root   The tree root vnode (the island vnode).
 * @param target The container element.
 * @return The path of vnodes from the root to the container, or `null`.
 */
const getPathTo = ( root: any, target: Element ): any[] | null => {
	let vnode = elementToVnode.get( target );
	if ( ! vnode ) {
		return null;
	}
	const reversed: any[] = [];
	while ( vnode && vnode !== root ) {
		reversed.push( vnode );
		vnode = vdomParent( vnode );
	}
	if ( vnode !== root ) {
		return null;
	}
	reversed.push( root );
	return reversed.reverse();
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
 * Mirrors a spliced region element into its router signal (write-through).
 *
 * When a splice rebuilds the path through a region's `router-region`
 * `Directives` level, that wrapper re-renders during the splice's own
 * `render()` and re-reads `routerRegions` — if the signal still holds the
 * PRE-splice vnode, the new content is reverted (a silent no-op). Writing
 * the rebuilt region content into the signal before the render makes the
 * splice stick; the signal then mirrors the tree (§6).
 *
 * Only NAVIGATED regions are written (signal holds a vnode). SSR regions
 * (signal `undefined`) render the tree's children directly and need no
 * mirror; hidden regions (`null`) have no content to splice into.
 *
 * @param wrapper     The rebuilt `Directives` wrapper whose CURRENT priority
 *                    level is the `router-region` directive.
 * @param regionVnode The rebuilt content the wrapper renders — the chain
 *                    below the wrapper (its `element` chain), which is the
 *                    same shape `cloneRouterRegionContent` produces.
 */
const writeRegionSignal = ( wrapper: any, regionVnode: any ): void => {
	const entries: any[] = wrapper.props?.directives?.[ 'router-region' ];
	const entry = entries?.find( isDefaultDirectiveSuffix );
	if ( ! entry || entry.uniqueId ) {
		return;
	}
	const regionId =
		typeof entry.value === 'string'
			? entry.value
			: ( entry.value as any )?.id;
	if ( ! regionId ) {
		return;
	}
	const signal = routerRegions.get( regionId );
	if ( signal && signal.value ) {
		signal.value = regionVnode;
	}
};

/**
 * Locates (and if needed hydrates) the island tree, then splices the new
 * vnodes into it at the mode described by `mode` relative to
 * `container`, and renders the rebuilt tree.
 *
 * @param island    The island whose tree receives the splice.
 * @param container The element the mode is relative to.
 * @param mode  Insert mode.
 * @param newVdoms  The vnodes to insert.
 * @param atIndex   For `mode: 'at'` — the child index to insert at.
 */
const spliceIntoTree = (
	island: Element,
	container: Element,
	mode: Mode | 'at',
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
	// `render()`/`hydrate()`); the island's vnode is its only child. Locate
	// the container through the element→vnode map and the `_parent` pointers
	// so the path is [island, ..., container] — never includes the wrapper (a
	// rebuilt wrapper would nest a Fragment that cannot type-match the island
	// element, remounting the whole tree).
	const treeRoot = vdomChildren( root )[ 0 ] ?? root;
	const path = getPathTo( treeRoot, container );
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
		mode === 'inner' ||
		mode === 'append' ||
		mode === 'prepend' ||
		mode === 'at'
	) {
		// Splice into the container's own children. `at` inserts at a specific
		// child index (used by the future MutationObserver's cut-and-reinsert,
		// §7).
		const target = path[ path.length - 1 ];
		const oldChildren = vdomChildren( target );
		let newChildren: ComponentChild[];
		if ( mode === 'inner' ) {
			newChildren = newVdoms;
		} else if ( mode === 'append' ) {
			newChildren = [ ...oldChildren, ...newVdoms ];
		} else if ( mode === 'prepend' ) {
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
			// The container is the tree root: only `replace` is supported.
			if ( mode === 'replace' ) {
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
		if ( mode === 'before' ) {
			newChildren = [
				...parentChildren.slice( 0, idx ),
				...newVdoms,
				...parentChildren.slice( idx ),
			];
		} else if ( mode === 'after' ) {
			newChildren = [
				...parentChildren.slice( 0, idx + 1 ),
				...newVdoms,
				...parentChildren.slice( idx + 1 ),
			];
		} else {
			// replace: replace the anchor.
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

	// Rebuild the path from the insertion point up to the root. When the
	// rebuild passes a region's `router-region` Directives level, mirror the
	// rebuilt region content into the region's signal BEFORE the render
	// below — otherwise the wrapper's re-render re-reads the stale signal
	// and reverts the splice (§6).
	for ( let i = startIdx; i >= 0; i-- ) {
		if (
			path[ i ].type === Directives &&
			path[ i ].props?.priorityLevels?.[ 0 ]?.includes( 'router-region' )
		) {
			writeRegionSignal( path[ i ], current );
		}
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
 * Unsupported targets (warn + no-op): `data-wp-ignore` subtrees,
 * `data-wp-each-child` content, and `<template>` elements. (Router regions
 * ARE supported — the region signal is written through from the spliced
 * tree, §6.)
 *
 * @param container    The element the parsed HTML is inserted into, or a CSS
 *                     selector for it (resolved via `document.querySelector`).
 * @param html         The HTML string.
 * @param options      Options.
 * @param options.mode Where to insert the parsed elements:
 *                     - `append`: as the container's last children (default)
 *                     - `prepend`: as the container's first children
 *                     - `before`: as siblings immediately before the container
 *                     - `after`: as siblings immediately after the container
 *                     - `inner`: replace the container's children
 *                     - `replace`: replace the container itself (the
 *                     datastar `outer` analog is a morph; ours is a hard
 *                     replace, so `outer` would mislead)
 */
export function renderHTML(
	container: Element | string,
	html: string,
	{
		mode = 'append',
	}: {
		mode?: Mode;
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
	// `getTreeIsland` starts with the same closest() call, so after the
	// island check above the nearest island is guaranteed to exist.
	const namespaceIsland = containerElement.closest( islandSelector )!;
	const namespace = getIslandNamespace( namespaceIsland );
	const vdoms = nodes.map( ( node ) => toVdom( node, namespace ) );

	spliceIntoTree( island, containerElement, mode, vdoms );
}
