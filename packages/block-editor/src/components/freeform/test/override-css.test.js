import { describe, expect, it } from 'vitest';
import {
	getCanvasOverrideCss,
	getCanvasesCss,
	getPendingCanvasCss,
} from '../override-css';

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
		// Two for the canvas — the positioning context and its children's
		// margins — then two for the child: where it sits, and that it is in
		// move mode.
		expect( css.match( /#block-/g ) ).toHaveLength( 4 );
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

describe( 'the rules that say a block is in move mode', () => {
	// The editor does not re-render a section when it becomes a canvas, so the
	// section's element never gains `is-layout-freeform` and CSS keyed on that
	// class does nothing until something else forces a render. These rules
	// therefore come from the canvas's own stylesheet, addressed by id, for the
	// same reason the positioning does.
	const canvas = {
		clientId: 'sec',
		canvasHeight: 600,
		rects: { a: { x: 0, y: 0, width: 600, height: 60 } },
	};

	it( 'gives every block on the canvas the move cursor', () => {
		expect( getCanvasOverrideCss( canvas ) ).toContain( 'cursor: move' );
	} );

	it( 'stops them looking like text to sweep over', () => {
		expect( getCanvasOverrideCss( canvas ) ).toContain(
			'user-select: none'
		);
	} );

	it( 'says it once for the canvas rather than once per block', () => {
		// Every child is in move mode, placed or not, so this is a rule about
		// the canvas. Writing it per block missed the ones with no coordinates
		// yet — a freshly inserted block, or a whole section nobody has dragged
		// in.
		expect( getCanvasOverrideCss( canvas ) ).toContain(
			'#block-sec > *:not([contenteditable="true"])'
		);
	} );

	it( 'excludes a block that has been entered for editing', () => {
		// Entered, it is text again: the caret belongs in it and the words are
		// selectable, so neither rule may reach it.
		expect( getCanvasOverrideCss( canvas ) ).toContain(
			':not([contenteditable="true"])'
		);
	} );

	it( 'leaves what is inside a block alone', () => {
		// `> *` is deliberate. A Group kept whole on the canvas travels as one
		// piece, and the words inside it are still words.
		expect( getCanvasOverrideCss( canvas ) ).not.toContain(
			'#block-sec *:not'
		);
	} );

	it( 'addresses move mode by id, which outranks the editor’s text cursor', () => {
		// `.block-editor-block-list__layout .block-editor-block-list__block
		// [contenteditable]` sets `cursor: text` at 0-3-0 — and that attribute
		// selector catches a locked block too, because it matches
		// `contenteditable="false"` just as happily.
		const css = getCanvasOverrideCss( canvas );
		expect( css ).not.toContain( '.is-layout-freeform' );
		expect( css ).toContain( '#block-sec' );
	} );

	it( 'keeps blocks above the lattice', () => {
		expect( getCanvasOverrideCss( canvas ) ).toContain( 'z-index: 1' );
	} );

	it( 'makes the canvas a container so the lattice can measure itself', () => {
		expect( getCanvasOverrideCss( canvas ) ).toContain(
			'container-type: inline-size'
		);
	} );
} );

describe( 'a section nobody has dragged in yet', () => {
	// It is a canvas waiting to happen: the first drag converts it. Its blocks
	// are already held still, so they must already say they can be moved — but
	// nothing may be positioned, because the section is still laying itself out
	// and coordinates would collapse it.
	it( 'says its blocks are in move mode', () => {
		const css = getPendingCanvasCss( [ 'sec-a', 'sec-b' ] );
		expect( css ).toContain(
			'#block-sec-a > *:not([contenteditable="true"])'
		);
		expect( css ).toContain(
			'#block-sec-b > *:not([contenteditable="true"])'
		);
		expect( css ).toContain( 'cursor: move' );
		expect( css ).toContain( 'user-select: none' );
	} );

	it( 'positions nothing at all', () => {
		const css = getPendingCanvasCss( [ 'sec-a' ] );
		expect( css ).not.toContain( 'position: absolute' );
		expect( css ).not.toContain( 'aspect-ratio' );
		expect( css ).not.toContain( 'left:' );
	} );

	it( 'is empty for no sections', () => {
		expect( getPendingCanvasCss( [] ) ).toBe( '' );
	} );
} );
