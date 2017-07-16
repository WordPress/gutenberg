import addContainer from '../addContainer';

describe( 'addContainer', () => {
	it( 'should create an aria-live element', () => {
		let containerPolite = addContainer( 'polite' );
		let containerAssertive = addContainer( 'assertive' );

		expect( containerPolite ).not.toBe( null );
		expect( containerAssertive ).not.toBe( null );
		expect( containerPolite.className ).toBe( 'a11y-speak-region' );
		expect( containerAssertive.className ).toBe( 'a11y-speak-region' );
		expect( containerPolite.id ).toBe( 'a11y-speak-polite' );
		expect( containerAssertive.id ).toBe( 'a11y-speak-assertive' );
		expect( containerPolite.getAttribute( 'style' ) ).toBe( 'clip: rect(1px, 1px, 1px, 1px); position: absolute; height: 1px; width: 1px; overflow: hidden; word-wrap: normal;' );
		expect( containerAssertive.getAttribute( 'style' ) ).toBe( 'clip: rect(1px, 1px, 1px, 1px); position: absolute; height: 1px; width: 1px; overflow: hidden; word-wrap: normal;' );
		expect( containerPolite.getAttribute( 'aria-live' ) ).toBe( 'polite' );
		expect( containerAssertive.getAttribute( 'aria-live' ) ).toBe( 'assertive' );
		expect( containerPolite.getAttribute( 'aria-relevant' ) ).toBe( 'additions text' );
		expect( containerAssertive.getAttribute( 'aria-relevant' ) ).toBe( 'additions text' );
		expect( containerPolite.getAttribute( 'aria-atomic' ) ).toBe( 'true' );
		expect( containerAssertive.getAttribute( 'aria-atomic' ) ).toBe( 'true' );
	} );
} );
