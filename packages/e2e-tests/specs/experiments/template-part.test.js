/**
 * WordPress dependencies
 */
import {
	visitAdminPage,
	pressKeyWithModifier,
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
		await page.click( '*[data-type="core/paragraph"]' );
		await pressKeyWithModifier( 'primary', 'ArrowRight' );
		await page.keyboard.type( '123' );

		// Save it, without saving the front page template.
		await page.click( '.edit-site-save-button__button' );
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
