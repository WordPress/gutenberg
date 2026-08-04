/**
 * External dependencies
 */
import { store } from '../store';
import { getContext } from '../scopes';

/**
 * Internal dependencies
 */
import '../directives'; // Registers all the core directives.
import { renderElement, renderHTML } from '../render';

function el( html: string ): HTMLElement {
	const host = document.createElement( 'div' );
	host.innerHTML = html;
	return host.firstElementChild as HTMLElement;
}

describe( 'renderElement', () => {
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

	it( 'throws when the element is not attached to the DOM', () => {
		const node = el(
			'<div data-wp-interactive="test/render-element"></div>'
		);
		node.remove();
		expect( () => renderElement( node ) ).toThrow( /attached to the DOM/ );
	} );

	it( 'hydrates directives on an inserted element', () => {
		store( 'test/render-element', { state: { message: 'hello' } } );
		const node = el(
			'<div data-wp-interactive="test/render-element">' +
				'<span data-testid="out" data-wp-text="state.message"></span>' +
				'</div>'
		);
		document.body.appendChild( node );

		renderElement( node );

		expect( node.querySelector( '[data-testid="out"]' )?.textContent ).toBe(
			'hello'
		);
	} );

	it( 'binds event handlers exactly once and updates in place on re-render', () => {
		const { state } = store( 'test/render-element', {
			state: { count: 0 },
			actions: {
				increment() {
					state.count += 1;
				},
			},
		} );
		const node = el(
			'<div data-wp-interactive="test/render-element">' +
				'<button data-testid="btn" data-wp-on--click="actions.increment"></button>' +
				'</div>'
		);
		document.body.appendChild( node );

		renderElement( node );
		const btn = node.querySelector(
			'[data-testid="btn"]'
		) as HTMLButtonElement;

		btn.click();
		btn.click();
		expect( state.count ).toBe( 2 );

		// Re-render the SAME node: diff in place, must NOT double-bind.
		renderElement( node );
		btn.click();
		expect( state.count ).toBe( 3 );
	} );

	it( 'hydrates nested islands in a single pass', () => {
		store( 'test/outer', { state: { label: 'outer' } } );
		store( 'test/inner', { state: { label: 'inner' } } );
		const node = el(
			'<div data-wp-interactive="test/outer">' +
				'<span data-testid="outer" data-wp-text="state.label"></span>' +
				'<div data-wp-interactive="test/inner">' +
				'<span data-testid="inner" data-wp-text="state.label"></span>' +
				'</div>' +
				'</div>'
		);
		document.body.appendChild( node );

		renderElement( node );

		expect(
			node.querySelector( '[data-testid="outer"]' )?.textContent
		).toBe( 'outer' );
		expect(
			node.querySelector( '[data-testid="inner"]' )?.textContent
		).toBe( 'inner' );
	} );

	it( 'does not affect sibling elements', () => {
		store( 'test/render-element', { state: { message: 'hello' } } );
		const card = el(
			'<article data-wp-interactive="test/render-element"></article>'
		);
		// Server-rendered sibling OUTSIDE any island, with an unprocessed directive.
		const sibling = el(
			'<div class="other-card">' +
				'<span data-wp-text="state.message">server text</span>' +
				'</div>'
		);
		const list = document.createElement( 'div' );
		document.body.appendChild( list );
		list.append( card, sibling );

		renderElement( card );

		// Sibling was NOT processed: directive untouched, server text intact.
		expect( sibling.querySelector( 'span' )?.textContent ).toBe(
			'server text'
		);
	} );

	it( 'renders an array of contiguous siblings with a single call', () => {
		store( 'test/render-element', { state: { message: 'hello' } } );
		const a = el(
			'<span data-wp-interactive="test/render-element" data-wp-text="state.message"></span>'
		);
		const b = el(
			'<span data-wp-interactive="test/render-element" data-wp-text="state.message"></span>'
		);
		const host = document.createElement( 'div' );
		document.body.appendChild( host );
		host.append( a, b );

		renderElement( [ a, b ] );

		// @ts-expect-error jest-dom matcher is added by the test setup.
		expect( a ).toHaveTextContent( 'hello' );
		// @ts-expect-error jest-dom matcher is added by the test setup.
		expect( b ).toHaveTextContent( 'hello' );
	} );

	it( 'keeps data-wp-ignore subtrees inert', () => {
		store( 'test/render-element', { state: { message: 'hello' } } );
		const node = el(
			'<div data-wp-interactive="test/render-element">' +
				'<div data-wp-ignore>' +
				'<span data-wp-text="state.message">keep</span>' +
				'</div>' +
				'</div>'
		);
		document.body.appendChild( node );

		renderElement( node );

		expect(
			node.querySelector( '[data-wp-ignore] span' )?.textContent
		).toBe( 'keep' );
		// @ts-expect-error jest-console matcher is added by the test setup.
		expect( console ).toHaveWarnedWith(
			'The data-wp-ignore directive is deprecated and will be removed in version 7.0.'
		);
	} );

	it( 'hydrates a plain fragment inside an existing island, inheriting its namespace and context', () => {
		store( 'test/render-element', { state: { message: 'hello' } } );
		// Existing island with its own context, already in the live DOM.
		const island = el(
			'<div data-wp-interactive="test/render-element" ' +
				"data-wp-context='{ \"label\": \"ctx\" }'>" +
				'<span data-testid="target"></span>' +
				'</div>'
		);
		document.body.appendChild( island );

		// The block's directives must be hydrated for the registry to have an
		// entry at the insertion point. Render the island itself first.
		renderElement( island );

		// Plain fragment WITHOUT data-wp-interactive, inserted inside.
		const node = el(
			'<span data-testid="out" data-wp-text="state.message"></span>'
		);
		island.querySelector( '[data-testid="target"]' )!.appendChild( node );

		renderElement( node );

		expect( node.textContent ).toBe( 'hello' );

		// A second fragment reading context.
		const ctxNode = el(
			'<button data-testid="ctx-out" data-wp-text="context.label"></button>'
		);
		island.querySelector( '[data-testid="target"]' )!.appendChild( ctxNode );
		renderElement( ctxNode );

		expect( ctxNode.textContent ).toBe( 'ctx' );
	} );

	it( 'warns and skips when the element has no enclosing island', () => {
		store( 'test/render-element', { state: { message: 'hello' } } );
		const node = el(
			'<div><span data-testid="out" data-wp-text="state.message"></span></div>'
		);
		document.body.appendChild( node );

		renderElement( node );

		// Directive unprocessed — server text intact.
		expect(
			node.querySelector( '[data-testid="out"]' )?.textContent
		).toBe( '' );
		// @ts-expect-error jest-console matcher is added by the test setup.
		expect( console ).toHaveWarnedWith(
			'renderElement(): no interactive island found for the inserted element. The element must be inside a [data-wp-interactive] subtree or have its own data-wp-interactive attribute.'
		);
	} );

	it( 'hydrates a self-contained island fragment with no ancestor, without warning', () => {
		store( 'test/render-element', { state: { message: 'hello' } } );
		const node = el(
			'<div data-wp-interactive="test/render-element">' +
				'<span data-testid="out" data-wp-text="state.message"></span>' +
				'</div>'
		);
		document.body.appendChild( node );

		renderElement( node );

		expect(
			node.querySelector( '[data-testid="out"]' )?.textContent
		).toBe( 'hello' );
		// @ts-expect-error jest-console matcher is added by the test setup.
		expect( console ).not.toHaveWarned();
	} );

	it( 'lets a fragment write through to the island context, and the island reacts', async () => {
		store( 'test/render-element', {
			actions: {
				increment() {
					const context = getContext() as { count: number };
					context.count += 1;
				},
			},
		} );
		const island = el(
			'<div data-wp-interactive="test/render-element" ' +
				"data-wp-context='{ \"count\": 0 }'>" +
				'<span data-testid="island-count" data-wp-text="context.count"></span>' +
				'<span data-testid="target"></span>' +
				'</div>'
		);
		document.body.appendChild( island );
		renderElement( island );

		const node = el(
			'<button data-testid="btn" data-wp-on--click="actions.increment"></button>'
		);
		island.querySelector( '[data-testid="target"]' )!.appendChild( node );
		renderElement( node );

		const btn = node as HTMLButtonElement;
		btn.click();
		btn.click();

		// The island's own element must react to the fragment's write-through.
		// The reactive update is flushed after the next animation frame, so
		// wait for it before asserting.
		await new Promise( ( resolve ) => requestAnimationFrame( resolve ) );
		await new Promise( ( resolve ) => requestAnimationFrame( resolve ) );

		expect(
			island.querySelector( '[data-testid="island-count"]' )?.textContent
		).toBe( '2' );
	} );

	it( 'updates a kept node with fresh server markup in place', () => {
		store( 'test/render-element', { state: { message: 'hello' } } );
		const node = el(
			'<div data-wp-interactive="test/render-element">' +
				'<span data-testid="out" data-wp-text="state.message"></span>' +
				'</div>'
		);
		document.body.appendChild( node );
		renderElement( node );
		expect(
			node.querySelector( '[data-testid="out"]' )?.textContent
		).toBe( 'hello' );

		// Change the state and re-render the SAME node: the directive must
		// re-evaluate against the new state, updating in place.
		store( 'test/render-element', { state: { message: 'updated' } } );
		renderElement( node );
		expect(
			node.querySelector( '[data-testid="out"]' )?.textContent
		).toBe( 'updated' );
	} );
} );

describe( 'renderHTML', () => {
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

	it( 'parses HTML, inserts it into the container, and hydrates directives', () => {
		store( 'test/render-element', { state: { message: 'hello' } } );
		const container = el(
			'<div data-wp-interactive="test/render-element">' +
				'<div data-testid="target"></div>' +
				'</div>'
		);
		document.body.appendChild( container );
		// Hydrate the island so the registry has an entry at the target.
		renderElement( container );

		const target = container.querySelector(
			'[data-testid="target"]'
		) as HTMLElement;
		renderHTML(
			target,
			'<span data-testid="out" data-wp-text="state.message"></span>'
		);

		expect(
			target.querySelector( '[data-testid="out"]' )?.textContent
		).toBe( 'hello' );
	} );

	it( 'appends by default', () => {
		store( 'test/render-element', { state: {} } );
		const container = el(
			'<div data-wp-interactive="test/render-element">' +
				'<div data-testid="target"><span data-testid="existing">keep</span></div>' +
				'</div>'
		);
		document.body.appendChild( container );
		renderElement( container );

		const target = container.querySelector(
			'[data-testid="target"]'
		) as HTMLElement;
		renderHTML(
			target,
			'<span data-testid="added">new</span>'
		);

		expect(
			target.querySelector( '[data-testid="existing"]' )
		).not.toBeNull();
		expect(
			target.querySelector( '[data-testid="added"]' )
		).not.toBeNull();
	} );

	it( 'prepends when position is "prepend"', () => {
		store( 'test/render-element', { state: {} } );
		const container = el(
			'<div data-wp-interactive="test/render-element">' +
				'<div data-testid="target"><span data-testid="existing">keep</span></div>' +
				'</div>'
		);
		document.body.appendChild( container );
		renderElement( container );

		const target = container.querySelector(
			'[data-testid="target"]'
		) as HTMLElement;
		renderHTML(
			target,
			'<span data-testid="added">new</span>',
			{ position: 'prepend' }
		);

		expect( target.firstElementChild?.getAttribute( 'data-testid' ) ).toBe(
			'added'
		);
	} );

	it( 'replaces children when position is "replace"', () => {
		store( 'test/render-element', { state: {} } );
		const container = el(
			'<div data-wp-interactive="test/render-element">' +
				'<div data-testid="target"><span data-testid="existing">old</span></div>' +
				'</div>'
		);
		document.body.appendChild( container );
		renderElement( container );

		const target = container.querySelector(
			'[data-testid="target"]'
		) as HTMLElement;
		renderHTML(
			target,
			'<span data-testid="added">new</span>',
			{ position: 'replace' }
		);

		expect(
			target.querySelector( '[data-testid="existing"]' )
		).toBeNull();
		expect(
			target.querySelector( '[data-testid="added"]' )
		).not.toBeNull();
	} );

	it( 'hydrates a plain fragment inside an existing island via the container', () => {
		store( 'test/render-element', { state: { message: 'hello' } } );
		const container = el(
			'<div data-wp-interactive="test/render-element" ' +
				"data-wp-context='{ \"label\": \"ctx\" }'>" +
				'<div data-testid="target"></div>' +
				'</div>'
		);
		document.body.appendChild( container );
		renderElement( container );

		const target = container.querySelector(
			'[data-testid="target"]'
		) as HTMLElement;
		renderHTML(
			target,
			'<span data-testid="out" data-wp-text="context.label"></span>'
		);

		expect(
			target.querySelector( '[data-testid="out"]' )?.textContent
		).toBe( 'ctx' );
	} );
} );
