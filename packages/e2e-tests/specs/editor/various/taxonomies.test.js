/**
 * External dependencies
 */
import { random } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	createNewPost,
	findSidebarPanelWithTitle,
	openDocumentSettingsSidebar,
	publishPost,
} from '@wordpress/e2e-test-utils';

/**
 * Module constants
 */
const TAG_TOKEN_SELECTOR =
	'.components-form-token-field__token-text span:not(.components-visually-hidden)';

describe( 'Taxonomies', () => {
	const canCreatTermInTaxonomy = ( taxonomy ) => {
		return page.evaluate( ( _taxonomy ) => {
			const post = wp.data.select( 'core/editor' ).getCurrentPost();
			if ( ! post._links ) {
				return false;
			}
			return !! post._links[ `wp:action-create-${ _taxonomy }` ];
		}, taxonomy );
	};

	const getSelectCategories = () => {
		return page.evaluate( () => {
			return Array.from(
				document.querySelectorAll(
					'.editor-post-taxonomies__hierarchical-terms-choice .components-checkbox-control__input:checked'
				)
			).map( ( node ) => {
				return node.parentElement.nextSibling.innerText;
			} );
		} );
	};

	const getCurrentTags = async () => {
		const tagsPanel = await findSidebarPanelWithTitle( 'Tags' );
		return page.evaluate(
			( node, selector ) => {
				return Array.from( node.querySelectorAll( selector ) ).map(
					( field ) => {
						return field.innerText;
					}
				);
			},
			tagsPanel,
			TAG_TOKEN_SELECTOR
		);
	};

	const openSidebarPanelWithTitle = async ( title ) => {
		const panel = await page.waitForXPath(
			`//div[contains(@class,"edit-post-sidebar")]//button[@class="components-button components-panel__body-toggle"][contains(text(),"${ title }")]`
		);
		await panel.click();
	};

	it( 'should be able to open the categories panel and create a new main category if the user has the right capabilities', async () => {
		await createNewPost();

		await openDocumentSettingsSidebar();

		await openSidebarPanelWithTitle( 'Categories' );

		await page.waitForSelector(
			'.editor-post-taxonomies__hierarchical-terms-list'
		);

		// If the user has no permission to add a new category finish the test.
		if ( ! ( await canCreatTermInTaxonomy( 'categories' ) ) ) {
			return;
		}

		await page.waitForSelector(
			'button.editor-post-taxonomies__hierarchical-terms-add'
		);

		// Click add new category button.
		await page.click(
			'button.editor-post-taxonomies__hierarchical-terms-add'
		);

		// Type the category name in the field.
		await page.type(
			'.editor-post-taxonomies__hierarchical-terms-input input[type=text]',
			'z rand category 1'
		);

		// Click the submit button.
		await page.click(
			'.editor-post-taxonomies__hierarchical-terms-submit'
		);

		// Wait for the categories to load.
		await page.waitForSelector(
			'.editor-post-taxonomies__hierarchical-terms-choice .components-checkbox-control__input:checked'
		);

		let selectedCategories = await getSelectCategories();

		// The new category is selected.
		expect( selectedCategories ).toHaveLength( 1 );
		expect( selectedCategories[ 0 ] ).toEqual( 'z rand category 1' );

		// Type something in the title so we can publish the post.
		await page.type( '.editor-post-title__input', 'Hello World' );

		// Publish the post.
		await publishPost();

		// Reload the editor.
		await page.reload();

		// Wait for the categories to load.
		await page.waitForSelector(
			'.editor-post-taxonomies__hierarchical-terms-choice .components-checkbox-control__input:checked'
		);

		selectedCategories = await getSelectCategories();

		// The category selection was persisted after the publish process.
		expect( selectedCategories ).toHaveLength( 1 );
		expect( selectedCategories[ 0 ] ).toEqual( 'z rand category 1' );
	} );

	it( "should be able to create a new tag with ' on the name", async () => {
		await createNewPost();

		await openDocumentSettingsSidebar();

		await openSidebarPanelWithTitle( 'Tags' );

		// If the user has no permission to add a new tag finish the test.
		if ( ! ( await canCreatTermInTaxonomy( 'tags' ) ) ) {
			return;
		}

		const tagsPanel = await findSidebarPanelWithTitle( 'Tags' );
		const tagInput = await tagsPanel.$(
			'.components-form-token-field__input'
		);

		// Click the tag input field.
		await tagInput.click();

		const tagName = "tag'-" + random( 1, Number.MAX_SAFE_INTEGER );

		// Type the category name in the field.
		await tagInput.type( tagName );

		// Press enter to create a new tag.
		await tagInput.press( 'Enter' );

		await page.waitForSelector( TAG_TOKEN_SELECTOR );

		// Get an array with the tags of the post.
		let tags = await getCurrentTags();

		// The post should only contain the tag we added.
		expect( tags ).toHaveLength( 1 );
		expect( tags[ 0 ] ).toEqual( tagName );

		// Type something in the title so we can publish the post.
		await page.type( '.editor-post-title__input', 'Hello World' );

		// Publish the post.
		await publishPost();

		// Reload the editor.
		await page.reload();

		// Wait for the tags to load.
		await page.waitForSelector( '.components-form-token-field__token' );

		tags = await getCurrentTags();

		// The tag selection was persisted after the publish process.
		expect( tags ).toHaveLength( 1 );
		expect( tags[ 0 ] ).toEqual( tagName );
	} );

	it( 'should be able to open the tags panel and create a new tag if the user has the right capabilities', async () => {
		await createNewPost();

		await openDocumentSettingsSidebar();

		await openSidebarPanelWithTitle( 'Tags' );

		// If the user has no permission to add a new tag finish the test.
		if ( ! ( await canCreatTermInTaxonomy( 'tags' ) ) ) {
			return;
		}

		// At the start there are no tag tokens
		expect( await page.$$( TAG_TOKEN_SELECTOR ) ).toHaveLength( 0 );

		const tagsPanel = await findSidebarPanelWithTitle( 'Tags' );
		const tagInput = await tagsPanel.$(
			'.components-form-token-field__input'
		);

		// Click the tag input field.
		await tagInput.click();

		const tagName = 'tag-' + random( 1, Number.MAX_SAFE_INTEGER );

		// Type the category name in the field.
		await tagInput.type( tagName );

		// Press enter to create a new tag.
		await tagInput.press( 'Enter' );

		await page.waitForSelector( TAG_TOKEN_SELECTOR );

		// Get an array with the tags of the post.
		let tags = await getCurrentTags();

		// The post should only contain the tag we added.
		expect( tags ).toHaveLength( 1 );
		expect( tags[ 0 ] ).toEqual( tagName );

		// Type something in the title so we can publish the post.
		await page.type( '.editor-post-title__input', 'Hello World' );

		// Publish the post.
		await publishPost();

		// Reload the editor.
		await page.reload();

		// Wait for the tags to load.
		await page.waitForSelector( '.components-form-token-field__token' );

		tags = await getCurrentTags();

		// The tag selection was persisted after the publish process.
		expect( tags ).toHaveLength( 1 );
		expect( tags[ 0 ] ).toEqual( tagName );
	} );
} );
