import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
	createBlock,
	registerBlockType,
	serialize,
	unregisterBlockType,
} from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import { parseInnerBlocksOverride } from '..';

const serializeTexts = ( contents: string[] ) =>
	serialize(
		contents.map( ( content ) => createBlock( 'test/text', { content } ) )
	);

const getContents = ( blocks: Block[] | undefined ) =>
	blocks?.map( ( block ) => block.attributes.content );

describe( 'parseInnerBlocksOverride', () => {
	beforeAll( () => {
		registerBlockType( 'test/text', {
			apiVersion: 3,
			title: 'Text',
			category: 'text',
			attributes: {
				content: { type: 'string' },
			},
			save: () => null,
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'test/text' );
	} );

	it( 'parses block markup', () => {
		expect(
			getContents(
				parseInnerBlocksOverride(
					serializeTexts( [ 'First', 'Second' ] )
				)
			)
		).toEqual( [ 'First', 'Second' ] );
	} );

	it( 'parses an empty string as no inner blocks', () => {
		expect( parseInnerBlocksOverride( '' ) ).toEqual( [] );
	} );

	it.each( [
		[ 'a space', ' ' ],
		[ 'a tab', '\t' ],
		[ 'a newline', '\n' ],
		[ 'a form feed', '\f' ],
		[ 'a carriage return', '\r' ],
	] )( 'parses block markup that starts with %s', ( _name, prefix ) => {
		expect(
			getContents(
				parseInnerBlocksOverride(
					prefix + serializeTexts( [ 'First' ] )
				)
			)
		).toEqual( [ 'First' ] );
	} );

	it.each( [
		[ 'a no-break space', '\u00a0' ],
		[ 'a byte order mark', '\ufeff' ],
		[ 'a vertical tab', '\v' ],
	] )(
		'does not parse block markup that starts with %s',
		( _name, prefix ) => {
			expect(
				parseInnerBlocksOverride(
					prefix + serializeTexts( [ 'First' ] )
				)
			).toBeUndefined();
		}
	);

	it.each( [
		[ 'HTML', '<p>Classic content</p>' ],
		[ 'whitespace', ' ' ],
		[ 'a missing value', undefined ],
		[ 'null', null ],
		[ 'an array', [] ],
	] )( 'does not parse %s', ( _name, value ) => {
		expect( parseInnerBlocksOverride( value ) ).toBeUndefined();
	} );
} );
