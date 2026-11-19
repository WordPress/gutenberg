import { afterEach, describe, expect, it } from 'vitest';
import {
	getLayoutFrame,
	getLayoutRect,
	getOutermostRotatedAncestorBlock,
	toClientRect,
	toLayoutPoint,
} from '../dom';

function createBlock(
	parent: Element,
	style: Partial< CSSStyleDeclaration > = {}
) {
	const block = document.createElement( 'div' );
	block.className = 'block-editor-block-list__block';
	Object.assign( block.style, style );
	parent.appendChild( block );
	return block;
}

afterEach( () => {
	document.body.replaceChildren();
} );

describe( 'getOutermostRotatedAncestorBlock', () => {
	it( 'returns the outermost rotated block, skipping the element itself', () => {
		const outer = createBlock( document.body, { rotate: '10deg' } );
		const middle = createBlock( outer, { rotate: '5deg' } );
		const inner = createBlock( createBlock( middle ), { rotate: '20deg' } );

		expect( getOutermostRotatedAncestorBlock( inner ) ).toBe( outer );
		expect( getOutermostRotatedAncestorBlock( outer ) ).toBeUndefined();
	} );

	it( 'detects a block rotated with transform', () => {
		const outer = createBlock( document.body, {
			transform: 'rotate(15deg)',
		} );
		const inner = createBlock( outer );

		expect( getOutermostRotatedAncestorBlock( inner ) ).toBe( outer );
	} );

	it( 'returns undefined when no ancestor block is rotated', () => {
		const outer = createBlock( document.body );
		const inner = createBlock( outer );

		expect( getOutermostRotatedAncestorBlock( inner ) ).toBeUndefined();
	} );
} );

function createLayoutElement( style: string, parentStyle = '' ) {
	const parent = document.createElement( 'div' );
	parent.style.cssText = `position: absolute; top: 40px; left: 60px; ${ parentStyle }`;
	parent.setAttribute( 'data-test-parent', '' );
	const element = document.createElement( 'div' );
	element.style.cssText = `width: 200px; height: 100px; margin: 10px 0 0 20px; ${ style }`;
	parent.appendChild( element );
	document.body.appendChild( parent );
	return element;
}

function round( rect: DOMRect ) {
	return {
		left: Math.round( rect.left ),
		top: Math.round( rect.top ),
		width: Math.round( rect.width ),
		height: Math.round( rect.height ),
	};
}

const LAYOUT_RECT = { left: 80, top: 50, width: 200, height: 100 };

describe( 'getLayoutRect', () => {
	afterEach( () => {
		document
			.querySelectorAll( '[data-test-parent]' )
			.forEach( ( element ) => element.remove() );
	} );

	it( 'returns the bounding client rect of an untransformed element', () => {
		const element = createLayoutElement( '' );
		expect( getLayoutRect( element ) ).toEqual(
			element.getBoundingClientRect()
		);
	} );

	it.each( [
		[ 'rotate', 'rotate: 30deg;' ],
		[ 'rotate in turns', 'rotate: 0.25turn;' ],
		[ 'rotate about a corner', 'rotate: 45deg; transform-origin: 0 0;' ],
		[ 'rotate around the x axis', 'rotate: x 60deg;' ],
		[ 'translate', 'translate: 30px 50%;' ],
		[ 'scale', 'scale: 1.5;' ],
		[ 'scale per axis', 'scale: 2 0.5;' ],
		[
			'transform',
			'transform: translateX(40px) rotate(20deg) scale(0.8);',
		],
		[
			'all transform properties',
			'translate: -10px 20px; rotate: -15deg; scale: 1.2; transform: skewX(10deg);',
		],
	] )( 'ignores %s', ( _name, style ) => {
		const element = createLayoutElement( style );
		expect( round( element.getBoundingClientRect() ) ).not.toEqual(
			LAYOUT_RECT
		);
		expect( round( getLayoutRect( element ) ) ).toEqual( LAYOUT_RECT );
	} );

	it( 'keeps the scale of a scaled ancestor', () => {
		const element = createLayoutElement(
			'rotate: 30deg;',
			'transform: scale(0.5); transform-origin: 0 0;'
		);
		const frame = getLayoutFrame( element.parentElement );
		expect(
			round( toClientRect( frame, getLayoutRect( element, frame ) ) )
		).toEqual( {
			left: 70,
			top: 45,
			width: 100,
			height: 50,
		} );
	} );

	it.each( [
		[ 'rotated', 'rotate: 30deg;' ],
		[ 'translated', 'translate: 30px -20px;' ],
		[ 'scaled', 'scale: 1.5;' ],
		[ 'transformed', 'transform: rotate(-15deg) scale(0.8);' ],
	] )( 'measures a child of a %s parent in its layout', ( _name, style ) => {
		const element = createLayoutElement( '', style );
		const frame = getLayoutFrame( element.parentElement );
		const rect = getLayoutRect( element, frame );
		const clientRect = element.getBoundingClientRect();

		expect( round( rect ) ).toEqual( {
			left: 20,
			top: 10,
			width: 200,
			height: 100,
		} );
		expect(
			toLayoutPoint(
				frame,
				clientRect.left + clientRect.width / 2,
				clientRect.top + clientRect.height / 2
			)
		).toMatchObject( {
			x: expect.closeTo( 120 ),
			y: expect.closeTo( 60 ),
		} );
	} );

	it( 'finds the gap between children of a rotated parent', () => {
		const first = createLayoutElement( '', 'rotate: -20deg;' );
		const second = first.cloneNode() as HTMLElement;
		first.after( second );
		const frame = getLayoutFrame( first.parentElement );
		const firstRect = getLayoutRect( first, frame );
		const secondRect = getLayoutRect( second, frame );
		const gap = new window.DOMRect(
			firstRect.left,
			firstRect.bottom,
			firstRect.width,
			secondRect.top - firstRect.bottom
		);
		const firstClient = first.getBoundingClientRect();
		const secondClient = second.getBoundingClientRect();
		// The pair is symmetric about the gap, so their union centres on it.
		const gapCenter = {
			x:
				( Math.min( firstClient.left, secondClient.left ) +
					Math.max( firstClient.right, secondClient.right ) ) /
				2,
			y: ( firstClient.top + secondClient.bottom ) / 2,
		};
		const clientGap = toClientRect( frame, gap );

		expect( round( gap ) ).toEqual( {
			left: 20,
			top: 110,
			width: 200,
			height: 10,
		} );
		expect( clientGap.left + clientGap.width / 2 ).toBeCloseTo(
			gapCenter.x
		);
		expect( clientGap.top + clientGap.height / 2 ).toBeCloseTo(
			gapCenter.y
		);
		expect( round( clientGap ) ).toMatchObject( {
			width: 200,
			height: 10,
		} );
	} );

	it( 'measures a transformed child two transformed levels deep', () => {
		const element = createLayoutElement(
			'rotate: 10deg;',
			'rotate: -45deg; scale: 0.8;'
		);
		const parent = element.parentElement!;
		const outer = document.createElement( 'div' );
		outer.style.cssText =
			'position: absolute; top: 100px; left: 100px; padding: 30px; rotate: 20deg;';
		outer.setAttribute( 'data-test-parent', '' );
		parent.style.position = 'static';
		parent.style.width = 'fit-content';
		parent.style.display = 'flow-root';
		parent.replaceWith( outer );
		outer.appendChild( parent );
		const frame = getLayoutFrame( parent );
		const clientRect = element.getBoundingClientRect();

		expect( round( getLayoutRect( element, frame ) ) ).toEqual( {
			left: 20,
			top: 10,
			width: 200,
			height: 100,
		} );
		expect(
			toLayoutPoint(
				frame,
				clientRect.left + clientRect.width / 2,
				clientRect.top + clientRect.height / 2
			)
		).toMatchObject( {
			x: expect.closeTo( 120 ),
			y: expect.closeTo( 60 ),
		} );
	} );

	it( 'returns client rects when nothing is transformed', () => {
		const element = createLayoutElement( '' );
		const frame = getLayoutFrame( element.parentElement );
		const rect = element.getBoundingClientRect();

		expect( frame.isIdentity ).toBe( true );
		expect( toLayoutPoint( frame, 5, 7 ) ).toMatchObject( {
			x: 5,
			y: 7,
		} );
		expect( toClientRect( frame, rect ) ).toBe( rect );
	} );
} );
