import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
	createBlock,
	getBlockAttributesNamesByRole,
	serialize,
	unregisterBlockType,
} from '@wordpress/blocks';
import * as listItem from '../index';

describe( 'List Item value', () => {
	beforeAll( () => {
		listItem.init();
	} );

	afterAll( () => {
		unregisterBlockType( listItem.name );
	} );

	it( 'saves the value on the list item', () => {
		const html = serialize(
			createBlock( 'core/list-item', { content: 'Five', value: '5' } )
		);

		expect( html ).toContain( '<li value="5">Five</li>' );
	} );

	it( 'saves a plain list item when there is no value', () => {
		expect(
			serialize( createBlock( 'core/list-item', { content: 'Five' } ) )
		).toContain( '<li>Five</li>' );
		expect(
			serialize(
				createBlock( 'core/list-item', { content: 'Five', value: '' } )
			)
		).toContain( '<li>Five</li>' );
	} );

	it( 'treats the value as content, so new sibling items do not inherit it', () => {
		expect(
			getBlockAttributesNamesByRole( 'core/list-item', 'content' )
		).toEqual( expect.arrayContaining( [ 'content', 'value' ] ) );
	} );
} );
