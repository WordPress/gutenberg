/**
 * @jest-environment jsdom
 */

/**
 * Comprehensive fragment invariants — many overlapping insertions,
 * deletions, moves, and repeated updates with context.
 *
 * This file is intentionally placed in `tu`-style revision *before* fixes,
 * so every `it` here describes CORRECT behaviour that CURRENTLY FAILS or
 * is fragile. The next jj revision should make them PASS.
 */
import '../directives';
import { store } from '../store';
import { getContext } from '../scopes';
import { renderElement, renderHTML } from '../render';

function el( html: string ): HTMLElement {
	const host = document.createElement( 'div' );
	host.innerHTML = html;
	return host.firstElementChild as HTMLElement;
}
function txt( s: string ): Text {
	return document.createTextNode( s );
}
const flush = async () => {
	await new Promise( ( r ) => requestAnimationFrame( r ) );
	await new Promise( ( r ) => requestAnimationFrame( r ) );
};

describe( 'render comprehensive — overlapping siblings/ancestors/descendants, moves, repeated updates, context', () => {
	/* eslint-disable @wordpress/wp-global-usage */
	const testGlobalThis = globalThis as typeof globalThis & {
		IS_GUTENBERG_PLUGIN?: boolean;
	};
	let originalIsGutenbergPlugin: boolean | undefined;

	beforeEach( () => {
		document.body.innerHTML = '';
		originalIsGutenbergPlugin = testGlobalThis.IS_GUTENBERG_PLUGIN;
		testGlobalThis.IS_GUTENBERG_PLUGIN = false;
		// jsdom's performance lacks .measure — stub it so data-wp-on
		// doesn't throw when SCRIPT_DEBUG is true.
		if ( typeof performance.measure !== 'function' ) {
			// @ts-ignore
			performance.measure = () => {};
		}
		if ( typeof performance.mark !== 'function' ) {
			// @ts-ignore
			performance.mark = () => ( {} as PerformanceMark );
		}
		if ( typeof performance.now !== 'function' ) {
			// @ts-ignore
			performance.now = () => Date.now();
		}
	} );

	afterEach( () => {
		testGlobalThis.IS_GUTENBERG_PLUGIN = originalIsGutenbergPlugin;
	} );
	/* eslint-enable @wordpress/wp-global-usage */

	// ------------------------------------------------------------------
	// A. Overlapping sibling insertions under same parent
	// ------------------------------------------------------------------
	describe( 'A overlapping sibling insertions', () => {
		it( 'A1: [a,b] as non-contiguous fragment with gap already between — must keep gap but moves it', () => {
			store( 'test/comp-A1', { state: { a: 'A', b: 'B', c: 'C', d: 'D' } } );
			const host = el(
				'<div data-wp-interactive="test/comp-A1"><div data-testid="parent"></div></div>'
			);
			document.body.appendChild( host );
			const parent = host.querySelector( '[data-testid="parent"]' ) as HTMLElement;
			renderElement( host );

			const a = el( '<span data-testid="a" data-wp-text="state.a"></span>' );
			const gap = el( '<span data-testid="gap">GAP</span>' );
			const b = el( '<span data-testid="b" data-wp-text="state.b"></span>' );
			const c = el( '<span data-testid="c" data-wp-text="state.c"></span>' );
			const d = el( '<span data-testid="d" data-wp-text="state.d"></span>' );

			// Create DOM with gap already between a and b BEFORE first fragment render.
			// This makes [a,b] non-contiguous at creation time.
			parent.append( a, gap, b, c, d );
			renderElement( [ a, b ] );
			expect( a.textContent ).toBe( 'A' );
			expect( b.textContent ).toBe( 'B' );
			// Correct: gap must stay between a and b. Current moves gap to after b.
			expect( Array.from( parent.children ).map( ( e ) => ( e as HTMLElement ).dataset.testid ) ).toEqual(
				[ 'a', 'gap', 'b', 'c', 'd' ]
			);
			// Second fragment under same parent also non-contiguous would compound
			renderElement( [ c, d ] );
			expect( Array.from( parent.children ).map( ( e ) => ( e as HTMLElement ).dataset.testid ) ).toEqual(
				[ 'a', 'gap', 'b', 'c', 'd' ]
			);
		} );

		it( 'A2: non-contiguous [a,b] with gap between — gap untouched', () => {
			store( 'test/comp-A2', { state: { a: 'A', b: 'B' } } );
			const host = el( '<div data-wp-interactive="test/comp-A2"><div data-testid="parent"></div></div>' );
			document.body.appendChild( host );
			const parent = host.querySelector( '[data-testid="parent"]' ) as HTMLElement;
			renderElement( host );

			const a = el( '<span data-testid="a" data-wp-text="state.a"></span>' );
			const gap = el( '<span data-testid="gap">GAP</span>' );
			const b = el( '<span data-testid="b" data-wp-text="state.b"></span>' );
			parent.append( a, gap, b );

			// Render only a and b — gap is between them in DOM but not in nodes
			// Correct: gap should survive; a,b should hydrate.
			// Current impl treats gap as between anchor and will drop or move it.
			renderElement( [ a, b ] );
			expect( a.textContent ).toBe( 'A' );
			expect( b.textContent ).toBe( 'B' );
			expect( parent.querySelector( '[data-testid="gap"]' )!.textContent ).toBe( 'GAP' );
			expect( parent.children.length ).toBe( 3 );
			expect( Array.from( parent.children ).map( ( e ) => ( e as HTMLElement ).dataset.testid ) ).toEqual(
				[ 'a', 'gap', 'b' ]
			);
		} );

		it( 'A3: arbitrary overlapping sequences [a,b]->[c,d]->[a,d]->[b,c] — idempotent, no duplicates', () => {
			store( 'test/comp-A3', { state: { v: 'X' } } );
			const host = el( '<div data-wp-interactive="test/comp-A3"><div data-testid="parent"></div></div>' );
			document.body.appendChild( host );
			const parent = host.querySelector( '[data-testid="parent"]' ) as HTMLElement;
			renderElement( host );

			const a = el( '<span data-testid="a" data-wp-text="state.v">a</span>' );
			const b = el( '<span data-testid="b" data-wp-text="state.v">b</span>' );
			const c = el( '<span data-testid="c" data-wp-text="state.v">c</span>' );
			const d = el( '<span data-testid="d" data-wp-text="state.v">d</span>' );
			parent.append( a, b, c, d );

			renderElement( [ a, b ] );
			renderElement( [ c, d ] );
			renderElement( [ a, d ] );
			renderElement( [ b, c ] );

			// After arbitrary overlapping renders, all 4 should still be there exactly once, in original order.
			expect( parent.children.length ).toBe( 4 );
			expect( Array.from( parent.children ).map( ( e ) => ( e as HTMLElement ).dataset.testid ) ).toEqual(
				[ 'a', 'b', 'c', 'd' ]
			);
			// Re-render same arbitrary set again — still idempotent
			renderElement( [ a, d ] );
			expect( parent.children.length ).toBe( 4 );
		} );

		it( 'A4: deletion + stale childNodes — remove b, then render [a,c] must not resurrect b and must update order', () => {
			store( 'test/comp-A4', { state: { a: 'A', c: 'C' } } );
			const host = el( '<div data-wp-interactive="test/comp-A4"><div data-testid="parent"></div></div>' );
			document.body.appendChild( host );
			const parent = host.querySelector( '[data-testid="parent"]' ) as HTMLElement;
			renderElement( host );
			const a = el( '<span data-testid="a" data-wp-text="state.a"></span>' );
			const b = el( '<span data-testid="b" data-wp-text="state.a">B</span>' );
			const c = el( '<span data-testid="c" data-wp-text="state.c"></span>' );
			const d = el( '<span data-testid="d">D</span>' );
			parent.append( a, b, c, d );
			renderElement( [ a, b, c ] );
			expect( parent.children.length ).toBe( 4 );

			b.remove();
			// Cached fragment [a,b,c] now has stale childNodes (b disconnected). New render [a,c] shares first node a.
			// Current impl recreates fragment for a (childNodes mismatch) but parent.__k still points to old fragment with anchor b.nextSibling=c -> stale.
			renderElement( [ a, c ] );
			expect( parent.querySelector( '[data-testid="b"]' ) ).toBeNull();
			expect( Array.from( parent.children ).map( ( e ) => ( e as HTMLElement ).dataset.testid ) ).toEqual(
				[ 'a', 'c', 'd' ]
			);
			// d is after c; fragment anchor for [a,c] should be d, not c's old anchor. Re-render [a,c] after mutating d should keep d.
			expect( () => renderElement( [ a, c ] ) ).not.toThrow();
			expect( Array.from( parent.children ).map( ( e ) => ( e as HTMLElement ).dataset.testid ) ).toEqual(
				[ 'a', 'c', 'd' ]
			);
		} );

		it( 'A5: move b from pA to pB while pA has fragment [a,b] and pB has [x] — old fragment anchor is b.nextSibling=null, move invalidates it', () => {
			store( 'test/comp-A5', { state: { m: 'M' } } );
			const host = el(
				'<div data-wp-interactive="test/comp-A5"><div data-testid="pA"></div><div data-testid="pB"></div></div>'
			);
			document.body.appendChild( host );
			const pA = host.querySelector( '[data-testid="pA"]' ) as HTMLElement;
			const pB = host.querySelector( '[data-testid="pB"]' ) as HTMLElement;
			pA.setAttribute( 'data-wp-context', '{"label":"A"}' );
			pB.setAttribute( 'data-wp-context', '{"label":"B"}' );
			renderElement( host );

			const a = el( '<span data-testid="a" data-wp-text="context.label">keepA</span>' );
			const b = el( '<span data-testid="b" data-wp-text="context.label"></span>' );
			const x = el( '<span data-testid="x">x</span>' );
			pA.append( a, b );
			renderElement( [ a, b ] );
			pB.appendChild( x );
			renderElement( x );
			expect( b.textContent ).toBe( 'A' );

			// Move b to pB after x: pA=[a], pB=[x,b]; fragment [a,b] in pA now has stale childNodes [a,b] where b.parent !== pA and anchor=null.
			pB.appendChild( b );
			renderElement( b );
			expect( b.textContent ).toBe( 'B' );
			expect( pA.children.length ).toBe( 1 );
			expect( Array.from( pB.children ).map( ( e ) => ( e as HTMLElement ).dataset.testid ) ).toEqual( [ 'x', 'b' ] );

			// Re-render stale fragment root [a] alone in pA — must not resurrect stale b or clobber pB's [x,b].
			renderElement( [ a ] );
			expect( pA.querySelector( '[data-testid="b"]' ) ).toBeNull();
			expect( Array.from( pB.children ).map( ( e ) => ( e as HTMLElement ).dataset.testid ) ).toEqual( [ 'x', 'b' ] );
			// pA's fragment for a should still hydrate via new parent pA context A, not stale.
			expect( a.textContent ).toBe( 'A' );
		} );
	} );

	// ------------------------------------------------------------------
	// B. Ancestors / descendants
	// ------------------------------------------------------------------
	describe( 'B ancestors & descendants', () => {
		it( 'B1: outer and sibling fragments interleaved — mutate outer, then insert sibling gap and re-render sibling must not revert outer', async () => {
			store( 'test/comp-B1', {
				actions: {
					inc() {
						( getContext() as any ).count += 1;
					},
					addLeaf() {
						const c = getContext() as any;
						c.count += 1;
					},
				},
			} );
			const host = el(
				'<div data-wp-interactive="test/comp-B1" data-wp-context=\'{"count":0}\'>' +
					'<div data-testid="parent"></div>' +
					'<span data-testid="islandN" data-wp-text="context.count"></span>' +
					'</div>'
			);
			document.body.appendChild( host );
			const parent = host.querySelector( '[data-testid="parent"]' ) as HTMLElement;
			renderElement( host );

			const outer = el(
				'<div data-testid="outer" data-wp-context=\'{"count":10}\'><div data-testid="mid"><span data-testid="leaf" data-wp-text="context.count"></span><button data-testid="btn" data-wp-on--click="actions.inc"></button></div></div>'
			);
			parent.appendChild( outer );
			renderElement( outer );

			const sibling = el( '<span data-testid="sibling" data-wp-text="context.count"></span>' );
			parent.appendChild( sibling );
			renderElement( sibling );

			( outer.querySelector( '[data-testid="btn"]' ) as HTMLButtonElement ).click();
			await flush();
			expect( outer.querySelector( '[data-testid="leaf"]' )!.textContent ).toBe( '11' );
			expect( sibling.textContent ).toBe( '0' );

			// Insert another element inside outer, then re-render sibling — outer must stay 11 (fragment isolation via parent.__k single slot would revert).
			const extra = el( '<span data-testid="extra" data-wp-text="context.count"></span>' );
			outer.querySelector( '[data-testid="mid"]' )!.appendChild( extra );
			renderElement( extra );
			expect( extra.textContent ).toBe( '11' );

			renderElement( sibling );
			expect( outer.querySelector( '[data-testid="leaf"]' )!.textContent ).toBe( '11' );
			expect( extra.textContent ).toBe( '11' );
			expect( sibling.textContent ).toBe( '0' );
			expect( parent.children.length ).toBe( 2 );
		} );

		it( 'B2: wrap [a] then [b,c] under same wrap — re-render wrap must not drop b,c (parent.__k single slot)', async () => {
			// B2-ext: b and c carry data-wp-init counters so a re-render that
			// re-mounts them (fresh DOM) is observable — the Option 3 fix must
			// reuse the existing vnodes instead (no re-init).
			const { state } = store( 'test/comp-B2', {
				state: { a: 'A', b: 'B', c: 'C', initCount: 0 },
				actions: {
					initB() {
						state.initCount += 1;
					},
					initC() {
						state.initCount += 1;
					},
				},
			} );
			const host = el( '<div data-wp-interactive="test/comp-B2"><div data-testid="parent"></div></div>' );
			document.body.appendChild( host );
			const parent = host.querySelector( '[data-testid="parent"]' ) as HTMLElement;
			renderElement( host );

			const wrap = el( '<div data-testid="wrap"><span data-testid="a" data-wp-text="state.a"></span></div>' );
			parent.appendChild( wrap );
			// wrap is its own island/fragment [wrap] parent=host
			renderElement( wrap );

			// wrap's children are a separate fragment [b,c] parent=wrap, same wrap element as parent.
			// wrap fragment anchor is null under host; [b,c] anchor is null under wrap.
			// But wrap's fragment in hydration.ts is keyed by wrap, and [b,c] keyed by b — different keys, same wrap ancestor.
			// Next render of wrap will overwrite wrap.__k? No, wrap.__k is host.__k in old impl? Actually wrap parent is host, b parent is wrap. Different parents, but wraps VDOM includes a+b+c walk via toVdom—hydrate wrap should include a,b,c if not fragmented.
			// To force conflict, render wrap and [b,c] both as fragments that share wrap's subtree.
			const inner = el( '<span data-testid="b" data-wp-text="state.b" data-wp-init="actions.initB"></span>' );
			const inner2 = el( '<span data-testid="c" data-wp-text="state.c" data-wp-init="actions.initC"></span>' );
			wrap.append( inner, inner2 );
			renderElement( [ inner, inner2 ] );
			await flush();
			expect( wrap.querySelector( '[data-testid="b"]' )!.textContent ).toBe( 'B' );
			expect( state.initCount ).toBe( 2 );

			// Mutate wrap's own a via state, then re-render wrap — inner fragments must not be orphaned via recreated wrap fragment
			state.a = 'A2';
			renderElement( wrap );
			await flush();
			expect( wrap.querySelector( '[data-testid="a"]' )!.textContent ).toBe( 'A2' );
			expect( wrap.querySelector( '[data-testid="b"]' ) ).not.toBeNull();
			expect( wrap.querySelector( '[data-testid="b"]' )!.textContent ).toBe( 'B' );
			expect( wrap.children.length ).toBe( 3 );
			expect( parent.children.length ).toBe( 1 );
			// B2-ext: re-rendering wrap must not re-mount b/c (no re-init).
			expect( state.initCount ).toBe( 2 );
		} );

		it( 'B3: two sibling fragments under slot both mutate same island context — interleaved re-renders must not lose sibling', async () => {
			store( 'test/comp-B3', {
				actions: {
					inc() {
						( getContext() as any ).n += 1;
					},
				},
			} );
			const host = el(
				'<div data-wp-interactive="test/comp-B3" data-wp-context=\'{"n":0}\'>' +
					'<div data-testid="slot"></div>' +
					'<span data-testid="islandN" data-wp-text="context.n"></span>' +
					'</div>'
			);
			document.body.appendChild( host );
			renderElement( host );
			const slot = host.querySelector( '[data-testid="slot"]' ) as HTMLElement;
			const frag = el( '<button data-testid="btn" data-wp-on--click="actions.inc">inc<button data-wp-text="context.n"></button></button>' );
			slot.appendChild( frag );
			renderElement( frag );
			( frag as HTMLButtonElement ).click();
			await flush();
			expect( host.querySelector( '[data-testid="islandN"]' )!.textContent ).toBe( '1' );

			const frag2 = el( '<button data-testid="btn2" data-wp-on--click="actions.inc">inc2<button data-wp-text="context.n"></button></button>' );
			slot.appendChild( frag2 );
			renderElement( frag2 );
			( frag2 as HTMLButtonElement ).click();
			await flush();
			expect( host.querySelector( '[data-testid="islandN"]' )!.textContent ).toBe( '2' );

			// Interleaved: re-render frag (first), then mutate via frag2, then re-render frag2, then mutate via frag — all must see coalesced n
			renderElement( frag );
			expect( slot.children.length ).toBe( 2 );
			( frag2 as HTMLButtonElement ).click();
			await flush();
			expect( host.querySelector( '[data-testid="islandN"]' )!.textContent ).toBe( '3' );
			renderElement( frag2 );
			( frag as HTMLButtonElement ).click();
			await flush();
			expect( host.querySelector( '[data-testid="islandN"]' )!.textContent ).toBe( '4' );
			expect( slot.children.length ).toBe( 2 );
		} );
	} );

	// ------------------------------------------------------------------
	// C. Repeated updates with different content / context
	// ------------------------------------------------------------------
	describe( 'C repeated updates with changing store & overlapping fragments', () => {
		it( 'C1: interleave [a,b] and [c,d] fragments with store mutate and gap — must keep gap and update both', () => {
			const { state } = store( 'test/comp-C1', { state: { x: 'X1', y: 'Y1' } } );
			const host = el( '<div data-wp-interactive="test/comp-C1"><div data-testid="parent"></div></div>' );
			document.body.appendChild( host );
			const parent = host.querySelector( '[data-testid="parent"]' ) as HTMLElement;
			renderElement( host );

			const a = el( '<span data-testid="a" data-wp-text="state.x"></span>' );
			const b = el( '<span data-testid="b" data-wp-text="state.y"></span>' );
			const c = el( '<span data-testid="c" data-wp-text="state.x"></span>' );
			const d = el( '<span data-testid="d" data-wp-text="state.y"></span>' );
			const gap = el( '<span data-testid="gap">GAP</span>' );

			// Create [a,gap,b, c,d] where first fragment [a,b] skips gap
			parent.append( a, gap, b, c, d );
			renderElement( [ a, b ] );
			renderElement( [ c, d ] );
			// gap must stay between a and b even after both renders
			expect( Array.from( parent.children ).map( ( e ) => ( e as HTMLElement ).dataset.testid ) ).toEqual(
				[ 'a', 'gap', 'b', 'c', 'd' ]
			);
			expect( a.textContent ).toBe( 'X1' );

			state.x = 'X2';
			state.y = 'Y2';
			// Reverse order re-render — both fragments must update via signals, gap still present
			renderElement( [ c, d ] );
			renderElement( [ a, b ] );
			expect( a.textContent ).toBe( 'X2' );
			expect( d.textContent ).toBe( 'Y2' );
			expect( Array.from( parent.children ).map( ( e ) => ( e as HTMLElement ).dataset.testid ) ).toEqual(
				[ 'a', 'gap', 'b', 'c', 'd' ]
			);
		} );

		it( 'C2: context writes from two separate fragments under same island must coalesce', async () => {
			store( 'test/comp-C2', {
				actions: {
					inc() {
						( getContext() as any ).n += 1;
					},
				},
			} );
			const host = el(
				'<div data-wp-interactive="test/comp-C2" data-wp-context=\'{"n":0}\'>' +
					'<div data-testid="parent"></div>' +
					'<span data-testid="islandN" data-wp-text="context.n"></span>' +
					'</div>'
			);
			document.body.appendChild( host );
			const parent = host.querySelector( '[data-testid="parent"]' ) as HTMLElement;
			renderElement( host );

			// Two fragments each with one button, not one fragment with two buttons.
			// Both must read/write the same island context at parent position.
			const a = el( '<button data-testid="a" data-wp-on--click="actions.inc"><span data-wp-text="context.n"></span></button>' );
			const b = el( '<button data-testid="b" data-wp-on--click="actions.inc"><span data-wp-text="context.n"></span></button>' );
			parent.appendChild( a );
			renderElement( a );
			parent.appendChild( b );
			renderElement( b ); // second fragment under same parent, overwrites parent.__k

			expect( host.querySelector( '[data-testid="islandN"]' )!.textContent ).toBe( '0' );
			( a as HTMLButtonElement ).click();
			await flush();
			expect( host.querySelector( '[data-testid="islandN"]' )!.textContent ).toBe( '1' );
			// b must see updated n from a's write — they share island but are separate roots
			expect( ( b.querySelector( 'span' ) as HTMLElement ).textContent ).toBe( '1' );
			( b as HTMLButtonElement ).click();
			await flush();
			expect( host.querySelector( '[data-testid="islandN"]' )!.textContent ).toBe( '2' );
			expect( ( a.querySelector( 'span' ) as HTMLElement ).textContent ).toBe( '2' );
		} );

		it( 'C3: renderHTML append twice to same parent interleaved — mutate both signals then interleave', () => {
			const { state } = store( 'test/comp-C3', { state: { a: 'A1', b: 'B1', c: 'C1' } } );
			const host = el( '<div data-wp-interactive="test/comp-C3"><div data-testid="parent"></div></div>' );
			document.body.appendChild( host );
			const parent = host.querySelector( '[data-testid="parent"]' ) as HTMLElement;
			renderElement( host );

			renderHTML( parent, '<span data-testid="a" data-wp-text="state.a"></span>' );
			renderHTML( parent, '<span data-testid="b" data-wp-text="state.b"></span>' );
			// Third fragment inserted between first two via DOM move, then via renderHTML prepend
			renderHTML( parent, '<span data-testid="c" data-wp-text="state.c"></span>' );
			expect( parent.children.length ).toBe( 3 );

			// Move c between a and b via DOM
			const cEl = parent.querySelector( '[data-testid="c"]' ) as HTMLElement;
			const bEl = parent.querySelector( '[data-testid="b"]' ) as HTMLElement;
			parent.insertBefore( cEl, bEl );
			expect( Array.from( parent.children ).map( ( e ) => ( e as HTMLElement ).dataset.testid ) ).toEqual(
				[ 'a', 'c', 'b' ]
			);

			// Mutate signals — each fragment must still be bound to its element after move
			state.a = 'A2';
			state.b = 'B2';
			state.c = 'C2';
			// Re-render via element refs (which re-uses fragment keyed by element)
			renderElement( parent.querySelector( '[data-testid="a"]' ) as HTMLElement );
			renderElement( parent.querySelector( '[data-testid="b"]' ) as HTMLElement );
			renderElement( parent.querySelector( '[data-testid="c"]' ) as HTMLElement );
			expect( parent.querySelector( '[data-testid="a"]' )!.textContent ).toBe( 'A2' );
			expect( parent.querySelector( '[data-testid="b"]' )!.textContent ).toBe( 'B2' );
			expect( parent.querySelector( '[data-testid="c"]' )!.textContent ).toBe( 'C2' );
			expect( parent.children.length ).toBe( 3 );
		} );

		it( 'C4: text nodes mixed with elements — multi-fragment sibling text between elements', () => {
			store( 'test/comp-C4', { state: { v: 'V', w: 'W' } } );
			const host = el( '<div data-wp-interactive="test/comp-C4"><div data-testid="parent"></div></div>' );
			document.body.appendChild( host );
			const parent = host.querySelector( '[data-testid="parent"]' ) as HTMLElement;
			renderElement( host );
			renderHTML( parent, 'hello <span data-testid="s" data-wp-text="state.v"></span> world' );
			expect( parent.childNodes.length ).toBe( 3 );
			// Insert second fragment whose Text node sits adjacent to first fragment's text
			renderHTML( parent, '<span data-testid="t" data-wp-text="state.w"></span> tail' );
			expect( parent.childNodes.length ).toBe( 5 );
			expect( parent.childNodes[ 0 ].textContent ).toBe( 'hello ' );
			expect( ( parent.childNodes[ 1 ] as HTMLElement ).dataset.testid ).toBe( 's' );
			expect( parent.childNodes[ 2 ].textContent ).toBe( ' world' );
			expect( ( parent.childNodes[ 3 ] as HTMLElement ).dataset.testid ).toBe( 't' );
			expect( parent.childNodes[ 4 ].textContent ).toBe( ' tail' );
			// Re-render first Text+Element fragment — second fragment's trailing Text must not be moved
			// C4-strengthen: the text nodes must survive by IDENTITY, not just
			// content — recreating them would break caret/selection in live text.
			const helloText = parent.childNodes[ 0 ];
			const worldText = parent.childNodes[ 2 ];
			const tailText = parent.childNodes[ 4 ];
			const s = parent.querySelector( '[data-testid="s"]' ) as HTMLElement;
			renderElement( s );
			expect( parent.childNodes.length ).toBe( 5 );
			expect( parent.childNodes[ 0 ] ).toBe( helloText );
			expect( parent.childNodes[ 1 ] ).toBe( s );
			expect( parent.childNodes[ 2 ] ).toBe( worldText );
			expect( parent.childNodes[ 2 ].textContent ).toBe( ' world' );
			expect( ( parent.childNodes[ 3 ] as HTMLElement ).dataset.testid ).toBe( 't' );
			expect( parent.childNodes[ 4 ] ).toBe( tailText );
			expect( ( parent.childNodes[ 4 ] as HTMLElement ).textContent ).toBe( ' tail' );
		} );
	} );

	// ------------------------------------------------------------------
	// D. Dead trees & leaked effects (Option 3 probes — red before the fix)
	// ------------------------------------------------------------------
	describe( 'D dead trees & leaked effects', () => {
		it( 'P1: superset re-render must not duplicate window listeners (re-rendering under a fresh fragment registers a second listener)', async () => {
			const { state } = store( 'test/comp-P1', {
				state: { count: 0 },
				actions: {
					resize() {
						state.count += 1;
					},
				},
			} );
			const host = el(
				'<div data-wp-interactive="test/comp-P1"><div data-testid="parent"></div></div>'
			);
			document.body.appendChild( host );
			const parent = host.querySelector( '[data-testid="parent"]' ) as HTMLElement;
			renderElement( host );

			const a = el( '<span data-testid="a" data-wp-on-window--resize="actions.resize"></span>' );
			parent.appendChild( a );
			renderElement( a );
			await flush();

			const b = el( '<span data-testid="b"></span>' );
			parent.appendChild( b );
			// Superset re-render: the current impl recreates the fragment
			// (childNodes length mismatch) and re-mounts a, registering a SECOND
			// window listener; the old tree is abandoned without cleanup.
			renderElement( [ a, b ] );
			await flush();

			window.dispatchEvent( new Event( 'resize' ) );
			expect( state.count ).toBe( 1 );
		} );

		it( 'P2: moving a node with a window listener to another parent and re-rendering it must not duplicate the listener', async () => {
			const { state } = store( 'test/comp-P2', {
				state: { count: 0 },
				actions: {
					resize() {
						state.count += 1;
					},
				},
			} );
			const host = el(
				'<div data-wp-interactive="test/comp-P2"><div data-testid="pA" data-wp-context=\'{"label":"A"}\'></div><div data-testid="pB" data-wp-context=\'{"label":"B"}\'></div></div>'
			);
			document.body.appendChild( host );
			const pA = host.querySelector( '[data-testid="pA"]' ) as HTMLElement;
			const pB = host.querySelector( '[data-testid="pB"]' ) as HTMLElement;
			renderElement( host );

			const a = el( '<span data-testid="a" data-wp-text="context.label"></span>' );
			const b = el( '<span data-testid="b" data-wp-text="context.label" data-wp-on-window--resize="actions.resize"></span>' );
			pA.append( a, b );
			renderElement( [ a, b ] );
			await flush();
			expect( b.textContent ).toBe( 'A' );

			// Move b to pB and re-render it: the current impl creates a fresh
			// fragment keyed by b (the [a,b] fragment is abandoned) and re-mounts
			// b, registering a SECOND window listener.
			pB.appendChild( b );
			renderElement( b );
			await flush();
			expect( b.textContent ).toBe( 'B' );
			expect( pA.children.length ).toBe( 1 );
			expect( pB.children.length ).toBe( 1 );

			window.dispatchEvent( new Event( 'resize' ) );
			expect( state.count ).toBe( 1 );
		} );

		it( 'P3: kanban — moving a card between columns inside one island and re-rendering the original set must resolve the new context', () => {
			store( 'test/comp-P3', { state: {} } );
			const host = el(
				'<div data-wp-interactive="test/comp-P3"><div data-testid="colA" data-wp-context=\'{"label":"A"}\'></div><div data-testid="colB" data-wp-context=\'{"label":"B"}\'></div></div>'
			);
			document.body.appendChild( host );
			const colA = host.querySelector( '[data-testid="colA"]' ) as HTMLElement;
			const colB = host.querySelector( '[data-testid="colB"]' ) as HTMLElement;
			renderElement( host );

			const a = el( '<span data-testid="a" data-wp-text="context.label"></span>' );
			const b = el( '<span data-testid="b" data-wp-text="context.label"></span>' );
			colA.append( a, b );
			renderElement( [ a, b ] );
			expect( a.textContent ).toBe( 'A' );
			expect( b.textContent ).toBe( 'A' );

			// Drag b to colB, then re-render the ORIGINAL set [a,b]. The current
			// impl reuses the cached fragment whose base/Provider was captured at
			// colA, so b keeps showing "A" despite now sitting under colB.
			colB.appendChild( b );
			renderElement( [ a, b ] );
			expect( a.textContent ).toBe( 'A' );
			expect( a.parentElement ).toBe( colA );
			expect( b.textContent ).toBe( 'B' );
			expect( b.parentElement ).toBe( colB );
			expect( colA.children.length ).toBe( 1 );
			expect( colB.children.length ).toBe( 1 );
		} );

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
			const content = host.querySelector( '[data-testid="content"]' ) as HTMLElement;
			renderElement( host );

			renderHTML( content, '<span data-testid="ins" data-wp-on-window--resize="actions.resize"></span>' );
			await flush();
			expect( content.querySelector( '[data-testid="ins"]' ) ).not.toBeNull();

			// Simulate a router-like replacement of the island's content.
			content.replaceChildren();
			renderElement( content );
			await flush();

			// The renderHTML-inserted node is gone, and its listener must have
			// been cleaned up (the current impl leaves the fragment orphaned
			// with a live listener).
			expect( content.querySelector( '[data-testid="ins"]' ) ).toBeNull();
			window.dispatchEvent( new Event( 'resize' ) );
			expect( state.count ).toBe( 0 );
		} );
	} );

	// ------------------------------------------------------------------
	// E. Multi-parent & coexistence guards (from the former
	//    render-fragment-failures probes — now all green)
	// ------------------------------------------------------------------
	describe( 'E multi-parent & coexistence', () => {
		it( 'renders an array whose elements have different parents, each within its own parent and context', () => {
			store( 'test/comp-E1', { state: { msg: 'hi' } } );
			const parentA = document.createElement( 'div' );
			const parentB = document.createElement( 'div' );
			// Each parent is itself an island with its own context.
			parentA.setAttribute( 'data-wp-interactive', 'test/comp-E1' );
			parentB.setAttribute( 'data-wp-interactive', 'test/comp-E1' );
			parentA.setAttribute( 'data-wp-context', '{"label":"A"}' );
			parentB.setAttribute( 'data-wp-context', '{"label":"B"}' );
			document.body.append( parentA, parentB );

			// Hydrate the islands first so their contexts are registered.
			renderElement( parentA );
			renderElement( parentB );

			const a = document.createElement( 'span' );
			a.setAttribute( 'data-wp-text', 'context.label' );
			const b = document.createElement( 'span' );
			b.setAttribute( 'data-wp-text', 'context.label' );

			parentA.appendChild( a );
			parentB.appendChild( b );

			// Each node renders within its own parent and resolves its own
			// parent's context.
			renderElement( [ a, b ] );
			expect( a.textContent ).toBe( 'A' );
			expect( b.textContent ).toBe( 'B' );
			expect( a.parentElement ).toBe( parentA );
			expect( b.parentElement ).toBe( parentB );
			expect( parentA.children.length ).toBe( 1 );
			expect( parentB.children.length ).toBe( 1 );
		} );

		it( 'two different fragments in same parent with different first nodes should not clobber each other', () => {
			store( 'test/comp-E2', {
				state: { a: 'A', b: 'B', c: 'C', d: 'D' },
			} );
			const parentHost = el(
				'<div data-wp-interactive="test/comp-E2"><div data-testid="parent"></div></div>'
			);
			document.body.appendChild( parentHost );
			// Hydrate the host island first so its context is registered.
			renderElement( parentHost );
			const parent = parentHost.querySelector(
				'[data-testid="parent"]'
			) as HTMLElement;

			// Two independent inserts: [a,b] and [c,d]
			const a = el( '<span data-testid="a" data-wp-text="state.a"></span>' );
			const b = el( '<span data-testid="b" data-wp-text="state.b"></span>' );
			const c = el( '<span data-testid="c" data-wp-text="state.c"></span>' );
			const d = el( '<span data-testid="d" data-wp-text="state.d"></span>' );

			parent.append( a, b );
			renderElement( [ a, b ] );
			expect( a.textContent ).toBe( 'A' );
			expect( b.textContent ).toBe( 'B' );

			parent.append( c, d );
			renderElement( [ c, d ] );
			expect( c.textContent ).toBe( 'C' );
			expect( d.textContent ).toBe( 'D' );

			// Re-rendering the first set must be idempotent and not disturb [c,d].
			renderElement( [ a, b ] );
			expect( parent.querySelector( '[data-testid="a"]' ) ).not.toBeNull();
			expect( parent.querySelector( '[data-testid="b"]' ) ).not.toBeNull();
			expect( parent.querySelector( '[data-testid="c"]' ) ).not.toBeNull();
			expect( parent.querySelector( '[data-testid="d"]' ) ).not.toBeNull();
			expect( parent.children.length ).toBe( 4 );
			expect(
				Array.from( parent.children ).map(
					( el ) => ( el as HTMLElement ).dataset.testid
				)
			).toEqual( [ 'a', 'b', 'c', 'd' ] );
		} );

		it( 'overlapping subset re-render should not remove nodes outside the subset', () => {
			store( 'test/comp-E3', { state: { x: 'X', y: 'Y', z: 'Z' } } );
			const host = el(
				'<div data-wp-interactive="test/comp-E3"><div data-testid="parent"></div></div>'
			);
			document.body.appendChild( host );
			const parent = host.querySelector(
				'[data-testid="parent"]'
			) as HTMLElement;

			const x = el( '<span data-testid="x" data-wp-text="state.x"></span>' );
			const y = el( '<span data-testid="y" data-wp-text="state.y"></span>' );
			const z = el( '<span data-testid="z" data-wp-text="state.z"></span>' );
			parent.append( x, y, z );
			renderElement( [ x, y, z ] );

			// Re-render with a subset that shares the same first node: z must
			// survive (no removal of nodes outside the subset).
			renderElement( [ x, y ] );
			expect( parent.querySelector( '[data-testid="z"]' ) ).not.toBeNull();
			expect( parent.children.length ).toBe( 3 );
		} );

		it( 'F1: a node moved out of its island is evicted and its listeners cleaned up', async () => {
			const { state } = store( 'test/comp-F1', {
				state: { count: 0 },
				actions: {
					resize() {
						state.count += 1;
					},
				},
			} );
			const host = el(
				'<div data-wp-interactive="test/comp-F1"><div data-testid="parent"></div></div>'
			);
			document.body.appendChild( host );
			const parent = host.querySelector(
				'[data-testid="parent"]'
			) as HTMLElement;
			renderElement( host );

			const node = el(
				'<span data-testid="node" data-wp-on-window--resize="actions.resize"></span>'
			);
			parent.appendChild( node );
			renderElement( node );
			await flush();
			// Listener registered.
			window.dispatchEvent( new Event( 'resize' ) );
			expect( state.count ).toBe( 1 );
			state.count = 0;

			// Move the node OUT of the island (to document.body, outside any
			// data-wp-interactive). The unsupported move-out case: the node
			// must be evicted from the registry and its listener cleaned up on
			// the next renderElement call (the sweep).
			document.body.appendChild( node );
			renderElement( host ); // triggers the sweep
			await flush();

			window.dispatchEvent( new Event( 'resize' ) );
			expect( state.count ).toBe( 0 );
		} );

		it( 'F2: renderElement([parent, child]) in one call must not double-own the child', async () => {
			store( 'test/comp-F2', { state: { a: 'A', b: 'B' } } );
			const host = el(
				'<div data-wp-interactive="test/comp-F2"><div data-testid="parent"></div></div>'
			);
			document.body.appendChild( host );
			const parent = host.querySelector(
				'[data-testid="parent"]'
			) as HTMLElement;
			renderElement( host );

			// `parent` and `child` are passed in ONE call, parent first.
			// Correct: the child is registered (its own fragment) and the
			// parent's tree must NOT claim the child's DOM (no double
			// ownership) — regardless of input order.
			const child = el(
				'<span data-testid="child" data-wp-text="state.b"></span>'
			);
			const parentEl = el(
				'<div data-testid="wrap"><span data-testid="a" data-wp-text="state.a"></span></div>'
			);
			parentEl.appendChild( child );
			parent.appendChild( parentEl );

			renderElement( [ parentEl, child ] );

			expect( parentEl.querySelector( '[data-testid="a"]' )!.textContent ).toBe( 'A' );
			expect( child.textContent ).toBe( 'B' );
			expect( parentEl.children.length ).toBe( 2 );

			// Re-render parentEl via renderElement: must NOT clobber or
			// duplicate child (the two-phase registration keeps single
			// ownership — the parent's tree has an opaque placeholder for
			// child, and child's own fragment owns it).
			renderElement( parentEl );
			expect( parentEl.children.length ).toBe( 2 );
			expect( child.textContent ).toBe( 'B' );

			// Re-render child via renderElement: still interactive, no dup.
			renderElement( child );
			expect( child.textContent ).toBe( 'B' );
			expect( parentEl.children.length ).toBe( 2 );
		} );
	} );
} );
