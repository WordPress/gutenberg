/**
 * WordPress dependencies
 */
import {
	createBlock,
	getBlockTypes,
	registerBlockType,
	switchToBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
	metadata as columnsMetadata,
	settings as columnsSettings,
} from '../index';
import {
	metadata as columnMetadata,
	settings as columnSettings,
} from '../../column';
import {
	metadata as groupMetadata,
	settings as groupSettings,
} from '../../group';

describe( 'transforms', () => {
	beforeAll( () => {
		registerBlockType( columnsMetadata, columnsSettings );
		registerBlockType( columnMetadata, columnSettings );
		registerBlockType( groupMetadata, groupSettings );
		registerBlockType( 'core/paragraph', {
			apiVersion: 3,
			attributes: {
				content: {
					type: 'string',
				},
			},
			save: () => {},
			category: 'text',
			title: 'Paragraph',
		} );
	} );

	afterAll( () => {
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	it( 'transforms Columns to the Grid variation of Group', () => {
		const block = createBlock(
			'core/columns',
			{
				align: 'wide',
				isStackedOnMobile: false,
				verticalAlignment: 'center',
			},
			[
				createBlock( 'core/column', {}, [
					createBlock( 'core/paragraph', { content: 'One' } ),
				] ),
				createBlock( 'core/column', {}, [
					createBlock( 'core/paragraph', { content: 'Two' } ),
					createBlock( 'core/paragraph', { content: 'Three' } ),
				] ),
			]
		);

		const transformedBlocks = switchToBlockType(
			block,
			'core/group',
			'group-grid'
		);

		expect( transformedBlocks[ 0 ] ).toMatchObject( {
			name: 'core/group',
			attributes: {
				align: 'wide',
				layout: { type: 'grid' },
			},
		} );
		expect( transformedBlocks[ 0 ].attributes ).not.toHaveProperty(
			'isStackedOnMobile'
		);
		expect( transformedBlocks[ 0 ].attributes ).not.toHaveProperty(
			'verticalAlignment'
		);
		expect( transformedBlocks[ 0 ].innerBlocks ).toHaveLength( 2 );
		expect( transformedBlocks[ 0 ].innerBlocks[ 0 ] ).toMatchObject( {
			name: 'core/paragraph',
			attributes: { content: 'One' },
		} );
		expect( transformedBlocks[ 0 ].innerBlocks[ 1 ] ).toMatchObject( {
			name: 'core/group',
			attributes: { layout: { type: 'constrained' } },
			innerBlocks: [
				expect.objectContaining( {
					name: 'core/paragraph',
					attributes: { content: 'Two' },
				} ),
				expect.objectContaining( {
					name: 'core/paragraph',
					attributes: { content: 'Three' },
				} ),
			],
		} );
	} );
} );
