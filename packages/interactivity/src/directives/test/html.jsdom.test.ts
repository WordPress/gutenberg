import { describe, expect, it, beforeEach } from 'vitest';
import { hydrate } from 'preact';
import { act } from 'preact/test-utils';
import '../index'; // Registers all core directives, including `html`.
import { hydratedIslands, toVdom } from '../../vdom';
import { store } from '../../store';
import { asDangerousHTML } from '../../html';

let namespaceCount = 0;

// Each test gets its own store namespace: the store registry is a module
// singleton, so reusing a namespace across tests would leak state.
function uniqueNamespace(): string {
	return `test/html-${ ++namespaceCount }`;
}

function createRegion( namespace: string, innerHtml: string ): HTMLElement {
	const container = document.createElement( 'div' );
	container.innerHTML = `<div data-wp-interactive='{ "namespace": "${ namespace }" }'>${ innerHtml }</div>`;
	document.body.appendChild( container );
	return container.firstElementChild as HTMLElement;
}

describe( 'data-wp-html', () => {
	beforeEach( () => {
		document.body.innerHTML = '';
		// @ts-expect-error `_values` is an internal property, accessed here for testing.
		hydratedIslands._values = new WeakMap();
	} );

	it( 'renders trusted HTML from asDangerousHTML()', async () => {
		const namespace = uniqueNamespace();
		const { state } = store( namespace, {
			state: { html: asDangerousHTML( '<strong>Hi</strong>' ) },
		} );

		const region = createRegion(
			namespace,
			'<div data-wp-html="state.html">fallback</div>'
		);
		await act( () => hydrate( toVdom( region ), region.parentNode! ) );

		const target = region.querySelector( 'div' )!;
		expect( target.innerHTML ).toBe( '<strong>Hi</strong>' );

		await act( () => {
			state.html = asDangerousHTML( '<em>Bye</em>' );
		} );
		expect( target.innerHTML ).toBe( '<em>Bye</em>' );
	} );

	it( 'leaves server-rendered content in place while the value is not trusted HTML yet', async () => {
		const namespace = uniqueNamespace();
		store( namespace, { state: { html: null } } );

		const region = createRegion(
			namespace,
			'<div data-wp-html="state.html"><p>Loading…</p></div>'
		);
		await act( () => hydrate( toVdom( region ), region.parentNode! ) );

		const target = region.querySelector( 'div' )!;
		expect( target.innerHTML ).toBe( '<p>Loading…</p>' );
	} );

	it( 'does not render a plain string as HTML', async () => {
		const namespace = uniqueNamespace();
		store( namespace, { state: { html: '<strong>Not safe</strong>' } } );

		const region = createRegion(
			namespace,
			'<div data-wp-html="state.html"><p>fallback</p></div>'
		);
		await act( () => hydrate( toVdom( region ), region.parentNode! ) );

		const target = region.querySelector( 'div' )!;
		expect( target.innerHTML ).toBe( '<p>fallback</p>' );
	} );

	it( 'keeps the last rendered HTML when the value later becomes untrusted', async () => {
		const namespace = uniqueNamespace();
		const { state } = store( namespace, {
			state: { html: asDangerousHTML( '<strong>Hi</strong>' ) },
		} );

		const region = createRegion(
			namespace,
			'<div data-wp-html="state.html">fallback</div>'
		);
		await act( () => hydrate( toVdom( region ), region.parentNode! ) );

		const target = region.querySelector( 'div' )!;
		expect( target.innerHTML ).toBe( '<strong>Hi</strong>' );

		// A later value that resolves to `null` must not wipe the HTML that
		// was already rendered — the directive should keep showing the last
		// trusted HTML it received.
		await act( () => {
			// @ts-expect-error Testing an invalid runtime value on purpose.
			state.html = null;
		} );
		expect( target.innerHTML ).toBe( '<strong>Hi</strong>' );
	} );

	it( 'ignores suffixed and unique-ID variants', async () => {
		const namespace = uniqueNamespace();
		store( namespace, {
			state: { html: asDangerousHTML( '<strong>Hi</strong>' ) },
		} );

		const region = createRegion(
			namespace,
			'<div data-wp-html--suffix="state.html"><p>a</p></div>' +
				'<div data-wp-html---unique-id="state.html"><p>b</p></div>'
		);
		await act( () => hydrate( toVdom( region ), region.parentNode! ) );

		const [ suffixed, uniqueId ] = region.querySelectorAll( 'div' );
		expect( suffixed.innerHTML ).toBe( '<p>a</p>' );
		expect( uniqueId.innerHTML ).toBe( '<p>b</p>' );
		expect( console ).toHaveWarned();
	} );
} );
