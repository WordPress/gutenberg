/**
 * External dependencies
 */
import { store } from '../store';

/**
 * Internal dependencies
 */
import '../directives'; // Registers all the core directives.
import { renderElement } from '../render';

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
} );
