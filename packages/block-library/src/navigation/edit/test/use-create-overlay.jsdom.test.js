import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock, parse, serialize } from '@wordpress/blocks';
import useCreateOverlayTemplatePart from '../use-create-overlay';

// Mock useDispatch and useSelect
vi.mock( import( '@wordpress/data' ), () => ( {
	useDispatch: vi.fn(),
	useSelect: vi.fn(),
} ) );

// Mock coreStore
vi.mock( import( '@wordpress/core-data' ), () => ( {
	store: {},
} ) );

// Mock blockEditorStore
vi.mock( import( '@wordpress/block-editor' ), () => ( {
	store: {},
} ) );

// Mock @wordpress/blocks
vi.mock( import( '@wordpress/blocks' ), () => ( {
	serialize: vi.fn( ( blocks ) => JSON.stringify( blocks ) ),
	parse: vi.fn( ( content ) => {
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
	createBlock: vi.fn( ( name ) => ( {
		name,
		attributes: {},
		innerBlocks: [],
	} ) ),
} ) );

// Mock lock-unlock
const mockUnlock = vi.fn();
vi.mock( import( '../../../lock-unlock' ), () => ( {
	unlock: ( select ) => mockUnlock( select ),
} ) );

describe( 'useCreateOverlayTemplatePart', () => {
	const mockSaveEntityRecord = vi.fn();
	const mockGetPatternBySlug = vi.fn();

	beforeEach( () => {
		vi.clearAllMocks();
		useDispatch.mockReturnValue( {
			saveEntityRecord: mockSaveEntityRecord,
		} );

		mockUnlock.mockReturnValue( {
			getPatternBySlug: mockGetPatternBySlug,
		} );

		useSelect.mockImplementation( ( selector ) => {
			const mockSelect = vi.fn( ( store ) => {
				if ( store === blockEditorStore ) {
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
			id: 'twentytwentyfive//navigation-overlay',
			theme: 'twentytwentyfive',
			slug: 'navigation-overlay',
			title: {
				rendered: 'Navigation Overlay',
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
				slug: 'navigation-overlay',
				title: 'Navigation Overlay',
				content: expect.any( String ),
				area: 'navigation-overlay',
			} ),
			{ throwOnError: true }
		);
		expect( savedOverlay ).toEqual( createdOverlay );
	} );

	it( 'should generate unique title when overlays already exist', async () => {
		const existingOverlay = {
			id: 'twentytwentyfive//navigation-overlay',
			theme: 'twentytwentyfive',
			slug: 'navigation-overlay',
			title: {
				rendered: 'Navigation Overlay',
			},
			area: 'navigation-overlay',
		};
		const overlayTemplateParts = [ existingOverlay ];
		const createdOverlay = {
			id: 'twentytwentyfive//navigation-overlay-2',
			theme: 'twentytwentyfive',
			slug: 'navigation-overlay-2',
			title: {
				rendered: 'Navigation Overlay 2',
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

		// Verify it generates a unique title (Navigation Overlay 2) when Navigation Overlay already exists
		expect( mockSaveEntityRecord ).toHaveBeenCalledWith(
			'postType',
			'wp_template_part',
			expect.objectContaining( {
				title: 'Navigation Overlay 2',
				slug: 'navigation-overlay-2',
				content: expect.any( String ),
				area: 'navigation-overlay',
			} ),
			{ throwOnError: true }
		);
	} );

	it( 'should use pattern content when pattern is found', async () => {
		const overlayTemplateParts = [];
		const createdOverlay = {
			id: 'twentytwentyfive//navigation-overlay',
			theme: 'twentytwentyfive',
			slug: 'navigation-overlay',
			title: {
				rendered: 'Navigation Overlay',
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
			id: 'twentytwentyfive//navigation-overlay',
			theme: 'twentytwentyfive',
			slug: 'navigation-overlay',
			title: {
				rendered: 'Navigation Overlay',
			},
			area: 'navigation-overlay',
		};

		mockSaveEntityRecord.mockResolvedValue( createdOverlay );
		mockGetPatternBySlug.mockReturnValue( null );

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
