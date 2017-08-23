/**
 * External dependencies
 */
import { equal } from 'assert';

/**
 * Internal dependencies
 */
import createUnwrapper from '../create-unwrapper';
import { deepFilter, isSpan, isInline } from '../utils';

const spanUnwrapper = createUnwrapper( ( node ) => isSpan( node ) );
const inlineUnwrapper = createUnwrapper( ( node ) => isInline( node ) );

describe( 'deepFilter', () => {
	it( 'should not error', () => {
		equal( deepFilter( '<span><em>test</em></span>', [ spanUnwrapper, inlineUnwrapper ] ), 'test' );
		equal( deepFilter( '<em><span>test</span></em>', [ spanUnwrapper, inlineUnwrapper ] ), 'test' );
	} );
} );
