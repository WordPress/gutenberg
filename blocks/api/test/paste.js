/**
 * External dependencies
 */
import { equal } from 'assert';

/**
 * Internal dependencies
 */
import { normaliseToBlockLevelNodes } from '../paste';
import stripAttributes from '../paste/strip-attributes';
import removeUnsupportedEls from '../paste/remove-unsupported-els';

function createNodes( HTML ) {
	document.body.innerHTML = HTML;
	return Array.from( document.body.childNodes );
}

function outerHTML( nodes ) {
	return nodes.map( node => node.outerHTML ).join( '' );
}

describe( 'normaliseToBlockLevelNodes', () => {
	function transform( HTML ) {
		return outerHTML( normaliseToBlockLevelNodes( createNodes( HTML ) ) );
	}

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
} );

describe( 'stripAttributes ', () => {
	it( 'should remove ids and classes', () => {
		equal( outerHTML( stripAttributes( createNodes( '<p id="foo" class="bar">test</p>' ) ) ), '<p>test</p>' );
	} );
} );

describe( 'removeUnsupportedEls ', () => {
	it( 'should remove <span>s', () => {
		equal( outerHTML( removeUnsupportedEls( createNodes( '<p><span>test</span></p>' ) ) ), '<p>test</p>' );
	} );

	it( 'should remove <meta>s', () => {
		equal( outerHTML( removeUnsupportedEls( createNodes( '<div><meta name="foo" /><p>test</p></div>' ) ) ), '<div><p>test</p></div>' );
	} );
} );
