import { describe, it } from 'mocha';
import { equal } from 'assert';
import { JSDOM } from 'jsdom';

const { window } = new JSDOM();
const { document } = window;

import { normaliseToBlockLevelNodes } from '../paste';

describe( 'normaliseToBlockLevelNodes', () => {
	function createNodes( HTML ) {
		document.body.innerHTML = HTML;
		return Array.from( document.body.childNodes );
	}

	function outerHTML( nodes ) {
		return nodes.map( node => node.outerHTML ).join( '' );
	}

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
} );

