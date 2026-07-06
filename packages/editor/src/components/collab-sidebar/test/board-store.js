/**
 * Internal dependencies
 */
import { createBoardStore } from '../board-store';

function mockRect( element, top ) {
	element.getBoundingClientRect = () => ( { top } );
}

describe( 'createBoardStore', () => {
	describe( 'getBlockRects', () => {
		it( 'anchors an inline note to its in-content marker', () => {
			const store = createBoardStore();
			const blockEl = document.createElement( 'p' );
			blockEl.innerHTML =
				'Some <mark class="wp-note" data-id="12">noted</mark> text';
			mockRect( blockEl, 100 );
			mockRect( blockEl.querySelector( 'mark' ), 160 );

			store.registerThread(
				12,
				blockEl,
				document.createElement( 'div' )
			);

			expect( store.getBlockRects()[ 12 ].top ).toBe( 160 );
		} );

		it( 'falls back to the block rect for block-level notes', () => {
			const store = createBoardStore();
			const blockEl = document.createElement( 'p' );
			blockEl.textContent = 'No marker here';
			mockRect( blockEl, 100 );

			store.registerThread(
				12,
				blockEl,
				document.createElement( 'div' )
			);

			expect( store.getBlockRects()[ 12 ].top ).toBe( 100 );
		} );

		it( 'ignores markers belonging to other notes', () => {
			const store = createBoardStore();
			const blockEl = document.createElement( 'p' );
			blockEl.innerHTML =
				'Some <mark class="wp-note" data-id="34">other note</mark> text';
			mockRect( blockEl, 100 );
			mockRect( blockEl.querySelector( 'mark' ), 160 );

			store.registerThread(
				12,
				blockEl,
				document.createElement( 'div' )
			);

			expect( store.getBlockRects()[ 12 ].top ).toBe( 100 );
		} );

		describe( 'pending new note', () => {
			let blockEl;

			beforeEach( () => {
				blockEl = document.createElement( 'p' );
				blockEl.textContent = 'Some longer paragraph text';
				// Selections only work on nodes attached to the document.
				document.body.appendChild( blockEl );
				mockRect( blockEl, 100 );
			} );

			afterEach( () => {
				window.getSelection().removeAllRanges();
				document.body.removeChild( blockEl );
				// jsdom's Range has no getBoundingClientRect; selectText
				// defines one, so drop it to keep tests isolated.
				delete window.Range.prototype.getBoundingClientRect;
			} );

			function selectText( node, start, end ) {
				const range = document.createRange();
				range.setStart( node, start );
				range.setEnd( node, end );
				window.Range.prototype.getBoundingClientRect = () => ( {
					top: 160,
				} );
				const selection = window.getSelection();
				selection.removeAllRanges();
				selection.addRange( range );
			}

			it( 'anchors to the text selection it will attach to', () => {
				selectText( blockEl.firstChild, 5, 11 );

				const store = createBoardStore();
				store.registerThread(
					'new',
					blockEl,
					document.createElement( 'div' )
				);

				expect( store.getBlockRects().new.top ).toBe( 160 );
			} );

			it( 'falls back to the block rect for a collapsed selection', () => {
				selectText( blockEl.firstChild, 5, 5 );

				const store = createBoardStore();
				store.registerThread(
					'new',
					blockEl,
					document.createElement( 'div' )
				);

				expect( store.getBlockRects().new.top ).toBe( 100 );
			} );

			it( 'falls back to the block rect when the selection is outside the block', () => {
				const other = document.createElement( 'p' );
				other.textContent = 'Elsewhere';
				document.body.appendChild( other );
				selectText( other.firstChild, 0, 4 );

				const store = createBoardStore();
				store.registerThread(
					'new',
					blockEl,
					document.createElement( 'div' )
				);

				expect( store.getBlockRects().new.top ).toBe( 100 );
				document.body.removeChild( other );
			} );

			it( 'falls back to the block rect when there is no selection', () => {
				const store = createBoardStore();
				store.registerThread(
					'new',
					blockEl,
					document.createElement( 'div' )
				);

				expect( store.getBlockRects().new.top ).toBe( 100 );
			} );
		} );

		it( 'anchors a marker split into several runs to its first run', () => {
			const store = createBoardStore();
			const blockEl = document.createElement( 'p' );
			/*
			 * Overlapping notes split a marker into several runs sharing the
			 * same data-id (see applyNoteFormat): the overlapped stretch nests
			 * inside the other note's marker. Each note anchors to its first
			 * run in document order.
			 */
			blockEl.innerHTML =
				'One <mark class="wp-note" data-id="12">first run</mark>' +
				'<mark class="wp-note" data-id="34">' +
				'<mark class="wp-note" data-id="12">overlap</mark>' +
				' tail</mark> text';
			const [ firstRun, outer, nestedRun ] =
				blockEl.querySelectorAll( 'mark' );
			mockRect( blockEl, 100 );
			mockRect( firstRun, 140 );
			mockRect( outer, 170 );
			mockRect( nestedRun, 200 );

			store.registerThread(
				12,
				blockEl,
				document.createElement( 'div' )
			);
			store.registerThread(
				34,
				blockEl,
				document.createElement( 'div' )
			);

			const rects = store.getBlockRects();
			expect( rects[ 12 ].top ).toBe( 140 );
			expect( rects[ 34 ].top ).toBe( 170 );
		} );

		it( 'anchors each note to its own marker within the same block', () => {
			const store = createBoardStore();
			const blockEl = document.createElement( 'p' );
			blockEl.innerHTML =
				'One <mark class="wp-note" data-id="12">first</mark> and ' +
				'another <mark class="wp-note" data-id="34">second</mark> note';
			const [ first, second ] = blockEl.querySelectorAll( 'mark' );
			mockRect( blockEl, 100 );
			mockRect( first, 120 );
			mockRect( second, 180 );

			store.registerThread(
				12,
				blockEl,
				document.createElement( 'div' )
			);
			store.registerThread(
				34,
				blockEl,
				document.createElement( 'div' )
			);

			const rects = store.getBlockRects();
			expect( rects[ 12 ].top ).toBe( 120 );
			expect( rects[ 34 ].top ).toBe( 180 );
		} );
	} );
} );
