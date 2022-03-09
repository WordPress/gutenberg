/**
 * WordPress dependencies
 */
import {
	createNewPost,
	clickButton,
	clickMenuItem,
	clickBlockToolbarButton,
	getEditedPostContent,
	insertBlock,
} from '@wordpress/e2e-test-utils';

describe( 'Block Grouping', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	describe( 'General', () => {
		it( 'can prevent removal', async () => {
			await insertBlock( 'Paragraph' );
			await page.keyboard.type( 'Some paragraph' );

			await clickBlockToolbarButton( 'Options' );
			await clickMenuItem( 'Lock Paragraph' );

			const [ checkbox ] = await page.$x(
				'//label[contains(text(), "Prevent removal")]'
			);
			await checkbox.click();

			await clickButton( 'Apply' );

			const [ removeBlock ] = await page.$x(
				'//*[@role="menu"]//*[text()="Remove Paragraph"]'
			);

			expect( removeBlock ).toBeFalsy();
		} );

		it( 'can disable movement', async () => {
			await insertBlock( 'Paragraph' );
			await page.keyboard.type( 'First paragraph' );

			await insertBlock( 'Paragraph' );
			await page.keyboard.type( 'Second paragraph' );

			await clickBlockToolbarButton( 'Options' );
			await clickMenuItem( 'Lock Paragraph' );

			const [ checkbox ] = await page.$x(
				'//label[contains(text(), "Disable movement")]'
			);
			await checkbox.click();

			await clickButton( 'Apply' );

			// Hide options.
			await clickBlockToolbarButton( 'Options' );

			const blockMover = await page.$( '.block-editor-block-mover' );
			expect( blockMover ).toBeNull();

			const [ lockButton ] = await page.$x(
				'//button[@aria-label="Unlock Paragraph"]'
			);
			expect( lockButton ).toBeTruthy();
		} );

		it( 'can lock everything', async () => {
			await insertBlock( 'Paragraph' );
			await page.keyboard.type( 'Some paragraph' );

			await clickBlockToolbarButton( 'Options' );
			await clickMenuItem( 'Lock Paragraph' );

			const [ checkbox ] = await page.$x(
				'//label//*[contains(text(), "Lock Everything")]'
			);
			await checkbox.click();

			await clickButton( 'Apply' );

			expect( await getEditedPostContent() ).toMatchInlineSnapshot( `
				"<!-- wp:paragraph {\\"lock\\":{\\"move\\":true,\\"remove\\":true}} -->
				<p>Some paragraph</p>
				<!-- /wp:paragraph -->"
			` );
		} );

		it( 'can unlock from toolbar', async () => {
			await insertBlock( 'Paragraph' );
			await page.keyboard.type( 'Some paragraph' );

			await clickBlockToolbarButton( 'Options' );
			await clickMenuItem( 'Lock Paragraph' );

			const [ lockCheckbox ] = await page.$x(
				'//label//*[contains(text(), "Lock Everything")]'
			);
			await lockCheckbox.click();

			await clickButton( 'Apply' );

			await clickBlockToolbarButton( 'Unlock Paragraph' );

			const [ unlockCheckbox ] = await page.$x(
				'//label//*[contains(text(), "Lock Everything")]'
			);
			await unlockCheckbox.click();

			await clickButton( 'Apply' );

			expect( await getEditedPostContent() ).toMatchInlineSnapshot( `
				"<!-- wp:paragraph {\\"lock\\":{\\"move\\":false,\\"remove\\":false}} -->
				<p>Some paragraph</p>
				<!-- /wp:paragraph -->"
			` );
		} );
	} );
} );
