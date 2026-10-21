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
import { ATTACHED_MEDIA } from '../dynamic-source';

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
				href: {
					type: 'string',
				},
				linkDestination: {
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

	describe( 'from Image blocks', () => {
		const createImages = ( linkDestinations ) =>
			linkDestinations.map( ( linkDestination, index ) =>
				createBlock( 'core/image', {
					url: `https://example.com/${ index }.jpg`,
					id: index + 1,
					linkDestination,
					href:
						linkDestination && linkDestination !== 'none'
							? `https://example.com/link/${ index }`
							: undefined,
				} )
			);

		// Attributes without a value are dropped from the created block, so
		// compare them one by one rather than with `toMatchObject`.
		const expectImageLinksKept = ( gallery, images ) =>
			gallery.innerBlocks.forEach( ( innerBlock, index ) => {
				expect( innerBlock.attributes.linkDestination ).toBe(
					images[ index ].attributes.linkDestination
				);
				expect( innerBlock.attributes.href ).toBe(
					images[ index ].attributes.href
				);
			} );

		it.each( [ 'media', 'attachment', 'none' ] )(
			'sets the Gallery linkTo to %s when every image links there',
			( linkDestination ) => {
				const images = createImages( [
					linkDestination,
					linkDestination,
				] );

				const [ gallery ] = switchToBlockType( images, 'core/gallery' );

				expect( gallery.attributes.linkTo ).toBe( linkDestination );
				expect( gallery.innerBlocks ).toHaveLength( 2 );
				expectImageLinksKept( gallery, images );
			}
		);

		it( 'leaves the Gallery linkTo unset and keeps each image link when the images disagree', () => {
			const images = createImages( [ 'media', 'none', 'custom' ] );

			const [ gallery ] = switchToBlockType( images, 'core/gallery' );

			expect( gallery.attributes.linkTo ).toBeUndefined();
			expectImageLinksKept( gallery, images );
		} );

		it( 'leaves the Gallery linkTo unset when the images have no link destination', () => {
			const images = createImages( [ undefined, undefined ] );

			const [ gallery ] = switchToBlockType( images, 'core/gallery' );

			expect( gallery.attributes.linkTo ).toBeUndefined();
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
