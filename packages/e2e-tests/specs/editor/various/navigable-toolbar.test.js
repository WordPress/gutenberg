/**
 * WordPress dependencies
 */
import { createNewPost, pressKeyWithModifier } from '@wordpress/e2e-test-utils';

async function isInBlockToolbar() {
	return await page.evaluate( () => {
		return !! document.activeElement.closest(
			'.block-editor-block-toolbar'
		);
	} );
}

describe( 'Block Toolbar', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	describe( 'Contextual Toolbar', () => {
		it( 'should not scroll page', async () => {
			while (
				await page.evaluate( () => {
					const { activeElement } =
						document.activeElement?.contentDocument ?? document;
					const scrollable =
						wp.dom.getScrollContainer( activeElement );
					return ! scrollable || scrollable.scrollTop === 0;
				} )
			) {
				await page.keyboard.press( 'Enter' );
			}

			await page.keyboard.type( 'a' );

			const scrollTopBefore = await page.evaluate( () => {
				const { activeElement } =
					document.activeElement?.contentDocument ?? document;
				window.scrollContainer =
					wp.dom.getScrollContainer( activeElement );
				return window.scrollContainer.scrollTop;
			} );

			await pressKeyWithModifier( 'alt', 'F10' );
			expect( await isInBlockToolbar() ).toBe( true );

			const scrollTopAfter = await page.evaluate( () => {
				return window.scrollContainer.scrollTop;
			} );
			expect( scrollTopBefore ).toBe( scrollTopAfter );
		} );
	} );

	describe( 'Unified Toolbar', () => {
		beforeEach( async () => {
			// Enable unified toolbar
			await page.evaluate( () => {
				const { select, dispatch } = wp.data;
				const isCurrentlyUnified =
					select( 'core/edit-post' ).isFeatureActive(
						'fixedToolbar'
					);
				if ( ! isCurrentlyUnified ) {
					dispatch( 'core/edit-post' ).toggleFeature(
						'fixedToolbar'
					);
				}
			} );
		} );
	} );
} );
