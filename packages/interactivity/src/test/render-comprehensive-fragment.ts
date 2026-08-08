// eslint-disable-next-line no-warning-comments
/**
 * @jest-environment jsdom
 */

/**
 * Outcome tests salvaged from the per-node fragment iteration — the only two
 * that express behavior tree-first must still satisfy (all the others were
 * per-node mechanism tests; see plan §3 "why not per-node fragments").
 *
 * - P4: replacing a container's content cleans up listeners of previously
 *   renderHTML-inserted nodes (tree-first does this by construction: the
 *   replacement unmounts the old vnodes, running their effect cleanups).
 * - C4: text nodes in live content survive re-renders BY IDENTITY (caret /
 *   selection preservation) — Preact's diff reuses matched text nodes.
 */
import '../directives';
import { store } from '../store';
import { renderHTML } from '../render';

function el( html: string ): HTMLElement {
	const host = document.createElement( 'div' );
	host.innerHTML = html;
	return host.firstElementChild as HTMLElement;
}

const flush = async () => {
	await new Promise( ( r ) => requestAnimationFrame( r ) );
	await new Promise( ( r ) => requestAnimationFrame( r ) );
};

describe( 'render comprehensive — pruned outcome tests', () => {
	/* eslint-disable @wordpress/wp-global-usage */
	const testGlobalThis = globalThis as typeof globalThis & {
		IS_GUTENBERG_PLUGIN?: boolean;
	};
	let originalIsGutenbergPlugin: boolean | undefined;

	beforeEach( () => {
		document.body.innerHTML = '';
		originalIsGutenbergPlugin = testGlobalThis.IS_GUTENBERG_PLUGIN;
		testGlobalThis.IS_GUTENBERG_PLUGIN = false;
	} );

	afterEach( () => {
		testGlobalThis.IS_GUTENBERG_PLUGIN = originalIsGutenbergPlugin;
	} );
	/* eslint-enable @wordpress/wp-global-usage */

	it( "P4: replacing an island's content must clean up listeners of renderHTML-inserted nodes", async () => {
		const { state } = store( 'test/comp-P4', {
			state: { count: 0 },
			actions: {
				resize() {
					state.count += 1;
				},
			},
		} );
		const host = el(
			'<div data-wp-interactive="test/comp-P4"><div data-testid="content"></div></div>'
		);
		document.body.appendChild( host );
		const content = host.querySelector(
			'[data-testid="content"]'
		) as HTMLElement;

		renderHTML(
			content,
			'<span data-testid="ins" data-wp-on-window--resize="actions.resize"></span>'
		);
		await flush();
		expect( content.querySelector( '[data-testid="ins"]' ) ).not.toBeNull();

		// Replace the container's content (router-like): the old vnodes are
		// unmounted, so the inserted node's window listener is cleaned up.
		renderHTML( content, '<p>new content</p>', { position: 'inner' } );
		await flush();

		expect( content.querySelector( '[data-testid="ins"]' ) ).toBeNull();
		window.dispatchEvent( new Event( 'resize' ) );
		expect( state.count ).toBe( 0 );
	} );

	it( 'C4: text nodes mixed with elements survive re-renders by identity', () => {
		store( 'test/comp-C4', { state: { v: 'V', w: 'W' } } );
		const host = el(
			'<div data-wp-interactive="test/comp-C4"><div data-testid="parent"></div></div>'
		);
		document.body.appendChild( host );
		const parent = host.querySelector(
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

		// Re-render the FIRST fragment (same HTML) via `inner` — the matched
		// text nodes must survive BY IDENTITY (Preact reuses them), not just
		// by content: recreating them would break caret/selection in live
		// text. The second fragment (t/tail) is unmounted by the inner swap.
		const helloText = parent.childNodes[ 0 ];
		const worldText = parent.childNodes[ 2 ];

		renderHTML(
			parent,
			'hello <span data-testid="s" data-wp-text="state.v"></span> world',
			{ position: 'inner' }
		);

		expect( parent.childNodes.length ).toBe( 3 );
		expect( parent.childNodes[ 0 ] ).toBe( helloText );
		expect( ( parent.childNodes[ 0 ] as Text ).nodeValue ).toBe( 'hello ' );
		expect( parent.childNodes[ 1 ] ).toBe( s );
		expect( parent.childNodes[ 2 ] ).toBe( worldText );
		expect( ( parent.childNodes[ 2 ] as Text ).nodeValue ).toBe( ' world' );
	} );
} );
