/**
 * External dependencies
 */
import { renderHook, act } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import useCreateOverlayTemplatePart from '../use-create-overlay';

// Mock useDispatch and useSelect
jest.mock( '@wordpress/data', () => ( {
	useDispatch: jest.fn(),
	useSelect: jest.fn(),
} ) );

// Mock coreStore
jest.mock( '@wordpress/core-data', () => ( {
	store: {},
} ) );

// Mock blockEditorStore
jest.mock( '@wordpress/block-editor', () => ( {
	store: {},
} ) );

// Mock @wordpress/blocks
jest.mock( '@wordpress/blocks', () => ( {
	serialize: jest.fn( ( blocks ) => JSON.stringify( blocks ) ),
	parse: jest.fn( ( content ) => {
		// Return mock blocks when parsing pattern content
		if ( content && typeof content === 'string' ) {
			return [
				{
					name: 'core/group',
					attributes: {},
					innerBlocks: [],
				},
			];
		}
		return [];
	} ),
	createBlock: jest.fn( ( name ) => ( {
		name,
		attributes: {},
		innerBlocks: [],
	} ) ),
} ) );

// Mock lock-unlock
const mockUnlock = jest.fn();
jest.mock( '../../../lock-unlock', () => ( {
	unlock: ( select ) => mockUnlock( select ),
} ) );

describe( 'useCreateOverlayTemplatePart', () => {
	const mockSaveEntityRecord = jest.fn();
	const mockGetPatternBySlug = jest.fn();

	beforeEach( () => {
		jest.clearAllMocks();
		useDispatch.mockReturnValue( {
			saveEntityRecord: mockSaveEntityRecord,
		} );

		mockUnlock.mockReturnValue( {
			getPatternBySlug: mockGetPatternBySlug,
		} );

		useSelect.mockImplementation( ( selector ) => {
			const mockSelect = jest.fn( ( store ) => {
				if ( store === require( '@wordpress/block-editor' ).store ) {
					return {}; // Return mock block editor store
				}
				return {};
			} );
			return selector( mockSelect );
		} );

		mockGetPatternBySlug.mockReturnValue( {
			name: 'core/navigation-overlay',
			title: 'Navigation Overlay',
			content:
				'<!-- wp:group --><div class="wp-block-group"><!-- wp:navigation-overlay-close /--><!-- wp:navigation /--></div><!-- /wp:group -->',
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

	it( 'should use pattern content when pattern is found', async () => {
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

		// Import mocked functions
		const blocksModule = require( '@wordpress/blocks' );
		const { parse, serialize } = blocksModule;

		const { result: createOverlayTemplatePart } = renderHook( () =>
			useCreateOverlayTemplatePart( overlayTemplateParts )
		);

		await act( async () => {
			await createOverlayTemplatePart.current();
		} );

		expect( mockGetPatternBySlug ).toHaveBeenCalledWith(
			'core/navigation-overlay'
		);

		expect( parse ).toHaveBeenCalledWith( mockGetPatternBySlug().content, {
			__unstableSkipMigrationLogs: true,
		} );

		expect( serialize ).toHaveBeenCalled();
	} );

	it( 'should use empty paragraph when pattern is not found', async () => {
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
		mockGetPatternBySlug.mockReturnValue( null );

		// Import mocked functions
		const blocksModule = require( '@wordpress/blocks' );
		const { createBlock, serialize } = blocksModule;

		const { result: createOverlayTemplatePart } = renderHook( () =>
			useCreateOverlayTemplatePart( overlayTemplateParts )
		);

		await act( async () => {
			await createOverlayTemplatePart.current();
		} );

		expect( createBlock ).toHaveBeenCalledWith( 'core/paragraph' );

		expect( serialize ).toHaveBeenCalledWith( [
			expect.objectContaining( { name: 'core/paragraph' } ),
		] );

		expect( mockSaveEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'wp_template_part',
			expect.objectContaining( {
				content: expect.any( String ),
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
