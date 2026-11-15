import { describe, expect, it } from 'vitest';
import replace from '../replace';

describe( 'replace', () => {
	it( 'puts the new node where the old node was, before its next siblings', () => {
		const container = document.createElement( 'section' );
		container.innerHTML =
			'<div><span id="a"></span><span id="b"></span></div><p></p>';

		replace(
			container.querySelector( '#a' )!,
			document.createElement( 'em' )
		);

		expect( container.innerHTML ).toBe(
			'<div><em></em><span id="b"></span></div><p></p>'
		);
	} );

	it( 'puts the new node where the old node was, after its previous siblings', () => {
		const container = document.createElement( 'section' );
		container.innerHTML =
			'<div><span id="a"></span><span id="b"></span></div><p></p>';

		replace(
			container.querySelector( '#b' )!,
			document.createElement( 'em' )
		);

		expect( container.innerHTML ).toBe(
			'<div><span id="a"></span><em></em></div><p></p>'
		);
	} );

	it( 'works when the parent has no parent of its own', () => {
		const parent = document.createElement( 'div' );
		parent.innerHTML = '<span id="a"></span>';
		const newNode = document.createElement( 'em' );

		replace( parent.querySelector( '#a' )!, newNode );

		expect( parent.firstChild ).toBe( newNode );
	} );
} );
