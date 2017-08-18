/**
 * External dependencies
 */
import { equal } from 'assert';

/**
 * Internal dependencies
 */
import stripAttributes from '../strip-attributes';

function createNodes( HTML ) {
	document.body.innerHTML = HTML;
	return Array.from( document.body.childNodes );
}

function outerHTML( nodes ) {
	return nodes.map( node => node.outerHTML ).join( '' );
}

function transform( HTML ) {
	return outerHTML( stripAttributes( createNodes( HTML ) ) );
}

describe( 'stripAttributes', () => {
	it( 'should remove attributes', () => {
		equal( transform( '<p class="test">test</p>' ), '<p>test</p>' );
	} );

	it( 'should remove multiple attributes', () => {
		equal( transform( '<p class="test" id="test">test</p>' ), '<p>test</p>' );
	} );

	it( 'should deep remove attributes', () => {
		equal( transform( '<p class="test">test <em id="test">test</em></p>' ), '<p>test <em>test</em></p>' );
	} );

	it( 'should remove data-* attributes', () => {
		equal( transform( '<p data-reactid="1">test</p>' ), '<p>test</p>' );
	} );

	it( 'should keep some attributes', () => {
		equal( transform( '<a href="#keep">test</a>' ), '<a href="#keep">test</a>' );
	} );
} );
