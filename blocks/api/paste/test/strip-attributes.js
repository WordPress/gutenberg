/**
 * External dependencies
 */
import { equal } from 'assert';

/**
 * Internal dependencies
 */
import stripAttributes from '../strip-attributes';

describe( 'stripAttributes', () => {
	it( 'should remove attributes', () => {
		equal( stripAttributes( '<p class="test">test</p>' ), '<p>test</p>' );
	} );

	it( 'should remove multiple attributes', () => {
		equal( stripAttributes( '<p class="test" id="test">test</p>' ), '<p>test</p>' );
	} );

	it( 'should deep remove attributes', () => {
		equal( stripAttributes( '<p class="test">test <em id="test">test</em></p>' ), '<p>test <em>test</em></p>' );
	} );

	it( 'should remove data-* attributes', () => {
		equal( stripAttributes( '<p data-reactid="1">test</p>' ), '<p>test</p>' );
	} );

	it( 'should keep some attributes', () => {
		equal( stripAttributes( '<a href="#keep">test</a>' ), '<a href="#keep">test</a>' );
	} );
} );
