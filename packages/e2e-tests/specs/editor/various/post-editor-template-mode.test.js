/**
 * WordPress dependencies
 */
import {
	activateTheme,
	createNewPost,
	insertBlock,
	saveDraft,
	openPreviewPage,
	openDocumentSettingsSidebar,
	activatePlugin,
	deactivatePlugin,
	deleteAllTemplates,
} from '@wordpress/e2e-test-utils';

const openSidebarPanelWithTitle = async ( title ) => {
	const panel = await page.waitForXPath(
		`//div[contains(@class,"edit-post-sidebar")]//button[@class="components-button components-panel__body-toggle"][contains(text(),"${ title }")]`
	);

	const expanded = await page.evaluate(
		( element ) => element.getAttribute( 'aria-expanded' ),
		panel
	);
	if ( expanded === 'false' ) {
		await panel.click();
	}
};

const disableTemplateWelcomeGuide = async () => {
	// Turn off the welcome guide if it's visible.
	const isWelcomeGuideActive = await page.evaluate( () =>
		wp.data
			.select( 'core/edit-post' )
			.isFeatureActive( 'welcomeGuideTemplate' )
	);
	if ( isWelcomeGuideActive ) {
		await page.evaluate( () =>
			wp.data
				.dispatch( 'core/edit-post' )
				.toggleFeature( 'welcomeGuideTemplate' )
		);
	}
};

const switchToTemplateMode = async () => {
	await disableTemplateWelcomeGuide();

	// Switch to template mode.
	await openDocumentSettingsSidebar();
	await openSidebarPanelWithTitle( 'Template' );
	const editTemplateXPath =
		"//*[contains(@class, 'edit-post-template__actions')]//button[contains(text(), 'Edit')]";
	const switchLink = await page.waitForXPath( editTemplateXPath );
	await switchLink.click();

	// Check that we switched properly to edit mode.
	await page.waitForXPath(
		'//*[contains(@class, "components-snackbar")]/*[text()="Editing template. Changes made here affect all posts and pages that use the template."]'
	);
	const title = await page.$eval(
		'.edit-post-template-top-area',
		( el ) => el.innerText
	);
	expect( title ).toContain( 'Just an FSE Post\n' );
};

const createNewTemplate = async ( templateName ) => {
	await disableTemplateWelcomeGuide();

	// Create a new custom template.
	await openDocumentSettingsSidebar();
	await openSidebarPanelWithTitle( 'Template' );
	const newTemplateXPath =
		"//*[contains(@class, 'edit-post-template__actions')]//button[contains(text(), 'New')]";
	const newButton = await page.waitForXPath( newTemplateXPath );
	await newButton.click();

	// Fill the template title and submit.
	const templateNameInputSelector =
		'.edit-post-template__modal .components-text-control__input';
	await page.click( templateNameInputSelector );
	await page.keyboard.type( templateName );
	await page.keyboard.press( 'Enter' );

	// Check that we switched properly to edit mode.
	await page.waitForXPath(
		'//*[contains(@class, "components-snackbar")]/*[text()="Custom template created. You\'re in template mode now."]'
	);
};

describe( 'Post Editor Template mode', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-block-templates' );
		await deleteAllTemplates( 'wp_template' );
		await deleteAllTemplates( 'wp_template_part' );
	} );

	afterAll( async () => {
		await activateTheme( 'twentytwentyone' );
		await deactivatePlugin( 'gutenberg-test-block-templates' );
	} );

	it( 'Allow to switch to template mode, edit the template and check the result', async () => {
		await activateTheme( 'emptytheme' );
		await createNewPost();
		// Create a random post.
		await page.type( '.editor-post-title__input', 'Just an FSE Post' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Hello World' );

		// Unselect the blocks.
		await page.evaluate( () => {
			wp.data.dispatch( 'core/block-editor' ).clearSelectedBlock();
		} );

		// Save the post
		// Saving shouldn't be necessary but unfortunately,
		// there's a template resolution bug forcing us to do so.
		await saveDraft();
		await page.reload();

		await switchToTemplateMode();

		// Edit the template
		await insertBlock( 'Paragraph' );
		await page.keyboard.type(
			'Just a random paragraph added to the template'
		);

		// Save changes
		const publishButton = await page.waitForXPath(
			`//button[contains(text(), 'Publish')]`
		);
		await publishButton.click();
		const saveButton = await page.waitForXPath(
			`//div[contains(@class, "entities-saved-states__panel-header")]/button[contains(text(), 'Save')]`
		);
		await saveButton.click();

		// Preview changes
		const previewPage = await openPreviewPage();
		await previewPage.waitForXPath(
			'//p[contains(text(), "Just a random paragraph added to the template")]'
		);
	} );

	it.skip( 'Allow creating custom block templates in classic themes', async () => {
		await activateTheme( 'twentytwentyone' );
		await createNewPost();
		// Create a random post.
		await page.type( '.editor-post-title__input', 'Another FSE Post' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Hello World' );

		// Unselect the blocks.
		await page.evaluate( () => {
			wp.data.dispatch( 'core/block-editor' ).clearSelectedBlock();
		} );

		// Save the post
		// Saving shouldn't be necessary but unfortunately,
		// there's a template resolution bug forcing us to do so.
		await saveDraft();
		await page.reload();

		await createNewTemplate( 'Blank Template' );

		// Edit the template
		await insertBlock( 'Paragraph' );
		await page.keyboard.type(
			'Just a random paragraph added to the template'
		);

		// Save changes
		const publishButton = await page.waitForXPath(
			`//button[contains(text(), 'Publish')]`
		);
		await publishButton.click();
		const saveButton = await page.waitForXPath(
			`//div[contains(@class, "entities-saved-states__panel-header")]/button[contains(text(), 'Save')]`
		);
		await saveButton.click();
		// Avoid publishing the post
		const cancelButton = await page.waitForXPath(
			`//button[contains(text(), 'Cancel')]`
		);
		await cancelButton.click();

		// Preview changes
		const previewPage = await openPreviewPage();
		await previewPage.waitForSelector( '.wp-site-blocks' );
		const content = await previewPage.evaluate(
			() => document.querySelector( '.wp-site-blocks' ).innerHTML
		);

		expect( content ).toMatchSnapshot();
	} );
} );
