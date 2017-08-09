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

function createTransform( transformFunc ) {
	return HTML => outerHTML( transformFunc( createNodes( HTML ) ) );
}
const htmlNormaliseToBlockLevelNodes = createTransform( normaliseToBlockLevelNodes );
const htmlStripAttributes = createTransform( stripAttributes );
const htmlRemoveUnsupportedEls = createTransform( removeUnsupportedEls );

describe( 'normaliseToBlockLevelNodes', () => {
	it( 'should convert double line breaks to paragraphs', () => {
		equal( htmlNormaliseToBlockLevelNodes( 'test<br><br>test' ), '<p>test</p><p>test</p>' );
	} );

	it( 'should not convert single line break to paragraphs', () => {
		equal( htmlNormaliseToBlockLevelNodes( 'test<br>test' ), '<p>test<br>test</p>' );
	} );

	it( 'should not add extra line at the start', () => {
		equal( htmlNormaliseToBlockLevelNodes( 'test<br><br><br>test' ), '<p>test</p><p>test</p>' );
		equal( htmlNormaliseToBlockLevelNodes( '<br>test<br><br>test' ), '<p>test</p><p>test</p>' );
	} );

	it( 'should preserve non-inline content', () => {
		const HTML = '<p>test</p><div>test<br>test</div>';
		equal( htmlNormaliseToBlockLevelNodes( HTML ), HTML );
	} );

	it( 'should remove empty paragraphs', () => {
		equal( htmlNormaliseToBlockLevelNodes( '<p>&nbsp;</p>' ), '' );
	} );
} );

describe( 'stripAttributes ', () => {
	it( 'should remove ids and classes', () => {
		equal( htmlStripAttributes( '<p id="foo" class="bar">test</p>' ), '<p>test</p>' );
	} );
} );

describe( 'removeUnsupportedEls ', () => {
	it( 'should remove <span>s', () => {
		equal( htmlRemoveUnsupportedEls( '<p><span>test</span></p>' ), '<p>test</p>' );
	} );

	it( 'should remove <meta>s', () => {
		equal( htmlRemoveUnsupportedEls( '<div><meta name="foo" /><p>test</p></div>' ), '<div><p>test</p></div>' );
	} );
} );
