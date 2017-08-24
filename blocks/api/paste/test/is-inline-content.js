/**
 * External dependencies
 */
import { equal } from 'assert';

/**
 * Internal dependencies
 */
import isInlineContent from '../is-inline-content';

describe( 'stripWrappers', () => {
	it( 'should be inline content', () => {
		equal( isInlineContent( '<em>test</em>' ), true );
	} );

	it( 'should not be inline content', () => {
		equal( isInlineContent( '<div>test</div>' ), false );
		equal( isInlineContent( '<em>test</em><div>test</div>' ), false );
		equal( isInlineContent( 'test<br><br>test' ), false );
		equal( isInlineContent( '<em><div>test</div></em>' ), false );
	} );
} );
