/**
 * External dependencies
 */
import { equal } from 'assert';

/**
 * Internal dependencies
 */
import stripWrappers from '../strip-wrappers';

describe( 'stripWrappers', () => {
	it( 'should remove spans', () => {
		equal( stripWrappers( '<span>test</span>' ), 'test' );
	} );

	it( 'should remove wrapped spans', () => {
		equal( stripWrappers( '<p><span>test</span></p>' ), '<p>test</p>' );
	} );

	it( 'should remove spans with attributes', () => {
		equal( stripWrappers( '<p><span id="test">test</span></p>' ), '<p>test</p>' );
	} );

	it( 'should remove nested spans', () => {
		equal( stripWrappers( '<p><span><span>test</span></span></p>' ), '<p>test</p>' );
	} );

	it( 'should remove spans, but preserve nested structure', () => {
		equal( stripWrappers( '<p><span><em>test</em> <em>test</em></span></p>' ), '<p><em>test</em> <em>test</em></p>' );
	} );
} );
