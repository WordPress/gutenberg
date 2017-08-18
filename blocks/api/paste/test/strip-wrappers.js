/**
 * External dependencies
 */
import { equal } from 'assert';

/**
 * WordPress dependencies
 */
import { ELEMENT_NODE } from 'utils/nodetypes';

/**
 * Internal dependencies
 */
import stripWrappers from '../strip-wrappers';

function createNodes( HTML ) {
	document.body.innerHTML = HTML;
	return Array.from( document.body.childNodes );
}

function outerHTML( nodes ) {
	return nodes.map( node =>
		node.nodeType === ELEMENT_NODE ?
		node.outerHTML :
		node.nodeValue
	).join( '' );
}

function transform( HTML ) {
	return outerHTML( stripWrappers( createNodes( HTML ) ) );
}

describe( 'stripWrappers', () => {
	it( 'should remove spans', () => {
		equal( transform( '<span>test</span>' ), 'test' );
	} );

	it( 'should remove wrapped spans', () => {
		equal( transform( '<p><span>test</span></p>' ), '<p>test</p>' );
	} );

	it( 'should remove spans with attributes', () => {
		equal( transform( '<p><span id="test">test</span></p>' ), '<p>test</p>' );
	} );

	it( 'should remove nested spans', () => {
		equal( transform( '<p><span><span>test</span></span></p>' ), '<p>test</p>' );
	} );

	it( 'should remove spans, but preserve nested structure', () => {
		equal( transform( '<p><span><em>test</em> <em>test</em></span></p>' ), '<p><em>test</em> <em>test</em></p>' );
	} );
} );
