/**
 * WordPress dependencies
 */
import {
	insertBlock,
	createNewPost,
	publishPost,
	trashAllPosts,
	activateTheme,
	canvas,
	openDocumentSettingsSidebar,
	pressKeyWithModifier,
	selectBlockByClientId,
} from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import { navigationPanel, siteEditor } from './utils';

const clickTemplateItem = async ( menus, itemName ) => {
	await navigationPanel.open();
	await navigationPanel.backToRoot();
	await navigationPanel.navigate( menus );
	await navigationPanel.clickItemByText( itemName );
};

const createTemplatePart = async (
	templatePartName = 'test-template-part',
	isNested = false
) => {
	// Create new template part.
	await insertBlock( 'Template Part' );
	const [ createNewButton ] = await page.$x(
		'//button[contains(text(), "New template part")]'
	);
	await createNewButton.click();
	await page.waitForSelector(
		isNested
			? '.wp-block-template-part .wp-block-template-part.block-editor-block-list__layout'
			: '.wp-block-template-part.block-editor-block-list__layout'
	);
	await openDocumentSettingsSidebar();

	const advancedPanelXPath = `//div[contains(@class,"interface-interface-skeleton__sidebar")]//button[@class="components-button components-panel__body-toggle"][contains(text(),"Advanced")]`;
	const advancedPanel = await page.waitForXPath( advancedPanelXPath );
	await advancedPanel.click();

	const nameInputXPath = `${ advancedPanelXPath }/ancestor::div[contains(@class, "components-panel__body")]//div[contains(@class,"components-base-control__field")]//label[contains(text(), "Title")]/following-sibling::input`;
	const nameInput = await page.waitForXPath( nameInputXPath );
	await nameInput.click();

	// Select all of the text in the title field.
	await pressKeyWithModifier( 'primary', 'a' );

	// Give the reusable block a title
	await page.keyboard.type( templatePartName );
};

const editTemplatePart = async ( textToAdd, isNested = false ) => {
	await page.click(
		`${
			isNested
				? '.wp-block-template-part .wp-block-template-part'
				: '.wp-block-template-part'
		} .block-editor-button-block-appender`
	);
	await page.click( '.editor-block-list-item-paragraph' );
	for ( const text of textToAdd ) {
		await page.keyboard.type( text );
		await page.keyboard.press( 'Enter' );
	}
};

const saveAllEntities = async () => {
	if ( await openEntitySavePanel() ) {
		await page.click( 'button.editor-entities-saved-states__save-button' );
	}
};

const openEntitySavePanel = async () => {
	// Open the entity save panel if it is not already open.
	try {
		await page.waitForSelector( '.entities-saved-states__panel', {
			timeout: 500,
		} );
	} catch {
		try {
			await page.click(
				'.edit-site-save-button__button[aria-disabled=false]',
				{ timeout: 500 }
			);
		} catch {
			try {
				await page.click(
					'.editor-post-publish-button__button.has-changes-dot',
					{ timeout: 500 }
				);
			} catch {
				return false; // Not dirty because the button is disabled.
			}
		}
		await page.waitForSelector( '.entities-saved-states__panel' );
	}
	// If we made it this far, the panel is opened.

	return true;
};

const isEntityDirty = async ( name ) => {
	const isOpen = await openEntitySavePanel();
	if ( ! isOpen ) {
		return false;
	}
	try {
		await page.waitForXPath(
			`//label[@class="components-checkbox-control__label"]//strong[contains(text(),"${ name }")]`,
			{ timeout: 1000 }
		);
		return true;
	} catch {}
	return false;
};

const removeErrorMocks = () => {
	// TODO: Add back console mocks when
	// https://github.com/WordPress/gutenberg/issues/17355 is fixed.
	/* eslint-disable no-console */
	console.warn.mockReset();
	console.error.mockReset();
	console.info.mockReset();
	/* eslint-enable no-console */
};

describe( 'Multi-entity editor states', () => {
	beforeAll( async () => {
		await activateTheme( 'emptytheme' );
		await trashAllPosts( 'wp_template' );
		await trashAllPosts( 'wp_template_part' );
	} );

	afterAll( async () => {
		await activateTheme( 'twentytwentyone' );
	} );

	it( 'should not display any dirty entities when loading the site editor', async () => {
		await siteEditor.visit();
		await siteEditor.disableWelcomeGuide();
		expect( await openEntitySavePanel() ).toBe( false );
	} );

	// Skip reason: This should be rewritten to use other methods to switching to different templates.
	it.skip( 'should not dirty an entity by switching to it in the template dropdown', async () => {
		await siteEditor.visit( {
			postId: 'emptytheme//header',
			postType: 'wp_template_part',
		} );
		await page.waitForFunction( () =>
			Array.from( window.frames ).find(
				( { name } ) => name === 'editor-canvas'
			)
		);

		// Wait for blocks to load.
		await canvas().waitForSelector( '.wp-block' );
		expect( await isEntityDirty( 'header' ) ).toBe( false );
		expect( await isEntityDirty( 'Index' ) ).toBe( false );

		// Switch back and make sure it is still clean.
		await clickTemplateItem( 'Templates', 'Index' );
		await page.waitForFunction( () =>
			Array.from( window.frames ).find(
				( { name } ) => name === 'editor-canvas'
			)
		);
		await canvas().waitForSelector( '.wp-block' );
		expect( await isEntityDirty( 'header' ) ).toBe( false );
		expect( await isEntityDirty( 'Index' ) ).toBe( false );

		removeErrorMocks();
	} );

	describe( 'Multi-entity edit', () => {
		const templatePartName = 'Test Template Part Name Edit';
		const nestedTPName = 'Test Nested Template Part Name Edit';
		const templateName = 'Custom Template';

		beforeAll( async () => {
			await trashAllPosts( 'wp_template' );
			await trashAllPosts( 'wp_template_part' );
			await createNewPost( {
				postType: 'wp_template',
				title: templateName,
			} );
			await publishPost();
			await createTemplatePart( templatePartName );
			await editTemplatePart( [
				'Default template part test text.',
				'Second paragraph test.',
			] );
			await createTemplatePart( nestedTPName, true );
			await editTemplatePart(
				[ 'Nested Template Part Text.', 'Second Nested test.' ],
				true
			);
			await saveAllEntities();
			await siteEditor.visit();
			await siteEditor.disableWelcomeGuide();

			// Wait for site editor to load.
			await canvas().waitForSelector(
				'.wp-block-template-part.block-editor-block-list__layout'
			);

			// Our custom template shows up in the "Templates > General" menu; let's use it.
			await clickTemplateItem(
				[ 'Templates', 'General templates' ],
				templateName
			);
			await page.waitForXPath(
				`//h1[contains(@class, "edit-site-document-actions__title") and contains(text(), '${ templateName }')]`
			);

			removeErrorMocks();
		} );

		const saveAndWaitResponse = async () => {
			await Promise.all( [
				saveAllEntities(),

				// Wait for the save request and the subsequent query to be
				// fulfilled - both are requests made to /index.php route.
				// Without that, clicked elements can lose focus sometimes
				// when the response is received.
				page.waitForResponse( ( response ) => {
					return (
						response.url().includes( 'index.php' ) &&
						response.request().method() === 'POST'
					);
				} ),

				page.waitForResponse( ( response ) => {
					return (
						response.url().includes( 'index.php' ) &&
						response.request().method() === 'GET'
					);
				} ),
			] );
			removeErrorMocks();
		};

		it.skip( 'should only dirty the parent entity when editing the parent', async () => {
			// Clear selection so that the block is not added to the template part.
			await insertBlock( 'Paragraph' );

			// Add changes to the main parent entity.
			await page.keyboard.type( 'Test.' );

			expect( await isEntityDirty( templateName ) ).toBe( true );
			expect( await isEntityDirty( templatePartName ) ).toBe( false );
			expect( await isEntityDirty( nestedTPName ) ).toBe( false );
			await saveAndWaitResponse();
		} );

		it.skip( 'should only dirty the child when editing the child', async () => {
			// Select parent TP to unlock selecting content.
			await canvas().click( '.wp-block-template-part' );
			await canvas().click(
				'.wp-block-template-part .wp-block[data-type="core/paragraph"]'
			);
			await page.keyboard.type( 'Some more test words!' );

			expect( await isEntityDirty( templateName ) ).toBe( false );
			expect( await isEntityDirty( templatePartName ) ).toBe( true );
			expect( await isEntityDirty( nestedTPName ) ).toBe( false );
			await saveAndWaitResponse();
		} );

		it.skip( 'should only dirty the nested entity when editing the nested entity', async () => {
			// Select parent TP to unlock selecting child.
			await canvas().click( '.wp-block-template-part' );
			// Select child TP to unlock selecting content.
			await canvas().click(
				'.wp-block-template-part .wp-block-template-part'
			);
			await canvas().click(
				'.wp-block-template-part .wp-block-template-part .wp-block[data-type="core/paragraph"]'
			);
			await page.keyboard.type( 'Nested test words!' );

			expect( await isEntityDirty( templateName ) ).toBe( false );
			expect( await isEntityDirty( templatePartName ) ).toBe( false );
			expect( await isEntityDirty( nestedTPName ) ).toBe( true );
			await saveAndWaitResponse();
		} );

		it.skip( 'should not allow selecting template part content without parent selected', async () => {
			// Unselect blocks.
			await selectBlockByClientId();
			// Try to select a child block of a template part.
			await canvas().click(
				'.wp-block-template-part .wp-block-template-part .wp-block[data-type="core/paragraph"]'
			);

			const selectedBlock = await page.evaluate( () => {
				return wp.data.select( 'core/block-editor' ).getSelectedBlock();
			} );
			expect( selectedBlock?.name ).toBe( 'core/template-part' );
		} );
	} );
} );
