/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import transforms, { stripFirstImage } from '../transforms';

jest.mock( '@wordpress/data', () => ( {
	select: jest.fn(),
} ) );

jest.mock( '@wordpress/core-data', () => ( {
	store: 'core',
} ) );

/*
 * core/video is not registered in this unit test, so stub createBlock with a
 * lightweight factory that preserves the name and attributes for assertion.
 */
jest.mock( '@wordpress/blocks', () => ( {
	createBlock: jest.fn( ( name, attributes ) => ( { name, attributes } ) ),
	getBlockAttributes: jest.fn(),
} ) );

describe( 'stripFirstImage', () => {
	test( 'should do nothing if no image is present', () => {
		expect( stripFirstImage( {}, { shortcode: { content: '' } } ) ).toEqual(
			''
		);
		expect(
			stripFirstImage( {}, { shortcode: { content: 'Tucson' } } )
		).toEqual( 'Tucson' );
		expect(
			stripFirstImage( {}, { shortcode: { content: '<em>Tucson</em>' } } )
		).toEqual( '<em>Tucson</em>' );
	} );

	test( 'should strip out image when leading as expected', () => {
		expect(
			stripFirstImage( {}, { shortcode: { content: '<img>' } } )
		).toEqual( '' );
		expect(
			stripFirstImage( {}, { shortcode: { content: '<img>Image!' } } )
		).toEqual( 'Image!' );
		expect(
			stripFirstImage(
				{},
				{ shortcode: { content: '<img src="image.png">Image!' } }
			)
		).toEqual( 'Image!' );
	} );

	test( 'should strip out image when not in leading position as expected', () => {
		expect(
			stripFirstImage( {}, { shortcode: { content: 'Before<img>' } } )
		).toEqual( 'Before' );
		expect(
			stripFirstImage(
				{},
				{ shortcode: { content: 'Before<img>Image!' } }
			)
		).toEqual( 'BeforeImage!' );
		expect(
			stripFirstImage(
				{},
				{ shortcode: { content: 'Before<img src="image.png">Image!' } }
			)
		).toEqual( 'BeforeImage!' );
	} );

	test( 'should strip out only the first of many images', () => {
		expect(
			stripFirstImage( {}, { shortcode: { content: '<img><img>' } } )
		).toEqual( '<img>' );
	} );

	test( 'should strip out the first image and its wrapping parents', () => {
		expect(
			stripFirstImage(
				{},
				{ shortcode: { content: '<p><a><img></a></p><p><img></p>' } }
			)
		).toEqual( '<p><img></p>' );
	} );
} );

describe( 'animated GIF to Video block transform', () => {
	const toVideo = transforms.to.find( ( t ) =>
		t.blocks.includes( 'core/video' )
	);
	const GIF_URL = 'https://example.com/wp-content/uploads/cat.gif';
	let getEntityRecord;

	const companionRecord = {
		source_url: GIF_URL,
		media_details: {
			animated_video: 'cat.mp4',
			animated_video_poster: 'cat.jpg',
			width: 320,
			height: 240,
		},
	};

	beforeEach( () => {
		jest.clearAllMocks();
		getEntityRecord = jest.fn( () => companionRecord );
		select.mockReturnValue( { getEntityRecord } );
	} );

	test( 'matches only when the attachment has a video companion', () => {
		expect( toVideo.isMatch( { id: 7, url: GIF_URL } ) ).toBe( true );

		// Not a GIF.
		expect(
			toVideo.isMatch( {
				id: 7,
				url: 'https://example.com/wp-content/uploads/cat.jpg',
			} )
		).toBe( false );

		// No attachment id (e.g. an external image).
		expect( toVideo.isMatch( { url: GIF_URL } ) ).toBe( false );

		// A GIF without a sideloaded companion video.
		getEntityRecord.mockReturnValue( {
			source_url: GIF_URL,
			media_details: { width: 320, height: 240 },
		} );
		expect( toVideo.isMatch( { id: 7, url: GIF_URL } ) ).toBe( false );
	} );

	test( 'creates a GIF-behaving video block from the companion', () => {
		const block = toVideo.transform( {
			id: 7,
			url: GIF_URL,
			caption: 'A cat',
			align: 'wide',
			anchor: 'my-gif',
		} );

		expect( block.name ).toBe( 'core/video' );
		expect( block.attributes ).toEqual( {
			id: 7,
			src: 'https://example.com/wp-content/uploads/cat.mp4',
			poster: 'https://example.com/wp-content/uploads/cat.jpg',
			caption: 'A cat',
			controls: false,
			loop: true,
			autoplay: true,
			muted: true,
			playsInline: true,
			width: 320,
			height: 240,
			align: 'wide',
			anchor: 'my-gif',
		} );
	} );
} );
