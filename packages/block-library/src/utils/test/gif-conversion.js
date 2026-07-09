/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import {
	getAnimatedGifVideoCompanion,
	getCarriedGifConversionAttributes,
	getConvertedGifAttachment,
} from '../gif-conversion';

jest.mock( '@wordpress/data', () => ( {
	select: jest.fn(),
} ) );

jest.mock( '@wordpress/core-data', () => ( {
	store: 'core',
} ) );

describe( 'getCarriedGifConversionAttributes', () => {
	it( 'carries align, anchor, className and margin spacing', () => {
		const result = getCarriedGifConversionAttributes( {
			align: 'wide',
			anchor: 'my-gif',
			className: 'is-style-rounded',
			style: { spacing: { margin: { top: '10px', bottom: '10px' } } },
		} );

		expect( result ).toEqual( {
			align: 'wide',
			anchor: 'my-gif',
			className: 'is-style-rounded',
			style: { spacing: { margin: { top: '10px', bottom: '10px' } } },
		} );
	} );

	it( 'omits attributes that are not set', () => {
		expect( getCarriedGifConversionAttributes( {} ) ).toEqual( {} );
		expect(
			getCarriedGifConversionAttributes( { align: 'full' } )
		).toEqual( { align: 'full' } );
	} );

	it( 'carries only margin from style, dropping unsupported styles', () => {
		const result = getCarriedGifConversionAttributes( {
			style: {
				spacing: {
					margin: { top: '5px' },
					padding: { top: '5px' },
				},
				border: { radius: '8px' },
				shadow: 'var:preset|shadow|natural',
			},
		} );

		// Only spacing.margin survives; padding/border/shadow are not carried
		// because the converted block may not support them.
		expect( result ).toEqual( {
			style: { spacing: { margin: { top: '5px' } } },
		} );
	} );

	it( 'does not carry image-only attributes such as links or sizing', () => {
		const result = getCarriedGifConversionAttributes( {
			align: 'center',
			href: 'https://example.com',
			linkDestination: 'custom',
			sizeSlug: 'large',
			scale: 'cover',
		} );

		expect( result ).toEqual( { align: 'center' } );
	} );
} );

describe( 'getAnimatedGifVideoCompanion', () => {
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

	it( 'returns absolute companion URLs and the GIF dimensions', () => {
		expect( getAnimatedGifVideoCompanion( 7, GIF_URL ) ).toEqual( {
			src: 'https://example.com/wp-content/uploads/cat.mp4',
			poster: 'https://example.com/wp-content/uploads/cat.jpg',
			width: 320,
			height: 240,
		} );
		expect( getEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'attachment',
			7,
			{ context: 'view' }
		);
	} );

	it( 'still recognizes a GIF URL that carries a query string or fragment', () => {
		expect(
			getAnimatedGifVideoCompanion( 7, `${ GIF_URL }?ver=2` )
		).not.toBeNull();
		expect(
			getAnimatedGifVideoCompanion( 7, `${ GIF_URL }#frag` )
		).not.toBeNull();
	} );

	it( 'omits the poster when the record has none', () => {
		getEntityRecord.mockReturnValue( {
			...companionRecord,
			media_details: {
				...companionRecord.media_details,
				animated_video_poster: undefined,
			},
		} );

		expect( getAnimatedGifVideoCompanion( 7, GIF_URL ).poster ).toBe(
			undefined
		);
	} );

	it( 'does not read the attachment record for a non-GIF image', () => {
		expect(
			getAnimatedGifVideoCompanion(
				7,
				'https://example.com/wp-content/uploads/cat.jpg'
			)
		).toBeNull();
		expect( getEntityRecord ).not.toHaveBeenCalled();
	} );

	it( 'returns null without an attachment id', () => {
		expect( getAnimatedGifVideoCompanion( undefined, GIF_URL ) ).toBeNull();
		expect( getEntityRecord ).not.toHaveBeenCalled();
	} );

	it( 'returns null while the record is unresolved or has no companion', () => {
		getEntityRecord.mockReturnValue( undefined );
		expect( getAnimatedGifVideoCompanion( 7, GIF_URL ) ).toBeNull();

		getEntityRecord.mockReturnValue( {
			source_url: GIF_URL,
			media_details: { width: 320, height: 240 },
		} );
		expect( getAnimatedGifVideoCompanion( 7, GIF_URL ) ).toBeNull();
	} );
} );

describe( 'getConvertedGifAttachment', () => {
	let getEntityRecord;

	const gifRecord = {
		mime_type: 'image/gif',
		source_url: 'https://example.com/wp-content/uploads/cat.gif',
		alt_text: 'A cat',
	};

	beforeEach( () => {
		jest.clearAllMocks();
		getEntityRecord = jest.fn( () => gifRecord );
		select.mockReturnValue( { getEntityRecord } );
	} );

	it( 'returns the record for an image attachment', () => {
		expect( getConvertedGifAttachment( 7 ) ).toBe( gifRecord );
		expect( getEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'attachment',
			7,
			{ context: 'view' }
		);
	} );

	it( 'returns null without an attachment id', () => {
		expect( getConvertedGifAttachment( undefined ) ).toBeNull();
		expect( getEntityRecord ).not.toHaveBeenCalled();
	} );

	it( 'returns null for a video attachment or an unresolved record', () => {
		getEntityRecord.mockReturnValue( {
			mime_type: 'video/mp4',
			source_url: 'https://example.com/wp-content/uploads/movie.mp4',
		} );
		expect( getConvertedGifAttachment( 7 ) ).toBeNull();

		getEntityRecord.mockReturnValue( undefined );
		expect( getConvertedGifAttachment( 7 ) ).toBeNull();
	} );
} );
