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
import { hydrateRegions } from '../hydration';

const NS = 'test/tree-first';

const { state } = store( NS, {
	state: { text: 'initial', count: 0, items: [ 'x', 'y' ] },
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

	it( 'prepends when position is "prepend"', async () => {
		await setup( '<div data-testid="feed"><p>a</p></div>' );
		renderHTML(
			document.querySelector( '[data-testid="feed"]' ),
			'<p>b</p>',
			{ position: 'prepend' }
		);
		await flush();
		const feed = document.querySelector( '[data-testid="feed"]' );
		expect( feed?.children[ 0 ]?.textContent ).toBe( 'b' );
		expect( feed?.children[ 1 ]?.textContent ).toBe( 'a' );
	} );

	it( 'replaces children when position is "inner"', async () => {
		await setup( '<div data-testid="feed"><p>a</p></div>' );
		renderHTML(
			document.querySelector( '[data-testid="feed"]' ),
			'<p>b</p>',
			{ position: 'inner' }
		);
		await flush();
		const feed = document.querySelector( '[data-testid="feed"]' );
		expect( feed?.children.length ).toBe( 1 );
		expect( feed?.children[ 0 ]?.textContent ).toBe( 'b' );
	} );

	it( 'inserts before the container when position is "before"', async () => {
		await setup(
			'<div data-testid="target"></div><p data-testid="after">after</p>'
		);
		renderHTML(
			document.querySelector( '[data-testid="target"]' ),
			'<p>before</p>',
			{ position: 'before' }
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

	it( 'inserts after the container when position is "after"', async () => {
		await setup(
			'<p data-testid="before">before</p><div data-testid="target"></div>'
		);
		renderHTML(
			document.querySelector( '[data-testid="target"]' ),
			'<p>after</p>',
			{ position: 'after' }
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

	it( 'replaces the container itself when position is "outer"', async () => {
		await setup(
			'<div data-testid="wrap"><div data-testid="target">old</div></div>'
		);
		renderHTML(
			document.querySelector( '[data-testid="target"]' ),
			'<p>new</p>',
			{ position: 'outer' }
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
			{ position: 'inner' }
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
