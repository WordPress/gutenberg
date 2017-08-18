/**
 * External dependencies
 */
import { equal } from 'assert';

/**
 * Internal dependencies
 */
import normaliseBlocks from '../normalise-blocks';

function createNodes( HTML ) {
	document.body.innerHTML = HTML;
	return Array.from( document.body.childNodes );
}

function outerHTML( nodes ) {
	return nodes.map( node => node.outerHTML ).join( '' );
}

function transform( HTML ) {
	return outerHTML( normaliseBlocks( createNodes( HTML ) ) );
}

describe( 'normaliseBlocks', () => {
	it( 'should convert double line breaks to paragraphs', () => {
		equal( transform( 'test<br><br>test' ), '<p>test</p><p>test</p>' );
	} );

	it( 'should not convert single line break to paragraphs', () => {
		equal( transform( 'test<br>test' ), '<p>test<br>test</p>' );
	} );

	it( 'should not add extra line at the start', () => {
		equal( transform( 'test<br><br><br>test' ), '<p>test</p><p>test</p>' );
		equal( transform( '<br>test<br><br>test' ), '<p>test</p><p>test</p>' );
	} );

	it( 'should preserve non-inline content', () => {
		const HTML = '<p>test</p><div>test<br>test</div>';
		equal( transform( HTML ), HTML );
	} );

	it( 'should remove empty paragraphs', () => {
		equal( transform( '<p>&nbsp;</p>' ), '' );
	} );

	it( 'should wrap lose inline elements', () => {
		equal( transform( '<a href="#">test</a>' ), '<p><a href="#">test</a></p>' );
	} );
} );
