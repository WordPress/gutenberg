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
} from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import { navigationPanel, siteEditor } from '../../experimental-features';

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
			? '.wp-block-template-part .wp-block-template-part .block-editor-block-list__layout'
			: '.wp-block-template-part .block-editor-block-list__layout'
	);
	await page.focus( '.wp-block-template-part__name-panel input' );
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
		await activateTheme( 'tt1-blocks' );
		await trashAllPosts( 'wp_template' );
		await trashAllPosts( 'wp_template_part' );
	} );

	afterAll( async () => {
		await activateTheme( 'twentytwentyone' );
	} );

	it( 'should not display any dirty entities when loading the site editor', async () => {
		await siteEditor.visit();
		expect( await openEntitySavePanel() ).toBe( false );
	} );

	it( 'should not dirty an entity by switching to it in the template dropdown', async () => {
		await siteEditor.visit();
		await clickTemplateItem( 'Template Parts', 'header' );
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

			// Wait for site editor to load.
			await canvas().waitForSelector(
				'.wp-block-template-part .block-editor-block-list__layout'
			);

			// Our custom template shows up in the " templates > all" menu; let's use it.
			await clickTemplateItem( [ 'Templates', 'All' ], templateName );
			await page.waitForXPath(
				`//h1[contains(@class, "edit-site-document-actions__title") and contains(text(), '${ templateName }')]`
			);

			removeErrorMocks();
		} );

		afterEach( async () => {
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
		} );

		it( 'should only dirty the parent entity when editing the parent', async () => {
			// Clear selection so that the block is not added to the template part.
			await insertBlock( 'Paragraph' );

			// Add changes to the main parent entity.
			await page.keyboard.type( 'Test.' );

			expect( await isEntityDirty( templateName ) ).toBe( true );
			expect( await isEntityDirty( templatePartName ) ).toBe( false );
			expect( await isEntityDirty( nestedTPName ) ).toBe( false );
		} );

		it( 'should only dirty the child when editing the child', async () => {
			await canvas().click(
				'.wp-block-template-part .wp-block[data-type="core/paragraph"]'
			);
			await page.keyboard.type( 'Some more test words!' );

			expect( await isEntityDirty( templateName ) ).toBe( false );
			expect( await isEntityDirty( templatePartName ) ).toBe( true );
			expect( await isEntityDirty( nestedTPName ) ).toBe( false );
		} );

		it( 'should only dirty the nested entity when editing the nested entity', async () => {
			await canvas().click(
				'.wp-block-template-part .wp-block-template-part .wp-block[data-type="core/paragraph"]'
			);
			await page.keyboard.type( 'Nested test words!' );

			expect( await isEntityDirty( templateName ) ).toBe( false );
			expect( await isEntityDirty( templatePartName ) ).toBe( false );
			expect( await isEntityDirty( nestedTPName ) ).toBe( true );
		} );
	} );
} );
