/**
 * External dependencies
 */
import { equal } from 'assert';

/**
 * Internal dependencies
 */
import createUnwrapper from '../create-unwrapper';
import { deepFilterHTML } from '../utils';

const unwrapper = createUnwrapper( ( node ) => node.nodeName === 'SPAN' );
const unwrapperWithAfter = createUnwrapper(
	( node ) => node.nodeName === 'P',
	() => document.createElement( 'BR' )
);

describe( 'createUnwrapper', () => {
	it( 'should remove spans', () => {
		equal( deepFilterHTML( '<span>test</span>', [ unwrapper ] ), 'test' );
	} );

	it( 'should remove wrapped spans', () => {
		equal( deepFilterHTML( '<p><span>test</span></p>', [ unwrapper ] ), '<p>test</p>' );
	} );

	it( 'should remove spans with attributes', () => {
		equal( deepFilterHTML( '<p><span id="test">test</span></p>', [ unwrapper ] ), '<p>test</p>' );
	} );

	it( 'should remove nested spans', () => {
		equal( deepFilterHTML( '<p><span><span>test</span></span></p>', [ unwrapper ] ), '<p>test</p>' );
	} );

	it( 'should remove spans, but preserve nested structure', () => {
		equal( deepFilterHTML( '<p><span><em>test</em> <em>test</em></span></p>', [ unwrapper ] ), '<p><em>test</em> <em>test</em></p>' );
	} );

	it( 'should remove paragraphs and insert line break', () => {
		equal( deepFilterHTML( '<p>test</p>', [ unwrapperWithAfter ] ), 'test<br>' );
	} );
} );
