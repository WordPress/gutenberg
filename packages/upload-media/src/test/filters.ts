import { addFilter, removeAllFilters } from '@wordpress/hooks';
import {
	PLAN_IMAGE_SIZE_HOOK,
	ENCODE_IMAGE_HOOK,
	FINALIZE_DATA_HOOK,
	applyPlanImageSizeFilter,
	applyEncodeImageFilter,
	applyFinalizeDataFilter,
	normalizeQuality,
	sizeNamesFromImageSize,
} from '../filters';
import type { EncodeImageContext, PlanImageSizeArgs } from '../filters';

describe( 'upload-media filters', () => {
	afterEach( () => {
		// Second arg is required by RemoveHook typing; ignored when removing all.
		removeAllFilters( PLAN_IMAGE_SIZE_HOOK, '' );
		removeAllFilters( ENCODE_IMAGE_HOOK, '' );
		removeAllFilters( FINALIZE_DATA_HOOK, '' );
	} );

	describe( 'normalizeQuality', () => {
		it( 'clamps values to the 0–1 range', () => {
			expect( normalizeQuality( -0.5, 0.82 ) ).toBe( 0 );
			expect( normalizeQuality( 1.5, 0.82 ) ).toBe( 1 );
			expect( normalizeQuality( 0.6, 0.82 ) ).toBe( 0.6 );
		} );

		it( 'falls back when the value is not a finite number', () => {
			expect( normalizeQuality( NaN, 0.82 ) ).toBe( 0.82 );
			expect( normalizeQuality( 'high', 0.82 ) ).toBe( 0.82 );
			expect( normalizeQuality( undefined, 0.5 ) ).toBe( 0.5 );
		} );
	} );

	describe( 'sizeNamesFromImageSize', () => {
		it( 'normalizes a string or array into a string array', () => {
			expect( sizeNamesFromImageSize( 'thumbnail' ) ).toEqual( [
				'thumbnail',
			] );
			expect(
				sizeNamesFromImageSize( [ 'medium', 'medium_large' ] )
			).toEqual( [ 'medium', 'medium_large' ] );
			expect( sizeNamesFromImageSize( undefined ) ).toBeUndefined();
		} );
	} );

	describe( 'applyPlanImageSizeFilter', () => {
		const baseArgs: PlanImageSizeArgs = {
			sizeNames: [ 'thumbnail' ],
			resize: { width: 150, height: 150, crop: true },
			quality: 0.82,
			sourceMimeType: 'image/jpeg',
			file: new File( [ 'x' ], 'photo.jpg', { type: 'image/jpeg' } ),
		};

		it( 'returns the provisional plan when no filters are registered', async () => {
			await expect(
				applyPlanImageSizeFilter( baseArgs )
			).resolves.toEqual( baseArgs );
		} );

		it( 'applies a provisional quality adjustment from size metadata', async () => {
			addFilter(
				PLAN_IMAGE_SIZE_HOOK,
				'test/lower-thumb-quality',
				( plan: PlanImageSizeArgs ) => ( {
					...plan,
					quality:
						plan.sizeNames.includes( 'thumbnail' ) &&
						plan.sourceMimeType === 'image/jpeg'
							? 0.6
							: plan.quality,
				} )
			);

			const result = await applyPlanImageSizeFilter( baseArgs );
			expect(
				Array.isArray( result ) ? undefined : result?.quality
			).toBe( 0.6 );
		} );

		it( 'skips the size when a filter returns null', async () => {
			addFilter( PLAN_IMAGE_SIZE_HOOK, 'test/skip', () => null );

			await expect(
				applyPlanImageSizeFilter( baseArgs )
			).resolves.toBeNull();
		} );

		it( 'keeps the provisional plan when a filter throws', async () => {
			addFilter( PLAN_IMAGE_SIZE_HOOK, 'test/throw', () => {
				throw new Error( 'boom' );
			} );

			await expect(
				applyPlanImageSizeFilter( baseArgs )
			).resolves.toEqual( baseArgs );
		} );

		it( 'rejects an invalid quality and keeps the provisional value', async () => {
			addFilter(
				PLAN_IMAGE_SIZE_HOOK,
				'test/bad-quality',
				( plan: PlanImageSizeArgs ) => ( {
					...plan,
					quality: 'nope',
				} )
			);

			const result = await applyPlanImageSizeFilter( baseArgs );
			expect(
				Array.isArray( result ) ? undefined : result?.quality
			).toBe( 0.82 );
		} );

		it( 'accepts an array of plans to split a dimension group', async () => {
			addFilter(
				PLAN_IMAGE_SIZE_HOOK,
				'test/split',
				( plan: PlanImageSizeArgs ) =>
					plan.sizeNames.map( ( name ) => ( {
						...plan,
						sizeNames: [ name ],
						quality: name === 'medium_large' ? 0.5 : 0.8,
					} ) )
			);

			const result = await applyPlanImageSizeFilter( {
				...baseArgs,
				sizeNames: [ 'medium_large', 'large' ],
			} );

			expect( result ).toEqual( [
				expect.objectContaining( {
					sizeNames: [ 'medium_large' ],
					quality: 0.5,
				} ),
				expect.objectContaining( {
					sizeNames: [ 'large' ],
					quality: 0.8,
				} ),
			] );
		} );

		it( 'treats an empty plan array as a skip', async () => {
			addFilter( PLAN_IMAGE_SIZE_HOOK, 'test/empty', () => [] );

			await expect(
				applyPlanImageSizeFilter( baseArgs )
			).resolves.toBeNull();
		} );
	} );

	describe( 'applyEncodeImageFilter', () => {
		const context: EncodeImageContext = {
			itemId: 'item-1',
			provisionalQuality: 0.82,
			mergeFinalizeData: jest.fn(),
			resizeImage: jest.fn(),
			convertImageFormat: jest.fn(),
		};

		const baseArgs = {
			file: new File( [ 'x' ], 'photo.jpg', { type: 'image/jpeg' } ),
			quality: 0.82,
			operation: 'resize' as const,
			resize: { width: 150, height: 150, crop: true },
			sizeNames: [ 'thumbnail' ],
		};

		it( 'returns the provisional encode args when no filters are registered', async () => {
			await expect(
				applyEncodeImageFilter( baseArgs, context )
			).resolves.toEqual( baseArgs );
		} );

		it( 'lets a filter refine quality after inspecting the encode context', async () => {
			addFilter(
				ENCODE_IMAGE_HOOK,
				'test/analyze',
				async ( encode, encodeContext ) => {
					expect( encodeContext.resizeImage ).toBe(
						context.resizeImage
					);
					expect( encodeContext.provisionalQuality ).toBe( 0.82 );
					return { ...encode, quality: 0.55 };
				}
			);

			const result = await applyEncodeImageFilter( baseArgs, context );
			expect( result.quality ).toBe( 0.55 );
		} );

		it( 'keeps provisional values when a filter throws', async () => {
			addFilter( ENCODE_IMAGE_HOOK, 'test/throw', () => {
				throw new Error( 'analysis failed' );
			} );

			await expect(
				applyEncodeImageFilter( baseArgs, context )
			).resolves.toEqual( baseArgs );
		} );

		it( 'ignores a non-File replacement from the filter', async () => {
			addFilter( ENCODE_IMAGE_HOOK, 'test/bad-file', ( encode ) => ( {
				...encode,
				file: 'not-a-file',
			} ) );

			const result = await applyEncodeImageFilter( baseArgs, context );
			expect( result.file ).toBe( baseArgs.file );
		} );
	} );

	describe( 'applyFinalizeDataFilter', () => {
		const context = {
			itemId: 'item-1',
			attachmentId: 42,
			subSizes: [],
		};

		it( 'returns accumulated data when no filters are registered', async () => {
			await expect(
				applyFinalizeDataFilter(
					{ quality: { thumbnail: 0.5 } },
					context
				)
			).resolves.toEqual( { quality: { thumbnail: 0.5 } } );
		} );

		it( 'lets a filter extend the finalize payload', async () => {
			addFilter( FINALIZE_DATA_HOOK, 'test/finalize', ( data ) => ( {
				...data,
				plugin: true,
			} ) );

			await expect(
				applyFinalizeDataFilter(
					{ quality: { thumbnail: 0.5 } },
					context
				)
			).resolves.toEqual( {
				quality: { thumbnail: 0.5 },
				plugin: true,
			} );
		} );

		it( 'keeps accumulated data when a filter throws', async () => {
			addFilter( FINALIZE_DATA_HOOK, 'test/throw', () => {
				throw new Error( 'nope' );
			} );

			await expect(
				applyFinalizeDataFilter( { keep: true }, context )
			).resolves.toEqual( { keep: true } );
		} );
	} );
} );
