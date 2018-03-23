/**
 * Internal dependencies
 */
import embeddedContentReducer from '../embedded-content-reducer';
import { deepFilterHTML } from '../utils';

describe( 'embeddedContentReducer', () => {
	it( 'should move embedded content from paragraph', () => {
		expect( deepFilterHTML( '<p><strong>test<img class="one"></strong><img class="two"></p>', [ embeddedContentReducer ] ) )
			.toEqual( '<img class="one"><img class="two"><p><strong>test</strong></p>' );
	} );

	it( 'should move an anchor with just an image from paragraph', () => {
		expect( deepFilterHTML( '<p><a href="#"><img class="one"></a><strong>test</strong></p>', [ embeddedContentReducer ] ) )
			.toEqual( '<a href="#"><img class="one"></a><p><strong>test</strong></p>' );
	} );

	it( 'should move multiple images', () => {
		expect( deepFilterHTML( '<p><a href="#"><img class="one"></a><img class="two"><strong>test</strong></p>', [ embeddedContentReducer ] ) )
			.toEqual( '<a href="#"><img class="one"></a><img class="two"><p><strong>test</strong></p>' );
	} );
} );
