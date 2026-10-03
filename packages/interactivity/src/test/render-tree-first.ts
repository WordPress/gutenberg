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
	it( 'text nodes mixed with elements survive re-renders by identity', async () => {
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

		// Re-render the FIRST fragment (same HTML) via `inner`. `inner`
		// gets no synthetic keys (wholesale swap — positional reuse is the
		// desired default), and this content has no id, so everything
		// matches positionally: the text nodes AND the span survive BY
		// IDENTITY — recreating them would break caret/selection in live
		// text. The second fragment (t/tail) is unmounted by the inner
		// swap.
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
		expect( parent.childNodes[ 1 ] ).toBe( s );
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
const idItem = ( id: string, label: string ) =>
	`<div id="${ id }" data-wp-context='{ "id": "${ id }" }' data-wp-init="actions.initItem">${ label }</div>`;

// Keyed (or id-keyed) item with a nested child that has its own init: used
// to verify that splicing INTO an item's subtree does not remount the item
// (its key must survive the path rebuild) and does not re-run any init.
const keyedNested = (
	key: string,
	id: string,
	label: string,
	childId: string,
	childLabel: string
) =>
	`<div data-wp-key="${ key }" data-wp-context='{ "id": "${ id }" }' data-wp-init="actions.initItem">${ label }<span data-wp-context='{ "id": "${ childId }" }' data-wp-init="actions.initItem">${ childLabel }</span></div>`;
const idNested = (
	id: string,
	label: string,
	childId: string,
	childLabel: string
) =>
	`<div id="${ id }" data-wp-context='{ "id": "${ id }" }' data-wp-init="actions.initItem">${ label }<span data-wp-context='{ "id": "${ childId }" }' data-wp-init="actions.initItem">${ childLabel }</span></div>`;

describe( 'data-wp-key and list identity across modes', () => {
	// Preact reconciles a position by KEY when keys are present and by INDEX
	// when they are not. An unkeyed index-shifting splice (prepend/before/
	// after) therefore diffs each new vnode against the WRONG old vnode —
	// the footgun pinned by revision `oop`. renderHTML now keys every new
	// vnode: a user `data-wp-key` wins, then the element's `id`, then (for
	// insertion modes only) a unique synthetic key (see spliceIntoTree), so
	// the unkeyed variants below assert the FIXED behavior: the new item
	// mounts fresh (its data-wp-init runs), and preact's skew re-aligns the
	// existing items to their old partners (element identity + init counts
	// preserved). The keyed variants remain the baseline; the auto-key gaps
	// (refresh/reorder/dedup semantics) are in the next describe block.
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

	it( 'KNOWN LIMITATION: unkeyed replace reuses the old element and swallows the replacement init (no synthetic on replace)', async () => {
		await setup(
			`${ unkeyedItem( 'a', 'a' ) }${ unkeyedItem(
				'b',
				'b'
			) }${ unkeyedItem( 'c', 'c' ) }`
		);
		await flush();
		const feed = document.querySelector( '[data-wp-interactive]' )!;
		const aEl = feed.children[ 0 ];
		const bEl = feed.children[ 1 ];
		const cEl = feed.children[ 2 ];

		renderHTML( bEl, unkeyedItem( 'b2', 'b2' ), { mode: 'replace' } );
		await flush();

		// `replace` gets no synthetic key (wholesale swap — positional
		// reuse is the desired default) and this content has no id, so the
		// replacement is diffed into the old element's component instance:
		// the old element renders the new content and the new content's
		// data-wp-init never runs. Give the replacement an id or
		// data-wp-key to mount fresh.
		expect( [ ...feed.children ].map( ( c ) => c.textContent ) ).toEqual( [
			'a',
			'b2',
			'c',
		] );
		expect( feed.children[ 0 ] ).toBe( aEl );
		expect( feed.children[ 1 ] ).toBe( bEl );
		expect( feed.children[ 2 ] ).toBe( cEl );
		expect( state.initCounts.b2 ).toBeUndefined();
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

	it( 'KNOWN LIMITATION: unkeyed inner reuses the old element and swallows the new content init (no synthetic on inner)', async () => {
		await setup(
			`${ unkeyedItem( 'a', 'a' ) }${ unkeyedItem( 'b', 'b' ) }`
		);
		await flush();
		const feed = document.querySelector( '[data-wp-interactive]' )!;
		const aEl = feed.children[ 0 ];

		renderHTML( feed, unkeyedItem( 'z', 'z' ), { mode: 'inner' } );
		await flush();

		// `inner` gets no synthetic key (wholesale swap — positional reuse
		// is the desired default) and this content has no id, so `a`'s
		// element is reused for 'z' and the new content's data-wp-init
		// never runs. Give the content an id or data-wp-key to mount fresh.
		expect( feed.children.length ).toBe( 1 );
		expect( feed.children[ 0 ] ).toBe( aEl );
		expect( aEl ).toHaveTextContent( 'z' );
		expect( state.initCounts.z ).toBeUndefined();
	} );
} );

// KNOWN-LIMITATION TESTS in this block are marked with a `KNOWN LIMITATION`
// prefix. They document behavior that is deliberate but imperfect — the
// auto-key mechanism cannot fix them (per-parse keys can never match across
// parses, and a key distinguishes, it does not merge). They pin the gaps so
// a change in behavior is noticed, not so the behavior is endorsed.
describe( 'auto-keys (id + synthetic): cross-splice, refresh, and dedup behavior', () => {
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

	it( 'KNOWN LIMITATION: inner refresh after a synthetic prepend misattributes id-less items (use data-wp-key/id)', async () => {
		await setup(
			`${ unkeyedItem( 'a', 'a' ) }${ unkeyedItem( 'b', 'b' ) }`
		);
		await flush();
		const feed = document.querySelector( '[data-wp-interactive]' )!;
		renderHTML( feed, unkeyedItem( 'new', 'new' ), { mode: 'prepend' } );
		await flush();
		const aEl = feed.children[ 1 ];
		const bEl = feed.children[ 2 ];

		// Re-fetch of the same three entities, refreshed via inner. The new
		// side is unkeyed (inner gets no synthetic keys, and none of this
		// content has an id). The old side has a SYNTHETIC-keyed hole at the
		// front, so the positional scan steps over it and matches `new'`
		// against `a`'s element: identity is misattributed (not just lost).
		renderHTML(
			feed,
			`${ unkeyedItem( 'new', 'new' ) }${ unkeyedItem(
				'a',
				'a'
			) }${ unkeyedItem( 'b', 'b' ) }`,
			{ mode: 'inner' }
		);
		await flush();

		// Order/content is correct, but the elements are scrambled:
		// `new`'s content now lives on `a`'s OLD element, `a`'s content on
		// `b`'s old element, and `b` mounts fresh (its init re-runs — hence
		// `b: 2`). `new` and `a` never re-init. This is the documented
		// reason to put ids (or data-wp-key) on dynamic list content.
		expect( [ ...feed.children ].map( ( c ) => c.textContent ) ).toEqual( [
			'new',
			'a',
			'b',
		] );
		expect( feed.children[ 0 ] ).toBe( aEl );
		expect( feed.children[ 1 ] ).toBe( bEl );
		expect( state.initCounts ).toEqual( { new: 1, a: 1, b: 2 } );
	} );

	it( 'KNOWN LIMITATION: same entity delivered twice duplicates when it has no stable key (no dedup)', async () => {
		await setup( unkeyedItem( 'a', 'a' ) );
		const feed = document.querySelector( '[data-wp-interactive]' )!;

		// A race: the same post arrives via push AND initial fetch. The
		// item has no id, so each delivery gets a fresh SYNTHETIC key —
		// distinctness, not identity: the second delivery mounts as a
		// duplicate. Ids (or data-wp-key) deduplicate instead (next test).
		renderHTML( feed, unkeyedItem( 'a', 'a' ), { mode: 'prepend' } );
		await flush();

		expect( feed.children.length ).toBe( 2 );
		expect( [ ...feed.children ].map( ( c ) => c.textContent ) ).toEqual( [
			'a',
			'a',
		] );
		expect( state.initCounts.a ).toBe( 2 );
	} );

	it( 'prepend uses the element id as the key: new item mounts fresh, existing items keep identity', async () => {
		await setup( `${ idItem( 'a', 'a' ) }${ idItem( 'b', 'b' ) }` );
		const feed = document.querySelector( '[data-wp-interactive]' )!;
		const aEl = feed.children[ 0 ];
		const bEl = feed.children[ 1 ];

		renderHTML( feed, idItem( 'new', 'new' ), { mode: 'prepend' } );
		await flush();

		// The id is used as the key ('new' matches no sibling) — the new
		// item mounts fresh, and the skew re-aligns the existing items.
		expect( [ ...feed.children ].map( ( c ) => c.textContent ) ).toEqual( [
			'new',
			'a',
			'b',
		] );
		expect( feed.children[ 0 ]?.textContent ).toBe( 'new' );
		expect( feed.children[ 1 ] ).toBe( aEl );
		expect( feed.children[ 2 ] ).toBe( bEl );
		expect( state.initCounts ).toEqual( { new: 1, a: 1, b: 1 } );
	} );

	it( 'id-keyed items survive an inner refresh by identity; unkeyed SSR items remount', async () => {
		await setup( `${ idItem( 'a', 'a' ) }${ idItem( 'b', 'b' ) }` );
		await flush();
		const feed = document.querySelector( '[data-wp-interactive]' )!;
		renderHTML( feed, idItem( 'x', 'x' ), { mode: 'prepend' } );
		await flush();
		const xEl = feed.children[ 0 ];

		// Re-fetch of the same three entities, refreshed via inner — all
		// with ids. The previously spliced `x` is id-keyed in the tree, so
		// the refreshed `x` matches it: same element, init NOT re-run. The
		// SSR'd `a`/`b` are unkeyed in the tree, so the id-keyed refreshes
		// match nothing and mount fresh (init re-runs once).
		renderHTML(
			feed,
			`${ idItem( 'x', 'x' ) }${ idItem( 'a', 'a' ) }${ idItem(
				'b',
				'b'
			) }`,
			{ mode: 'inner' }
		);
		await flush();

		expect( [ ...feed.children ].map( ( c ) => c.textContent ) ).toEqual( [
			'x',
			'a',
			'b',
		] );
		expect( feed.children[ 0 ] ).toBe( xEl );
		expect( state.initCounts ).toEqual( { a: 2, b: 2, x: 1 } );
	} );

	it( 'KNOWN LIMITATION: a duplicate delivery with the same id still duplicates (same-key match orphans the old vnode)', async () => {
		await setup( `${ idItem( 'a', 'a' ) }${ idItem( 'b', 'b' ) }` );
		await flush();
		const feed = document.querySelector( '[data-wp-interactive]' )!;
		renderHTML( feed, idItem( 'x', 'x' ), { mode: 'prepend' } );
		await flush();

		// The same entity arrives again via a second splice. The new
		// delivery DOES match the existing element by id (it is absorbed,
		// init not re-run), but spliceIntoTree carries the old children by
		// reference — and the old `x` vnode can no longer match anything
		// (its slot was taken by the new delivery), so it remounts fresh.
		// Net result: a duplicate anyway. True dedup would need an upsert
		// (replace-on-key-collision), which is not implemented.
		renderHTML( feed, idItem( 'x', 'x' ), { mode: 'prepend' } );
		await flush();

		expect( feed.children.length ).toBe( 4 );
		expect( [ ...feed.children ].map( ( c ) => c.textContent ) ).toEqual( [
			'x',
			'x',
			'a',
			'b',
		] );
		expect( state.initCounts ).toEqual( { a: 1, b: 1, x: 2 } );
	} );

	it( 'mixed tags (data-wp-key, id, synthetic) coexist in one list with identity preserved', async () => {
		await setup(
			`${ item( 'a', 'a', 'a' ) }` + // data-wp-key → key 'a'
				`${ idItem( 'b', 'b' ) }` + // id → but SSR'd: no key in tree
				`${ unkeyedItem( 'c', 'c' ) }` // neither → no key in tree
		);
		await flush();
		const feed = document.querySelector( '[data-wp-interactive]' )!;
		const aEl = feed.children[ 0 ];
		const bEl = feed.children[ 1 ];
		const cEl = feed.children[ 2 ];

		// Prepend one item of each tag type (data-wp-key / id /
		// neither → synthetic). The mixed key types must not collide
		// or absorb each other: preact 10.29 matches key-to-key
		// (null==null for unkeyed), so distinct tags coexist.
		renderHTML( feed, unkeyedItem( 'd', 'd' ), { mode: 'prepend' } );
		renderHTML( feed, idItem( 'e', 'e' ), { mode: 'prepend' } );
		renderHTML( feed, item( 'f', 'f', 'f' ), { mode: 'prepend' } );
		await flush();

		expect( [ ...feed.children ].map( ( c ) => c.textContent ) ).toEqual( [
			'f',
			'e',
			'd',
			'a',
			'b',
			'c',
		] );
		expect( feed.children[ 3 ] ).toBe( aEl );
		expect( feed.children[ 4 ] ).toBe( bEl );
		expect( feed.children[ 5 ] ).toBe( cEl );
		expect( state.initCounts ).toEqual( {
			a: 1,
			b: 1,
			c: 1,
			d: 1,
			e: 1,
			f: 1,
		} );
	} );

	it( 'KNOWN LIMITATION (partial): mixed-tag refresh — data-wp-key and spliced-id items reuse, SSR-id and synthetic items do not', async () => {
		await setup(
			`${ item( 'a', 'a', 'a' ) }` + // data-wp-key → key 'a' in tree
				`${ idItem( 'b', 'b' ) }` // SSR'd id → NO key in tree (ids are only read at splice time)
		);
		await flush();
		const feed = document.querySelector( '[data-wp-interactive]' )!;
		const aEl = feed.children[ 0 ];
		const bEl = feed.children[ 1 ];

		// Splice in one id-keyed item (gets key 'e') and one
		// id-less item (gets a synthetic key).
		renderHTML( feed, idItem( 'e', 'e' ), { mode: 'prepend' } );
		renderHTML( feed, unkeyedItem( 'd', 'd' ), { mode: 'prepend' } );
		await flush();
		const eEl = feed.children[ 1 ];

		// Server re-fetch of the same four entities, same order.
		// Refresh via inner.
		renderHTML(
			feed,
			`${ unkeyedItem( 'd', 'd' ) }${ idItem( 'e', 'e' ) }${ item(
				'a',
				'a',
				'a'
			) }${ idItem( 'b', 'b' ) }`,
			{ mode: 'inner' }
		);
		await flush();

		// Order/content is correct — but look at the elements:
		// - e' (id 'e') matches the spliced e (key 'e' in tree):
		//   element reused, init NOT re-run. ✓
		// - a' (data-wp-key 'a') matches the SSR'd a (key 'a' in
		//   tree): element reused, init NOT re-run. ✓
		// - b' (SSR'd id) has key 'b', but the old b has NO key in
		//   the tree (SSR ids aren't read at hydration) → no match:
		//   b' mounts fresh, init re-runs (b: 2). ✗
		// - d' (id-less) can't match the synthetic-keyed old d, so
		//   the positional scan absorbs d' into the OLD b element
		//   (the first unkeyed hole): identity misattributed, d's
		//   init swallowed. The old d is unmounted. ✗
		expect( [ ...feed.children ].map( ( c ) => c.textContent ) ).toEqual( [
			'd',
			'e',
			'a',
			'b',
		] );
		expect( feed.children[ 0 ] ).toBe( bEl ); // d' absorbed b's element
		expect( feed.children[ 1 ] ).toBe( eEl ); // e' reused e's element
		expect( feed.children[ 2 ] ).toBe( aEl ); // a' reused a's element
		expect( state.initCounts ).toEqual( {
			a: 1,
			b: 2,
			d: 1,
			e: 1,
		} );
	} );

	it( 'splicing into a data-wp-key SSR item keeps its identity and nested content (no re-init)', async () => {
		await setup(
			`${ keyedNested( 'a', 'a', 'a', 'a-child', 'ac' ) }${ item(
				'b',
				'b',
				'b'
			) }`
		);
		await flush();
		const feed = document.querySelector( '[data-wp-interactive]' )!;
		const aEl = feed.children[ 0 ];
		const childEl = aEl.querySelector( 'span' )!;
		const bEl = feed.children[ 1 ];

		// Splice INTO the nested child of the keyed item. The rebuild path
		// runs through the item's Directives wrapper (which carries the
		// key) and both nested elements. If the wrapper's key is lost,
		// preact remounts the whole item: element replaced, its nested
		// child re-inited, its init re-run. The sibling `b` is OFF the
		// path — carried by reference, so it must be untouched either way.
		renderHTML(
			childEl as Element,
			'<span data-wp-context=\'{ "id": "x" }\' data-wp-init="actions.initItem">x</span>'
		);
		await flush();

		expect( feed.children.length ).toBe( 2 );
		expect( feed.children[ 0 ] ).toBe( aEl );
		expect( feed.children[ 1 ] ).toBe( bEl );
		expect( aEl.querySelector( 'span' ) ).toBe( childEl );
		expect( childEl.lastElementChild?.textContent ).toBe( 'x' );
		expect( state.initCounts ).toEqual( {
			a: 1,
			'a-child': 1,
			b: 1,
			x: 1,
		} );
	} );

	it( 'splicing into an id-keyed spliced item keeps its identity and nested content (no re-init)', async () => {
		await setup( '<div data-testid="feed"></div>' );
		const feed = document.querySelector( '[data-testid="feed"]' )!;
		renderHTML( feed, idNested( 'a', 'a', 'a-child', 'ac' ), {
			mode: 'prepend',
		} );
		await flush();
		const aEl = feed.children[ 0 ];
		const childEl = aEl.querySelector( 'span' )!;

		// Same as above, but the key came from the id fallback at splice
		// time: the Directives wrapper carries the key, and the rebuild
		// must keep it — otherwise the item remounts and its nested child
		// re-inits.
		renderHTML(
			childEl as Element,
			'<span data-wp-context=\'{ "id": "x" }\' data-wp-init="actions.initItem">x</span>'
		);
		await flush();

		expect( feed.children.length ).toBe( 1 );
		expect( feed.children[ 0 ] ).toBe( aEl );
		expect( aEl.querySelector( 'span' ) ).toBe( childEl );
		expect( childEl.lastElementChild?.textContent ).toBe( 'x' );
		expect( state.initCounts ).toEqual( { a: 1, 'a-child': 1, x: 1 } );
	} );

	it( 'inserting below a directive-carrying parent does not re-run its init (or its siblings)', async () => {
		await setup(
			'<div data-wp-context=\'{ "id": "parent" }\' data-wp-init="actions.initItem">' +
				'<div data-testid="feed"></div>' +
				'</div>' +
				'<div data-wp-context=\'{ "id": "sibling" }\' data-wp-init="actions.initItem">sib</div>'
		);
		await flush();
		expect( state.initCounts ).toEqual( { parent: 1, sibling: 1 } );
		const island = document.querySelector( '[data-wp-interactive]' )!;
		const sibEl = island.children[ 1 ];

		// The parent's Directives wrapper is rebuilt (unkeyed → matched
		// positionally → instance reused, init not re-run) and the sibling
		// is off-path (carried by reference). Both must keep identity.
		renderHTML(
			document.querySelector( '[data-testid="feed"]' ),
			'<span>x</span>'
		);
		await flush();

		expect( state.initCounts ).toEqual( { parent: 1, sibling: 1 } );
		expect( island.children[ 1 ] ).toBe( sibEl );
	} );
} );
