import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
	createBlock,
	getBlockTypes,
	getPossibleBlockTransformations,
	registerBlockType,
	switchToBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import {
	metadata as galleryMetadata,
	settings as gallerySettings,
} from '../index';
import {
	metadata as groupMetadata,
	settings as groupSettings,
} from '../../group';
import {
	metadata as columnsMetadata,
	settings as columnsSettings,
} from '../../columns';
import {
	metadata as columnMetadata,
	settings as columnSettings,
} from '../../column';
import { ATTACHED_MEDIA } from '../dynamic-source';

const createImages = ( count ) =>
	Array.from( { length: count }, ( _, index ) =>
		createBlock( 'core/image', {
			url: `https://example.com/${ index + 1 }.jpg`,
			id: index + 1,
		} )
	);

const getColumnImageIds = ( columnsBlock ) =>
	columnsBlock.innerBlocks.map( ( column ) =>
		column.innerBlocks.map( ( image ) => image.attributes.id )
	);

describe( 'transforms', () => {
	beforeAll( () => {
		registerBlockType( galleryMetadata, gallerySettings );
		registerBlockType( groupMetadata, groupSettings );
		registerBlockType( columnsMetadata, columnsSettings );
		registerBlockType( columnMetadata, columnSettings );
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
	it( 'transforms an empty static Gallery to the Grid variation of Group', () => {
		const block = createBlock( 'core/gallery', {}, [] );

		const transformedBlocks = switchToBlockType(
			block,
			'core/group',
			'group-grid'
		);

		expect( transformedBlocks[ 0 ] ).toMatchObject( {
			name: 'core/group',
			attributes: { layout: { type: 'grid' } },
		} );
	} );

	describe( 'to Columns', () => {
		it( 'distributes the images across one column per gallery column', () => {
			const block = createBlock(
				'core/gallery',
				{ columns: 3 },
				createImages( 7 )
			);

			const [ columnsBlock ] = switchToBlockType( block, 'core/columns' );

			expect( columnsBlock.name ).toBe( 'core/columns' );
			expect(
				columnsBlock.innerBlocks.map( ( { name, attributes } ) => [
					name,
					attributes.width,
				] )
			).toEqual( [
				[ 'core/column', '33.33%' ],
				[ 'core/column', '33.33%' ],
				[ 'core/column', '33.33%' ],
			] );
			// Images are dealt in turn, so each gallery row stays a row.
			expect( getColumnImageIds( columnsBlock ) ).toEqual( [
				[ 1, 4, 7 ],
				[ 2, 5 ],
				[ 3, 6 ],
			] );
		} );

		it( 'uses the default gallery column count', () => {
			const block = createBlock( 'core/gallery', {}, createImages( 2 ) );

			const [ columnsBlock ] = switchToBlockType( block, 'core/columns' );

			expect( getColumnImageIds( columnsBlock ) ).toEqual( [
				[ 1 ],
				[ 2 ],
			] );
		} );

		it( 'does not create more columns than there are images', () => {
			const block = createBlock(
				'core/gallery',
				{ columns: 5 },
				createImages( 2 )
			);

			const [ columnsBlock ] = switchToBlockType( block, 'core/columns' );

			expect( columnsBlock.innerBlocks ).toHaveLength( 2 );
			expect( columnsBlock.innerBlocks[ 0 ].attributes.width ).toBe(
				'50%'
			);
		} );

		it( 'clones the images', () => {
			const images = createImages( 1 );
			const block = createBlock( 'core/gallery', {}, images );

			const [ columnsBlock ] = switchToBlockType( block, 'core/columns' );
			const [ image ] = columnsBlock.innerBlocks[ 0 ].innerBlocks;

			expect( image ).toMatchObject( {
				name: 'core/image',
				attributes: { url: 'https://example.com/1.jpg', id: 1 },
			} );
			expect( image.clientId ).not.toBe( images[ 0 ].clientId );
		} );

		it( 'keeps shared attributes and drops the Gallery-specific ones, as the Grid transform does', () => {
			const block = createBlock(
				'core/gallery',
				{
					align: 'wide',
					anchor: 'my-gallery',
					aspectRatio: '4/3',
					caption: 'Gallery caption',
					columns: 2,
					imageCrop: false,
					linkTo: 'media',
				},
				createImages( 2 )
			);

			const [ columnsBlock ] = switchToBlockType( block, 'core/columns' );

			expect( columnsBlock.attributes ).toMatchObject( {
				align: 'wide',
				anchor: 'my-gallery',
			} );
			[
				'aspectRatio',
				'caption',
				'columns',
				'imageCrop',
				'layout',
				'linkTo',
			].forEach( ( attribute ) =>
				expect( columnsBlock.attributes ).not.toHaveProperty(
					attribute
				)
			);
		} );

		it( 'wraps an empty Gallery in Columns, keeping its placeholder', () => {
			const [ columnsBlock ] = switchToBlockType(
				createBlock( 'core/gallery', {}, [] ),
				'core/columns'
			);

			expect( columnsBlock.innerBlocks[ 0 ].innerBlocks[ 0 ].name ).toBe(
				'core/gallery'
			);
		} );

		it( 'drops alignments the Columns block does not support', () => {
			const block = createBlock(
				'core/gallery',
				{ align: 'left' },
				createImages( 2 )
			);

			const [ columnsBlock ] = switchToBlockType( block, 'core/columns' );

			expect( columnsBlock.attributes.align ).toBeUndefined();
		} );
	} );

	describe( 'dynamic mode', () => {
		const createDynamicGallery = () =>
			createBlock(
				'core/gallery',
				{ dynamicContent: { source: ATTACHED_MEDIA } },
				[]
			);

		it( 'does not transform a dynamic Gallery to the Grid variation of Group', () => {
			expect(
				switchToBlockType(
					createDynamicGallery(),
					'core/group',
					'group-grid'
				)
			).toBeNull();
		} );

		it( 'does not transform a dynamic Gallery to Image', () => {
			expect(
				switchToBlockType( createDynamicGallery(), 'core/image' )
			).toBeNull();
		} );

		it( 'wraps a dynamic Gallery in Columns instead of distributing its images', () => {
			const gallery = createDynamicGallery();

			const [ columnsBlock ] = switchToBlockType(
				gallery,
				'core/columns'
			);

			expect( columnsBlock.innerBlocks ).toHaveLength( 1 );
			expect(
				columnsBlock.innerBlocks[ 0 ].innerBlocks[ 0 ]
			).toMatchObject( {
				name: 'core/gallery',
				attributes: { dynamicContent: { source: ATTACHED_MEDIA } },
			} );
		} );

		it( 'does not offer the Image or Grid transforms for a dynamic Gallery', () => {
			const transformations = getPossibleBlockTransformations( [
				createDynamicGallery(),
			] );

			expect(
				transformations.find( ( { name } ) => name === 'core/image' )
			).toBeUndefined();
			expect(
				transformations.find(
					( { name, variationName } ) =>
						name === 'core/group' && variationName === 'group-grid'
				)
			).toBeUndefined();
		} );
	} );
} );
