/**
 * External dependencies
 */
import { kebabCase } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	insertBlock,
	visitAdminPage,
	createNewPost,
	publishPost,
} from '@wordpress/e2e-test-utils';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { useExperimentalFeatures } from '../../experimental-features';
import { trashExistingPosts } from '../../config/setup-test-framework';

const visitSiteEditor = async () => {
	const query = addQueryArgs( '', {
		page: 'gutenberg-edit-site',
	} ).slice( 1 );
	await visitAdminPage( 'admin.php', query );
	// Waits for the template part to load...
	await page.waitForSelector(
		'.wp-block[data-type="core/template-part"] .block-editor-inner-blocks'
	);
};

const openTemplateDropdown = async () => {
	// Open the dropdown menu.
	const templateDropdown =
		'button.components-dropdown-menu__toggle[aria-label="Switch Template"]';
	await page.click( templateDropdown );
	await page.waitForSelector( '.edit-site-template-switcher__popover' );
};

const getTemplateDropdownElement = async ( itemName ) => {
	await openTemplateDropdown();
	const [ item ] = await page.$x(
		`//div[contains(@class, "edit-site-template-switcher__popover")]//button[contains(., "${ itemName }")]`
	);
	return item;
};

const createTemplatePart = async (
	templatePartName = 'test-template-part',
	themeName = 'test-theme',
	isNested = false
) => {
	// Create new template part.
	await insertBlock( 'Template Part' );
	await page.keyboard.type( templatePartName );
	await page.keyboard.press( 'Tab' );
	await page.keyboard.type( themeName );
	await page.keyboard.press( 'Tab' );
	await page.keyboard.press( 'Enter' );
	await page.waitForSelector(
		isNested
			? '.wp-block[data-type="core/template-part"] .wp-block[data-type="core/template-part"] .block-editor-inner-blocks'
			: '.wp-block[data-type="core/template-part"] .block-editor-inner-blocks'
	);
};

const editTemplatePart = async ( textToAdd, isNested = false ) => {
	await page.click(
		isNested
			? '.wp-block[data-type="core/template-part"] .wp-block[data-type="core/template-part"]'
			: '.wp-block[data-type="core/template-part"]'
	);
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

	// Expand to view savable entities if necessary.
	const reviewChangesButton = await page.$(
		'.entities-saved-states__review-changes-button'
	);
	const [ needsToOpen ] = await reviewChangesButton.$x(
		'//*[contains(text(),"Review changes.")]'
	);
	if ( needsToOpen ) {
		await reviewChangesButton.click();
	}

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
	// Setup & Teardown.
	const templateName = 'Front Page';
	const templatePartName = 'Test Template Part Name Edit';
	const nestedTPName = 'Test Nested Template Part Name Edit';

	useExperimentalFeatures( [
		'#gutenberg-full-site-editing',
		'#gutenberg-full-site-editing-demo',
	] );

	beforeAll( async () => {
		await trashExistingPosts( 'wp_template' );
		await trashExistingPosts( 'wp_template_part' );
	} );

	it( 'should not display any dirty entities when loading the site editor', async () => {
		await visitSiteEditor();
		expect( await openEntitySavePanel() ).toBe( true );

		await saveAllEntities();
		await visitSiteEditor();

		// Unable to open the save panel implies that no entities are dirty.
		expect( await openEntitySavePanel() ).toBe( false );
	} );

	it( 'should not dirty an entity by switching to it in the template dropdown', async () => {
		const templatePartButton = await getTemplateDropdownElement( 'header' );
		await templatePartButton.click();

		// Wait for blocks to load.
		await page.waitForSelector( '.wp-block' );
		expect( await isEntityDirty( 'header' ) ).toBe( false );
		expect( await isEntityDirty( 'front-page' ) ).toBe( false );

		// Switch back and make sure it is still clean.
		const templateButton = await getTemplateDropdownElement( 'front-page' );
		await templateButton.click();
		await page.waitForSelector( '.wp-block' );
		expect( await isEntityDirty( 'header' ) ).toBe( false );
		expect( await isEntityDirty( 'front-page' ) ).toBe( false );

		removeErrorMocks();
	} );

	describe( 'Multi-entity edit', () => {
		beforeAll( async () => {
			await trashExistingPosts( 'wp_template' );
			await trashExistingPosts( 'wp_template_part' );
			await createNewPost( {
				postType: 'wp_template',
				title: kebabCase( templateName ),
			} );
			await publishPost();
			await createTemplatePart( templatePartName );
			await editTemplatePart( [
				'Default template part test text.',
				'Second paragraph test.',
			] );
			await createTemplatePart( nestedTPName, 'test-theme', true );
			await editTemplatePart(
				[ 'Nested Template Part Text.', 'Second Nested test.' ],
				true
			);
			await saveAllEntities();
			await visitSiteEditor();
			removeErrorMocks();
		} );

		afterEach( async () => {
			await saveAllEntities();
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
			await page.click(
				'.wp-block[data-type="core/template-part"] .wp-block[data-type="core/paragraph"]'
			);
			await page.keyboard.type( 'Some more test words!' );

			expect( await isEntityDirty( templateName ) ).toBe( false );
			expect( await isEntityDirty( templatePartName ) ).toBe( true );
			expect( await isEntityDirty( nestedTPName ) ).toBe( false );
		} );

		it( 'should only dirty the nested entity when editing the nested entity', async () => {
			await page.click(
				'.wp-block[data-type="core/template-part"] .wp-block[data-type="core/template-part"] .wp-block[data-type="core/paragraph"]'
			);
			await page.keyboard.type( 'Nested test words!' );

			expect( await isEntityDirty( templateName ) ).toBe( false );
			expect( await isEntityDirty( templatePartName ) ).toBe( false );
			expect( await isEntityDirty( nestedTPName ) ).toBe( true );
		} );
	} );
} );
