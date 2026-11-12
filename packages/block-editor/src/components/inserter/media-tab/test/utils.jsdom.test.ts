import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import { getBlockAndPreviewFromMedia } from '../utils';

describe( 'getBlockAndPreviewFromMedia', () => {
	// A stand-in for the File block, since registering the real one would pull
	// in all of `@wordpress/block-library`.
	beforeAll( () => {
		registerBlockType( 'core/file', {
			apiVersion: 3,
			title: 'File',
			category: 'media',
			attributes: {
				id: { type: 'number' },
				href: { type: 'string' },
				fileName: { type: 'rich-text' },
				textLinkHref: { type: 'string' },
				downloadButtonText: { type: 'rich-text' },
				displayPreview: { type: 'boolean' },
			},
			save: () => null,
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'core/file' );
	} );

	it( 'builds a File block for a PDF, named after its title', () => {
		const [ block ] = getBlockAndPreviewFromMedia(
			{
				id: 3,
				url: 'https://example.com/report.pdf',
				title: { raw: 'Annual report', rendered: 'Annual report' },
				mime_type: 'application/pdf',
			},
			'application'
		);
		expect( block.name ).toBe( 'core/file' );
		expect( block.attributes ).toMatchObject( {
			id: 3,
			href: 'https://example.com/report.pdf',
			textLinkHref: 'https://example.com/report.pdf',
			displayPreview: true,
		} );
		expect( String( block.attributes.fileName ) ).toBe( 'Annual report' );
		expect( String( block.attributes.downloadButtonText ) ).toBe(
			'Download'
		);
	} );

	it( 'names an untitled file after its filename, without a preview', () => {
		const [ block ] = getBlockAndPreviewFromMedia(
			{ id: 4, url: 'https://example.com/archive.zip' },
			'application'
		);
		expect( String( block.attributes.fileName ) ).toBe( 'archive.zip' );
		expect( block.attributes.displayPreview ).toBeUndefined();
	} );
} );
