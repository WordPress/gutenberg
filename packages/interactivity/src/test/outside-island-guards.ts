// eslint-disable-next-line no-warning-comments
/**
 * @jest-environment jsdom
 */

/**
 * RED probes — outside-island hydration + island-root guards.
 *
 * Current behavior (to be fixed):
 * 1. `renderHTML` into a container with NO island around it warns + no-ops
 *    even when the HTML itself carries `data-wp-interactive` at its root —
 *    the HTML's island is never hydrated.
 * 2. `mode: 'replace'` at the island root with HTML lacking
 *    `data-wp-interactive` is allowed — the fragment's tree root becomes a
 *    non-island element, ORPHANING the tree (subsequent renderHTML calls
 *    can't find an island).
 *
 * The fix (plan §8 next-up task 1):
 * - No island + HTML root with `data-wp-interactive` → append the parsed
 *   nodes and hydrate the HTML's island via the sanctioned first-render
 *   path (the fragment's first render matches pre-existing DOM — the same
 *   path `hydrateRegions` uses); subsequent splices target the island
 *   normally.
 * - Island-root `replace` requires the new content to carry an island;
 *   otherwise warn + no-op.
 * - Island-root `before`/`after` already warn (guard exists — add tests).
 */

import { store } from '../store';

/**
 * Internal dependencies
 */
import '../directives'; // Registers all the core directives.
import { renderHTML } from '../render';

const NS = 'test/outside-island';

const { state } = store( NS, {
	state: { text: 'initial' },
	actions: {
		setChanged() {
			state.text = 'changed';
		},
	},
} );

// Drains preact's effect queue reliably: a macrotask plus two frames.
const flush = async () => {
	await new Promise( ( r ) => setTimeout( r, 0 ) );
	await new Promise( ( r ) => requestAnimationFrame( r ) );
	await new Promise( ( r ) => requestAnimationFrame( r ) );
};

/* eslint-disable @wordpress/wp-global-usage */
const testGlobalThis = globalThis as typeof globalThis & {
	IS_GUTENBERG_PLUGIN?: boolean;
};
let originalIsGutenbergPlugin: boolean | undefined;

( globalThis as { SCRIPT_DEBUG?: boolean } ).SCRIPT_DEBUG = false;

beforeEach( () => {
	document.body.innerHTML = '';
	state.text = 'initial';
	originalIsGutenbergPlugin = testGlobalThis.IS_GUTENBERG_PLUGIN;
	testGlobalThis.IS_GUTENBERG_PLUGIN = false;
} );

afterEach( () => {
	testGlobalThis.IS_GUTENBERG_PLUGIN = originalIsGutenbergPlugin;
} );
/* eslint-enable @wordpress/wp-global-usage */

describe( 'renderHTML outside any island', () => {
	it( 'RED: hydrates an HTML island into a container that has no island around it', async () => {
		document.body.innerHTML = '<div data-testid="host"></div>';
		const host = document.querySelector( '[data-testid="host"]' )!;

		// The container has no island around it, but the HTML itself IS an
		// island (root carries data-wp-interactive). It must be hydrated
		// into the container via the sanctioned first-render path.
		renderHTML(
			host,
			`<div data-wp-interactive="${ NS }">
				<div data-testid="feed"></div>
				<span data-testid="txt" data-wp-text="state.text">initial</span>
			</div>`
		);
		await flush();

		// The island exists and its directives work.
		const txt = document.querySelector( '[data-testid="txt"]' );
		expect( txt ).not.toBeNull();
		expect( txt?.textContent ).toBe( 'initial' );

		// A subsequent splice into a container INSIDE the island must work
		// (the island is now a normal hydrated island).
		renderHTML(
			'[data-testid="feed"]',
			'<button data-testid="btn" data-wp-on--click="actions.setChanged">go</button>'
		);
		await flush();
		expect(
			document.querySelector( '[data-testid="btn"]' )
		).not.toBeNull();

		// The spliced button is interactive.
		(
			document.querySelector( '[data-testid="btn"]' ) as HTMLButtonElement
		 ).click();
		await flush();
		expect( txt?.textContent ).toBe( 'changed' );
	} );

	it( 'GREEN guard: warns and does nothing when there is no island and the HTML has no island', async () => {
		// eslint-disable-next-line @wordpress/wp-global-usage
		( globalThis as { SCRIPT_DEBUG?: boolean } ).SCRIPT_DEBUG = true;
		document.body.innerHTML = '<div data-testid="host"></div>';
		const warnSpy = jest
			.spyOn( console, 'warn' )
			.mockImplementation( () => {} );
		renderHTML( '[data-testid="host"]', '<p data-testid="p">plain</p>' );
		expect( warnSpy ).toHaveBeenCalled();
		warnSpy.mockRestore();
		// eslint-disable-next-line @wordpress/wp-global-usage
		( globalThis as { SCRIPT_DEBUG?: boolean } ).SCRIPT_DEBUG = false;
		expect( document.querySelector( '[data-testid="p"]' ) ).toBeNull();
	} );
} );

describe( 'HTML-island fallback honors mode', () => {
	const islandHtml = `
		<div data-wp-interactive="${ NS }" data-testid="island">
			<span data-testid="txt" data-wp-text="state.text">initial</span>
		</div>
	`;

	const setupHost = ( content = '' ) => {
		document.body.innerHTML = `<div data-testid="host">${ content }</div>`;
		return document.querySelector( '[data-testid="host"]' )!;
	};

	it( "prepend: the island lands BEFORE the host's existing children, hydrated", async () => {
		const host = setupHost( '<p data-testid="existing">old</p>' );
		renderHTML( host, islandHtml, { mode: 'prepend' } );
		await flush();

		expect( host.children.length ).toBe( 2 );
		expect( host.children[ 0 ] ).toHaveAttribute( 'data-testid', 'island' );
		expect( host.children[ 1 ] ).toHaveAttribute(
			'data-testid',
			'existing'
		);
		// Hydrated: the directive works.
		expect( host.querySelector( '[data-testid="txt"]' )?.textContent ).toBe(
			'initial'
		);
	} );

	it( "inner: the island REPLACES the host's children, hydrated", async () => {
		const host = setupHost( '<p data-testid="existing">old</p>' );
		renderHTML( host, islandHtml, { mode: 'inner' } );
		await flush();

		expect( host.querySelector( '[data-testid="existing"]' ) ).toBeNull();
		expect( host.children.length ).toBe( 1 );
		expect( host.children[ 0 ] ).toHaveAttribute( 'data-testid', 'island' );
		expect( host.querySelector( '[data-testid="txt"]' )?.textContent ).toBe(
			'initial'
		);
	} );

	it( 'before: the island becomes a sibling immediately BEFORE the host, hydrated', async () => {
		const host = setupHost();
		renderHTML( host, islandHtml, { mode: 'before' } );
		await flush();

		expect( host.previousElementSibling ).toHaveAttribute(
			'data-testid',
			'island'
		);
		expect(
			document.querySelector( '[data-testid="txt"]' )?.textContent
		).toBe( 'initial' );
	} );

	it( 'after: the island becomes a sibling immediately AFTER the host, hydrated', async () => {
		const host = setupHost();
		renderHTML( host, islandHtml, { mode: 'after' } );
		await flush();

		expect( host.nextElementSibling ).toHaveAttribute(
			'data-testid',
			'island'
		);
		expect(
			document.querySelector( '[data-testid="txt"]' )?.textContent
		).toBe( 'initial' );
	} );

	it( 'replace: the host is replaced by the island, hydrated, and accepts follow-up splices', async () => {
		const host = setupHost();
		renderHTML( host, islandHtml, { mode: 'replace' } );
		await flush();

		expect( document.querySelector( '[data-testid="host"]' ) ).toBeNull();
		const island = document.querySelector( '[data-testid="island"]' );
		expect( island ).not.toBeNull();
		expect(
			document.querySelector( '[data-testid="txt"]' )?.textContent
		).toBe( 'initial' );

		// A subsequent splice into the new island works (not orphaned).
		renderHTML(
			'[data-testid="island"]',
			'<button data-testid="btn" data-wp-on--click="actions.setChanged">go</button>'
		);
		await flush();
		(
			document.querySelector( '[data-testid="btn"]' ) as HTMLButtonElement
		 ).click();
		await flush();
		expect(
			document.querySelector( '[data-testid="txt"]' )?.textContent
		).toBe( 'changed' );
	} );
} );

describe( 'renderHTML at the island root', () => {
	it( 'RED: replacing the island root with non-island HTML warns and does nothing', async () => {
		// eslint-disable-next-line @wordpress/wp-global-usage
		( globalThis as { SCRIPT_DEBUG?: boolean } ).SCRIPT_DEBUG = true;
		document.body.innerHTML = `
			<div data-wp-interactive="${ NS }" data-testid="island">
				<span data-testid="inner" data-wp-text="state.text">initial</span>
			</div>
		`;
		await flush();
		const warnSpy = jest
			.spyOn( console, 'warn' )
			.mockImplementation( () => {} );
		const islandEl = document.querySelector(
			'[data-testid="island"]'
		) as HTMLElement;

		// Replacing the island root with a NON-island element would orphan
		// the fragment (no island to find on subsequent calls) — must warn
		// and leave the tree untouched.
		renderHTML( islandEl, '<p data-testid="p">plain</p>', {
			mode: 'replace',
		} );
		await flush();

		expect( warnSpy ).toHaveBeenCalled();
		warnSpy.mockRestore();
		// eslint-disable-next-line @wordpress/wp-global-usage
		( globalThis as { SCRIPT_DEBUG?: boolean } ).SCRIPT_DEBUG = false;

		// The tree is untouched and still functional.
		expect(
			document.querySelector( '[data-testid="island"]' )
		).not.toBeNull();
		expect( document.querySelector( '[data-testid="p"]' ) ).toBeNull();
	} );

	it( 'replacing the island root with island HTML works and stays interactive', async () => {
		document.body.innerHTML = `
			<div data-wp-interactive="${ NS }" data-testid="island">
				<span data-testid="old" data-wp-text="state.text">initial</span>
			</div>
		`;
		await flush();
		const islandEl = document.querySelector(
			'[data-testid="island"]'
		) as HTMLElement;

		renderHTML(
			islandEl,
			`<section data-wp-interactive="${ NS }" data-testid="island2">
				<span data-testid="txt" data-wp-text="state.text">initial</span>
			</section>`,
			{ mode: 'replace' }
		);
		await flush();

		// The old island is gone; the new island is in place.
		expect( document.querySelector( '[data-testid="island"]' ) ).toBeNull();
		const txt = document.querySelector( '[data-testid="txt"]' );
		expect( txt ).not.toBeNull();
		expect( txt?.textContent ).toBe( 'initial' );

		// A subsequent splice inside the NEW island works (not orphaned).
		renderHTML(
			'[data-testid="island2"]',
			'<button data-testid="btn" data-wp-on--click="actions.setChanged">go</button>'
		);
		await flush();
		(
			document.querySelector( '[data-testid="btn"]' ) as HTMLButtonElement
		 ).click();
		await flush();
		expect( txt?.textContent ).toBe( 'changed' );
	} );

	it( 'warns and does nothing when inserting before/after the island root', async () => {
		// eslint-disable-next-line @wordpress/wp-global-usage
		( globalThis as { SCRIPT_DEBUG?: boolean } ).SCRIPT_DEBUG = true;
		document.body.innerHTML = `
			<div data-wp-interactive="${ NS }" data-testid="island">
				<span data-testid="inner">x</span>
			</div>
		`;
		await flush();
		const islandEl = document.querySelector(
			'[data-testid="island"]'
		) as HTMLElement;

		const warnSpy = jest
			.spyOn( console, 'warn' )
			.mockImplementation( () => {} );

		// `before` and `after` share the same island-root guard branch. The
		// module-level warn dedupe (`logged` in utils.ts) silences a second
		// IDENTICAL message, so the warn is asserted once and the DOM
		// outcome (nothing inserted) for both modes. Element-sibling checks:
		// the multiline template leaves whitespace TEXT nodes around the
		// island, which are not insertions.
		renderHTML( islandEl, '<p>plain</p>', { mode: 'before' } );
		await flush();
		expect( warnSpy ).toHaveBeenCalled();
		expect( islandEl.previousElementSibling ).toBeNull();

		renderHTML( islandEl, '<p>plain</p>', { mode: 'after' } );
		await flush();
		expect( islandEl.nextElementSibling ).toBeNull();

		warnSpy.mockRestore();
		// eslint-disable-next-line @wordpress/wp-global-usage
		( globalThis as { SCRIPT_DEBUG?: boolean } ).SCRIPT_DEBUG = false;
	} );
} );
