/**
 * External dependencies
 */
import { equal } from 'assert';

/**
 * Internal dependencies
 */
import formattingTransformer from '../formatting-transformer';
import { deepFilterHTML } from '../utils';

describe( 'formattingTransformer', () => {
	it( 'should transform font weight', () => {
		equal( deepFilterHTML( '<span style="font-weight:bold">test</span>', [ formattingTransformer ] ), '<strong>test</strong>' );
	} );

	it( 'should transform numeric font weight', () => {
		equal( deepFilterHTML( '<span style="font-weight:700">test</span>', [ formattingTransformer ] ), '<strong>test</strong>' );
	} );

	it( 'should transform font style', () => {
		equal( deepFilterHTML( '<span style="font-style:italic">test</span>', [ formattingTransformer ] ), '<em>test</em>' );
	} );
} );
