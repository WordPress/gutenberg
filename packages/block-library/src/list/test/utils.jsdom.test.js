import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { unregisterBlockType } from '@wordpress/blocks';
import * as list from '../index';
import * as listItem from '../../list-item';
import { createListBlockFromDOMElement } from '../utils';

function parseList( html ) {
	const container = document.createElement( 'div' );
	container.innerHTML = html;
	return container.firstElementChild;
}

describe( 'createListBlockFromDOMElement', () => {
	beforeAll( () => {
		listItem.init();
		list.init();
	} );

	afterAll( () => {
		unregisterBlockType( list.name );
		unregisterBlockType( listItem.name );
	} );

	it( 'keeps the value of a list item', () => {
		const block = createListBlockFromDOMElement(
			parseList( '<ol><li value="5">Five</li><li>Six</li></ol>' )
		);

		expect(
			block.innerBlocks.map( ( { attributes } ) => attributes.value )
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
