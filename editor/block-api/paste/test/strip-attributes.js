/**
 * External dependencies
 */
import { equal } from 'assert';

/**
 * Internal dependencies
 */
import stripAttributes from '../strip-attributes';
import { deepFilter } from '../utils';

describe( 'stripAttributes', () => {
	it( 'should remove attributes', () => {
		equal( deepFilter( '<p class="test">test</p>', [ stripAttributes ] ), '<p>test</p>' );
	} );

	it( 'should remove multiple attributes', () => {
		equal( deepFilter( '<p class="test" id="test">test</p>', [ stripAttributes ] ), '<p>test</p>' );
	} );

	it( 'should deep remove attributes', () => {
		equal( deepFilter( '<p class="test">test <em id="test">test</em></p>', [ stripAttributes ] ), '<p>test <em>test</em></p>' );
	} );

	it( 'should remove data-* attributes', () => {
		equal( deepFilter( '<p data-reactid="1">test</p>', [ stripAttributes ] ), '<p>test</p>' );
	} );

	it( 'should keep some attributes', () => {
		equal( deepFilter( '<a href="#keep">test</a>', [ stripAttributes ] ), '<a href="#keep">test</a>' );
	} );
} );
