/**
 * WordPress dependencies
 */
import {
	createNewPost,
	insertBlock,
	disablePrePublishChecks,
	trashAllPosts,
	activateTheme,
	getAllBlocks,
	selectBlockByClientId,
	clickBlockToolbarButton,
	canvas,
} from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import { navigationPanel, siteEditor } from '../../experimental-features';

const templatePartNameInput =
	'.edit-site-template-part-converter__modal .components-text-control__input';

describe( 'Template Part', () => {
	beforeAll( async () => {
		await activateTheme( 'tt1-blocks' );
		await trashAllPosts( 'wp_template' );
		await trashAllPosts( 'wp_template_part' );
	} );
	afterAll( async () => {
		await trashAllPosts( 'wp_template' );
		await trashAllPosts( 'wp_template_part' );
		await activateTheme( 'twentytwentyone' );
	} );

	describe( 'Template part block', () => {
		beforeEach( async () => {
			await siteEditor.visit();
		} );

		async function navigateToHeader() {
			// Switch to editing the header template part.
			await navigationPanel.open();
			await navigationPanel.backToRoot();
			await navigationPanel.navigate( [ 'Template Parts', 'Headers' ] );
			await navigationPanel.clickItemByText( 'header' );
		}

		async function updateHeader( content ) {
			await navigateToHeader();

			// Edit it.
			await insertBlock( 'Paragraph' );
			await page.keyboard.type( content );

			// Save it.
			await page.click( '.edit-site-save-button__button' );
			await page.click( '.editor-entities-saved-states__save-button' );
			await page.waitForSelector(
				'.edit-site-save-button__button:not(.is-busy)'
			);

			// Switch back to the Index template.
			await navigationPanel.open();
			await navigationPanel.backToRoot();
			await navigationPanel.navigate( 'Templates' );
			await navigationPanel.clickItemByText( 'Index' );
		}

		async function triggerEllipsisMenuItem( textPrompt ) {
			await clickBlockToolbarButton( 'Options' );
			const button = await page.waitForXPath(
				`//span[contains(text(), "${ textPrompt }")]`
			);
			await button.click();
		}

		async function createParagraphAndGetClientId( content ) {
			await insertBlock( 'Paragraph' );
			await page.keyboard.type( content );
			const allBlocks = await getAllBlocks();
			const paragraphBlock = allBlocks.find(
				( block ) =>
					block.name === 'core/paragraph' &&
					block.attributes.content === content
			);
			return paragraphBlock.clientId;
		}

		async function assertParagraphInTemplatePart( content ) {
			const paragraphInTemplatePart = await canvas().waitForXPath(
				`//*[@data-type="core/template-part"][//p[text()="${ content }"]]`
			);
			expect( paragraphInTemplatePart ).not.toBeNull();
		}

		it( 'Should load customizations when in a template even if only the slug and theme attributes are set.', async () => {
			await updateHeader( 'Header Template Part 123' );

			// Verify that the header template part is updated.
			await assertParagraphInTemplatePart( 'Header Template Part 123' );
		} );

		it( 'Should detach blocks from template part', async () => {
			await updateHeader( 'Header Template Part 456' );

			const initialTemplateParts = await canvas().$$(
				'.wp-block-template-part'
			);

			// Select the header template part block.
			const allBlocks = await getAllBlocks();
			const headerBlock = allBlocks.find(
				( block ) => block.name === 'core/template-part'
			);
			await selectBlockByClientId( headerBlock.clientId );

			// Detach blocks from template part using ellipsis menu.
			await triggerEllipsisMenuItem( 'Detach blocks from template part' );

			// Verify there is one less template part on the page.
			const finalTemplateParts = await canvas().$$(
				'.wp-block-template-part'
			);
			expect(
				initialTemplateParts.length - finalTemplateParts.length
			).toBe( 1 );

			// Verify content of the template part is still present.
			const [ expectedContent ] = await canvas().$x(
				'//p[contains(text(), "Header Template Part 456")]'
			);
			expect( expectedContent ).not.toBeUndefined();
		} );

		it( 'Should load navigate-to-links properly', async () => {
			await navigateToHeader();
			await insertBlock( 'Paragraph' );
			await page.keyboard.type( 'Header Template Part 789' );

			// Select the paragraph block
			const text = await canvas().waitForXPath(
				'//p[contains(text(), "Header Template Part 789")]'
			);

			// Highlight all the text in the paragraph block
			await text.click( { clickCount: 3 } );

			// Click the convert to link toolbar button
			await page.waitForSelector( 'button[aria-label="Link"]' );
			await page.click( 'button[aria-label="Link"]' );

			// Enter url for link
			await page.keyboard.type( 'https://google.com' );
			await page.keyboard.press( 'Enter' );

			// Verify that there is no error
			await canvas().click( 'p[data-type="core/paragraph"] a' );
			const expectedContent = await canvas().$x(
				'//p[contains(text(), "Header Template Part 789")]'
			);

			expect( expectedContent ).not.toBeUndefined();
		} );

		it( 'Should convert selected block to template part', async () => {
			await canvas().waitForSelector(
				'.wp-block-template-part.block-editor-block-list__layout'
			);
			const initialTemplateParts = await canvas().$$(
				'.wp-block-template-part'
			);

			// Add some block and select it.
			const clientId = await createParagraphAndGetClientId(
				'Some block...'
			);
			await selectBlockByClientId( clientId );

			// Convert block to a template part.
			await triggerEllipsisMenuItem( 'Make template part' );
			const nameInput = await page.waitForSelector(
				templatePartNameInput
			);
			await nameInput.click();
			await page.keyboard.type( 'My template part' );
			await page.keyboard.press( 'Enter' );

			// Wait for creation to finish
			await page.waitForXPath(
				'//*[contains(@class, "components-snackbar")]/*[text()="Template part created."]'
			);

			// Verify new template part is created with expected content.
			await assertParagraphInTemplatePart( 'Some block...' );

			// Verify there is 1 more template part on the page than previously.
			const finalTemplateParts = await canvas().$$(
				'.wp-block-template-part'
			);
			expect(
				finalTemplateParts.length - initialTemplateParts.length
			).toBe( 1 );
		} );

		it( 'Should convert multiple selected blocks to template part', async () => {
			await canvas().waitForSelector(
				'.wp-block-template-part.block-editor-block-list__layout'
			);
			const initialTemplateParts = await canvas().$$(
				'.wp-block-template-part'
			);

			// Add two blocks and select them.
			const block1Id = await createParagraphAndGetClientId(
				'Some block #1'
			);
			const block2Id = await createParagraphAndGetClientId(
				'Some block #2'
			);
			await page.evaluate(
				( id1, id2 ) => {
					wp.data
						.dispatch( 'core/block-editor' )
						.multiSelect( id1, id2 );
				},
				block1Id,
				block2Id
			);

			// Convert block to a template part.
			await triggerEllipsisMenuItem( 'Make template part' );
			const nameInput = await page.waitForSelector(
				templatePartNameInput
			);
			await nameInput.click();
			await page.keyboard.type( 'My multi  template part' );
			await page.keyboard.press( 'Enter' );

			// Wait for creation to finish
			await page.waitForXPath(
				'//*[contains(@class, "components-snackbar")]/*[text()="Template part created."]'
			);

			// Verify new template part is created with expected content.
			await assertParagraphInTemplatePart( 'Some block #1' );
			await assertParagraphInTemplatePart( 'Some block #2' );

			// Verify there is 1 more template part on the page than previously.
			const finalTemplateParts = await canvas().$$(
				'.wp-block-template-part'
			);
			expect(
				finalTemplateParts.length - initialTemplateParts.length
			).toBe( 1 );
		} );
	} );

	describe( 'Template part placeholder', () => {
		// Test constants for template part.
		const testContent = 'some words...';

		// Selectors
		const entitiesSaveSelector =
			'.editor-entities-saved-states__save-button';
		const savePostSelector = '.editor-post-publish-button__button';
		const templatePartSelector = '*[data-type="core/template-part"]';
		const activatedTemplatePartSelector = `${ templatePartSelector }.block-editor-block-list__layout`;
		const testContentSelector = `//p[contains(., "${ testContent }")]`;
		const createNewButtonSelector =
			'//button[contains(text(), "New template part")]';
		const chooseExistingButtonSelector =
			'//button[contains(text(), "Choose existing")]';

		it( 'Should insert new template part on creation', async () => {
			await createNewPost();
			await disablePrePublishChecks();
			// Create new template part.
			await insertBlock( 'Template Part' );
			await page.waitForXPath( chooseExistingButtonSelector );
			const [ createNewButton ] = await page.$x(
				createNewButtonSelector
			);
			await createNewButton.click();

			const newTemplatePart = await page.waitForSelector(
				activatedTemplatePartSelector
			);
			expect( newTemplatePart ).toBeTruthy();

			// Finish creating template part, insert some text, and save.
			await page.click( '.block-editor-button-block-appender' );
			await page.click( '.editor-block-list-item-paragraph' );
			await page.keyboard.type( testContent );
			await page.click( savePostSelector );
			await page.click( entitiesSaveSelector );

			await createNewPost();
			// Try to insert the template part we created.
			await insertBlock( 'Template Part' );
			const chooseExistingButton = await page.waitForXPath(
				chooseExistingButtonSelector
			);
			await chooseExistingButton.click();
			const preview = await page.waitForXPath( testContentSelector );
			expect( preview ).toBeTruthy();

			await preview.click();
			await page.waitForSelector( activatedTemplatePartSelector );
			const templatePartContent = await page.waitForXPath(
				testContentSelector
			);
			expect( templatePartContent ).toBeTruthy();
		} );
	} );
} );
