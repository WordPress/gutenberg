import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
	createBlock,
	registerBlockType,
	switchToBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import type { BlockConfiguration } from '@wordpress/blocks';

const MEDIA_TEXT_BLOCK_NAME = 'core/media-text';
const IMAGE_BLOCK_NAME = 'core/image';

describe( 'transforms', () => {
	beforeAll( async () => {
		const { default: transforms } = await vi.importActual< {
			default: BlockConfiguration[ 'transforms' ];
		} >( '../transforms' );
		registerBlockType(
			{
				apiVersion: 3,
				name: MEDIA_TEXT_BLOCK_NAME,
				title: 'Media & Text',
				category: 'media',
				attributes: {
					mediaType: { type: 'string' },
					mediaUrl: { type: 'string' },
					mediaTitle: { type: 'string' },
				},
			},
			{ transforms }
		);
		registerBlockType(
			{
				apiVersion: 3,
				name: IMAGE_BLOCK_NAME,
				title: 'Image',
				category: 'media',
				attributes: {
					url: { type: 'string' },
					title: { type: 'string' },
				},
			},
			{}
		);
	} );

	afterAll( () => {
		unregisterBlockType( MEDIA_TEXT_BLOCK_NAME );
		unregisterBlockType( IMAGE_BLOCK_NAME );
	} );

	it( 'keeps the title when transforming Image to Media & Text', () => {
		const block = createBlock( IMAGE_BLOCK_NAME, {
			url: 'https://example.com/image.jpg',
			title: 'My title',
		} );

		const transformedBlocks = switchToBlockType(
			block,
			MEDIA_TEXT_BLOCK_NAME
		);

		expect( transformedBlocks?.[ 0 ].attributes.mediaTitle ).toBe(
			'My title'
		);
	} );

	it( 'keeps the title when transforming Media & Text to Image', () => {
		const block = createBlock( MEDIA_TEXT_BLOCK_NAME, {
			mediaType: 'image',
			mediaUrl: 'https://example.com/image.jpg',
			mediaTitle: 'My title',
		} );

		const transformedBlocks = switchToBlockType( block, IMAGE_BLOCK_NAME );

		expect( transformedBlocks?.[ 0 ].attributes.title ).toBe( 'My title' );
	} );
} );
