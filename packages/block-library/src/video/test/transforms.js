/**
 * WordPress dependencies
 */
import { select } from '@wordpress/data';

/**
 * Internal dependencies
 */
import transforms from '../transforms';

jest.mock( '@wordpress/data', () => ( {
	select: jest.fn(),
} ) );

jest.mock( '@wordpress/core-data', () => ( {
	store: 'core',
} ) );

/*
 * The icons package re-exports a generated module that only exists once the
 * package is built; the video variations (imported by the transforms) only
 * use the icon as opaque data.
 */
jest.mock( '@wordpress/icons', () => ( {
	video: {},
} ) );

/*
 * core/image is not registered in this unit test, so stub createBlock with a
 * lightweight factory that preserves the name and attributes for assertion.
 */
jest.mock( '@wordpress/blocks', () => ( {
	createBlock: jest.fn( ( name, attributes ) => ( { name, attributes } ) ),
} ) );

describe( 'converted GIF video to Image block transform', () => {
	const toImage = transforms.to.find( ( t ) =>
		t.blocks.includes( 'core/image' )
	);

	// A GIF-behaving video: muted, looping, autoplaying, inline, no controls.
	const gifAttributes = {
		id: 7,
		src: 'https://example.com/wp-content/uploads/cat.mp4',
		controls: false,
		loop: true,
		autoplay: true,
		muted: true,
		playsInline: true,
	};

	const gifRecord = {
		mime_type: 'image/gif',
		source_url: 'https://example.com/wp-content/uploads/cat.gif',
		alt_text: 'A cat',
	};

	let getEntityRecord;

	beforeEach( () => {
		jest.clearAllMocks();
		getEntityRecord = jest.fn( () => gifRecord );
		select.mockReturnValue( { getEntityRecord } );
	} );

	test( 'matches a GIF-behaving video whose media is an image attachment', () => {
		expect( toImage.isMatch( gifAttributes ) ).toBe( true );
		expect( getEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'attachment',
			7,
			{ context: 'view' }
		);
	} );

	test( 'does not match a regular video', () => {
		expect( toImage.isMatch( { ...gifAttributes, controls: true } ) ).toBe(
			false
		);
		// The record is never consulted for non-GIF-behaving videos.
		expect( getEntityRecord ).not.toHaveBeenCalled();
	} );

	test( 'does not match when the attachment is a real video', () => {
		getEntityRecord.mockReturnValue( {
			mime_type: 'video/mp4',
			source_url: 'https://example.com/wp-content/uploads/movie.mp4',
		} );
		expect( toImage.isMatch( gifAttributes ) ).toBe( false );
	} );

	test( 'does not match without an attachment id', () => {
		expect( toImage.isMatch( { ...gifAttributes, id: undefined } ) ).toBe(
			false
		);
	} );

	test( 'restores the original GIF image block', () => {
		const block = toImage.transform( {
			...gifAttributes,
			caption: 'A cat',
			align: 'wide',
		} );

		expect( block.name ).toBe( 'core/image' );
		expect( block.attributes ).toEqual( {
			id: 7,
			url: 'https://example.com/wp-content/uploads/cat.gif',
			alt: 'A cat',
			caption: 'A cat',
			align: 'wide',
		} );
	} );
} );
