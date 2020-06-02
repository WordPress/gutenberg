/**
 * WordPress dependencies
 */
import {
	createNewPost,
	insertBlock,
	disablePrePublishChecks,
	visitAdminPage,
} from '@wordpress/e2e-test-utils';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import {
	enableExperimentalFeatures,
	disableExperimentalFeatures,
} from '../../experimental-features';
import { trashExistingPosts } from '../../config/setup-test-framework';

describe( 'Template Part', () => {
	beforeAll( async () => {
		await enableExperimentalFeatures( [
			'#gutenberg-full-site-editing',
			'#gutenberg-full-site-editing-demo',
		] );
		await trashExistingPosts( 'wp_template' );
		await trashExistingPosts( 'wp_template_part' );
	} );
	afterAll( async () => {
		await trashExistingPosts( 'wp_template' );
		await trashExistingPosts( 'wp_template_part' );
		await disableExperimentalFeatures( [
			'#gutenberg-full-site-editing',
			'#gutenberg-full-site-editing-demo',
		] );
	} );

	describe( 'Template part block', () => {
		beforeEach( () =>
			visitAdminPage(
				'admin.php',
				addQueryArgs( '', {
					page: 'gutenberg-edit-site',
				} ).slice( 1 )
			)
		);

		it( 'Should load customizations when in a template even if only the slug and theme attributes are set.', async () => {
			// Switch to editing the header template part.
			await page.click(
				'.components-dropdown-menu__toggle[aria-label="Switch Template"]'
			);
			const [ switchToHeaderTemplatePartButton ] = await page.$x(
				'//button[contains(text(), "header")]'
			);
			await switchToHeaderTemplatePartButton.click();

			// Edit it.
			await insertBlock( 'Paragraph' );
			await page.keyboard.type( 'Header Template Part 123' );

			// Save it, without saving the front page template.
			await page.click( '.edit-site-save-button__button' );
			const reviewChangesButton = await page.waitForSelector(
				'.entities-saved-states__review-changes-button'
			);
			await reviewChangesButton.click();
			const [ frontPageCheckbox ] = await page.$x(
				'//strong[contains(text(),"Front Page")]/../preceding-sibling::span/input'
			);
			await frontPageCheckbox.click();
			await page.click( '.editor-entities-saved-states__save-button' );
			await page.waitForSelector(
				'.edit-site-save-button__button:not(.is-busy)'
			);

			// Switch back to the front page template.
			await page.click(
				'.components-dropdown-menu__toggle[aria-label="Switch Template"]'
			);
			const [ switchToFrontPageTemplateButton ] = await page.$x(
				'//button[contains(text(), "front-page")]'
			);
			await switchToFrontPageTemplateButton.click();

			// Verify that the header template part is updated.
			const [ headerTemplatePart ] = await page.$x(
				'//*[@data-type="core/template-part"][//p[text()="Header Template Part123"]]'
			);
			expect( headerTemplatePart ).not.toBeNull();
		} );
	} );

	describe( 'Template part placeholder', () => {
		// Test constants for template part.
		const testSlug = 'test-template-part';
		const testTheme = 'test-theme';
		const testContent = 'some words...';

		// Selectors
		const chooseButtonSelector =
			'//div[contains(@class,"is-selected")]//button[text()="Choose"]';
		const entitiesSaveSelector =
			'.editor-entities-saved-states__save-button';
		const savePostSelector = '.editor-post-publish-button__button';
		const templatePartSelector = '*[data-type="core/template-part"]';
		const activatedTemplatePartSelector = `${ templatePartSelector } .block-editor-inner-blocks`;
		const testContentSelector = `//p[contains(., "${ testContent }")]`;
		const createNewButtonSelector =
			'//button[contains(text(), "Create new")]';

		it( 'Should insert new template part on creation', async () => {
			await createNewPost();
			await disablePrePublishChecks();
			// Create new template part.
			await insertBlock( 'Template Part' );
			const [ createNewButton ] = await page.$x(
				createNewButtonSelector
			);
			await createNewButton.click();
			await page.keyboard.press( 'Tab' );
			await page.keyboard.type( testSlug );
			await page.keyboard.press( 'Tab' );
			await page.keyboard.type( testTheme );
			await page.keyboard.press( 'Tab' );
			await page.keyboard.press( 'Enter' );

			const newTemplatePart = await page.waitForSelector(
				activatedTemplatePartSelector
			);
			expect( newTemplatePart ).toBeTruthy();

			// Finish creating template part, insert some text, and save.
			await page.click( templatePartSelector );
			await page.keyboard.type( testContent );
			await page.click( savePostSelector );
			await page.click( entitiesSaveSelector );
		} );

		it( 'Should preview newly added template part', async () => {
			await createNewPost();
			// Try to insert the template part we created.
			await insertBlock( 'Template Part' );
			const preview = await page.waitForXPath( testContentSelector );
			expect( preview ).toBeTruthy();
		} );

		it.skip( 'Should preview added template part', async () => {
			await createNewPost();
			await disablePrePublishChecks();
			// Try to insert the template part we created.
			await insertBlock( 'Template Part' );
			const [ createNewButton ] = await page.$x(
				createNewButtonSelector
			);
			await createNewButton.click();
			await page.keyboard.press( 'Tab' );
			await page.keyboard.type( testSlug );
			await page.keyboard.press( 'Tab' );
			await page.keyboard.type( testTheme );
			// Should say 'Choose'
			const placeholderButton = await page.waitForXPath(
				chooseButtonSelector
			);
			expect( placeholderButton ).not.toBeNull();
		} );

		it.skip( 'Should dispaly a preview when match is found', async () => {
			const [ preview ] = await page.$x( testContentSelector );
			expect( preview ).toBeTruthy();
		} );

		it.skip( 'Should insert the desired template part', async () => {
			const [ placeholderButton ] = await page.$x( chooseButtonSelector );
			await placeholderButton.click();
			await page.waitForSelector( activatedTemplatePartSelector );
			const templatePartContent = await page.waitForXPath(
				testContentSelector
			);
			expect( templatePartContent ).toBeTruthy();
		} );
	} );
} );
