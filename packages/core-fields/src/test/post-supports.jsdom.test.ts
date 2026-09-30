import { describe, expect, it } from 'vitest';
import postSupports from '../post_supports';

describe( 'post_supports', () => {
	it( 'provides the JavaScript parts of the author field only', () => {
		expect( Object.keys( postSupports ) ).toEqual( [ 'author' ] );
		expect( postSupports.author ).toEqual( {
			getElements: expect.any( Function ),
			setValue: expect.any( Function ),
			render: expect.any( Function ),
			isVisible: expect.any( Function ),
		} );
	} );

	it( 'sets the author as a number', () => {
		expect(
			postSupports.author.setValue?.( { item: {}, value: '3' } )
		).toEqual( { author: 3 } );
	} );

	it( 'shows the author field when the author can be assigned', () => {
		const { isVisible } = postSupports.author;
		expect(
			isVisible?.( { _links: { 'wp:action-assign-author': [] } } )
		).toBe( true );
		expect( isVisible?.( { _links: {} } ) ).toBe( false );
		// A bulk edit form has no record, hence no links.
		expect( isVisible?.( {} ) ).toBe( true );
	} );
} );
