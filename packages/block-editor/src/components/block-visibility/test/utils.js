/**
 * Internal dependencies
 */
import {
	getViewportCheckboxState,
	getHideEverywhereCheckboxState,
} from '../utils';

describe( 'block-visibility utils', () => {
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
							blockVisibility: {},
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
			const consoleSpy = jest
				.spyOn( console, 'log' )
				.mockImplementation( () => {} );

			const blocks = [
				{
					attributes: {
						metadata: {
							blockVisibility: {
								mobile: false,
							},
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
							blockVisibility: {},
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
							mobile: false,
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
							blockVisibility: {},
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
								mobile: false,
							},
						},
					},
				},
				{
					attributes: {
						metadata: {
							blockVisibility: {
								tablet: false,
							},
						},
					},
				},
			];
			expect( getHideEverywhereCheckboxState( blocks ) ).toBe( false );
		} );
	} );
} );
