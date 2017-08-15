/**
 * External dependencies
 */
import { equal, deepEqual } from 'assert';

/**
 * Internal dependencies
 */
import paste, { normaliseToBlockLevelNodes } from '../paste';
import { registerBlockType, unregisterBlockType, setUnknownTypeHandlerName } from '../registration';
import { createBlock } from '../factory';
import { children, prop } from '../source';

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

describe( 'paste', () => {
	beforeAll( () => {
		registerBlockType( 'test/small', {
			category: 'common',
			attributes: {
				content: {
					type: 'array',
					source: children( 'small' ),
				},
			},
			transforms: {
				from: [
					{
						type: 'raw',
						isMatch: ( node ) => node.nodeName === 'SMALL',
					},
				],
			},
			save: () => {},
		} );

		registerBlockType( 'test/unknown', {
			category: 'common',
			attributes: {
				content: {
					type: 'string',
					source: prop( 'innerHTML' ),
				},
			},
			save: () => {},
		} );

		setUnknownTypeHandlerName( 'test/unknown' );
	} );

	afterAll( () => {
		unregisterBlockType( 'test/small' );
		unregisterBlockType( 'test/unknown' );
		setUnknownTypeHandlerName( undefined );
	} );

	it( 'should convert recognised pasted content', () => {
		const pastedBlock = paste( createNodes( '<small>test</small>' ) )[ 0 ];
		const block = createBlock( 'test/small', { content: [ 'test' ] } );

		equal( pastedBlock.name, block.name );
		deepEqual( pastedBlock.attributes, block.attributes );
	} );

	it( 'should handle unknown pasted content', () => {
		const pastedBlock = paste( createNodes( '<big>test</big>' ) )[ 0 ];

		equal( pastedBlock.name, 'test/unknown' );
		equal( pastedBlock.attributes.content, '<big>test</big>' );
	} );
} );
