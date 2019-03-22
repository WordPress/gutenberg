/**
 * External dependencies
 */
import { forEach } from 'lodash';

/**
 * WordPress dependencies
 */
import { createNewPost, pressKeyWithModifier } from '@wordpress/e2e-test-utils';

describe( 'block toolbar', () => {
	forEach( {
		unified: true,
		contextual: false,
	}, ( isUnifiedToolbar, label ) => {
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

		const isInRichTextEditable = () => page.evaluate( () => (
			document.activeElement.contentEditable === 'true'
		) );

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

				// Downward
				await page.keyboard.press( 'Escape' );
				expect( await isInRichTextEditable() ).toBe( true );
			} );
		} );
	} );
} );
