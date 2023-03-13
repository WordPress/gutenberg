/**
 * Internal dependencies
 */
import isInlineContent from '../is-inline-content';

describe( 'isInlineContent', () => {
	it( 'should be inline content', () => {
		expect( isInlineContent( '<em>test</em>' ) ).toBe( true );
		expect( isInlineContent( '<span>test</span>' ) ).toBe( true );
		expect( isInlineContent( '<li>test</li>', 'ul' ) ).toBe( true );
	} );

	it( 'should not be inline content', () => {
		expect( isInlineContent( '<div>test</div>' ) ).toBe( false );
		expect( isInlineContent( '<em>test</em><div>test</div>' ) ).toBe(
			false
		);
		expect( isInlineContent( 'test<br><br>test' ) ).toBe( false );
		expect( isInlineContent( '<em><div>test</div></em>' ) ).toBe( false );
		expect( isInlineContent( '<li>test</li>', 'p' ) ).toBe( false );
		expect( isInlineContent( '<li>test</li>', 'h1' ) ).toBe( false );
		expect( isInlineContent( '<h1>test</h1>', 'li' ) ).toBe( false );
	} );
} );
