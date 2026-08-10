// eslint-disable-next-line no-warning-comments
/**
 * @jest-environment jsdom
 */

/**
 * Tree-first renderHTML outcome tests.
 *
 * These assert BEHAVIOR ONLY — the "what must be true" spec that any correct
 * implementation must satisfy. Mechanism tests (per-node fragments, stale
 * trees, overlapping sets) are intentionally NOT ported from the previous
 * iteration: they test failure modes that cannot occur in tree-first.
 */

import { store } from '../store';
import { getContext } from '../scopes';

/**
 * Internal dependencies
 */
import '../directives'; // Registers all the core directives.
import { renderHTML } from '../render';
import { elementToVnode } from '../hooks';
import { hydrateRegions } from '../hydration';

const NS = 'test/tree-first';

const { state } = store( NS, {
	state: {
		text: 'initial',
		count: 0,
		items: [ 'x', 'y' ],
		initCounts: {} as Record< string, number >,
	},
	actions: {
		inc() {
			state.count += 1;
		},
		set7() {
			state.count = 7;
		},
		bump() {
			getContext< { n: number } >().n += 1;
		},
		watchText() {
			state.count = state.text.length;
		},
		// Counts how many times each item's data-wp-init ran, keyed by the
		// item's context id. Init must run exactly once per mounted item.
		initItem() {
			const { id } = getContext< { id: string } >();
			state.initCounts[ id ] = ( state.initCounts[ id ] ?? 0 ) + 1;
		},
	},
} );

// Drains preact's effect queue (useInit/useEffect) reliably: a macrotask
// plus two animation frames.
const flush = async () => {
	await new Promise( ( r ) => setTimeout( r, 0 ) );
	await new Promise( ( r ) => requestAnimationFrame( r ) );
	await new Promise( ( r ) => requestAnimationFrame( r ) );
};

const setup = async ( islandHtml: string ) => {
	document.body.innerHTML = `
		<div data-wp-interactive="${ NS }">
			${ islandHtml }
		</div>
	`;
	state.count = 0;
	state.initCounts = {};
	await hydrateRegions();
};

/* eslint-disable @wordpress/wp-global-usage */
const testGlobalThis = globalThis as typeof globalThis & {
	IS_GUTENBERG_PLUGIN?: boolean;
};
let originalIsGutenbergPlugin: boolean | undefined;

( globalThis as { SCRIPT_DEBUG?: boolean } ).SCRIPT_DEBUG = false;

beforeEach( () => {
	document.body.innerHTML = '';
	originalIsGutenbergPlugin = testGlobalThis.IS_GUTENBERG_PLUGIN;
	testGlobalThis.IS_GUTENBERG_PLUGIN = false;
} );

afterEach( () => {
	testGlobalThis.IS_GUTENBERG_PLUGIN = originalIsGutenbergPlugin;
} );
/* eslint-enable @wordpress/wp-global-usage */

describe( 'renderHTML (tree-first)', () => {
	it( 'parses HTML, renders it into the container, and hydrates directives', async () => {
		await setup( '<div data-testid="feed"></div>' );
		renderHTML(
			document.querySelector( '[data-testid="feed"]' ),
			'<button data-testid="btn" data-wp-on--click="actions.inc">0</button>'
		);
		await flush();

		const btn = document.querySelector(
			'[data-testid="btn"]'
		) as HTMLButtonElement;
		expect( btn ).not.toBeNull();
		btn.click();
		expect( state.count ).toBe( 1 );
	} );

	it( 'appends by default', async () => {
		await setup( '<div data-testid="feed"><p>a</p></div>' );
		renderHTML(
			document.querySelector( '[data-testid="feed"]' ),
			'<p>b</p>'
		);
		await flush();
		const feed = document.querySelector( '[data-testid="feed"]' );
		expect( feed?.children.length ).toBe( 2 );
		expect( feed?.children[ 1 ]?.textContent ).toBe( 'b' );
	} );

	it( 'prepends when mode is "prepend"', async () => {
		await setup( '<div data-testid="feed"><p>a</p></div>' );
		renderHTML(
			document.querySelector( '[data-testid="feed"]' ),
			'<p>b</p>',
			{ mode: 'prepend' }
		);
		await flush();
		const feed = document.querySelector( '[data-testid="feed"]' );
		expect( feed?.children[ 0 ]?.textContent ).toBe( 'b' );
		expect( feed?.children[ 1 ]?.textContent ).toBe( 'a' );
	} );

	it( 'replaces children when mode is "inner"', async () => {
		await setup( '<div data-testid="feed"><p>a</p></div>' );
		renderHTML(
			document.querySelector( '[data-testid="feed"]' ),
			'<p>b</p>',
			{ mode: 'inner' }
		);
		await flush();
		const feed = document.querySelector( '[data-testid="feed"]' );
		expect( feed?.children.length ).toBe( 1 );
		expect( feed?.children[ 0 ]?.textContent ).toBe( 'b' );
	} );

	it( 'inserts before the container when mode is "before"', async () => {
		await setup(
			'<div data-testid="target"></div><p data-testid="after">after</p>'
		);
		renderHTML(
			document.querySelector( '[data-testid="target"]' ),
			'<p>before</p>',
			{ mode: 'before' }
		);
		await flush();
		const before = document.querySelector(
			'[data-testid="target"]'
		)!.previousElementSibling;
		expect( before?.textContent ).toBe( 'before' );
		expect(
			document.querySelector( '[data-testid="after"]' )
		).not.toBeNull();
	} );

	it( 'inserts after the container when mode is "after"', async () => {
		await setup(
			'<p data-testid="before">before</p><div data-testid="target"></div>'
		);
		renderHTML(
			document.querySelector( '[data-testid="target"]' ),
			'<p>after</p>',
			{ mode: 'after' }
		);
		await flush();
		const after = document.querySelector(
			'[data-testid="target"]'
		)!.nextElementSibling;
		expect( after?.textContent ).toBe( 'after' );
		expect(
			document.querySelector( '[data-testid="before"]' )
		).not.toBeNull();
	} );

	it( 'replaces the container itself when mode is "replace"', async () => {
		await setup(
			'<div data-testid="wrap"><div data-testid="target">old</div></div>'
		);
		renderHTML(
			document.querySelector( '[data-testid="target"]' ),
			'<p>new</p>',
			{ mode: 'replace' }
		);
		await flush();
		expect( document.querySelector( '[data-testid="target"]' ) ).toBeNull();
		const wrap = document.querySelector( '[data-testid="wrap"]' );
		expect( wrap?.children.length ).toBe( 1 );
		expect( wrap?.children[ 0 ]?.textContent ).toBe( 'new' );
	} );

	it( 'accepts a CSS selector for the container', async () => {
		await setup( '<div id="feed"></div>' );
		renderHTML( '#feed', '<p>hi</p>' );
		await flush();
		expect( document.querySelector( '#feed' )?.children.length ).toBe( 1 );
	} );

	it( 'throws when a selector matches no element', async () => {
		await setup( '<div></div>' );
		expect( () => renderHTML( '#nope', '<p>hi</p>' ) ).toThrow();
	} );

	it( 'inserts and hydrates multiple top-level sibling elements', async () => {
		await setup( '<div data-testid="feed"></div>' );
		renderHTML(
			document.querySelector( '[data-testid="feed"]' ),
			'<p>a</p><p>b</p>'
		);
		await flush();
		const feed = document.querySelector( '[data-testid="feed"]' );
		expect( feed?.children.length ).toBe( 2 );
	} );

	it( 'warns and does nothing when there is no island', async () => {
		// eslint-disable-next-line @wordpress/wp-global-usage
		( globalThis as { SCRIPT_DEBUG?: boolean } ).SCRIPT_DEBUG = true;
		document.body.innerHTML = '<div data-testid="feed"></div>';
		const warnSpy = jest
			.spyOn( console, 'warn' )
			.mockImplementation( () => {} );
		renderHTML(
			document.querySelector( '[data-testid="feed"]' ),
			'<p>hi</p>'
		);
		expect( warnSpy ).toHaveBeenCalled();
		warnSpy.mockRestore();
	} );

	it( 'renders into a container with its own data-wp-interactive (new island)', async () => {
		document.body.innerHTML = `
			<div data-wp-interactive="${ NS }" data-testid="widget"></div>
		`;
		state.count = 0;
		await hydrateRegions();
		renderHTML(
			document.querySelector( '[data-testid="widget"]' ),
			'<button data-testid="wbtn" data-wp-on--click="actions.inc">0</button>'
		);
		await flush();
		(
			document.querySelector(
				'[data-testid="wbtn"]'
			) as HTMLButtonElement
		 ).click();
		expect( state.count ).toBe( 1 );
	} );

	it( 'hydrates a plain fragment inside an existing island, inheriting its namespace and context', async () => {
		await setup(
			'<div data-testid="feed" data-wp-context=\'{ "n": 42 }\'></div>'
		);
		renderHTML(
			document.querySelector( '[data-testid="feed"]' ),
			'<span data-testid="ctx" data-wp-text="context.n"></span>'
		);
		await flush();
		expect(
			document.querySelector( '[data-testid="ctx"]' )?.textContent
		).toBe( '42' );
	} );

	it( 'lets inserted content write through to the island context, and the island reacts', async () => {
		await setup(
			'<div data-wp-context=\'{ "n": 1 }\'>' +
				'<div data-testid="feed"></div>' +
				'<span data-testid="display" data-wp-text="context.n"></span>' +
				'</div>'
		);
		renderHTML(
			document.querySelector( '[data-testid="feed"]' ),
			'<button data-testid="bump" data-wp-on--click="actions.bump">bump</button>'
		);
		await flush();
		(
			document.querySelector(
				'[data-testid="bump"]'
			) as HTMLButtonElement
		 ).click();
		await flush();
		expect(
			document.querySelector( '[data-testid="display"]' )?.textContent
		).toBe( '2' );
	} );

	it( 'preserves state across re-renders (no re-init, no duplicate listeners)', async () => {
		await setup( '<div data-testid="feed"></div>' );
		const html =
			'<button data-testid="counter" data-wp-text="state.count" data-wp-on--click="actions.inc">0</button>';
		renderHTML( document.querySelector( '[data-testid="feed"]' ), html );
		await flush();
		const counter = () =>
			document.querySelector(
				'[data-testid="counter"]'
			) as HTMLButtonElement;

		counter().click();
		counter().click();
		await flush();
		// @ts-expect-error jest-dom matcher is added by the test setup.
		expect( counter() ).toHaveTextContent( '2' );

		// Re-render the same container with the same markup: the button must
		// NOT be re-initialized (its component instance is matched by
		// position), so the listener fires exactly once per click.
		renderHTML( document.querySelector( '[data-testid="feed"]' ), html );
		await flush();
		counter().click();
		await flush();
		// @ts-expect-error jest-dom matcher is added by the test setup.
		expect( counter() ).toHaveTextContent( '3' );
	} );

	it( 'repeated appends do not duplicate nodes or leak listeners', async () => {
		await setup( '<div data-testid="feed"></div>' );
		renderHTML(
			document.querySelector( '[data-testid="feed"]' ),
			'<button data-testid="a" data-wp-on--click="actions.inc">a</button>'
		);
		await flush();
		renderHTML(
			document.querySelector( '[data-testid="feed"]' ),
			'<button data-testid="b" data-wp-on--click="actions.inc">b</button>'
		);
		await flush();
		const feed = document.querySelector( '[data-testid="feed"]' );
		expect( feed?.children.length ).toBe( 2 );
		expect( state.count ).toBe( 0 );
		( feed?.children[ 0 ] as HTMLButtonElement ).click();
		( feed?.children[ 1 ] as HTMLButtonElement ).click();
		expect( state.count ).toBe( 2 );
	} );

	it( 'cleans up listeners of removed content on inner replacement', async () => {
		await setup( '<div data-testid="feed"></div>' );
		renderHTML(
			document.querySelector( '[data-testid="feed"]' ),
			'<span data-testid="listener" data-wp-on-window--resize="actions.inc"></span>'
		);
		await flush();
		// Replace the container's children entirely.
		renderHTML(
			document.querySelector( '[data-testid="feed"]' ),
			'<p>new content</p>',
			{ mode: 'inner' }
		);
		await flush();
		expect(
			document.querySelector( '[data-testid="listener"]' )
		).toBeNull();
		window.dispatchEvent( new Event( 'resize' ) );
		expect( state.count ).toBe( 0 );
	} );

	it( 'keeps data-wp-ignore subtrees inert', async () => {
		// `data-wp-ignore` is deprecated (removal planned for 7.0), so its
		// deprecation warning firing here is EXPECTED — asserted below, not
		// accidental noise. SCRIPT_DEBUG gates the warning.
		// eslint-disable-next-line @wordpress/wp-global-usage
		( globalThis as { SCRIPT_DEBUG?: boolean } ).SCRIPT_DEBUG = true;
		const warnSpy = jest
			.spyOn( console, 'warn' )
			.mockImplementation( () => {} );
		await setup( '<div data-testid="feed"></div>' );
		renderHTML(
			document.querySelector( '[data-testid="feed"]' ),
			'<div data-wp-ignore><span data-testid="inner" data-wp-text="state.text">raw</span></div>'
		);
		await flush();
		expect(
			document.querySelector( '[data-testid="inner"]' )?.textContent
		).toBe( 'raw' );
		// The subtree is inert BECAUSE the directive ran — and the directive
		// is deprecated, so it must have warned.
		expect( warnSpy ).toHaveBeenCalledWith(
			expect.stringContaining(
				'The data-wp-ignore directive is deprecated'
			)
		);
		warnSpy.mockRestore();
		// eslint-disable-next-line @wordpress/wp-global-usage
		( globalThis as { SCRIPT_DEBUG?: boolean } ).SCRIPT_DEBUG = false;
	} );

	it( 'runs data-wp-init on inserted content', async () => {
		await setup( '<div data-testid="feed"></div>' );
		renderHTML(
			document.querySelector( '[data-testid="feed"]' ),
			'<span data-testid="inited" data-wp-init="actions.set7"></span>'
		);
		await flush();
		expect( state.count ).toBe( 7 );
	} );

	it( 'runs data-wp-watch on insertion and re-runs on state change', async () => {
		await setup( '<div data-testid="feed"></div>' );
		renderHTML(
			document.querySelector( '[data-testid="feed"]' ),
			'<span data-testid="watched" data-wp-watch="actions.watchText"></span>'
		);
		await flush();
		expect( state.count ).toBe( 7 );
		state.text = 'x';
		await flush();
		expect( state.count ).toBe( 1 );
	} );

	it( 'renders a data-wp-each list inside inserted content', async () => {
		await setup( '<div data-testid="feed"></div>' );
		renderHTML(
			document.querySelector( '[data-testid="feed"]' ),
			'<template data-wp-each="state.items"><li data-wp-text="context.item"></li></template>'
		);
		await flush();
		const feed = document.querySelector( '[data-testid="feed"]' );
		expect( feed?.querySelectorAll( 'li' ).length ).toBe( 2 );
		expect( feed?.querySelectorAll( 'li' )[ 1 ]?.textContent ).toBe( 'y' );
	} );

	it( 'scopes context writes to content with its own data-wp-context, leaving the island unaffected', async () => {
		await setup(
			'<div data-wp-context=\'{ "n": 1 }\'>' +
				'<div data-testid="feed"></div>' +
				'<span data-testid="display" data-wp-text="context.n"></span>' +
				'</div>'
		);
		renderHTML(
			document.querySelector( '[data-testid="feed"]' ),
			'<div data-wp-context=\'{ "n": 100 }\'>' +
				'<button data-testid="bump" data-wp-on--click="actions.bump">bump</button>' +
				'<span data-testid="local" data-wp-text="context.n"></span>' +
				'</div>'
		);
		await flush();
		expect(
			document.querySelector( '[data-testid="local"]' )?.textContent
		).toBe( '100' );
		(
			document.querySelector(
				'[data-testid="bump"]'
			) as HTMLButtonElement
		 ).click();
		await flush();
		expect(
			document.querySelector( '[data-testid="local"]' )?.textContent
		).toBe( '101' );
		// The island's context is unaffected.
		expect(
			document.querySelector( '[data-testid="display"]' )?.textContent
		).toBe( '1' );
	} );

	it( 'hydrates nested islands inside inserted content', async () => {
		await setup( '<div data-testid="feed"></div>' );
		store( 'test/tree-first-nested', {
			state: { n: 5 },
		} );
		renderHTML(
			document.querySelector( '[data-testid="feed"]' ),
			`<div data-wp-interactive="test/tree-first-nested">
				<span data-testid="nested" data-wp-text="state.n"></span>
			</div>`
		);
		await flush();
		expect(
			document.querySelector( '[data-testid="nested"]' )?.textContent
		).toBe( '5' );
	} );
} );

describe( 'nested islands (targeting a container inside one)', () => {
	it( 'does not create a second tree for the nested island (no re-init of its SSR content)', async () => {
		const { state: nestedState } = store( 'test/tree-first-nested-dup', {
			state: { count: 0, initCount: 0 },
			actions: {
				inc() {
					nestedState.count += 1;
				},
				initOnce() {
					nestedState.initCount += 1;
				},
			},
		} );
		document.body.innerHTML = `
			<div data-wp-interactive="test/tree-first-outer">
				<div data-wp-interactive="test/tree-first-nested-dup">
					<span data-testid="ssr-init" data-wp-init="actions.initOnce"></span>
					<div data-testid="container"></div>
				</div>
			</div>
		`;
		await hydrateRegions();
		await flush();

		// The nested island's SSR content initialized exactly once: the outer
		// island's tree descends into the nested island and owns it.
		expect( nestedState.initCount ).toBe( 1 );

		renderHTML(
			document.querySelector( '[data-testid="container"]' ),
			'<button data-testid="nested-btn" data-wp-on--click="actions.inc">inc</button>'
		);
		await flush();

		// RED pre-fix: spliceIntoTree uses the NEAREST island (the nested one)
		// as the tree owner, creating a SECOND fragment and hydrating the
		// nested island again — re-running its data-wp-init.
		expect( nestedState.initCount ).toBe( 1 );

		// The inserted button is interactive.
		(
			document.querySelector(
				'[data-testid="nested-btn"]'
			) as HTMLButtonElement
		 ).click();
		expect( nestedState.count ).toBe( 1 );
	} );

	it( 'content inside a nested island resolves the nested namespace', async () => {
		store( 'test/tree-first-nested-ns', {
			state: { label: 'nested' },
		} );
		document.body.innerHTML = `
			<div data-wp-interactive="test/tree-first-outer">
				<div data-wp-interactive="test/tree-first-nested-ns">
					<div data-testid="container"></div>
				</div>
			</div>
		`;
		await hydrateRegions();
		renderHTML(
			document.querySelector( '[data-testid="container"]' ),
			'<span data-testid="ns" data-wp-text="state.label"></span>'
		);
		await flush();
		expect(
			document.querySelector( '[data-testid="ns"]' )?.textContent
		).toBe( 'nested' );
	} );
} );

describe( 'text nodes in mixed content', () => {
	it( 'text nodes survive re-renders by identity; directive elements remount on inner', async () => {
		store( 'test/comp-C4', { state: { v: 'V', w: 'W' } } );
		document.body.innerHTML =
			'<div data-wp-interactive="test/comp-C4"><div data-testid="parent"></div></div>';
		await hydrateRegions();
		const parent = document.querySelector(
			'[data-testid="parent"]'
		) as HTMLElement;

		renderHTML(
			parent,
			'hello <span data-testid="s" data-wp-text="state.v"></span> world'
		);
		expect( parent.childNodes.length ).toBe( 3 );
		renderHTML(
			parent,
			'<span data-testid="t" data-wp-text="state.w"></span> tail'
		);
		expect( parent.childNodes.length ).toBe( 5 );
		const s = parent.childNodes[ 1 ];
		const t = parent.childNodes[ 3 ];
		expect( ( parent.childNodes[ 0 ] as Text ).nodeValue ).toBe( 'hello ' );
		expect( parent.childNodes[ 1 ] ).toBe( s );
		expect( ( parent.childNodes[ 2 ] as Text ).nodeValue ).toBe( ' world' );
		expect( parent.childNodes[ 3 ] ).toBe( t );
		expect( ( parent.childNodes[ 4 ] as Text ).nodeValue ).toBe( ' tail' );

		// Re-render the FIRST fragment (same HTML) via `inner`. Plain text
		// nodes are strings (no key) and still match positionally — they
		// survive BY IDENTITY (Preact reuses them), which is the invariant
		// that protects caret/selection in live text. The directive-bearing
		// span, however, gets a fresh SYNTHETIC key and mounts anew — the
		// documented "no reuse across a refresh" gap of the mechanism (see
		// the synthetic-keys describe block). The second fragment (t/tail)
		// is unmounted by the inner swap.
		const helloText = parent.childNodes[ 0 ];
		const worldText = parent.childNodes[ 2 ];

		renderHTML(
			parent,
			'hello <span data-testid="s" data-wp-text="state.v"></span> world',
			{ mode: 'inner' }
		);

		expect( parent.childNodes.length ).toBe( 3 );
		expect( parent.childNodes[ 0 ] ).toBe( helloText );
		expect( ( parent.childNodes[ 0 ] as Text ).nodeValue ).toBe( 'hello ' );
		expect( parent.childNodes[ 1 ] ).not.toBe( s );
		expect( parent.childNodes[ 1 ] as HTMLElement ).toHaveTextContent(
			'V'
		);
		expect( parent.childNodes[ 2 ] ).toBe( worldText );
		expect( ( parent.childNodes[ 2 ] as Text ).nodeValue ).toBe( ' world' );
	} );
} );

describe( 'element→vnode map', () => {
	const vdomParent = ( vnode: any ): any => vnode?.__ ?? null;
	const vdomDom = ( vnode: any ): Node | null => vnode?.__e ?? null;

	it( 'maps every rendered element to its vnode after initial hydration', async () => {
		await setup(
			'<div data-testid="a"><span data-testid="b"></span></div>'
		);
		expect(
			elementToVnode.get( document.querySelector( '[data-testid="a"]' ) )
		).toBeDefined();
		expect(
			elementToVnode.get( document.querySelector( '[data-testid="b"]' ) )
		).toBeDefined();
	} );

	it( 'maps elements spliced in by renderHTML', async () => {
		await setup( '<div data-testid="feed"></div>' );
		renderHTML( '[data-testid="feed"]', '<p data-testid="p">x</p>' );
		await flush();
		expect(
			elementToVnode.get( document.querySelector( '[data-testid="p"]' ) )
		).toBeDefined();
	} );

	it( 'walks the _parent chain from a spliced element through the Directives wrapper to the island vnode', async () => {
		await setup(
			'<div data-testid="feed" data-wp-context=\'{ "n": 42 }\'></div>'
		);
		renderHTML(
			'[data-testid="feed"]',
			'<span data-testid="ctx" data-wp-text="context.n"></span>'
		);
		await flush();
		const ctx = document.querySelector( '[data-testid="ctx"]' );
		// The spliced content is wrapped in a Directives chain (data-wp-text
		// is a directive) — the chain must climb through it to the island
		// vnode, whose DOM node is the island element.
		const island = document.querySelector( '[data-wp-interactive]' );
		let vnode: any = elementToVnode.get( ctx );
		let reachedIsland = false;
		for ( let i = 0; vnode && i < 10; i += 1 ) {
			if ( vdomDom( vnode ) === island ) {
				reachedIsland = true;
				break;
			}
			vnode = vdomParent( vnode );
		}
		expect( reachedIsland ).toBe( true );
	} );

	it( 'rejects a stale entry for an element removed by a splice and re-inserted raw', async () => {
		await setup(
			'<div data-testid="outer"><div data-testid="victim">v</div></div>'
		);
		const victim = document.querySelector( '[data-testid="victim"]' );
		renderHTML( '[data-testid="outer"]', '<p>new</p>', {
			mode: 'inner',
		} );
		await flush();
		const outer = document.querySelector( '[data-testid="outer"]' );
		expect( outer?.children.length ).toBe( 1 );
		expect( outer?.children[ 0 ]?.textContent ).toBe( 'new' );

		// Raw re-insertion of the removed element (unsupported territory, but
		// its map entry survives) — renderHTML must reject the stale vnode
		// instead of corrupting the tree.
		outer?.appendChild( victim as Node );
		// eslint-disable-next-line @wordpress/wp-global-usage
		( globalThis as { SCRIPT_DEBUG?: boolean } ).SCRIPT_DEBUG = true;
		const warnSpy = jest
			.spyOn( console, 'warn' )
			.mockImplementation( () => {} );
		renderHTML( victim as Element, '<p>x</p>' );
		expect( warnSpy ).toHaveBeenCalled();
		warnSpy.mockRestore();
		// eslint-disable-next-line @wordpress/wp-global-usage
		( globalThis as { SCRIPT_DEBUG?: boolean } ).SCRIPT_DEBUG = false;

		// The tree is still consistent: the failed splice left the DOM alone
		// and the island still accepts splices.
		expect( outer?.children[ 0 ]?.textContent ).toBe( 'new' );
		renderHTML( '[data-testid="outer"]', '<p>ok</p>' );
		await flush();
		expect( outer?.textContent ).toContain( 'ok' );
	} );
} );

// Every item carries a context id + data-wp-init that tallies into
// `state.initCounts`. A correct splice keeps each mounted item's identity
// (same element object, held refs still valid) and runs init exactly once.
const item = ( key: string, id: string, label: string ) =>
	`<div data-wp-key="${ key }" data-wp-context='{ "id": "${ id }" }' data-wp-init="actions.initItem">${ label }</div>`;
const unkeyedItem = ( id: string, label: string ) =>
	`<div data-wp-context='{ "id": "${ id }" }' data-wp-init="actions.initItem">${ label }</div>`;

describe( 'data-wp-key and list identity across modes', () => {
	// Preact reconciles a position by KEY when keys are present and by INDEX
	// when they are not. An unkeyed index-shifting splice (prepend/before/
	// after) therefore diffs each new vnode against the WRONG old vnode —
	// the footgun pinned by revision `oop`. renderHTML now gives every new
	// vnode without a user key a unique SYNTHETIC key (see spliceIntoTree),
	// so the unkeyed variants below assert the FIXED behavior: the new item
	// mounts fresh (its data-wp-init runs), and preact's skew re-aligns the
	// existing items to their old partners (element identity + init counts
	// preserved). The keyed variants remain the baseline; the synthetic-key
	// gaps (no reuse across a refresh, no dedup) are in the next describe
	// block.
	it( 'keyed prepend preserves element identity and init counts', async () => {
		await setup( `${ item( 'a', 'a', 'a' ) }${ item( 'b', 'b', 'b' ) }` );
		// `setup` wraps the markup directly in the island element, which is
		// therefore the list container.
		const feed = document.querySelector( '[data-wp-interactive]' )!;
		const aEl = feed.children[ 0 ];
		const bEl = feed.children[ 1 ];

		renderHTML( feed, item( 'new', 'new', 'new' ), { mode: 'prepend' } );
		await flush();

		expect( feed.children.length ).toBe( 3 );
		expect( feed!.children[ 0 ]?.textContent ).toBe( 'new' );
		expect( feed!.children[ 1 ] ).toBe( aEl );
		expect( feed!.children[ 2 ] ).toBe( bEl );
		expect( state.initCounts ).toEqual( { new: 1, a: 1, b: 1 } );
	} );

	it( 'unkeyed prepend gets a synthetic key: new item mounts fresh, existing items keep identity', async () => {
		await setup(
			`${ unkeyedItem( 'a', 'a' ) }${ unkeyedItem( 'b', 'b' ) }`
		);
		const feed = document.querySelector( '[data-wp-interactive]' )!;
		const aEl = feed.children[ 0 ];
		const bEl = feed.children[ 1 ];

		renderHTML( feed, unkeyedItem( 'new', 'new' ), { mode: 'prepend' } );
		await flush();

		// RED pre-mechanism: the new item was absorbed into `a`'s element
		// (held ref rendered 'new', init swallowed) and `b` re-initialized.
		expect( feed.children.length ).toBe( 3 );
		expect( feed.children[ 0 ]?.textContent ).toBe( 'new' );
		expect( feed.children[ 1 ] ).toBe( aEl );
		expect( feed.children[ 2 ] ).toBe( bEl );
		expect( state.initCounts ).toEqual( { new: 1, a: 1, b: 1 } );
	} );

	it( 'append is safe without keys', async () => {
		await setup(
			`${ unkeyedItem( 'a', 'a' ) }${ unkeyedItem( 'b', 'b' ) }`
		);
		const feed = document.querySelector( '[data-wp-interactive]' )!;
		const aEl = feed.children[ 0 ];
		const bEl = feed.children[ 1 ];

		renderHTML( feed, unkeyedItem( 'c', 'c' ) );
		await flush();

		// Appending shifts no existing index, so unchanged vnodes keep their
		// positions: preact bails out on the shared subtree and nothing
		// remounts or re-inits.
		expect( feed.children[ 0 ] ).toBe( aEl );
		expect( feed.children[ 1 ] ).toBe( bEl );
		expect( state.initCounts ).toEqual( { a: 1, b: 1, c: 1 } );
	} );

	it( 'keyed before/after around a middle item preserve identity', async () => {
		await setup(
			`${ item( 'a', 'a', 'a' ) }${ item( 'b', 'b', 'b' ) }${ item(
				'c',
				'c',
				'c'
			) }`
		);
		const feed = document.querySelector( '[data-wp-interactive]' )!;
		const aEl = feed.children[ 0 ];
		const bEl = feed.children[ 1 ];
		const cEl = feed.children[ 2 ];

		renderHTML( bEl, item( 'x', 'x', 'x' ), { mode: 'before' } );
		renderHTML( bEl, item( 'y', 'y', 'y' ), { mode: 'after' } );
		await flush();

		expect( [ ...feed.children ].map( ( c ) => c.textContent ) ).toEqual( [
			'a',
			'x',
			'b',
			'y',
			'c',
		] );
		expect( feed.children[ 0 ] ).toBe( aEl );
		expect( feed.children[ 2 ] ).toBe( bEl );
		expect( feed.children[ 4 ] ).toBe( cEl );
		expect( state.initCounts ).toEqual( {
			a: 1,
			b: 1,
			c: 1,
			x: 1,
			y: 1,
		} );
	} );

	it( 'unkeyed before gets a synthetic key: new item mounts fresh, existing items keep identity', async () => {
		await setup(
			`${ unkeyedItem( 'a', 'a' ) }${ unkeyedItem(
				'b',
				'b'
			) }${ unkeyedItem( 'c', 'c' ) }`
		);
		const feed = document.querySelector( '[data-wp-interactive]' )!;
		const aEl = feed.children[ 0 ];
		const bEl = feed.children[ 1 ];
		const cEl = feed.children[ 2 ];

		renderHTML( bEl, unkeyedItem( 'x', 'x' ), { mode: 'before' } );
		await flush();

		// RED pre-mechanism: `b`'s element absorbed 'x', `c` re-initialized.
		expect( [ ...feed.children ].map( ( c ) => c.textContent ) ).toEqual( [
			'a',
			'x',
			'b',
			'c',
		] );
		expect( feed.children[ 0 ] ).toBe( aEl );
		expect( feed.children[ 2 ] ).toBe( bEl );
		expect( feed.children[ 3 ] ).toBe( cEl );
		expect( state.initCounts ).toEqual( { a: 1, b: 1, c: 1, x: 1 } );
	} );

	it( 'keyed replace with a new key mounts the replacement fresh', async () => {
		await setup(
			`${ item( 'a', 'a', 'a' ) }${ item( 'b', 'b', 'b' ) }${ item(
				'c',
				'c',
				'c'
			) }`
		);
		// useInit effects flush after paint. If the splice ran before that
		// flush, the replaced item's pending hydration init would be dropped
		// with its unmount (preact discards deferred callbacks of unmounted
		// components). Flush first so the assertion documents the stable
		// semantics: every item init'd exactly once.
		await flush();
		const feed = document.querySelector( '[data-wp-interactive]' )!;
		const aEl = feed.children[ 0 ];
		const bEl = feed.children[ 1 ];
		const cEl = feed.children[ 2 ];

		renderHTML( bEl, item( 'b2', 'b2', 'b2' ), { mode: 'replace' } );
		await flush();

		expect( [ ...feed.children ].map( ( c ) => c.textContent ) ).toEqual( [
			'a',
			'b2',
			'c',
		] );
		expect( feed.children[ 1 ] ).not.toBe( bEl );
		expect( feed.children[ 0 ] ).toBe( aEl );
		expect( feed.children[ 2 ] ).toBe( cEl );
		expect( state.initCounts ).toEqual( { a: 1, b: 1, c: 1, b2: 1 } );
	} );

	it( 'unkeyed replace gets a synthetic key: replacement mounts fresh (init fires)', async () => {
		await setup(
			`${ unkeyedItem( 'a', 'a' ) }${ unkeyedItem(
				'b',
				'b'
			) }${ unkeyedItem( 'c', 'c' ) }`
		);
		// useInit effects flush after paint; the replaced item's pending
		// hydration init is dropped with its unmount, so flush first to
		// assert the stable semantics (see the keyed replace test above).
		await flush();
		const feed = document.querySelector( '[data-wp-interactive]' )!;
		const aEl = feed.children[ 0 ];
		const bEl = feed.children[ 1 ];
		const cEl = feed.children[ 2 ];

		renderHTML( bEl, unkeyedItem( 'b2', 'b2' ), { mode: 'replace' } );
		await flush();

		// RED pre-mechanism: the replacement was diffed into `b`'s element
		// and its data-wp-init never ran (DOM looked right, state didn't
		// activate). The synthetic key makes it mount fresh.
		expect( [ ...feed.children ].map( ( c ) => c.textContent ) ).toEqual( [
			'a',
			'b2',
			'c',
		] );
		expect( feed.children[ 0 ] ).toBe( aEl );
		expect( feed.children[ 1 ] ).not.toBe( bEl );
		expect( feed.children[ 2 ] ).toBe( cEl );
		expect( state.initCounts ).toEqual( { a: 1, b: 1, c: 1, b2: 1 } );
	} );

	it( 'keyed inner mounts fresh', async () => {
		await setup( `${ item( 'a', 'a', 'a' ) }${ item( 'b', 'b', 'b' ) }` );
		// Same deferred-effect note as the keyed replace test above.
		await flush();
		const feed = document.querySelector( '[data-wp-interactive]' )!;
		const aEl = feed.children[ 0 ];

		renderHTML( feed, item( 'z', 'z', 'z' ), { mode: 'inner' } );
		await flush();

		expect( feed.children.length ).toBe( 1 );
		expect( feed.children[ 0 ] ).not.toBe( aEl );
		expect( state.initCounts ).toEqual( { a: 1, b: 1, z: 1 } );
	} );

	it( 'unkeyed inner gets a synthetic key: content mounts fresh (init fires)', async () => {
		await setup(
			`${ unkeyedItem( 'a', 'a' ) }${ unkeyedItem( 'b', 'b' ) }`
		);
		// Same deferred-effect note as the keyed replace test above.
		await flush();
		const feed = document.querySelector( '[data-wp-interactive]' )!;
		const aEl = feed.children[ 0 ];

		renderHTML( feed, unkeyedItem( 'z', 'z' ), { mode: 'inner' } );
		await flush();

		// RED pre-mechanism: `a`'s element was reused for 'z' and the new
		// content's data-wp-init never ran.
		expect( feed.children.length ).toBe( 1 );
		expect( feed.children[ 0 ] ).not.toBe( aEl );
		expect( state.initCounts ).toEqual( { a: 1, b: 1, z: 1 } );
	} );
} );

describe( 'synthetic keys (experimental): cross-splice and refresh behavior', () => {
	it( 'successive unkeyed splices accumulate with all identities preserved', async () => {
		await setup(
			`${ unkeyedItem( 'a', 'a' ) }${ unkeyedItem( 'b', 'b' ) }`
		);
		const feed = document.querySelector( '[data-wp-interactive]' )!;
		const aEl = feed.children[ 0 ];
		const bEl = feed.children[ 1 ];

		renderHTML( feed, unkeyedItem( 'x', 'x' ), { mode: 'prepend' } );
		await flush();
		renderHTML( feed, unkeyedItem( 'y', 'y' ), { mode: 'prepend' } );
		await flush();

		// Each synthetic key lives on its vnode, which the next splice
		// carries by reference — so earlier splices' keys still match.
		expect( [ ...feed.children ].map( ( c ) => c.textContent ) ).toEqual( [
			'y',
			'x',
			'a',
			'b',
		] );
		expect( feed.children[ 2 ] ).toBe( aEl );
		expect( feed.children[ 3 ] ).toBe( bEl );
		expect( state.initCounts ).toEqual( { a: 1, b: 1, x: 1, y: 1 } );
	} );

	it( 'inner refresh after synthetic prepends remounts everything — no scramble, no reuse', async () => {
		await setup(
			`${ unkeyedItem( 'a', 'a' ) }${ unkeyedItem( 'b', 'b' ) }`
		);
		await flush();
		const feed = document.querySelector( '[data-wp-interactive]' )!;
		renderHTML( feed, unkeyedItem( 'new', 'new' ), { mode: 'prepend' } );
		await flush();
		const newEl = feed.children[ 0 ];
		const aEl = feed.children[ 1 ];

		// Re-fetch of the same three entities, refreshed via inner.
		renderHTML(
			feed,
			`${ unkeyedItem( 'new', 'new' ) }${ unkeyedItem(
				'a',
				'a'
			) }${ unkeyedItem( 'b', 'b' ) }`,
			{ mode: 'inner' }
		);
		await flush();

		// Every refreshed item gets a FRESH synthetic key, so nothing
		// matches the old tree: correct order (no chain scramble — the
		// new side is never null-keyed, unlike a raw innerHTML swap) but
		// full remount — init re-runs for all three, no element identity
		// survives. Real `data-wp-key`/id is the only way to reuse.
		expect( [ ...feed.children ].map( ( c ) => c.textContent ) ).toEqual( [
			'new',
			'a',
			'b',
		] );
		expect( feed.children[ 0 ] ).not.toBe( newEl );
		expect( feed.children[ 1 ] ).not.toBe( aEl );
		expect( state.initCounts ).toEqual( { new: 2, a: 2, b: 2 } );
	} );

	it( 'same entity delivered twice duplicates (no dedup)', async () => {
		await setup( unkeyedItem( 'a', 'a' ) );
		const feed = document.querySelector( '[data-wp-interactive]' )!;

		// A race: the same post arrives via push AND initial fetch.
		renderHTML( feed, unkeyedItem( 'a', 'a' ), { mode: 'prepend' } );
		await flush();

		// Distinctness, not identity: the second delivery gets a new key
		// and mounts as a duplicate. Real keys would move the element.
		expect( feed.children.length ).toBe( 2 );
		expect( [ ...feed.children ].map( ( c ) => c.textContent ) ).toEqual( [
			'a',
			'a',
		] );
		expect( state.initCounts.a ).toBe( 2 );
	} );
} );
