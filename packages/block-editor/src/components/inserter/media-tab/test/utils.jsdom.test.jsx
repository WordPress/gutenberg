import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import { getBlockAndPreviewFromMedia, getMediaTitle } from '../utils';

// Minimal stand-ins for the core media blocks, mirroring the attributes this
// module sets. Registering the real ones would pull in all of
// `@wordpress/block-library`, which needs a build.
const BLOCK_FIXTURES = {
	'core/image': {
		id: { type: 'number' },
		url: { type: 'string' },
		alt: { type: 'string' },
		caption: { type: 'rich-text' },
	},
	'core/video': {
		id: { type: 'number' },
		src: { type: 'string' },
		caption: { type: 'rich-text' },
	},
	'core/audio': {
		id: { type: 'number' },
		src: { type: 'string' },
		caption: { type: 'rich-text' },
	},
	'core/file': {
		id: { type: 'number' },
		href: { type: 'string' },
		fileName: { type: 'rich-text' },
		textLinkHref: { type: 'string' },
	},
};

describe( 'getMediaTitle', () => {
	it( 'reads a plain string title', () => {
		expect( getMediaTitle( { title: 'Annual report' } ) ).toBe(
			'Annual report'
		);
	} );

	it( 'prefers the raw title of a core-data attachment record', () => {
		expect(
			getMediaTitle( {
				title: { raw: 'Q1 & Q2', rendered: 'Q1 &amp; Q2' },
			} )
		).toBe( 'Q1 & Q2' );
	} );

	it( 'falls back to the rendered title when there is no raw one', () => {
		expect( getMediaTitle( { title: { rendered: 'Rendered' } } ) ).toBe(
			'Rendered'
		);
	} );

	it( 'returns undefined for a missing or empty title', () => {
		expect( getMediaTitle( {} ) ).toBeUndefined();
		expect( getMediaTitle( { title: '' } ) ).toBeUndefined();
		expect( getMediaTitle( { title: { raw: '' } } ) ).toBeUndefined();
	} );
} );

describe( 'getBlockAndPreviewFromMedia', () => {
	beforeAll( () => {
		Object.entries( BLOCK_FIXTURES ).forEach( ( [ name, attributes ] ) => {
			registerBlockType( name, {
				apiVersion: 3,
				title: name,
				attributes,
				save: () => null,
			} );
		} );
	} );

	afterAll( () => {
		Object.keys( BLOCK_FIXTURES ).forEach( unregisterBlockType );
	} );

	it( 'builds an Image block previewed with an `img`', () => {
		const [ block, preview ] = getBlockAndPreviewFromMedia(
			{
				id: 1,
				url: 'https://example.com/pic.jpg',
				previewUrl: 'https://example.com/pic-medium.jpg',
				alt: 'A picture',
				caption: 'A caption',
			},
			'image'
		);
		expect( block.name ).toBe( 'core/image' );
		expect( block.attributes ).toMatchObject( {
			id: 1,
			url: 'https://example.com/pic.jpg',
			alt: 'A picture',
		} );
		expect( block.attributes.caption.toString() ).toBe( 'A caption' );
		expect( preview.type ).toBe( 'img' );
		expect( preview.props.src ).toBe(
			'https://example.com/pic-medium.jpg'
		);
		expect( preview.props.alt ).toBe( 'A picture' );
	} );

	it.each( [
		[ 'video', 'core/video' ],
		[ 'audio', 'core/audio' ],
	] )( 'builds a %s block from `src`', ( mediaType, blockName ) => {
		const [ block, preview ] = getBlockAndPreviewFromMedia(
			{ id: 2, url: `https://example.com/media.${ mediaType }` },
			mediaType
		);
		expect( block.name ).toBe( blockName );
		expect( block.attributes ).toMatchObject( {
			id: 2,
			src: `https://example.com/media.${ mediaType }`,
		} );
		expect( preview.type ).toBe( mediaType );
	} );

	it( 'builds a File block for a media type with no inline preview', () => {
		const [ block, preview ] = getBlockAndPreviewFromMedia(
			{
				id: 3,
				url: 'https://example.com/report.pdf',
				title: { raw: 'Annual report' },
			},
			'application'
		);
		expect( block.name ).toBe( 'core/file' );
		expect( block.attributes ).toMatchObject( {
			id: 3,
			href: 'https://example.com/report.pdf',
			textLinkHref: 'https://example.com/report.pdf',
		} );
		// `fileName` is a rich-text attribute, so `createBlock` wraps it.
		expect( block.attributes.fileName.toString() ).toBe( 'Annual report' );
		render( preview );
		expect( screen.getByText( 'Annual report' ) ).toBeInTheDocument();
	} );

	it( 'names an untitled file after its filename', () => {
		const [ block ] = getBlockAndPreviewFromMedia(
			{ id: 4, url: 'https://example.com/notes.txt' },
			'text'
		);
		expect( block.name ).toBe( 'core/file' );
		expect( block.attributes.fileName.toString() ).toBe( 'notes.txt' );
	} );

	it( 'falls back to a File block for an unrecognised media type', () => {
		const [ block ] = getBlockAndPreviewFromMedia(
			{ url: 'https://example.com/model.glb' },
			'model'
		);
		expect( block.name ).toBe( 'core/file' );
		expect( block.attributes.id ).toBeUndefined();
	} );
} );
