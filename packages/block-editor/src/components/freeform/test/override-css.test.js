import { describe, expect, it } from 'vitest';
import { getCanvasOverrideCss } from '../override-css';

const squash = ( css ) => css.replace( /\s+/g, ' ' ).trim();

describe( 'getCanvasOverrideCss', () => {
	it( 'makes the canvas a positioning context at the design ratio', () => {
		const css = squash(
			getCanvasOverrideCss( {
				canvasClientId: 'abc',
				canvasHeight: 600,
				rects: {},
			} )
		);

		expect( css ).toContain( '#block-abc {' );
		expect( css ).toContain( 'position: relative' );
		expect( css ).toContain( 'aspect-ratio: 1200 / 600' );
	} );

	it( 'takes every child out of flow', () => {
		const css = squash(
			getCanvasOverrideCss( {
				canvasClientId: 'abc',
				canvasHeight: 600,
				rects: {},
			} )
		);

		expect( css ).toContain( '#block-abc > * { position: absolute' );
	} );

	it( 'places each child as a percentage of the canvas', () => {
		const css = squash(
			getCanvasOverrideCss( {
				canvasClientId: 'abc',
				canvasHeight: 600,
				rects: { def: { x: 72, y: 60, width: 600, height: 60 } },
			} )
		);

		expect( css ).toContain( '#block-def {' );
		expect( css ).toContain( 'left: 6%' );
		expect( css ).toContain( 'top: 10%' );
		expect( css ).toContain( 'width: 50%' );
		expect( css ).toContain( 'min-height: 10%' );
	} );

	it( 'addresses blocks by id, which outranks anything the editor sets', () => {
		// `.block-editor-block-list__layout .block-editor-block-list__block`
		// sets `position: relative` at 0-2-0. An id selector is 1-0-0.
		const css = getCanvasOverrideCss( {
			canvasClientId: 'abc',
			canvasHeight: 600,
			rects: { def: { x: 0, y: 0, width: 100, height: 10 } },
		} );

		expect( css ).not.toContain( '.block-editor' );
		expect( css.match( /#block-/g ) ).toHaveLength( 3 );
	} );

	it( 'emits one rule per child', () => {
		const css = getCanvasOverrideCss( {
			canvasClientId: 'abc',
			canvasHeight: 600,
			rects: {
				one: { x: 0, y: 0, width: 100, height: 10 },
				two: { x: 10, y: 10, width: 100, height: 10 },
			},
		} );

		expect( css ).toContain( '#block-one' );
		expect( css ).toContain( '#block-two' );
	} );

	it( 'is empty without a canvas', () => {
		expect(
			getCanvasOverrideCss( {
				canvasClientId: null,
				canvasHeight: 600,
				rects: {},
			} )
		).toBe( '' );
	} );
} );
