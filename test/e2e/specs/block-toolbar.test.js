/**
 * External dependencies
 */
import { forEach } from 'lodash';

/**
 * Internal dependencies
 */
import {
	newPost,
	clickBlockAppender,
	pressWithModifier,
} from '../support/utils';

describe( 'block toolbar', () => {
	forEach( {
		unified: true,
		'not unified': false,
	}, ( isUnifiedToolbar, label ) => {
		beforeEach( async () => {
			await newPost();

			await page.evaluate( ( _isUnifiedToolbar ) => {
				const { select, dispatch } = wp.data;
				const isCurrentlyUnified = select( 'core/edit-post' ).isFeatureActive( 'fixedToolbar' );
				if ( isCurrentlyUnified !== _isUnifiedToolbar ) {
					dispatch( 'core/edit-post' ).toggleFeature( 'fixedToolbar' );
				}
			}, isUnifiedToolbar );
		} );

		describe( label, () => {
			it( 'navigates in and out of toolbar by keyboard (Alt+F10, Escape)', async () => {
				await clickBlockAppender();

				// [TEMPORARY/BUG]: Unless in unified toolbar mode, the toolbar
				// does not appear until the user types some text and changes
				// the selection.
				await page.keyboard.type( 'a' );
				await pressWithModifier( 'Shift', 'ArrowLeft' );

				await pressWithModifier( 'Alt', 'F10' );
				const isInToolbar = await page.evaluate( () => (
					!! document.activeElement.closest( '.editor-block-toolbar' )
				) );

				expect( isInToolbar ).toBe( true );

				await page.keyboard.press( 'Escape' );
				const isInBlockEdit = await page.evaluate( () => (
					!! document.activeElement.closest( '.editor-block-list__block-edit' )
				) );

				expect( isInBlockEdit ).toBe( true );
			} );
		} );
	} );
} );
