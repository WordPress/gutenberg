/**
 * External dependencies
 */
import { equal } from 'assert';

/**
 * Internal dependencies
 */
import commentRemover from '../comment-remover';
import { deepFilterHTML } from '../utils';

describe( 'commentRemover', () => {
	it( 'should remove comments', () => {
		equal( deepFilterHTML( '<!-- test -->', [ commentRemover ] ), '' );
	} );

	it( 'should deep remove comments', () => {
		equal( deepFilterHTML( '<p>test<!-- test --></p>', [ commentRemover ] ), '<p>test</p>' );
	} );
} );
