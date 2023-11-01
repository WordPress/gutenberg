/**
 * Internal dependencies
 */
import createElement from './utils/create-element';
import { find } from '../tabbable';

describe( 'tabbable', () => {
	beforeEach( () => {
		document.body.innerHTML = '';
	} );

	describe( 'find()', () => {
		it( 'returns focusables in order of tabindex', () => {
			const node = createElement( 'div' );
			const absent = createElement( 'input' );
			absent.tabIndex = -1;
			const first = createElement( 'input' );
			const second = createElement( 'span' );
			second.tabIndex = 0;
			const third = createElement( 'input' );
			third.tabIndex = 1;
			node.appendChild( third );
			node.appendChild( first );
			node.appendChild( second );
			node.appendChild( absent );

			const tabbables = find( node );

			expect( tabbables ).toEqual( [ first, second, third ] );
		} );

		it( 'consolidates radio group to the first, if unchecked', () => {
			const node = createElement( 'div' );
			const firstRadio = createElement( 'input' );
			firstRadio.type = 'radio';
			firstRadio.name = 'a';
			firstRadio.value = 'firstRadio';
			const secondRadio = createElement( 'input' );
			secondRadio.type = 'radio';
			secondRadio.name = 'a';
			secondRadio.value = 'secondRadio';
			const text = createElement( 'input' );
			text.type = 'text';
			text.name = 'b';
			const thirdRadio = createElement( 'input' );
			thirdRadio.type = 'radio';
			thirdRadio.name = 'a';
			thirdRadio.value = 'thirdRadio';
			const fourthRadio = createElement( 'input' );
			fourthRadio.type = 'radio';
			fourthRadio.name = 'b';
			fourthRadio.value = 'fourthRadio';
			const fifthRadio = createElement( 'input' );
			fifthRadio.type = 'radio';
			fifthRadio.name = 'b';
			fifthRadio.value = 'fifthRadio';
			node.appendChild( firstRadio );
			node.appendChild( secondRadio );
			node.appendChild( text );
			node.appendChild( thirdRadio );
			node.appendChild( fourthRadio );
			node.appendChild( fifthRadio );

			const tabbables = find( node );

			expect( tabbables ).toEqual( [ firstRadio, text, fourthRadio ] );
		} );

		it( 'consolidates radio group to the checked', () => {
			const node = createElement( 'div' );
			const firstRadio = createElement( 'input' );
			firstRadio.type = 'radio';
			firstRadio.name = 'a';
			firstRadio.value = 'firstRadio';
			const secondRadio = createElement( 'input' );
			secondRadio.type = 'radio';
			secondRadio.name = 'a';
			secondRadio.value = 'secondRadio';
			const text = createElement( 'input' );
			text.type = 'text';
			text.name = 'b';
			const thirdRadio = createElement( 'input' );
			thirdRadio.type = 'radio';
			thirdRadio.name = 'a';
			thirdRadio.value = 'thirdRadio';
			thirdRadio.checked = true;
			node.appendChild( firstRadio );
			node.appendChild( secondRadio );
			node.appendChild( text );
			node.appendChild( thirdRadio );

			const tabbables = find( node );

			expect( tabbables ).toEqual( [ text, thirdRadio ] );
		} );

		it( 'not consolidate unnamed radio inputs', () => {
			const node = createElement( 'div' );
			const firstRadio = createElement( 'input' );
			firstRadio.type = 'radio';
			firstRadio.value = 'firstRadio';
			const text = createElement( 'input' );
			text.type = 'text';
			text.name = 'b';
			const secondRadio = createElement( 'input' );
			secondRadio.type = 'radio';
			secondRadio.value = 'secondRadio';
			node.appendChild( firstRadio );
			node.appendChild( text );
			node.appendChild( secondRadio );

			const tabbables = find( node );

			expect( tabbables ).toEqual( [ firstRadio, text, secondRadio ] );
		} );
	} );
} );
