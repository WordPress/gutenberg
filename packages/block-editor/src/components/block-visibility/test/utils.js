import { describe, expect, it, vi } from 'vitest';
import {
	getBlockVisibilityViewportEntries,
	getBlockVisibilityReason,
	appendVisibilityReason,
	getViewportCheckboxState,
	getHideEverywhereCheckboxState,
} from '../utils';

describe( 'block-visibility utils', () => {
	describe( 'getBlockVisibilityViewportEntries', () => {
		it( 'returns the configured viewport for a single breakpoint', () => {
			expect(
				getBlockVisibilityViewportEntries( { tablet: '64rem' } ).map(
					( [ key ] ) => key
				)
			).toEqual( [ 'desktop', 'tablet' ] );
		} );
	} );

	describe( 'getViewportCheckboxState', () => {
		it( 'should return false for empty or invalid input', () => {
			expect( getViewportCheckboxState( [], 'mobile' ) ).toBe( false );
			expect( getViewportCheckboxState( null, 'mobile' ) ).toBe( false );
			expect( getViewportCheckboxState( undefined, 'mobile' ) ).toBe(
				false
			);
		} );

		it( 'should return false when no blocks are hidden for viewport', () => {
			const blocks = [
				{
					attributes: {
						metadata: {
							blockVisibility: {
								viewport: {},
							},
						},
					},
				},
				{
					attributes: {},
				},
			];
			expect( getViewportCheckboxState( blocks, 'mobile' ) ).toBe(
				false
			);
		} );

		it( 'should return false when all blocks are hidden everywhere (blockVisibility=false not handled)', () => {
			const blocks = [
				{
					attributes: {
						metadata: {
							blockVisibility: false,
						},
					},
				},
				{
					attributes: {
						metadata: {
							blockVisibility: false,
						},
					},
				},
			];
			// Note: isBlockHiddenForViewport doesn't check for blockVisibility === false,
			// so it treats false as a non-object and returns false (not hidden)
			expect( getViewportCheckboxState( blocks, 'mobile' ) ).toBe(
				false
			);
			expect( getViewportCheckboxState( blocks, 'tablet' ) ).toBe(
				false
			);
			expect( getViewportCheckboxState( blocks, 'desktop' ) ).toBe(
				false
			);
		} );

		it( 'should return null when some blocks are hidden for viewport', () => {
			// Suppress console.log from getViewportCheckboxState
			const consoleSpy = vi
				.spyOn( console, 'log' )
				.mockImplementation( () => {} );

			const blocks = [
				{
					attributes: {
						metadata: {
							blockVisibility: {
								viewport: {
									mobile: false,
								},
							},
						},
					},
				},
				{
					attributes: {
						metadata: {
							blockVisibility: {
								viewport: {},
							},
						},
					},
				},
			];
			expect( getViewportCheckboxState( blocks, 'mobile' ) ).toBe( null );

			consoleSpy.mockRestore();
		} );

		it( 'should return false when some blocks have blockVisibility=false (not handled)', () => {
			const blocks = [
				{
					attributes: {
						metadata: {
							blockVisibility: false,
						},
					},
				},
				{
					attributes: {
						metadata: {
							blockVisibility: {
								viewport: {},
							},
						},
					},
				},
			];
			// Note: isBlockHiddenForViewport doesn't check for blockVisibility === false,
			// so both blocks are treated as not hidden, resulting in false
			expect( getViewportCheckboxState( blocks, 'mobile' ) ).toBe(
				false
			);
		} );

		it( 'should return false for invalid viewport', () => {
			const block = {
				attributes: {
					metadata: {
						blockVisibility: {
							viewport: {
								mobile: false,
							},
						},
					},
				},
			};
			expect( getViewportCheckboxState( [ block ], 'invalid' ) ).toBe(
				false
			);
		} );

		it( 'should return false when blockVisibility === true exists', () => {
			// Test with blockVisibility=false (not handled by isBlockHiddenForViewport)
			const blocks1 = [
				{
					attributes: {
						metadata: {
							blockVisibility: true,
						},
					},
				},
				{
					attributes: {
						metadata: {
							blockVisibility: false,
						},
					},
				},
			];
			// First block is explicitly visible (true), second has blockVisibility=false
			// which is not handled, so both are treated as not hidden
			expect( getViewportCheckboxState( blocks1, 'mobile' ) ).toBe(
				false
			);

			// Test with no metadata
			const blocks2 = [
				{
					attributes: {
						metadata: {
							blockVisibility: true,
						},
					},
				},
				{
					attributes: {},
				},
			];
			// Both blocks are not hidden (first is explicitly visible, second has no visibility set)
			expect( getViewportCheckboxState( blocks2, 'mobile' ) ).toBe(
				false
			);
		} );
	} );

	describe( 'getHideEverywhereCheckboxState', () => {
		it( 'should return false for empty or invalid input', () => {
			expect( getHideEverywhereCheckboxState( [] ) ).toBe( false );
			expect( getHideEverywhereCheckboxState( null ) ).toBe( false );
			expect( getHideEverywhereCheckboxState( undefined ) ).toBe( false );
		} );

		it( 'should return false when no blocks are hidden everywhere', () => {
			const blocks = [
				{
					attributes: {
						metadata: {
							blockVisibility: {
								viewport: {},
							},
						},
					},
				},
				{
					attributes: {},
				},
			];
			expect( getHideEverywhereCheckboxState( blocks ) ).toBe( false );
		} );

		it( 'should return true when all blocks are hidden everywhere', () => {
			const blocks = [
				{
					attributes: {
						metadata: {
							blockVisibility: false,
						},
					},
				},
				{
					attributes: {
						metadata: {
							blockVisibility: false,
						},
					},
				},
			];
			expect( getHideEverywhereCheckboxState( blocks ) ).toBe( true );
		} );

		it( 'should return null when some blocks are hidden everywhere', () => {
			const blocks = [
				{
					attributes: {
						metadata: {
							blockVisibility: false,
						},
					},
				},
				{
					attributes: {
						metadata: {
							blockVisibility: {},
						},
					},
				},
			];
			expect( getHideEverywhereCheckboxState( blocks ) ).toBe( null );
		} );

		it( 'should return false when blocks have viewport-specific visibility', () => {
			const blocks = [
				{
					attributes: {
						metadata: {
							blockVisibility: {
								viewport: {
									mobile: false,
								},
							},
						},
					},
				},
				{
					attributes: {
						metadata: {
							blockVisibility: {
								viewport: {
									tablet: false,
								},
							},
						},
					},
				},
			];
			expect( getHideEverywhereCheckboxState( blocks ) ).toBe( false );
		} );
	} );

	describe( 'getBlockVisibilityReason', () => {
		it( 'returns null when no rule hides the block', () => {
			expect( getBlockVisibilityReason( undefined ) ).toBe( null );
			expect( getBlockVisibilityReason( true ) ).toBe( null );
			expect(
				getBlockVisibilityReason( { viewport: { mobile: true } } )
			).toBe( null );
		} );

		it( 'names the control when hidden everywhere', () => {
			expect( getBlockVisibilityReason( false ) ).toBe(
				'Omitted from published content'
			);
		} );

		it( 'names a single viewport', () => {
			expect(
				getBlockVisibilityReason( { viewport: { mobile: false } } )
			).toBe( 'Hidden on mobile' );
		} );

		it( 'joins two viewports', () => {
			expect(
				getBlockVisibilityReason( {
					viewport: { tablet: false, mobile: false },
				} )
			).toBe( 'Hidden on tablet and mobile' );
		} );

		it( 'joins three viewports', () => {
			expect(
				getBlockVisibilityReason( {
					viewport: { desktop: false, tablet: false, mobile: false },
				} )
			).toBe( 'Hidden on desktop, tablet and mobile' );
		} );

		it( 'ignores viewports the theme does not configure', () => {
			expect(
				getBlockVisibilityReason(
					{ viewport: { mobile: false } },
					{ tablet: '64rem' }
				)
			).toBe( null );
		} );
	} );

	describe( 'appendVisibilityReason', () => {
		it( 'returns the label unchanged without a reason', () => {
			expect( appendVisibilityReason( 'Block: Paragraph', null ) ).toBe(
				'Block: Paragraph'
			);
		} );

		it( 'returns the reason when there is no label', () => {
			expect(
				appendVisibilityReason( undefined, 'Hidden on mobile' )
			).toBe( 'Hidden on mobile' );
		} );

		it( 'appends the reason as a new sentence', () => {
			expect(
				appendVisibilityReason(
					'Block: Column (1 of 2)',
					'Hidden on mobile'
				)
			).toBe( 'Block: Column (1 of 2). Hidden on mobile' );
			expect(
				appendVisibilityReason(
					'Empty block; start writing or type forward slash to choose a block',
					'Omitted from published content'
				)
			).toBe(
				'Empty block; start writing or type forward slash to choose a block. Omitted from published content'
			);
		} );

		it( 'does not double punctuation the label already ends with', () => {
			expect(
				appendVisibilityReason(
					'Added block: Paragraph.',
					'Hidden on mobile'
				)
			).toBe( 'Added block: Paragraph. Hidden on mobile' );
		} );
	} );
} );
