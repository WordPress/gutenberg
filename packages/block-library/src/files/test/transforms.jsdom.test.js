import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
	createBlock,
	getBlockTypes,
	registerBlockType,
	switchToBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import { metadata as fileMetadata, settings as fileSettings } from '../../file';
import { createFileBlocks } from '../../file/utils/create-file-blocks';
import { metadata as filesMetadata, settings as filesSettings } from '../index';

describe( 'transforms', () => {
	let originalCreateObjectURL;

	beforeAll( () => {
		// jsdom doesn't implement blob URLs.
		originalCreateObjectURL = window.URL.createObjectURL;
		window.URL.createObjectURL = ( file ) => `blob:${ file.name }`;

		registerBlockType( fileMetadata, fileSettings );
		registerBlockType( filesMetadata, filesSettings );
		registerBlockType( 'core/image', {
			apiVersion: 3,
			attributes: {
				blob: {
					type: 'string',
				},
			},
			save: () => {},
			category: 'media',
			title: 'Image',
		} );
	} );

	afterAll( () => {
		window.URL.createObjectURL = originalCreateObjectURL;
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	it( 'groups selected File blocks in a Files block', () => {
		const fileBlocks = [ 'report', 'notes' ].map( ( name ) =>
			createBlock( 'core/file', {
				href: `https://example.com/${ name }.pdf`,
				fileName: name,
			} )
		);

		const [ filesBlock ] = switchToBlockType( fileBlocks, 'core/files' );

		expect( filesBlock.name ).toBe( 'core/files' );
		expect(
			filesBlock.innerBlocks.map( ( { attributes } ) => attributes.href )
		).toEqual( [
			'https://example.com/report.pdf',
			'https://example.com/notes.pdf',
		] );
	} );

	it( 'ungroups a Files block into its File blocks', () => {
		const innerBlocks = [
			createBlock( 'core/file', {
				href: 'https://example.com/report.pdf',
			} ),
		];

		expect( filesSettings.transforms.ungroup( {}, innerBlocks ) ).toBe(
			innerBlocks
		);
	} );

	describe( 'dropping files', () => {
		const { transform } = fileSettings.transforms.from.find(
			( { type } ) => type === 'files'
		);

		it( 'groups several files in a Files block', () => {
			const block = transform( [
				new window.File( [ 'a' ], 'report.pdf', {
					type: 'application/pdf',
				} ),
				new window.File( [ 'b' ], 'notes.txt', { type: 'text/plain' } ),
			] );

			expect( block.name ).toBe( 'core/files' );
			expect(
				block.innerBlocks.map( ( { attributes } ) => [
					// `fileName` is rich text.
					String( attributes.fileName ),
					attributes.blob,
					attributes.displayPreview,
				] )
			).toEqual( [
				[ 'report.pdf', 'blob:report.pdf', false ],
				[ 'notes.txt', 'blob:notes.txt', undefined ],
			] );
		} );

		it( 'keeps a single file as a File block', () => {
			const blocks = transform( [
				new window.File( [ 'a' ], 'report.pdf', {
					type: 'application/pdf',
				} ),
			] );

			expect( blocks.map( ( { name } ) => name ) ).toEqual( [
				'core/file',
			] );
		} );

		it( 'keeps media files in their own blocks', () => {
			const blocks = transform( [
				new window.File( [ 'a' ], 'report.pdf', {
					type: 'application/pdf',
				} ),
				new window.File( [ 'b' ], 'photo.jpg', { type: 'image/jpeg' } ),
			] );

			expect( blocks.map( ( { name } ) => name ) ).toEqual( [
				'core/file',
				'core/image',
			] );
		} );
	} );
} );

describe( 'createFileBlocks', () => {
	beforeAll( () => {
		registerBlockType( fileMetadata, fileSettings );
	} );

	afterAll( () => {
		unregisterBlockType( fileMetadata.name );
	} );

	it( 'creates File blocks from Media Library items', () => {
		const [ pdfBlock, textBlock ] = createFileBlocks( [
			{
				id: 1,
				url: 'https://example.com/report.pdf',
				title: 'Report',
				mime: 'application/pdf',
			},
			{
				id: 2,
				url: 'https://example.com/notes.txt',
				title: 'Notes',
				mime_type: 'text/plain',
			},
		] );

		expect( pdfBlock.attributes ).toMatchObject( {
			id: 1,
			href: 'https://example.com/report.pdf',
			textLinkHref: 'https://example.com/report.pdf',
			fileId: `wp-block-file--media-${ pdfBlock.clientId }`,
			displayPreview: false,
		} );
		expect( String( pdfBlock.attributes.fileName ) ).toBe( 'Report' );
		expect( textBlock.attributes.displayPreview ).toBeUndefined();
	} );
} );
