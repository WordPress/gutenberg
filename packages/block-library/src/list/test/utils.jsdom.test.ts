import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import listMetadata from '../block.json';
import listSave from '../save';
import listItemMetadata from '../../list-item/block.json';
import listItemSave from '../../list-item/save';
import { createListBlockFromDOMElement } from '../utils';

function parseList( html: string ) {
	const container = document.createElement( 'div' );
	container.innerHTML = html;
	return container.firstElementChild as HTMLElement;
}

describe( 'createListBlockFromDOMElement', () => {
	beforeAll( () => {
		registerBlockType( listItemMetadata as never, { save: listItemSave } );
		registerBlockType( listMetadata as never, { save: listSave } );
	} );

	afterAll( () => {
		unregisterBlockType( listMetadata.name );
		unregisterBlockType( listItemMetadata.name );
	} );

	it( 'keeps the value of a list item', () => {
		const block = createListBlockFromDOMElement(
			parseList( '<ol><li value="5">Five</li><li>Six</li></ol>' )
		);

		expect(
			block.innerBlocks.map(
				( { attributes }: { attributes: { value?: string } } ) =>
					attributes.value
			)
		).toEqual( [ '5', undefined ] );
	} );

	it( 'keeps the value of a list item that has a nested list', () => {
		const block = createListBlockFromDOMElement(
			parseList(
				'<ol><li value="5">Five<ol><li value="2">Two</li></ol></li></ol>'
			)
		);
		const [ item ] = block.innerBlocks;
		const [ nestedItem ] = item.innerBlocks[ 0 ].innerBlocks;

		expect( item.attributes.value ).toBe( '5' );
		expect( nestedItem.attributes.value ).toBe( '2' );
	} );
} );
