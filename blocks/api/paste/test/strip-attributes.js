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
	it( 'should remove id, class, and style', () => {
		equal( transform( '<p class="test" style="display:none;">test</p><p id="test">test <a href="#keep">test</a></p>' ), '<p>test</p><p>test <a href="#keep">test</a></p>' );
	} );
} );
