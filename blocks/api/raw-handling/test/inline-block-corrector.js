/**
 * External dependencies
 */
import { equal } from 'assert';

/**
 * Internal dependencies
 */
import embeddedContentReducer from '../embedded-content-reducer';
import { deepFilterHTML } from '../utils';

describe( 'embeddedContentReducer', () => {
	it( 'should move inline-block content from paragraph', () => {
		equal(
			deepFilterHTML( '<p><strong>test<img></strong></p>', [ embeddedContentReducer ] ),
			'<img><p><strong>test</strong></p>'
		);
	} );
} );
