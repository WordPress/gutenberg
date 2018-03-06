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
} );
