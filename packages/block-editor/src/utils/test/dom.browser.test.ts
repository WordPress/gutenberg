import { afterEach, describe, expect, it } from 'vitest';
import { getLayoutRect } from '../dom';

function createBlock( style: string, parentStyle = '' ) {
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
		const element = createBlock( '' );
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
		const element = createBlock( style );
		expect( round( element.getBoundingClientRect() ) ).not.toEqual(
			LAYOUT_RECT
		);
		expect( round( getLayoutRect( element ) ) ).toEqual( LAYOUT_RECT );
	} );

	it( 'keeps the scale of a scaled ancestor', () => {
		const element = createBlock(
			'rotate: 30deg;',
			'transform: scale(0.5); transform-origin: 0 0;'
		);
		expect( round( getLayoutRect( element ) ) ).toEqual( {
			left: 70,
			top: 45,
			width: 100,
			height: 50,
		} );
	} );
} );
