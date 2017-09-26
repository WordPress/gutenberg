/**
 * External dependencies
 */
import { equal } from 'assert';

/**
 * Internal dependencies
 */
import commentRemover from '../comment-remover';
import { deepFilter } from '../utils';

describe( 'stripWrappers', () => {
	it( 'should remove comments', () => {
		equal( deepFilter( '<!-- test -->', [ commentRemover ] ), '' );
	} );

	it( 'should deep remove comments', () => {
		equal( deepFilter( '<p>test<!-- test --></p>', [ commentRemover ] ), '<p>test</p>' );
	} );
} );
