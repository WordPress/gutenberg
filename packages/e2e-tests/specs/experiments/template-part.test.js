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
import { useExperimentalFeatures } from '../../experimental-features';
import { trashExistingPosts } from '../../config/setup-test-framework';

describe( 'Template Part', () => {
	useExperimentalFeatures( [
		'#gutenberg-full-site-editing',
		'#gutenberg-full-site-editing-demo',
	] );

	beforeAll( async () => {
		await trashExistingPosts( 'wp_template' );
		await trashExistingPosts( 'wp_template_part' );
	} );
	afterAll( async () => {
		await trashExistingPosts( 'wp_template' );
		await trashExistingPosts( 'wp_template_part' );
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
			const switchToHeaderTemplatePartButton = await page.waitForXPath(
				'//button[contains(text(), "header")]'
			);
			await switchToHeaderTemplatePartButton.click();

			// Edit it.
			await insertBlock( 'Paragraph' );
			await page.keyboard.type( 'Header Template Part 123' );

			// Save it.
			await page.click( '.edit-site-save-button__button' );
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
		const entitiesSaveSelector =
			'.editor-entities-saved-states__save-button';
		const savePostSelector = '.editor-post-publish-button__button';
		const templatePartSelector = '*[data-type="core/template-part"]';
		const activatedTemplatePartSelector = `${ templatePartSelector } .block-editor-inner-blocks`;
		const testContentSelector = `//p[contains(., "${ testContent }")]`;
		const createNewButtonSelector =
			'//button[contains(text(), "Create new")]';
		const disabledButtonSelector =
			'.wp-block-template-part__placeholder-create-button[disabled]';

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

		it( 'Should insert template part when preview is selected', async () => {
			const [ preview ] = await page.$x( testContentSelector );
			await preview.click();
			await page.waitForSelector( activatedTemplatePartSelector );
			const templatePartContent = await page.waitForXPath(
				testContentSelector
			);
			expect( templatePartContent ).toBeTruthy();
		} );

		it( 'Should disable create button for slug/theme combo', async () => {
			await createNewPost();
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

			const disabledButton = await page.waitForSelector(
				disabledButtonSelector
			);
			expect( disabledButton ).toBeTruthy();
		} );
	} );
} );
