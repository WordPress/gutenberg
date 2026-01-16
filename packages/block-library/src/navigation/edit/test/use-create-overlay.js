/**
 * External dependencies
 */
import { renderHook, act } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import useCreateOverlayTemplatePart from '../use-create-overlay';

// Mock useDispatch
jest.mock( '@wordpress/data', () => ( {
	useDispatch: jest.fn(),
} ) );

// Mock coreStore
jest.mock( '@wordpress/core-data', () => ( {
	store: {},
} ) );

// Mock @wordpress/blocks
jest.mock( '@wordpress/blocks', () => ( {
	serialize: jest.fn( ( blocks ) => JSON.stringify( blocks ) ),
	createBlock: jest.fn( ( name ) => ( {
		name,
		attributes: {},
		innerBlocks: [],
	} ) ),
} ) );

describe( 'useCreateOverlayTemplatePart', () => {
	const mockSaveEntityRecord = jest.fn();

	beforeEach( () => {
		jest.clearAllMocks();
		useDispatch.mockReturnValue( {
			saveEntityRecord: mockSaveEntityRecord,
		} );
	} );

	it( 'should save a new overlay with correct parameters when no overlays exist', async () => {
		const overlayTemplateParts = [];
		const createdOverlay = {
			id: 'twentytwentyfive//overlay',
			theme: 'twentytwentyfive',
			slug: 'overlay',
			title: {
				rendered: 'Overlay',
			},
			area: 'navigation-overlay',
		};

		mockSaveEntityRecord.mockResolvedValue( createdOverlay );

		const { result: createOverlayTemplatePart } = renderHook( () =>
			useCreateOverlayTemplatePart( overlayTemplateParts )
		);

		let savedOverlay;
		await act( async () => {
			savedOverlay = await createOverlayTemplatePart.current();
		} );

		expect( mockSaveEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'wp_template_part',
			expect.objectContaining( {
				slug: 'overlay',
				title: 'Overlay',
				content: expect.any( String ),
				area: 'navigation-overlay',
			} ),
			{ throwOnError: true }
		);
		expect( savedOverlay ).toEqual( createdOverlay );
	} );

	it( 'should generate unique title when overlays already exist', async () => {
		const existingOverlay = {
			id: 'twentytwentyfive//overlay',
			theme: 'twentytwentyfive',
			slug: 'overlay',
			title: {
				rendered: 'Overlay',
			},
			area: 'navigation-overlay',
		};
		const overlayTemplateParts = [ existingOverlay ];
		const createdOverlay = {
			id: 'twentytwentyfive//overlay-2',
			theme: 'twentytwentyfive',
			slug: 'overlay-2',
			title: {
				rendered: 'Overlay 2',
			},
			area: 'navigation-overlay',
		};

		mockSaveEntityRecord.mockResolvedValue( createdOverlay );

		const { result: createOverlayTemplatePart } = renderHook( () =>
			useCreateOverlayTemplatePart( overlayTemplateParts )
		);

		await act( async () => {
			await createOverlayTemplatePart.current();
		} );

		// Verify it generates a unique title (Overlay 2) when Overlay already exists
		expect( mockSaveEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'wp_template_part',
			expect.objectContaining( {
				title: 'Overlay 2',
				slug: 'overlay-2',
				content: expect.any( String ),
				area: 'navigation-overlay',
			} ),
			{ throwOnError: true }
		);
	} );

	it( 'should throw errors when save fails', async () => {
		const overlayTemplateParts = [];
		const error = new Error( 'Failed to save' );
		error.code = 'save_error';

		mockSaveEntityRecord.mockRejectedValue( error );

		const { result: createOverlayTemplatePart } = renderHook( () =>
			useCreateOverlayTemplatePart( overlayTemplateParts )
		);

		await expect(
			act( async () => {
				await createOverlayTemplatePart.current();
			} )
		).rejects.toThrow( 'Failed to save' );

		expect( mockSaveEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'wp_template_part',
			expect.any( Object ),
			{ throwOnError: true }
		);
	} );
} );
