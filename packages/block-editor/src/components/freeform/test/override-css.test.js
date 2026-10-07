import { describe, expect, it } from 'vitest';
import { getCanvasOverrideCss, getCanvasesCss } from '../override-css';

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

	it( 'takes every placed block out of flow', () => {
		const css = squash(
			getCanvasOverrideCss( {
				canvasClientId: 'abc',
				canvasHeight: 600,
				rects: { def: { x: 0, y: 0, width: 100, height: 10 } },
			} )
		);

		expect( css ).toContain( '#block-def { position: absolute' );
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

describe( 'getCanvasesCss', () => {
	const outer = {
		clientId: 'outer',
		canvasHeight: 600,
		rects: { inner: { x: 0, y: 120, width: 600, height: 300 } },
	};
	const inner = {
		clientId: 'inner',
		canvasHeight: 300,
		rects: { leaf: { x: 0, y: 60, width: 600, height: 60 } },
	};

	it( 'places a nested canvas after it has been made one', () => {
		// A canvas that is also a block on another canvas gets `position:
		// relative` for being a canvas and `position: absolute` for being
		// placed. Both are id selectors, so the one written last wins — and it
		// has to be the placement, or the nested canvas ignores the
		// coordinates its parent gave it and sits wherever flow leaves it.
		const css = getCanvasesCss( [ outer, inner ] );
		const becameACanvas = css.indexOf( 'aspect-ratio: 1200 / 300' );
		const wasPlaced = css.indexOf( '#block-inner {\n\tposition: absolute' );

		expect( becameACanvas ).toBeGreaterThan( -1 );
		expect( wasPlaced ).toBeGreaterThan( becameACanvas );
	} );

	it( 'gives every placed block its own position', () => {
		const css = getCanvasesCss( [ outer, inner ] );
		expect( css ).toContain( '#block-leaf' );
		expect( ( css.match( /position: absolute/g ) || [] ).length ).toBe( 2 );
	} );

	it( 'is empty for no canvases', () => {
		expect( getCanvasesCss( [] ) ).toBe( '' );
	} );
} );

describe( 'placing a block whose height is not known', () => {
	it( 'omits min-height rather than emitting NaN', () => {
		// A drag writes x and y; a block that had no stored height until then
		// has none afterwards either. `min-height: NaN%` is dropped by the
		// browser, but it has no business being written.
		const css = getCanvasOverrideCss( {
			canvasClientId: 'abc',
			canvasHeight: 600,
			rects: { def: { x: 0, y: 60, width: 600 } },
		} );

		expect( css ).not.toContain( 'NaN' );
		expect( css ).not.toContain( 'min-height' );
		expect( css ).toContain( 'top: 10%' );
	} );
} );
