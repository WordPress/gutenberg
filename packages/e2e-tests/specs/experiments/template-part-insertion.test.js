/**
 * WordPress dependencies
 */
import {
	createNewPost,
	insertBlock,
	disablePrePublishChecks,
} from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	enableExperimentalFeatures,
	disableExperimentalFeatures,
} from '../../experimental-features';
import { trashExistingPosts } from '../../config/setup-test-framework';

describe( 'Template part insertion by placeholder block', () => {
	// Test constants for template part.
	const testSlug = 'test-template-part';
	const testTheme = 'test-theme';
	const testContent = 'some words...';

	// Selectors
	const chooseButtonSelector =
		'//div[contains(@class,"is-selected")]//button[text()="Choose"]';
	const entitiesSaveSelector = '.editor-entities-saved-states__save-button';
	const savePostSelector = '.editor-post-publish-button__button';
	const templatePartSelector = '*[data-type="core/template-part"]';
	const activatedTemplatePartSelector = `${ templatePartSelector } .block-editor-inner-blocks`;
	const templatePartButtonSelector = `${ templatePartSelector } button`;
	const testContentSelector = `//p[contains(., "${ testContent }")]`;

	// Setup & Teardown.
	const requiredExperiments = [ '#gutenberg-full-site-editing' ];
	beforeAll( async () => {
		await enableExperimentalFeatures( requiredExperiments );
		await trashExistingPosts( 'wp_template' );
		await trashExistingPosts( 'wp_template_part' );
	} );
	afterAll( async () => {
		await disableExperimentalFeatures( requiredExperiments );
	} );

	it( 'Should prompt to create when no match found', async () => {
		await createNewPost();
		await disablePrePublishChecks();
		// Create new template part.
		await insertBlock( 'Template Part' );
		await page.keyboard.type( testSlug );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.type( testTheme );
		// Should say 'Create'
		const placeholderButton = await page.$( templatePartButtonSelector );
		const text = await page.evaluate(
			( element ) => element.textContent,
			placeholderButton
		);
		expect( text ).toBe( 'Create' );

		// Finish creating template part, insert some text, and save.
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Enter' );
		await page.waitForSelector( activatedTemplatePartSelector );
		await page.click( templatePartSelector );
		await page.keyboard.type( testContent );
		await page.click( savePostSelector );
		await page.click( entitiesSaveSelector );
	} );

	it( 'Should prompt to Choose when match found', async () => {
		await createNewPost();
		await disablePrePublishChecks();
		// Try to insert the template part we created.
		await insertBlock( 'Template Part' );
		await page.keyboard.type( testSlug );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.type( testTheme );
		// Should say 'Choose'
		const placeholderButton = await page.waitForXPath(
			chooseButtonSelector
		);
		expect( placeholderButton ).not.toBeNull();
	} );

	it( 'Should dispaly a preview when match is found', async () => {
		const [ preview ] = await page.$x( testContentSelector );
		expect( preview ).toBeTruthy();
	} );

	it( 'Should insert the desired template part', async () => {
		const [ placeholderButton ] = await page.$x( chooseButtonSelector );
		await placeholderButton.click();
		await page.waitForSelector( activatedTemplatePartSelector );
		const templatePartContent = await page.waitForXPath(
			testContentSelector
		);
		expect( templatePartContent ).toBeTruthy();
	} );
} );
