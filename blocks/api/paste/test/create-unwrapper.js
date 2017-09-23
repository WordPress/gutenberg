/**
 * External dependencies
 */
import { equal } from 'assert';

/**
 * Internal dependencies
 */
import createUnwrapper from '../create-unwrapper';
import { deepFilter } from '../utils';

const unwrapper = createUnwrapper( ( node ) => node.nodeName === 'SPAN' );

describe( 'stripWrappers', () => {
	it( 'should remove spans', () => {
		equal( deepFilter( '<span>test</span>', [ unwrapper ] ), 'test' );
	} );

	it( 'should remove wrapped spans', () => {
		equal( deepFilter( '<p><span>test</span></p>', [ unwrapper ] ), '<p>test</p>' );
	} );

	it( 'should remove spans with attributes', () => {
		equal( deepFilter( '<p><span id="test">test</span></p>', [ unwrapper ] ), '<p>test</p>' );
	} );

	it( 'should remove nested spans', () => {
		equal( deepFilter( '<p><span><span>test</span></span></p>', [ unwrapper ] ), '<p>test</p>' );
	} );

	it( 'should remove spans, but preserve nested structure', () => {
		equal( deepFilter( '<p><span><em>test</em> <em>test</em></span></p>', [ unwrapper ] ), '<p><em>test</em> <em>test</em></p>' );
	} );
} );
