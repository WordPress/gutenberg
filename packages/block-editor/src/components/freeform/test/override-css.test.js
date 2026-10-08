import { describe, expect, it } from 'vitest';
import {
	getCanvasOverrideCss,
	getCanvasesCss,
	getMoveModeCss,
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
		// margins — and one for the child, saying where it sits. Move mode is
		// a separate stylesheet keyed on the movable blocks.
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

describe( 'the rules that say a block is in move mode', () => {
	// Keyed on the blocks themselves, not on the canvas's children, because
	// the blocks a canvas can move are not always its children yet: an item in
	// a column becomes one on the first drag, and until then `> *` never
	// reaches it. In the theme patterns almost everything is nested like that,
	// so almost nothing showed the move cursor.
	it( 'names each movable block', () => {
		const css = getMoveModeCss( [ 'a', 'b' ] );
		expect( css ).toContain( '#block-a:not([contenteditable="true"])' );
		expect( css ).toContain( '#block-b:not([contenteditable="true"])' );
	} );

	it( 'gives it the move cursor and stops it looking like text', () => {
		const css = getMoveModeCss( [ 'a' ] );
		expect( css ).toContain( 'cursor: move' );
		expect( css ).toContain( 'user-select: none' );
	} );

	it( 'stops the browser dragging the image inside it off by itself', () => {
		// An image is draggable by default, and that native drag swallows the
		// pointer stream the moment it starts: the press arrives, `dragstart`
		// fires, and no further move or up is ever seen, so the block is left
		// where it was. The image is inside the Image block rather than being
		// it, and the property is not inherited, so this is the one thing said
		// about a block's contents.
		expect( getMoveModeCss( [ 'a' ] ) ).toContain(
			'#block-a:not([contenteditable="true"]) * {\n\t-webkit-user-drag: none;'
		);
	} );

	it( 'stops the browser dragging the block off either', () => {
		// On a canvas the block itself is the drag handle, so the browser's own
		// dragging of it has nothing left to do — and this has to be CSS rather
		// than a cancelled `dragstart`, because with nothing selected yet there
		// is no canvas mounted and so no listener to cancel anything. The very
		// first press on an image was being carried off before the editor had
		// even selected it.
		const css = getMoveModeCss( [ 'a' ] );
		const ownRule = css.slice(
			0,
			css.indexOf( '#block-a:not([contenteditable="true"]) *' )
		);
		expect( ownRule ).toContain( '-webkit-user-drag: none' );
	} );

	it( 'excludes a block that has been entered for editing', () => {
		// Entered, it is text again: the caret belongs in it and the words are
		// selectable, so neither rule may reach it.
		expect( getMoveModeCss( [ 'a' ] ) ).toContain(
			':not([contenteditable="true"])'
		);
	} );

	it( 'leaves what is inside a movable block alone', () => {
		// A Group kept whole on a canvas travels as one piece, and the words
		// inside it are still words, so nothing here is a descendant selector.
		expect( getMoveModeCss( [ 'a' ] ) ).not.toContain( '#block-a *' );
		expect( getMoveModeCss( [ 'a' ] ) ).not.toContain( '#block-a >' );
	} );

	it( 'outranks the editor’s text cursor by using an id', () => {
		// `.block-editor-block-list__layout .block-editor-block-list__block
		// [contenteditable]` sets `cursor: text` at 0-3-0 — and that attribute
		// selector catches a locked block too, because it matches
		// `contenteditable="false"` just as happily.
		const css = getMoveModeCss( [ 'a' ] );
		expect( css ).not.toContain( '.is-layout-freeform' );
		expect( css ).toContain( '#block-a' );
	} );

	it( 'is empty for no blocks', () => {
		expect( getMoveModeCss( [] ) ).toBe( '' );
	} );
} );

describe( 'placing blocks on a canvas', () => {
	const canvas = {
		clientId: 'sec',
		canvasHeight: 600,
		rects: { a: { x: 0, y: 0, width: 600, height: 60 } },
	};

	it( 'keeps blocks above the lattice', () => {
		expect( getCanvasOverrideCss( canvas ) ).toContain( 'z-index: 1' );
	} );

	it( 'makes the canvas a container so the lattice can measure itself', () => {
		expect( getCanvasOverrideCss( canvas ) ).toContain(
			'container-type: inline-size'
		);
	} );

	it( 'says nothing about move mode, which is not about placement', () => {
		// A block with no coordinates is still movable, so the two cannot be
		// decided by the same rule.
		expect( getCanvasOverrideCss( canvas ) ).not.toContain(
			'cursor: move'
		);
	} );
} );
