import { createBoardStore } from '../board-store';

function mockRect( element, top ) {
	element.getBoundingClientRect = () => ( { top } );
}

describe( 'createBoardStore', () => {
	describe( 'getAnchorRects', () => {
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

			expect( store.getAnchorRects()[ 12 ].top ).toBe( 160 );
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

			expect( store.getAnchorRects()[ 12 ].top ).toBe( 100 );
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
				// jsdom's Range has neither getClientRects nor
				// getBoundingClientRect; selectText defines both, so drop
				// them to keep tests isolated.
				delete window.Range.prototype.getClientRects;
				delete window.Range.prototype.getBoundingClientRect;
			} );

			/**
			 * Select a range and give it the client rects a browser would
			 * report. One rect per line the selection covers; the bounding
			 * rect is their union, as in a real engine.
			 *
			 * @param {Node}     node  Text node to select within.
			 * @param {number}   start Start offset.
			 * @param {number}   end   End offset.
			 * @param {Object[]} rects Per-line rects the selection reports.
			 */
			function selectText(
				node,
				start,
				end,
				rects = [ { top: 160, width: 50, height: 20 } ]
			) {
				const range = document.createRange();
				range.setStart( node, start );
				range.setEnd( node, end );
				window.Range.prototype.getClientRects = () => rects;
				window.Range.prototype.getBoundingClientRect = () =>
					rects.length
						? {
								top: Math.min( ...rects.map( ( r ) => r.top ) ),
								width: Math.max(
									...rects.map( ( r ) => r.width )
								),
								height: rects.reduce(
									( sum, r ) => sum + r.height,
									0
								),
						  }
						: { top: 0, width: 0, height: 0 };
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

				expect( store.getAnchorRects().new.top ).toBe( 160 );
			} );

			it( 'falls back to the block rect for a collapsed selection', () => {
				selectText( blockEl.firstChild, 5, 5 );

				const store = createBoardStore();
				store.registerThread(
					'new',
					blockEl,
					document.createElement( 'div' )
				);

				expect( store.getAnchorRects().new.top ).toBe( 100 );
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

				expect( store.getAnchorRects().new.top ).toBe( 100 );
				document.body.removeChild( other );
			} );

			it( 'ignores the zero-width rect a selection picks up at a line edge', () => {
				// A selection starting at the very end of one line reports a
				// zero-width rect there plus the real rect on the next line.
				// The union would align the form to the line above the text.
				selectText( blockEl.firstChild, 5, 11, [
					{ top: 100, width: 0, height: 20 },
					{ top: 160, width: 50, height: 20 },
				] );

				const store = createBoardStore();
				store.registerThread(
					'new',
					blockEl,
					document.createElement( 'div' )
				);

				expect( store.getAnchorRects().new.top ).toBe( 160 );
			} );

			it( 'falls back to the block rect when the selection has no rendered rects', () => {
				// An unrendered range still yields an all-zero rect rather
				// than null, which would pin the form to the top of the canvas.
				selectText( blockEl.firstChild, 5, 11, [] );

				const store = createBoardStore();
				store.registerThread(
					'new',
					blockEl,
					document.createElement( 'div' )
				);

				expect( store.getAnchorRects().new.top ).toBe( 100 );
			} );

			it( 'falls back to the block rect when there is no selection', () => {
				const store = createBoardStore();
				store.registerThread(
					'new',
					blockEl,
					document.createElement( 'div' )
				);

				expect( store.getAnchorRects().new.top ).toBe( 100 );
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

			const rects = store.getAnchorRects();
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

			const rects = store.getAnchorRects();
			expect( rects[ 12 ].top ).toBe( 120 );
			expect( rects[ 34 ].top ).toBe( 180 );
		} );
	} );
} );
