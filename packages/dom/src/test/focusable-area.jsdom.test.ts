import { beforeEach, describe, expect, it } from 'vitest';
import { find } from '../focusable';

function createImageWithLayout() {
	const image = document.createElement( 'img' );

	Object.defineProperties( image, {
		offsetHeight: { value: 10 },
		offsetWidth: { value: 10 },
	} );

	return image;
}

describe( 'focusable.find() image map areas', () => {
	beforeEach( () => {
		document.body.innerHTML = '';
	} );

	it( 'finds an area in a named map referenced by an image', () => {
		const map = document.createElement( 'map' );
		map.name = 'testfocus';
		const area = document.createElement( 'area' );
		area.href = '';
		map.appendChild( area );
		const image = createImageWithLayout();
		image.setAttribute( 'usemap', '#testfocus' );
		document.body.append( map, image );

		expect( find( map ) ).toEqual( [ area ] );
	} );

	it( 'ignores an area when no image references its map', () => {
		const map = document.createElement( 'map' );
		map.name = 'testfocus';
		const area = document.createElement( 'area' );
		area.href = '';
		map.appendChild( area );
		document.body.append( map );

		expect( find( map ) ).toEqual( [] );
	} );
} );
