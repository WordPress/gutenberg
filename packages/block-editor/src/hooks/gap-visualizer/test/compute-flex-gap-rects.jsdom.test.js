import { describe, expect, test } from 'vitest';
import { computeFlexGapRects } from '../compute-flex-gap-rects';
import fixtures from './fixtures/flex-layout-fixtures.json';

const EPSILON = 0.1;

describe( 'computeFlexGapRects', () => {
	describe( 'Golden Flex Fixtures - Exact Expected Rects & Invariants', () => {
		// Hand derived expected rects for each of the 10 golden flex layout cases.
		// Values are derived by hand from the fixture child boxes and rendered browser geometry.
		const goldenCases = [
			{
				id: 'flex-1',
				// Line 1: boxes 0,1,2 (Y: 22..118.9, H: 96.9) with 2 col gaps (X=122 and X=282); Line 2: boxes 3,4 (Y: 138.9..179, H: 40.1) with 1 col gap (X=142); 1 row gap (Y: 118.9..138.9, H: 20) across content width (X: 22..458, W: 436).
				comment:
					'Line 1 has 3 items with unequal heights aligned center emitting 2 column gaps; Line 2 has 2 items emitting 1 column gap; 1 row gap between lines spanning content width.',
				expectedRects: [
					{
						type: 'column',
						left: 122,
						top: 22.0,
						width: 20,
						height: 96.9,
					},
					{
						type: 'column',
						left: 282,
						top: 22.0,
						width: 20,
						height: 96.9,
					},
					{
						type: 'column',
						left: 142,
						top: 138.9,
						width: 20,
						height: 40.1,
					},
					{
						type: 'row',
						left: 22,
						top: 118.9,
						width: 436,
						height: 20,
					},
				],
			},
			{
				id: 'flex-2',
				// Line 1: boxes 0,1,2 (Y: 17..59.1, H: 42.1) with 2 col gaps (X=117 and X=277); Line 2: boxes 3,4 (Y: 79.1..124, H: 44.9) with 1 col gap (X=137); 1 row gap (Y: 59.1..79.1, H: 20) across content width (X: 17..463, W: 446).
				comment:
					'Align-items flex-start: line tops align at container content top, emitting 2 column gaps in line 1, 1 column gap in line 2, and 1 row gap between lines.',
				expectedRects: [
					{
						type: 'column',
						left: 117,
						top: 17.0,
						width: 20,
						height: 42.1,
					},
					{
						type: 'column',
						left: 277,
						top: 17.0,
						width: 20,
						height: 42.1,
					},
					{
						type: 'column',
						left: 137,
						top: 79.1,
						width: 20,
						height: 44.9,
					},
					{
						type: 'row',
						left: 17,
						top: 59.1,
						width: 446,
						height: 20,
					},
				],
			},
			{
				id: 'flex-3',
				// Line 1: boxes 0,1,2 (Y: 17..59.1, H: 42.1) with 2 col gaps (X=117 and X=277); Line 2: boxes 3,4 (Y: 79.1..115, H: 35.9) with 1 col gap (X=137); 1 row gap (Y: 59.1..79.1, H: 20) across content width (X: 17..463, W: 446).
				comment:
					'Align-items stretch: items stretch to line height emitting 2 column gaps in line 1, 1 in line 2, and 1 row gap between lines.',
				expectedRects: [
					{
						type: 'column',
						left: 117,
						top: 17.0,
						width: 20,
						height: 42.1,
					},
					{
						type: 'column',
						left: 277,
						top: 17.0,
						width: 20,
						height: 42.1,
					},
					{
						type: 'column',
						left: 137,
						top: 79.1,
						width: 20,
						height: 35.9,
					},
					{
						type: 'row',
						left: 17,
						top: 59.1,
						width: 446,
						height: 20,
					},
				],
			},
			{
				id: 'flex-4',
				// Space-between: Line 1: boxes 0,1,2,3 (Y: 17..57, H: 40) with 3 nominal 16px col gaps anchored to left item right edges (X=107, X=219, X=331); Line 2 has only 1 box; 1 row gap (Y: 57..73, H: 16) across content width (X: 17..463, W: 446).
				comment:
					'Justify-content space-between: nominal 16px column gaps anchor to leading item right edges; line 2 has single item (0 col gaps); 1 row gap between lines.',
				expectedRects: [
					{
						type: 'column',
						left: 107,
						top: 17.0,
						width: 16,
						height: 40.0,
					},
					{
						type: 'column',
						left: 219,
						top: 17.0,
						width: 16,
						height: 40.0,
					},
					{
						type: 'column',
						left: 331,
						top: 17.0,
						width: 16,
						height: 40.0,
					},
					{
						type: 'row',
						left: 17,
						top: 57.0,
						width: 446,
						height: 16,
					},
				],
			},
			{
				id: 'flex-5',
				// Column direction: Col 1: boxes 0,1 (X: 17..117, W: 100) with 1 row gap (Y: 62..80, H: 18); Col 2: boxes 2,3 (X: 145..245, W: 100) with 1 row gap (Y: 57..75, H: 18); Col 3: box 4 (1 item); 2 col gaps (at X=117 and X=245, W: 18) spanning content height (Y: 17..183, H: 166).
				comment:
					'Column direction with wrap: 2 row gaps along vertical columns, and 2 column gaps between the 3 wrapped column lines spanning content height.',
				expectedRects: [
					{
						type: 'row',
						left: 17,
						top: 62.0,
						width: 100,
						height: 18.0,
					},
					{
						type: 'row',
						left: 145,
						top: 57.0,
						width: 100,
						height: 18.0,
					},
					{
						type: 'column',
						left: 117,
						top: 17.0,
						width: 18,
						height: 166.0,
					},
					{
						type: 'column',
						left: 245,
						top: 17.0,
						width: 18,
						height: 166.0,
					},
				],
			},
			{
				id: 'flex-6',
				// Wrap-reverse: Upper line: boxes 3,4 (Y: 17..56.9, H: 39.9) with 1 col gap (at X=137); Lower line: boxes 0,1,2 (Y: 76.9..119, H: 42.1) with 2 col gaps (at X=117 and X=277); 1 row gap between upper and lower lines (Y: 56.9..76.9, H: 20) across content width (X: 17..463, W: 446).
				comment:
					'Flex-wrap wrap-reverse: lines are ordered physically top-to-bottom, emitting 1 column gap in upper line, 2 in lower line, and 1 row gap between them.',
				expectedRects: [
					{
						type: 'column',
						left: 137,
						top: 17.0,
						width: 20,
						height: 39.9,
					},
					{
						type: 'column',
						left: 117,
						top: 76.9,
						width: 20,
						height: 42.1,
					},
					{
						type: 'column',
						left: 277,
						top: 76.9,
						width: 20,
						height: 42.1,
					},
					{
						type: 'row',
						left: 17,
						top: 56.9,
						width: 446,
						height: 20,
					},
				],
			},
			{
				id: 'flex-7',
				// CSS order: 3 items in 1 line sorted visually left-to-right (boxes 1, 2, 0 at X=17, X=137, X=257; Y: 17..69, H: 52) with 2 col gaps (at X=117 and X=237); no row gap.
				comment:
					'CSS order property: items sorted physically by coordinate rather than DOM order, emitting 2 column gaps and 0 row gaps.',
				expectedRects: [
					{
						type: 'column',
						left: 117,
						top: 17.0,
						width: 20,
						height: 52.0,
					},
					{
						type: 'column',
						left: 237,
						top: 17.0,
						width: 20,
						height: 52.0,
					},
				],
			},
			{
				id: 'flex-8',
				// Custom margin: 3 items in 1 line; box 1 has 25px right margin extending its margin box to X=242; 2 col gaps (at X=107 and X=242, W: 20, H: 68); no row gap.
				comment:
					'Child with custom 25px right margin: gap strip starts at margin-box right edge (X=242), emitting 2 column gaps and 0 row gaps.',
				expectedRects: [
					{
						type: 'column',
						left: 107,
						top: 17.0,
						width: 20,
						height: 68.0,
					},
					{
						type: 'column',
						left: 242,
						top: 17.0,
						width: 20,
						height: 68.0,
					},
				],
			},
			{
				id: 'flex-9',
				// Display: none child filtered out: 2 visible items in 1 line (boxes 0, 1 at X=17 and X=137; Y: 17..53, H: 36) with 1 col gap (at X=117, W: 20, H: 36); no row gap.
				comment:
					'Display none child filtered out: exactly 1 column gap between the 2 visible items and 0 row gaps.',
				expectedRects: [
					{
						type: 'column',
						left: 117,
						top: 17.0,
						width: 20,
						height: 36.0,
					},
				],
			},
			{
				id: 'flex-10',
				// RTL with wrap: Line 1: boxes 2,1,0 sorted physically left-to-right (at X=73, X=193, X=353; Y: 17..59.1, H: 42.1) with 2 col gaps (at X=173 and X=333); Line 2: box 3 (1 item); 1 row gap (Y: 59.1..79.1, H: 20) across content width (X: 17..463, W: 446).
				comment:
					'Direction RTL with wrap: items sorted physically left-to-right, emitting 2 column gaps in line 1, 0 in line 2, and 1 row gap between lines.',
				expectedRects: [
					{
						type: 'column',
						left: 173,
						top: 17.0,
						width: 20,
						height: 42.1,
					},
					{
						type: 'column',
						left: 333,
						top: 17.0,
						width: 20,
						height: 42.1,
					},
					{
						type: 'row',
						left: 17,
						top: 59.1,
						width: 446,
						height: 20,
					},
				],
			},
		];

		test.each( goldenCases )(
			'$id: asserts exact hand derived rects and general invariants ($comment)',
			( { id, expectedRects } ) => {
				const fixture = fixtures[ id ];
				const actualRects = computeFlexGapRects(
					fixture.boxes,
					fixture.config
				);

				expect( actualRects ).toHaveLength( expectedRects.length );

				for ( let i = 0; i < expectedRects.length; i++ ) {
					const actual = actualRects[ i ];
					const expected = expectedRects[ i ];

					expect( actual.type ).toBe( expected.type );
					expect(
						Math.abs( actual.left - expected.left )
					).toBeLessThanOrEqual( EPSILON );
					expect(
						Math.abs( actual.top - expected.top )
					).toBeLessThanOrEqual( EPSILON );
					expect(
						Math.abs( actual.width - expected.width )
					).toBeLessThanOrEqual( EPSILON );
					expect(
						Math.abs( actual.height - expected.height )
					).toBeLessThanOrEqual( EPSILON );
				}

				const { contentBox, columnGap, rowGap, isSpaceBetween } =
					fixture.config;

				for ( const rect of actualRects ) {
					// Invariant A: No rect has width < 0.5 or height < 0.5.
					expect( rect.width ).toBeGreaterThanOrEqual( 0.5 );
					expect( rect.height ).toBeGreaterThanOrEqual( 0.5 );

					// Invariant B: Derived dimensions match edge bounds.
					expect(
						Math.abs( rect.right - rect.left - rect.width )
					).toBeLessThanOrEqual( 0.01 );
					expect(
						Math.abs( rect.bottom - rect.top - rect.height )
					).toBeLessThanOrEqual( 0.01 );

					// Invariant C: All rects lie inside the content-box.
					expect( rect.left ).toBeGreaterThanOrEqual(
						contentBox.left - EPSILON
					);
					expect( rect.top ).toBeGreaterThanOrEqual(
						contentBox.top - EPSILON
					);
					expect( rect.right ).toBeLessThanOrEqual(
						contentBox.left + contentBox.width + EPSILON
					);
					expect( rect.bottom ).toBeLessThanOrEqual(
						contentBox.top + contentBox.height + EPSILON
					);

					// Invariant D: No rect overlaps any child's border-box.
					for ( const box of fixture.boxes ) {
						const bBox = box.borderBox;
						expect( bBox ).toBeDefined();
						const xOverlap =
							Math.min( rect.right, bBox.right ) -
							Math.max( rect.left, bBox.left );
						const yOverlap =
							Math.min( rect.bottom, bBox.bottom ) -
							Math.max( rect.top, bBox.top );

						const overlaps =
							xOverlap > EPSILON && yOverlap > EPSILON;
						expect( overlaps ).toBe( false );
					}
				}

				// Invariant E: In standard flex row (not space-between), column-gap width == columnGap.
				const invalidColumnGaps =
					fixture.config.direction === 'row' && ! isSpaceBetween
						? actualRects
								.filter( ( r ) => r.type === 'column' )
								.filter(
									( r ) =>
										Math.abs( r.width - columnGap ) >
										EPSILON
								)
						: [];
				expect( invalidColumnGaps ).toEqual( [] );

				// Invariant F: Row-gap height <= rowGap.
				const invalidRowGaps = actualRects
					.filter( ( r ) => r.type === 'row' )
					.filter( ( r ) => r.height > rowGap + EPSILON );
				expect( invalidRowGaps ).toEqual( [] );
			}
		);
	} );

	describe( 'RTL with justify-content: space-between', () => {
		test( 'anchors nominal gap strip to leading item on the right', () => {
			// Container: width 500, padding 20, colGap: 24, space-between in RTL.
			// Box A (right, leading in RTL): left: 380, right: 480, top: 20, bottom: 60.
			// Box B (left, trailing in RTL): left: 20, right: 120, top: 20, bottom: 60.
			// Available space between: 380 - 120 = 260px.
			// The strip should anchor to Box A inner left edge (380 - 24 = 356) with width 24.
			const boxes = [
				{
					left: 20,
					top: 20,
					right: 120,
					bottom: 60,
					borderBox: {
						left: 20,
						top: 20,
						right: 120,
						bottom: 60,
						width: 100,
						height: 40,
					},
				},
				{
					left: 380,
					top: 20,
					right: 480,
					bottom: 60,
					borderBox: {
						left: 380,
						top: 20,
						right: 480,
						bottom: 60,
						width: 100,
						height: 40,
					},
				},
			];

			const config = {
				columnGap: 24,
				rowGap: 0,
				direction: 'row',
				flexWrap: 'nowrap',
				isSpaceBetween: true,
				isRtl: true,
				contentBox: { left: 20, top: 20, width: 460, height: 40 },
			};

			const rects = computeFlexGapRects( boxes, config );
			expect( rects ).toHaveLength( 1 );
			expect( rects[ 0 ] ).toEqual( {
				type: 'column',
				left: 356, // 380 - 24 = 356
				top: 20,
				width: 24,
				height: 40,
				right: 380,
				bottom: 60,
			} );
		} );
	} );

	describe( 'Edge Cases & Direct Unit Tests', () => {
		test( 'returns empty array when boxes is null, undefined, or empty', () => {
			expect( computeFlexGapRects( null, { columnGap: 20 } ) ).toEqual(
				[]
			);
			expect(
				computeFlexGapRects( undefined, { columnGap: 20 } )
			).toEqual( [] );
			expect( computeFlexGapRects( [], { columnGap: 20 } ) ).toEqual(
				[]
			);
		} );

		test( 'returns empty array when there is only a single child box', () => {
			const singleBox = [ { left: 10, top: 10, right: 110, bottom: 60 } ];
			expect(
				computeFlexGapRects( singleBox, {
					columnGap: 20,
					rowGap: 20,
				} )
			).toEqual( [] );
		} );

		test( 'returns empty array when both columnGap and rowGap are 0', () => {
			const boxes = [
				{ left: 10, top: 10, right: 110, bottom: 60 },
				{ left: 130, top: 10, right: 230, bottom: 60 },
			];
			expect(
				computeFlexGapRects( boxes, { columnGap: 0, rowGap: 0 } )
			).toEqual( [] );
		} );

		test( 'handles flex-wrap nowrap with multiple items (only column gaps emitted)', () => {
			const boxes = [
				{ left: 10, top: 10, right: 110, bottom: 50 },
				{ left: 130, top: 10, right: 230, bottom: 50 },
				{ left: 250, top: 10, right: 350, bottom: 50 },
			];
			const rects = computeFlexGapRects( boxes, {
				columnGap: 20,
				rowGap: 20,
				flexWrap: 'nowrap',
			} );

			expect( rects ).toHaveLength( 2 );
			expect( rects[ 0 ] ).toEqual( {
				type: 'column',
				left: 110,
				top: 10,
				width: 20,
				height: 40,
				right: 130,
				bottom: 50,
			} );
			expect( rects[ 1 ] ).toEqual( {
				type: 'column',
				left: 230,
				top: 10,
				width: 20,
				height: 40,
				right: 250,
				bottom: 50,
			} );
		} );

		test( 'handles column direction without wrap (only row gaps emitted)', () => {
			const boxes = [
				{ left: 10, top: 10, right: 110, bottom: 50 },
				{ left: 10, top: 70, right: 110, bottom: 120 },
			];
			const rects = computeFlexGapRects( boxes, {
				direction: 'column',
				rowGap: 20,
				columnGap: 20,
				flexWrap: 'nowrap',
			} );

			expect( rects ).toHaveLength( 1 );
			expect( rects[ 0 ] ).toEqual( {
				type: 'row',
				left: 10,
				top: 50,
				width: 100,
				height: 20,
				right: 110,
				bottom: 70,
			} );
		} );

		test( 'anchors space-between gap strip to leading item margin-box edge in LTR', () => {
			const boxes = [
				{ left: 0, top: 0, right: 100, bottom: 50 },
				{ left: 300, top: 0, right: 400, bottom: 50 },
			];
			const rects = computeFlexGapRects( boxes, {
				columnGap: 20,
				direction: 'row',
				isSpaceBetween: true,
				isRtl: false,
			} );

			expect( rects ).toHaveLength( 1 );
			expect( rects[ 0 ].left ).toBe( 100 );
			expect( rects[ 0 ].width ).toBe( 20 );
		} );

		test( 'never emits a row gap after the last line', () => {
			const boxes = [
				{ left: 10, top: 10, right: 110, bottom: 50 },
				{ left: 10, top: 70, right: 110, bottom: 120 },
			];
			const rects = computeFlexGapRects( boxes, {
				direction: 'row',
				flexWrap: 'wrap',
				columnGap: 20,
				rowGap: 20,
			} );

			// Exactly 1 row gap between line 1 and line 2, none after line 2.
			const rowRects = rects.filter( ( r ) => r.type === 'row' );
			expect( rowRects ).toHaveLength( 1 );
			expect( rowRects[ 0 ].top ).toBe( 50 );
			expect( rowRects[ 0 ].bottom ).toBe( 70 );
		} );

		test( 'ignores gaps smaller than 0.5px threshold and does not emit zero-height gaps', () => {
			const boxes = [
				{ left: 10, top: 10, right: 110, bottom: 50 },
				{ left: 110.2, top: 10, right: 210, bottom: 50 },
			];
			const rects = computeFlexGapRects( boxes, {
				columnGap: 20,
				flexWrap: 'nowrap',
			} );

			// Gap is 0.2px, which is below 0.5px threshold.
			expect( rects ).toHaveLength( 0 );
		} );

		test( 'handles 150 children in flex wrap without count cap', () => {
			const boxes = [];
			for ( let i = 0; i < 150; i++ ) {
				const line = Math.floor( i / 10 );
				const col = i % 10;
				const left = col * 120;
				const top = line * 60;
				boxes.push( {
					left,
					top,
					right: left + 100,
					bottom: top + 40,
				} );
			}
			const rects = computeFlexGapRects( boxes, {
				direction: 'row',
				flexWrap: 'wrap',
				columnGap: 20,
				rowGap: 20,
			} );
			const colRects = rects.filter( ( r ) => r.type === 'column' );
			const rowRects = rects.filter( ( r ) => r.type === 'row' );
			// 15 lines of 10 items -> 9 column gaps per line * 15 lines = 135 column gaps.
			expect( colRects ).toHaveLength( 135 );
			// 14 row gaps between 15 lines.
			expect( rowRects ).toHaveLength( 14 );
			expect( rects ).toHaveLength( 149 );
		} );
	} );
} );
