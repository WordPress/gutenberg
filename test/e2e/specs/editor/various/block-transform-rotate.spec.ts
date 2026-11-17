import type { Locator } from '@playwright/test';
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

const getRotate = ( locator: Locator ) =>
	locator.evaluate(
		( element ) => window.getComputedStyle( element ).rotate
	);

test.describe( 'Transform rotate block support', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		// The theme opts into the transform tools with `appearanceTools`.
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'saves the rotation inline on the block wrapper', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/group',
			innerBlocks: [
				{ name: 'core/paragraph', attributes: { content: 'Tilted' } },
			],
		} );
		await editor.openDocumentSettingsSidebar();

		const settings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await settings
			.getByRole( 'button', { name: 'Transform options' } )
			.click();
		await page
			.getByRole( 'menuitemcheckbox', { name: /Rotation/ } )
			.click();
		await page.keyboard.press( 'Escape' );
		await settings
			.getByRole( 'spinbutton', { name: 'Rotation' } )
			.fill( '30' );

		await expect
			.poll( editor.getEditedPostContent )
			.toContain( '<div class="wp-block-group" style="rotate:30deg">' );

		const editorGroup = editor.canvas.getByRole( 'document', {
			name: 'Block: Group',
		} );
		await expect.poll( () => getRotate( editorGroup ) ).toBe( '30deg' );

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		const group = page.locator( '.wp-block-group' );
		await expect( group ).toHaveAttribute( 'style', 'rotate:30deg' );
		expect( await getRotate( group ) ).toBe( '30deg' );
	} );
} );
