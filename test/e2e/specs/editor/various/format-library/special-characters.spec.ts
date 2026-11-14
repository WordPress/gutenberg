import type { Page } from '@playwright/test';
import { test, expect } from '@wordpress/e2e-test-utils-playwright';
import type { Editor } from '@wordpress/e2e-test-utils-playwright';

test.describe( 'Format Library - Special characters', () => {
	test.beforeEach( async ( { admin, editor, page } ) => {
		await admin.createNewPost();
		await editor.canvas
			.getByRole( 'document', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'Price: ' );
	} );

	async function openPicker( {
		editor,
		page,
	}: {
		editor: Editor;
		page: Page;
	} ) {
		await editor.clickBlockToolbarButton( 'More' );
		await page
			.getByRole( 'menuitem', { name: 'Special characters' } )
			.click();
		await expect(
			page.getByRole( 'combobox', { name: 'Search special characters' } )
		).toBeFocused();
	}

	test( 'inserts the top search result with Enter and returns the caret', async ( {
		editor,
		page,
	} ) => {
		await openPicker( { editor, page } );
		await page.keyboard.type( 'euro' );
		await page.keyboard.press( 'Enter' );

		await expect(
			page.getByRole( 'dialog', { name: 'Special characters' } )
		).toBeHidden();

		// The caret sits right after the inserted character.
		await page.keyboard.type( '5' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'Price: €5' },
			},
		] );
	} );

	test( 'inserts a non-breaking space', async ( { editor, page } ) => {
		await page.keyboard.press( 'Backspace' );
		await openPicker( { editor, page } );
		await page.keyboard.type( 'nbsp' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '5' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'Price: 5' },
			},
		] );
	} );

	test( 'returns the caret to the text on Escape', async ( {
		editor,
		page,
	} ) => {
		await openPicker( { editor, page } );
		await page.keyboard.type( 'euro' );
		await page.keyboard.press( 'Escape' );

		await expect(
			page.getByRole( 'dialog', { name: 'Special characters' } )
		).toBeHidden();

		await page.keyboard.type( '5' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'Price: 5' },
			},
		] );
	} );

	test( 'closes from the visible Close button and returns the caret', async ( {
		editor,
		page,
	} ) => {
		await openPicker( { editor, page } );

		const closeButton = page
			.getByRole( 'dialog', { name: 'Special characters' } )
			.getByRole( 'button', { name: 'Close' } );

		// Tab moves from the search field to the Close button, which is
		// visible so keyboard users can see where focus went.
		await page.keyboard.press( 'Tab' );
		await expect( closeButton ).toBeFocused();
		await expect( closeButton ).toBeVisible();

		await page.keyboard.press( 'Enter' );
		await expect(
			page.getByRole( 'dialog', { name: 'Special characters' } )
		).toBeHidden();

		await page.keyboard.type( '5' );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'Price: 5' },
			},
		] );
	} );
} );
