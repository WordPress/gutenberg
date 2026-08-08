// eslint-disable-next-line no-warning-comments
/**
 * @jest-environment jsdom
 */

/**
 * `elementToVnode` map mechanism tests.
 *
 * These pin the element→vnode map (populated by the `options.diffed` hook in
 * `hooks.tsx`) and the `_parent`-pointer walk (`getPathTo` in `render.ts`)
 * that `renderHTML` uses to locate its container — the O(1) replacement for
 * a depth-first search over the whole island. They are mechanism tests by
 * design: the map's correctness is what the O(1) lookup is built on.
 * Outcome-level behavior is covered by `render-tree-first.ts`.
 */

/**
 * Internal dependencies
 */
import '../directives'; // Registers all the core directives.
import { elementToVnode } from '../hooks';
import { renderHTML } from '../render';
import { hydrateRegions } from '../hydration';

const NS = 'test/element-vnode-map';

// Preact internal property accessors — the dist build mangles `_parent` to
// `__` (read both, same as `render.ts`).
const vdomParent = ( vnode: any ): any => vnode?._parent ?? vnode?.__ ?? null;
const vdomDom = ( vnode: any ): Node | null =>
	vnode?._dom ?? vnode?.__e ?? null;

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
	await hydrateRegions();
};

describe( 'elementToVnode map', () => {
	it( 'maps every rendered element to its vnode after initial hydration', async () => {
		await setup(
			'<div data-testid="a"><span data-testid="b"></span></div>'
		);
		const a = document.querySelector( '[data-testid="a"]' );
		const b = document.querySelector( '[data-testid="b"]' );
		expect( elementToVnode.get( a ) ).toBeDefined();
		expect( elementToVnode.get( b ) ).toBeDefined();
	} );

	it( 'maps elements spliced in by renderHTML', async () => {
		await setup( '<div data-testid="feed"></div>' );
		renderHTML( '[data-testid="feed"]', '<p data-testid="p">x</p>' );
		await flush();
		const p = document.querySelector( '[data-testid="p"]' );
		expect( elementToVnode.get( p ) ).toBeDefined();
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
			position: 'inner',
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
