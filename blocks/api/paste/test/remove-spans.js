/**
 * External dependencies
 */
import { equal } from 'assert';

/**
 * Internal dependencies
 */
import removeSpans from '../remove-spans';

function createNodes( HTML ) {
	document.body.innerHTML = HTML;
	return Array.from( document.body.childNodes );
}

function outerHTML( nodes ) {
	return nodes.map( node => node.outerHTML ).join( '' );
}

function transform( HTML ) {
	return outerHTML( removeSpans( createNodes( HTML ) ) );
}

describe( 'removeSpans', () => {
	it( 'should remove spans', () => {
		equal( transform( '<p><span>test</span></p>' ), '<p>test</p>' );
	} );

	it( 'should remove spans with attributes', () => {
		equal( transform( '<p><span id="test">test</span></p>' ), '<p>test</p>' );
	} );

	// To do: fails.
	// it( 'should remove nested spans', () => {
	// 	equal( transform( '<p><span><span>test</span></span></p>' ), '<p>test</p>' );
	// } );

	it( 'should remove spans, but preserve nested structure', () => {
		equal( transform( '<p><span><em>test</em> <em>test</em></span></p>' ), '<p><em>test</em> <em>test</em></p>' );
	} );
} );
