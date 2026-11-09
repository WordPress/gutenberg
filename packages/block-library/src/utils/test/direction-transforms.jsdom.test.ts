import { afterAll, beforeAll, describe, expect, it } from 'vitest';
// Load block support registration filters.
import '@wordpress/block-editor';
import {
	createBlock,
	getBlockTypes,
	switchToBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import * as paragraph from '../../paragraph';
import * as heading from '../../heading';
import * as list from '../../list';
import * as listItem from '../../list-item';

describe( 'direction across transforms', () => {
	beforeAll( () => {
		[ paragraph, heading, list, listItem ].forEach( ( block ) =>
			block.init()
		);
	} );

	afterAll( () => {
		getBlockTypes().forEach( ( { name } ) => unregisterBlockType( name ) );
	} );

	it( 'keeps direction from paragraph to heading and back', () => {
		const [ newHeading ] = switchToBlockType(
			createBlock( 'core/paragraph', {
				content: 'Hello',
				direction: 'rtl',
			} ),
			'core/heading'
		);
		expect( newHeading.attributes.direction ).toBe( 'rtl' );

		const [ newParagraph ] = switchToBlockType(
			newHeading,
			'core/paragraph'
		);
		expect( newParagraph.attributes.direction ).toBe( 'rtl' );
	} );

	it( 'keeps each paragraph direction on the list items', () => {
		const [ newList ] = switchToBlockType(
			[
				createBlock( 'core/paragraph', {
					content: 'One',
					direction: 'rtl',
				} ),
				createBlock( 'core/paragraph', { content: 'Two' } ),
			],
			'core/list'
		);
		expect(
			newList.innerBlocks.map( ( item ) => item.attributes.direction )
		).toEqual( [ 'rtl', undefined ] );

		const paragraphs = switchToBlockType( newList, 'core/paragraph' );
		expect(
			paragraphs.map( ( block ) => block.attributes.direction )
		).toEqual( [ 'rtl', undefined ] );
	} );
} );
