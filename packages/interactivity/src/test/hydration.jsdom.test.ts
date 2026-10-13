import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'preact/test-utils';
import '../directives';
import { hydrateRegions, initialVdom } from '../hydration';
import { populateServerData, store } from '../store';
import { getElement } from '../scopes';
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

	it.each( [ false, true ] )(
		'hydrates HTML fallback islands only outside an interactive region (inside: %s)',
		async ( inside ) => {
			const namespace = uniqueNamespace();
			const mark = vi.fn();
			const markFollowing = vi.fn();
			populateServerData( {
				// Identifies HTML as a getter whose implementation is pending.
				state: { [ namespace ]: { html: {} } },
				derivedStateClosures: { [ namespace ]: [ 'state.html' ] },
			} );
			store( namespace, {
				state: {
					/** Text rendered only by eligible islands. */
					label: 'live',
				},
				actions: {
					/** Records initialization inside HTML content. */
					mark,
					/** Records initialization of the following ordinary island. */
					markFollowing,
				},
			} );
			const htmlElement = `<div data-wp-html="state.html"><p>fallback</p><div data-wp-interactive="${ namespace }" data-wp-init="actions.mark"><span data-wp-text="state.label">static</span></div></div>`;
			document.body.innerHTML =
				( inside
					? `<div data-wp-interactive="${ namespace }">${ htmlElement }</div>`
					: htmlElement ) +
				`<div id="following" data-wp-interactive="${ namespace }" data-wp-init="actions.markFollowing"><span data-wp-text="state.label">static</span></div>`;

			const fallback = document.querySelector( '[data-wp-html] span' )!;
			const paragraph = document.querySelector( 'p' )!;
			const island = fallback.parentElement!;
			const roots = [
				...document.querySelectorAll( '[data-wp-interactive]' ),
			].filter(
				( node ) =>
					! node.parentElement?.closest( '[data-wp-interactive]' )
			);
			await act( () => hydrateRegions() );

			expect( mark ).toHaveBeenCalledTimes( inside ? 0 : 1 );
			expect( fallback ).toHaveTextContent(
				inside ? /^static$/ : /^live$/
			);
			expect( fallback.isConnected ).toBe( true );
			expect( document.querySelector( 'p' ) ).toBe( paragraph );
			expect( paragraph ).toHaveTextContent( /^fallback$/ );
			expect( initialVdom.has( island ) ).toBe( ! inside );
			for ( const root of roots ) {
				expect( initialVdom.has( root ) ).toBe( true );
			}
			expect( markFollowing ).toHaveBeenCalledTimes( 1 );
			expect(
				document.querySelector( '#following span' )
			).toHaveTextContent( /^live$/ );
		}
	);

	it.each( [ false, true ] )(
		'runs template islands, never server item islands, when the list is pending: %s',
		async ( pending ) => {
			const namespace = uniqueNamespace();
			const origins: unknown[] = [];
			const after = vi.fn();
			if ( pending ) {
				populateServerData( {
					// The list's getter has not yet registered on the client.
					state: { [ namespace ]: { list: {} } },
					derivedStateClosures: { [ namespace ]: [ 'state.list' ] },
				} );
			}
			store( namespace, {
				state: pending
					? {}
					: {
							/** Items whose template islands run as part of the list. */
							list: [ 'one', 'two' ],
						},
				actions: {
					/** Records the origin of every initialized list island. */
					mark: () => {
						origins.push(
							Reflect.get(
								getElement().attributes,
								'data-origin'
							)
						);
					},
					/** Records initialization of the separate following island. */
					after,
				},
			} );
			const serverItem = `<div data-wp-each-child="${ namespace }::state.list"><div data-wp-interactive="${ namespace }" data-wp-init="actions.mark" data-origin="server"></div></div>`;
			document.body.innerHTML = `<div id="list" data-wp-interactive="${ namespace }"><template data-wp-each="state.list"><div data-wp-interactive="${ namespace }" data-wp-init="actions.mark" data-origin="template"></div></template>${ serverItem }${ serverItem }</div><div id="following" data-wp-interactive="${ namespace }" data-wp-init="actions.after"></div>`;
			const roots = [
				document.querySelector( '#list' )!,
				document.querySelector( '#following' )!,
			];
			const serverItems = [
				...document.querySelectorAll( '[data-wp-each-child]' ),
			];
			const serverIslands = serverItems.map(
				( item ) => item.firstElementChild!
			);

			await act( () => hydrateRegions() );

			expect( origins ).toEqual(
				pending ? [] : [ 'template', 'template' ]
			);
			expect( after ).toHaveBeenCalledTimes( 1 );
			for ( const root of roots ) {
				expect( initialVdom.has( root ) ).toBe( true );
			}
			for ( const island of serverIslands ) {
				expect( initialVdom.has( island ) ).toBe( false );
			}
			expect(
				[
					...document.querySelectorAll( '[data-origin="server"]' ),
				].map( ( island ) => island.parentElement )
			).toEqual( pending ? serverItems : [] );
			expect(
				serverIslands.every( ( island ) => island.isConnected )
			).toBe( pending );
			if ( pending ) {
				await act( async () => {
					store( namespace, {
						state: {
							/**
							 * Supplies the pending derived list.
							 *
							 * @return The two list items to render.
							 */
							get list() {
								return [ 'one', 'two' ];
							},
						},
					} );
				} );
			}
			expect( origins ).toEqual( [ 'template', 'template' ] );
			expect(
				serverIslands.every( ( island ) => ! island.isConnected )
			).toBe( true );
			expect( after ).toHaveBeenCalledTimes( 1 );
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
} );
