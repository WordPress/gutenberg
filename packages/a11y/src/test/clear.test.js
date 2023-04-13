/**
 * Internal dependencies
 */
import clear from '../clear';

describe( 'clear', () => {
	it( 'should clear all a11y-speak-region elements', () => {
		const container1 = document.createElement( 'div' );
		container1.className = 'a11y-speak-region';
		container1.textContent = 'not empty';
		document.body.appendChild( container1 );

		const container2 = document.createElement( 'div' );
		container2.className = 'a11y-speak-region';
		container2.textContent = 'not empty';
		document.body.appendChild( container2 );

		clear();
		expect( container1 ).toBeEmptyDOMElement();
		expect( container2 ).toBeEmptyDOMElement();
	} );
} );
