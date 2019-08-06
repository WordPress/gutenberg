/**
 * WordPress dependencies
 */
import { createNewPost, pressKeyWithModifier } from '@wordpress/e2e-test-utils';

describe.each( [ [ 'unified', true ], [ 'contextual', false ] ] )(
	'block toolbar (%s: %p)',
	( label, isUnifiedToolbar ) => {
		beforeEach( async () => {
			await createNewPost();

			await page.evaluate( ( _isUnifiedToolbar ) => {
				const { select, dispatch } = wp.data;
				const isCurrentlyUnified = select( 'core/edit-post' ).isFeatureActive( 'fixedToolbar' );
				if ( isCurrentlyUnified !== _isUnifiedToolbar ) {
					dispatch( 'core/edit-post' ).toggleFeature( 'fixedToolbar' );
				}
			}, isUnifiedToolbar );
		} );

		const isInBlockToolbar = () => page.evaluate( () => (
			!! document.activeElement.closest( '.block-editor-block-toolbar' )
		) );

		describe( label, () => {
			it( 'navigates in and out of toolbar by keyboard (Alt+F10, Escape)', async () => {
				// Assumes new post focus starts in title. Create first new
				// block by ArrowDown.
				await page.keyboard.press( 'ArrowDown' );

				// [TEMPORARY]: A new paragraph is not technically a block yet
				// until starting to type within it.
				await page.keyboard.type( 'Example' );

				// Upward
				await pressKeyWithModifier( 'alt', 'F10' );
				expect( await isInBlockToolbar() ).toBe( true );
			} );
		} );
	}
);

