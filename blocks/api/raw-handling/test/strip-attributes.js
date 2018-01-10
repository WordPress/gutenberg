/**
 * External dependencies
 */
import { equal } from 'assert';

/**
 * Internal dependencies
 */
import stripAttributes from '../strip-attributes';
import { deepFilterHTML } from '../utils';

describe( 'stripAttributes', () => {
	it( 'should remove attributes', () => {
		equal( deepFilterHTML( '<p class="test">test</p>', [ stripAttributes ] ), '<p>test</p>' );
	} );

	it( 'should remove multiple attributes', () => {
		equal( deepFilterHTML( '<p class="test" id="test">test</p>', [ stripAttributes ] ), '<p>test</p>' );
	} );

	it( 'should deep remove attributes', () => {
		equal( deepFilterHTML( '<p class="test">test <em id="test">test</em></p>', [ stripAttributes ] ), '<p>test <em>test</em></p>' );
	} );

	it( 'should remove data-* attributes', () => {
		equal( deepFilterHTML( '<p data-reactid="1">test</p>', [ stripAttributes ] ), '<p>test</p>' );
	} );

	it( 'should keep some attributes', () => {
		equal( deepFilterHTML( '<a href="#keep">test</a>', [ stripAttributes ] ), '<a href="#keep">test</a>' );
	} );

	it( 'should keep some classes', () => {
		equal( deepFilterHTML( '<img class="alignright test" src="">', [ stripAttributes ] ), '<img class="alignright" src="">' );
	} );
} );
