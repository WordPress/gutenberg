import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act } from 'preact/test-utils';
import '../directives';
import { closestHtmlDirectiveElement, hydrateRegions } from '../hydration';
import { store } from '../store';
import { asDangerousHTML } from '../html';

/**
 * Creates a detached element for an ancestor-check fixture.
 *
 * @param html Markup with one root element.
 * @return The fixture's root element.
 */
function createElementFromHTML( html: string ): HTMLElement {
	const div = document.createElement( 'div' );
	div.innerHTML = html.trim();
	return div.firstChild as HTMLElement;
}

describe( 'closestHtmlDirectiveElement', () => {
	it.each( [
		'data-wp-html',
		'data-wp-html--',
		'data-wp-html---',
		'data-wp-html---id',
	] )(
		'finds an inclusive ancestor with %s, independently of its value',
		( attribute ) => {
			const outer = createElementFromHTML(
				`<div ${ attribute }="missing::state.html"><span></span></div>`
			);
			const child = outer.firstElementChild!;
			expect( closestHtmlDirectiveElement( outer ) ).toBe( outer );
			expect( closestHtmlDirectiveElement( child ) ).toBe( outer );
			expect( closestHtmlDirectiveElement( child.parentElement! ) ).toBe(
				outer
			);
			expect(
				closestHtmlDirectiveElement( outer.parentElement! )
			).toBeNull();
		}
	);
	it.each(
		[ 'text', 'each', 'router-region' ].flatMap( ( prefix ) =>
			[
				'',
				'--',
				'---',
				'--x',
				'---id',
				'--x---id',
				'----',
				'------',
			].map( ( suffix ) => `data-wp-${ prefix }${ suffix }` )
		)
	)( 'excludes an element with the conflict %s', ( attribute ) => {
		const outer = createElementFromHTML(
			`<div data-wp-html ${ attribute }="null"><span></span></div>`
		);
		expect( closestHtmlDirectiveElement( outer ) ).toBeNull();
		expect(
			closestHtmlDirectiveElement( outer.firstElementChild! )
		).toBeNull();
	} );
	it.each( [
		'',
		'data-wp-html--suffix',
		'data-wp-html----',
		'data-wp-html[name]',
		'other-data-wp-html',
	] )( 'does not treat %s as a default HTML directive', ( attribute ) => {
		const element = createElementFromHTML(
			`<div ${ attribute }><span></span></div>`
		);
		expect(
			closestHtmlDirectiveElement( element.firstElementChild! )
		).toBeNull();
	} );
	it( 'finds the nearest eligible ancestor through a conflicting element', () => {
		const outer = createElementFromHTML(
			'<div data-wp-html><section data-wp-html><div data-wp-html data-wp-text><span></span></div></section></div>'
		);
		const inner = outer.firstElementChild!;
		expect(
			closestHtmlDirectiveElement( outer.querySelector( 'span' )! )
		).toBe( inner );
		expect( closestHtmlDirectiveElement( inner ) ).toBe( inner );
		expect( closestHtmlDirectiveElement( inner.parentElement! ) ).toBe(
			outer
		);
	} );
	it( 'ignores attributes that do not parse to a conflicting directive', () => {
		const element = createElementFromHTML(
			'<div data-wp-html data-wp-interactive="ns" data-wp-textual data-wp-each-child data-wp-text[x]></div>'
		);
		expect( closestHtmlDirectiveElement( element ) ).toBe( element );
	} );
} );

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
				/** Empties the owning island's HTML content during hydration. */
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
