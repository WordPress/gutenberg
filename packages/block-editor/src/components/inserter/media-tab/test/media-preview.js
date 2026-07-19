/**
 * External dependencies
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { MediaPreview } from '../media-preview';

const mockGetSettings = jest.fn();
const mockGetBlock = jest.fn();
const mediaUpload = jest.fn();

// The component reads bound selectors/actions from the block editor and
// notices stores; return them directly so no registry is needed.
jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );
jest.mock( '@wordpress/data/src/components/use-dispatch', () => ( {
	useDispatch: () => ( {
		updateBlockAttributes: jest.fn(),
		createErrorNotice: jest.fn(),
		createSuccessNotice: jest.fn(),
	} ),
} ) );

// Replace the draggable wrapper so the preview renders without drag wiring.
jest.mock( '../../../inserter-draggable-blocks', () => ( {
	__esModule: true,
	default: ( { children } ) => children( { draggable: false } ),
} ) );

const category = { mediaType: 'image' };

const baseMedia = {
	sourceId: 'test-1',
	title: 'Media item title',
	url: 'https://example.com/tree.jpg',
	alt: 'A tall oak tree',
	caption: 'Tree caption',
};

// Renders the preview, clicks the media item, and returns the arguments the
// upload was called with.
async function insertMedia( media ) {
	render(
		<MediaPreview
			media={ media }
			onClick={ jest.fn() }
			category={ category }
		/>
	);
	await userEvent.click( screen.getByRole( 'option' ) );
	await waitFor( () => expect( mediaUpload ).toHaveBeenCalled() );
	return mediaUpload.mock.calls[ 0 ][ 0 ];
}

describe( 'MediaPreview external media upload', () => {
	beforeAll( () => {
		registerBlockType( 'core/image', {
			apiVersion: 3,
			title: 'Image',
			category: 'media',
			attributes: {
				id: { type: 'number' },
				url: { type: 'string' },
				alt: { type: 'string' },
				caption: { type: 'string' },
			},
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'core/image' );
	} );

	beforeEach( () => {
		jest.clearAllMocks();
		mockGetSettings.mockReturnValue( { mediaUpload } );
		useSelect.mockImplementation( () => ( {
			getSettings: mockGetSettings,
			getBlock: mockGetBlock,
		} ) );
		window.fetch = jest.fn( () =>
			Promise.resolve( {
				blob: () =>
					Promise.resolve(
						new window.Blob( [ 'image-data' ], {
							type: 'image/jpeg',
						} )
					),
			} )
		);
	} );

	it( 'passes the media metadata to the upload as attachment fields', async () => {
		const { additionalData } = await insertMedia( {
			...baseMedia,
			description: 'A long description',
		} );

		expect( additionalData ).toEqual( {
			caption: 'Tree caption',
			alt_text: 'A tall oak tree',
			title: 'Media item title',
			description: 'A long description',
		} );
	} );

	it( 'omits attachment fields the media item does not provide', async () => {
		const { additionalData } = await insertMedia( {
			...baseMedia,
			title: '',
			alt: undefined,
		} );

		expect( additionalData ).toEqual( { caption: 'Tree caption' } );
	} );

	it( 'names the uploaded file from the media item filename when provided', async () => {
		const { filesList } = await insertMedia( {
			...baseMedia,
			filename: 'oak-tree.jpg',
		} );

		expect( filesList[ 0 ].name ).toBe( 'oak-tree.jpg' );
	} );

	it( 'falls back to the url filename when no filename is provided', async () => {
		const { filesList } = await insertMedia( baseMedia );

		expect( filesList[ 0 ].name ).toBe( 'tree.jpg' );
	} );

	it( 'does not derive a filename from a data url', async () => {
		const { filesList } = await insertMedia( {
			...baseMedia,
			url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg',
		} );

		expect( filesList[ 0 ].name ).toBe( 'image.jpg' );
	} );

	it( 'does not derive a filename from a blob url', async () => {
		const { filesList } = await insertMedia( {
			...baseMedia,
			url: 'blob:https://example.com/e4b1a532-9797-4a6b-a55c-b81e88a52e39',
		} );

		expect( filesList[ 0 ].name ).toBe( 'image.jpg' );
	} );
} );
