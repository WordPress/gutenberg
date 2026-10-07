import { describe, expect, it } from 'vitest';
import freeform from '../freeform';

describe( 'freeform layout', () => {
	describe( 'getLayoutStyle', () => {
		it( 'makes the canvas a positioning context sized by its design height', () => {
			const result = freeform.getLayoutStyle( {
				selector: '.my-canvas',
				layout: { type: 'freeform', canvasHeight: 800 },
				style: {},
				blockName: 'test-block',
			} );

			expect( result ).toContain( '.my-canvas { position: relative;' );
			expect( result ).toContain( 'aspect-ratio: 1200 / 800' );
		} );

		it( 'absolutely positions its children and strips their margins', () => {
			const result = freeform.getLayoutStyle( {
				selector: '.my-canvas',
				layout: { type: 'freeform', canvasHeight: 800 },
				style: {},
				blockName: 'test-block',
			} );

			expect( result ).toContain( '.my-canvas > :is(*, div)' );
			expect( result ).toContain( 'position: absolute' );
			expect( result ).toContain( 'margin: 0' );
		} );

		it( 'falls back to the default canvas height', () => {
			const result = freeform.getLayoutStyle( {
				selector: '.my-canvas',
				layout: { type: 'freeform' },
				style: {},
				blockName: 'test-block',
			} );

			expect( result ).toContain( 'aspect-ratio: 1200 / 576' );
		} );

		it( 'applies each comma-separated selector', () => {
			const result = freeform.getLayoutStyle( {
				selector: '.one,.two',
				layout: { type: 'freeform', canvasHeight: 600 },
				style: {},
				blockName: 'test-block',
			} );

			expect( result ).toContain( '.one,.two {' );
			expect( result ).toContain(
				'.one > :is(*, div),.two > :is(*, div) {'
			);
		} );

		it( 'never emits a block gap, which has no meaning on a canvas', () => {
			const result = freeform.getLayoutStyle( {
				selector: '.my-canvas',
				layout: { type: 'freeform', canvasHeight: 600 },
				style: { spacing: { blockGap: '2em' } },
				blockName: 'test-block',
				hasBlockGapSupport: true,
			} );

			expect( result ).not.toContain( 'gap' );
		} );
	} );

	describe( 'getOrientation', () => {
		it( 'reports no single orientation', () => {
			expect( freeform.getOrientation() ).toBe( 'freeform' );
		} );
	} );

	describe( 'getAlignments', () => {
		it( 'offers no alignments, since position is absolute', () => {
			expect( freeform.getAlignments() ).toEqual( [] );
		} );
	} );
} );
