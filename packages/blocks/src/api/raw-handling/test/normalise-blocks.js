/**
 * Internal dependencies
 */
import normaliseBlocks from '../normalise-blocks';

describe( 'normaliseBlocks', () => {
	it( 'should convert double line breaks to paragraphs', () => {
		expect( normaliseBlocks( 'test<br><br>test' ) ).toEqual( '<p>test</p><p>test</p>' );
	} );

	it( 'should not convert single line break to paragraphs', () => {
		expect( normaliseBlocks( 'test<br>test' ) ).toEqual( '<p>test<br>test</p>' );
	} );

	it( 'should not add extra line at the start', () => {
		expect( normaliseBlocks( 'test<br><br><br>test' ) ).toEqual( '<p>test</p><p>test</p>' );
		expect( normaliseBlocks( '<br>test<br><br>test' ) ).toEqual( '<p>test</p><p>test</p>' );
	} );

	it( 'should preserve non-inline content', () => {
		const HTML = '<p>test</p><div>test<br>test</div>';
		expect( normaliseBlocks( HTML ) ).toEqual( HTML );
	} );

	it( 'should remove empty paragraphs', () => {
		expect( normaliseBlocks( '<p>&nbsp;</p>' ) ).toEqual( '' );
	} );

	it( 'should wrap lose inline elements', () => {
		expect( normaliseBlocks( '<a href="#">test</a>' ) ).toEqual( '<p><a href="#">test</a></p>' );
	} );

	it( 'should not break between inline siblings', () => {
		expect( normaliseBlocks( '<strong>test</strong>&nbsp;is a test of&nbsp;<a href="#">test</a>&nbsp;using a&nbsp;<a href="#">test</a>.' ) ).toEqual( '<p><strong>test</strong>&nbsp;is a test of&nbsp;<a href="#">test</a>&nbsp;using a&nbsp;<a href="#">test</a>.</p>' );
	} );

	it( 'should not append empty text nodes', () => {
		expect( normaliseBlocks( '<p>test</p>\n' ) ).toEqual( '<p>test</p>' );
	} );
} );
