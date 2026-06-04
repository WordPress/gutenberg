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
	metadata as galleryMetadata,
	settings as gallerySettings,
} from '../index';
import {
	metadata as groupMetadata,
	settings as groupSettings,
} from '../../group';

describe( 'transforms', () => {
	beforeAll( () => {
		registerBlockType( galleryMetadata, gallerySettings );
		registerBlockType( groupMetadata, groupSettings );
		registerBlockType( 'core/image', {
			apiVersion: 3,
			attributes: {
				url: {
					type: 'string',
				},
				alt: {
					type: 'string',
				},
				caption: {
					type: 'rich-text',
				},
				id: {
					type: 'number',
				},
				sizeSlug: {
					type: 'string',
				},
			},
			save: () => {},
			category: 'media',
			title: 'Image',
		} );
	} );

	afterAll( () => {
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	it( 'transforms Gallery to the Grid variation of Group with images as direct children', () => {
		const firstImage = createBlock( 'core/image', {
			url: 'https://example.com/one.jpg',
			alt: 'One',
			id: 1,
			sizeSlug: 'large',
		} );
		const secondImage = createBlock( 'core/image', {
			url: 'https://example.com/two.jpg',
			alt: 'Two',
			id: 2,
			sizeSlug: 'large',
		} );
		const block = createBlock(
			'core/gallery',
			{
				align: 'wide',
				caption: 'Gallery caption',
				columns: 2,
				imageCrop: false,
			},
			[ firstImage, secondImage ]
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
				layout: { type: 'grid', columnCount: 2 },
			},
		} );
		expect( transformedBlocks[ 0 ].attributes ).not.toHaveProperty(
			'caption'
		);
		expect( transformedBlocks[ 0 ].attributes ).not.toHaveProperty(
			'columns'
		);
		expect( transformedBlocks[ 0 ].attributes ).not.toHaveProperty(
			'imageCrop'
		);
		expect( transformedBlocks[ 0 ].innerBlocks ).toHaveLength( 2 );
		expect( transformedBlocks[ 0 ].innerBlocks[ 0 ] ).toMatchObject( {
			name: 'core/image',
			attributes: {
				url: 'https://example.com/one.jpg',
				alt: 'One',
				id: 1,
				sizeSlug: 'large',
			},
		} );
		expect( transformedBlocks[ 0 ].innerBlocks[ 1 ] ).toMatchObject( {
			name: 'core/image',
			attributes: {
				url: 'https://example.com/two.jpg',
				alt: 'Two',
				id: 2,
				sizeSlug: 'large',
			},
		} );
		expect( transformedBlocks[ 0 ].innerBlocks[ 0 ].clientId ).not.toBe(
			firstImage.clientId
		);
		expect( transformedBlocks[ 0 ].innerBlocks[ 1 ].clientId ).not.toBe(
			secondImage.clientId
		);
	} );

	it( 'transforms Gallery to the Grid variation of Group with the default gallery column count', () => {
		const block = createBlock( 'core/gallery', {}, [
			createBlock( 'core/image', {
				url: 'https://example.com/one.jpg',
			} ),
			createBlock( 'core/image', {
				url: 'https://example.com/two.jpg',
			} ),
		] );

		const transformedBlocks = switchToBlockType(
			block,
			'core/group',
			'group-grid'
		);

		expect( transformedBlocks[ 0 ] ).toMatchObject( {
			name: 'core/group',
			attributes: {
				layout: { type: 'grid', columnCount: 2 },
			},
		} );
	} );
} );
