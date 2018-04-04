/**
 * External dependencies
 */
import { equal } from 'assert';

/**
 * Internal dependencies
 */
import injectMissingSpaces from '../inject-missing-spaces';

describe( 'injectMissingSpaces', () => {
	it( 'should inject missing spaces', () => {
		equal( injectMissingSpaces( '<p>sometext</p>', 'some text' ), '<p>some text</p>' );
		equal( injectMissingSpaces( '<p><em>some</em>text</p>', 'some text' ), '<p><em>some</em> text</p>' );
		equal( injectMissingSpaces( '<p>some<em>text</em></p>', 'some text' ), '<p>some<em> text</em></p>' );
	} );
} );
