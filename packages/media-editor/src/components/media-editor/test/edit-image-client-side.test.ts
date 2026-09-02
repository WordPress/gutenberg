import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorCode, UploadError } from '@wordpress/upload-media';
import {
	canEditImageClientSide,
	editImageClientSide,
	getEditedAttachmentData,
	getOriginalImageUrl,
} from '../edit-image-client-side';

const { mockAddEditedImage, mockGetSettings, mockIsSupported } = vi.hoisted(
	() => ( {
		mockAddEditedImage: vi.fn(),
		mockGetSettings: vi.fn(),
		mockIsSupported: vi.fn( () => true ),
	} )
);

vi.mock( import( '@wordpress/upload-media' ), async ( importOriginal ) => {
	const actual = await importOriginal();
	return {
		...actual,
		store: { name: 'core/upload-media' },
		isClientSideMediaSupported: mockIsSupported,
	} as unknown as typeof actual;
} );

const registry = {
	select: () => ( { getSettings: mockGetSettings } ),
	dispatch: () => ( { addEditedImage: mockAddEditedImage } ),
} as unknown as Parameters< typeof canEditImageClientSide >[ 0 ];

const configuredSettings = {
	mediaUpload: () => {},
	mediaSideload: () => {},
	mediaFinalize: async () => {},
};

const media = {
	id: 10,
	source_url: 'https://example.com/wp-content/uploads/2026/09/photo.jpg',
	mime_type: 'image/jpeg',
	title: { raw: 'A photo', rendered: 'A photo' },
	caption: { raw: '', rendered: '' },
	description: { raw: 'Desc', rendered: '<p>Desc</p>' },
	alt_text: 'Alt',
	post: 3,
};

const modifiers = [ { type: 'rotate' as const, args: { angle: 90 } } ];

describe( 'getOriginalImageUrl', () => {
	it( 'uses source_url for images below the big image threshold', () => {
		expect( getOriginalImageUrl( media ) ).toBe( media.source_url );
	} );

	it( 'swaps a -scaled source_url for the original file', () => {
		expect(
			getOriginalImageUrl( {
				...media,
				source_url:
					'https://example.com/wp-content/uploads/2026/09/photo-scaled.jpg',
				media_details: { original_image: 'photo.jpg' },
			} )
		).toBe( 'https://example.com/wp-content/uploads/2026/09/photo.jpg' );
	} );

	it( 'returns undefined without a source_url', () => {
		expect( getOriginalImageUrl( { id: 10 } ) ).toBeUndefined();
	} );
} );

describe( 'getEditedAttachmentData', () => {
	it( 'copies the attachment fields the /edit endpoint would', () => {
		expect( getEditedAttachmentData( undefined, media ) ).toEqual( {
			title: 'A photo',
			caption: '',
			description: 'Desc',
			alt_text: 'Alt',
			post: 3,
		} );
	} );

	it( 'lets pending edits win, including an explicit unattached post', () => {
		expect(
			getEditedAttachmentData(
				{ title: 'Renamed', alt_text: '', post: 0 },
				media
			)
		).toEqual( {
			title: 'Renamed',
			caption: '',
			description: 'Desc',
			alt_text: '',
			post: 0,
		} );
	} );

	it( 'accepts plain string fields', () => {
		expect(
			getEditedAttachmentData( undefined, {
				id: 10,
				title: 'Plain',
			} )
		).toEqual( { title: 'Plain' } );
	} );
} );

describe( 'canEditImageClientSide', () => {
	beforeEach( () => {
		mockIsSupported.mockReturnValue( true );
		mockGetSettings.mockReturnValue( configuredSettings );
	} );

	it( 'is true when the browser and the upload queue are ready', () => {
		expect( canEditImageClientSide( registry ) ).toBe( true );
	} );

	it( 'is false without browser support', () => {
		mockIsSupported.mockReturnValue( false );
		expect( canEditImageClientSide( registry ) ).toBe( false );
	} );

	it( 'is false when the queue has no server transport for sub-sizes', () => {
		// The standalone media editor page has no block editor provider
		// wiring the queue up, so edits stay on the server there.
		mockGetSettings.mockReturnValue( { mediaUpload: () => {} } );
		expect( canEditImageClientSide( registry ) ).toBe( false );
	} );
} );

describe( 'editImageClientSide', () => {
	const fetchMock = vi.fn();

	beforeEach( () => {
		mockIsSupported.mockReturnValue( true );
		mockGetSettings.mockReturnValue( configuredSettings );
		mockAddEditedImage.mockReset();
		fetchMock.mockReset();
		vi.stubGlobal( 'fetch', fetchMock );
		fetchMock.mockResolvedValue( {
			ok: true,
			blob: async () =>
				new Blob( [ 'jpeg bytes' ], { type: 'image/jpeg' } ),
		} );
	} );

	afterEach( () => {
		vi.unstubAllGlobals();
	} );

	it( 'fetches the original and resolves with the new attachment ID', async () => {
		mockAddEditedImage.mockImplementation(
			( { onSuccess }: { onSuccess: ( a: unknown[] ) => void } ) => {
				onSuccess( [ { id: 11, url: 'photo-edited.jpg' } ] );
			}
		);

		const result = await editImageClientSide( {
			registry,
			media,
			modifiers,
			additionalData: { post: 3 },
		} );

		expect( result ).toBe( 11 );
		expect( fetchMock ).toHaveBeenCalledWith( media.source_url );
		expect( mockAddEditedImage ).toHaveBeenCalledWith(
			expect.objectContaining( {
				modifiers,
				sourceAttachmentId: 10,
				additionalData: { post: 3 },
			} )
		);
		const { file } = mockAddEditedImage.mock.calls[ 0 ][ 0 ];
		expect( file ).toBeInstanceOf( File );
		expect( file.name ).toBe( 'photo.jpg' );
		expect( file.type ).toBe( 'image/jpeg' );
	} );

	it( 'falls back when client-side processing is unavailable', async () => {
		mockIsSupported.mockReturnValue( false );

		expect(
			await editImageClientSide( {
				registry,
				media,
				modifiers,
				additionalData: {},
			} )
		).toBeNull();
		expect( fetchMock ).not.toHaveBeenCalled();
	} );

	it( 'falls back when the original cannot be fetched', async () => {
		fetchMock.mockResolvedValue( { ok: false } );

		expect(
			await editImageClientSide( {
				registry,
				media,
				modifiers,
				additionalData: {},
			} )
		).toBeNull();
		expect( mockAddEditedImage ).not.toHaveBeenCalled();
	} );

	it( 'falls back when the edit itself fails before upload', async () => {
		mockAddEditedImage.mockImplementation(
			( { onError }: { onError: ( e: Error ) => void } ) => {
				onError(
					new UploadError( {
						code: ErrorCode.IMAGE_EDIT_ERROR,
						message: 'nope',
						file: new File( [], 'photo.jpg' ),
					} )
				);
			}
		);

		expect(
			await editImageClientSide( {
				registry,
				media,
				modifiers,
				additionalData: {},
			} )
		).toBeNull();
	} );

	it( 'rejects when the upload fails', async () => {
		mockAddEditedImage.mockImplementation(
			( { onError }: { onError: ( e: Error ) => void } ) => {
				onError( new Error( 'Could not finalize the upload.' ) );
			}
		);

		await expect(
			editImageClientSide( {
				registry,
				media,
				modifiers,
				additionalData: {},
			} )
		).rejects.toThrow( 'Could not finalize the upload.' );
	} );
} );
