import { beforeEach, describe, expect, it } from 'vitest';
import { find } from '../focusable';

function createElementWithLayout( type ) {
	const element = document.createElement( type );
	const sizeIfVisible = () => ( element.style.display === 'none' ? 0 : 10 );

	Object.defineProperties( element, {
		offsetHeight: { get: sizeIfVisible },
		offsetWidth: { get: sizeIfVisible },
	} );

	return element;
}

describe( 'focusable.find() image map areas', () => {
	beforeEach( () => {
		document.body.innerHTML = '';
	} );

	it( 'finds a mapped area with a visible image', () => {
		const map = createElementWithLayout( 'map' );
		map.name = 'testfocus';
		const area = createElementWithLayout( 'area' );
		area.href = '';
		map.appendChild( area );
		const image = createElementWithLayout( 'img' );
		image.setAttribute( 'usemap', '#testfocus' );
		document.body.append( map, image );

		expect( find( map ) ).toEqual( [ area ] );
	} );

	it( 'ignores a mapped area with a hidden image', () => {
		const map = createElementWithLayout( 'map' );
		map.name = 'testfocus';
		const area = createElementWithLayout( 'area' );
		area.href = '';
		map.appendChild( area );
		const image = createElementWithLayout( 'img' );
		image.setAttribute( 'usemap', '#testfocus' );
		image.style.display = 'none';
		document.body.append( map, image );

		expect( find( map ) ).toEqual( [] );
	} );
} );
