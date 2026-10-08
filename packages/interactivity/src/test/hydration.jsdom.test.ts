import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'preact/test-utils';
import '../directives';
import { hydrateRegions } from '../hydration';
import { store } from '../store';
import { asDangerousHTML } from '../html';

/** Counter for store namespaces, whose registry persists between tests. */
let namespaceCount = 0;

/**
 * Provides an independent store namespace for each hydration fixture.
 *
 * @return A namespace unused by earlier tests.
 */
function uniqueNamespace(): string {
	return `test/hydration-${ ++namespaceCount }`;
}

describe( 'hydrateRegions', () => {
	beforeEach( () => {
		document.body.innerHTML = '';
	} );

	it.each( [ 'outside every island', 'inside an island' ] )(
		'keeps islands inside HTML content inert %s',
		async ( position ) => {
			const namespace = uniqueNamespace();
			const mark = vi.fn();
			const markFollowing = vi.fn();
			store( namespace, {
				state: {
					/** Empties owned HTML content during hydration. */
					html: null,
					/** Text rendered only by eligible islands. */
					label: 'hydrated',
				},
				actions: {
					/** Records initialization inside HTML content. */
					mark,
					/** Records initialization of the following ordinary island. */
					markFollowing,
				},
			} );
			const htmlElement = `<div data-wp-html="state.html"><div data-wp-interactive="${ namespace }" data-wp-init="actions.mark"><span data-wp-text="state.label">static</span></div></div>`;
			document.body.innerHTML =
				( position === 'inside an island'
					? `<div data-wp-interactive="${ namespace }">${ htmlElement }</div>`
					: htmlElement ) +
				`<div id="following" data-wp-interactive="${ namespace }" data-wp-init="actions.markFollowing"><span data-wp-text="state.label">static</span></div>`;

			const fallback = document.querySelector( '[data-wp-html] span' )!;
			await act( () => hydrateRegions() );

			expect( mark ).not.toHaveBeenCalled();
			expect( fallback ).toHaveTextContent( /^static$/ );
			const inside = position === 'inside an island';
			expect( fallback.isConnected ).toBe( ! inside );
			expect(
				document.querySelector( '[data-wp-html]' )!.outerHTML
			).toBe(
				inside ? '<div data-wp-html="state.html"></div>' : htmlElement
			);
			expect( markFollowing ).toHaveBeenCalledTimes( 1 );
			expect(
				document.querySelector( '#following span' )
			).toHaveTextContent( /^hydrated$/ );
		}
	);

	it( 'keeps fallback and inserted islands inert when trusted HTML replaces content during hydration and reactive updates', async () => {
		const namespace = uniqueNamespace();
		const mark = vi.fn();
		const markFollowing = vi.fn();
		const island = `<div data-wp-interactive="${ namespace }" data-wp-init="actions.mark"><span data-wp-text="state.label">static</span></div>`;
		const { state } = store( namespace, {
			state: {
				/** Replaces fallback islands while the initial snapshot is processed. */
				html: asDangerousHTML( `<section>${ island }</section>` ),
				/** Text that must not render inside either fallback or inserted HTML. */
				label: 'hydrated',
			},
			actions: {
				/** Records any initialization of an inert island. */
				mark,
				/** Records initialization after the replaced fallback in document order. */
				markFollowing,
			},
		} );
		document.body.innerHTML = `<div data-wp-interactive="${ namespace }"><div data-wp-html="state.html">${ island }</div></div><div id="following" data-wp-interactive="${ namespace }" data-wp-init="actions.markFollowing"><span data-wp-text="state.label">static</span></div>`;
		const target = document.querySelector( '[data-wp-html]' )!;
		const fallbackIsland = target.firstElementChild!;

		await act( () => hydrateRegions() );

		expect( fallbackIsland.isConnected ).toBe( false );
		expect( fallbackIsland.querySelector( 'span' ) ).toHaveTextContent(
			/^static$/
		);
		expect( target.innerHTML ).toBe( `<section>${ island }</section>` );
		expect( mark ).not.toHaveBeenCalled();
		expect( markFollowing ).toHaveBeenCalledTimes( 1 );
		expect( document.querySelector( '#following span' ) ).toHaveTextContent(
			/^hydrated$/
		);

		await act( () => {
			state.html = asDangerousHTML( `<article>${ island }</article>` );
			state.label = 'updated';
		} );

		expect( target.innerHTML ).toBe( `<article>${ island }</article>` );
		expect( mark ).not.toHaveBeenCalled();
		expect( document.querySelector( '#following span' ) ).toHaveTextContent(
			/^updated$/
		);
	} );

	it( 'hydrates an island that owns HTML content without hydrating its nested island', async () => {
		const namespace = uniqueNamespace();
		const mark = vi.fn();
		const markOwner = vi.fn();
		store( namespace, {
			state: {
				/** Leaves the owning island's fallback unchanged. */
				html: null,
			},
			actions: {
				/** Records initialization of the nested inert island. */
				mark,
				/** Records initialization on the HTML element itself. */
				markOwner,
			},
		} );
		document.body.innerHTML = `<div data-wp-interactive="${ namespace }" data-wp-html="state.html" data-wp-init="actions.markOwner"><div data-wp-interactive="${ namespace }" data-wp-init="actions.mark">static</div></div>`;

		await act( () => hydrateRegions() );

		expect( markOwner ).toHaveBeenCalledTimes( 1 );
		expect( mark ).not.toHaveBeenCalled();
	} );
} );
