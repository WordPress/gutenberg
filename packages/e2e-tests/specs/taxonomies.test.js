/**
 * WordPress dependencies
 */
import {
	findSidebarPanelWithTitle,
	createNewPost,
	openDocumentSettingsSidebar,
	publishPost,
} from '@wordpress/e2e-test-utils';

describe( 'Taxonomies', () => {
	const canCreatTermInTaxonomy = ( taxonomy ) => {
		return page.evaluate(
			( _taxonomy ) => {
				const post = wp.data.select( 'core/editor' ).getCurrentPost();
				if ( ! post._links ) {
					return false;
				}
				return !! post._links[ `wp:action-create-${ _taxonomy }` ];
			},
			taxonomy
		);
	};

	const getSelectCategories = () => {
		return page.evaluate(
			() => {
				return Array.from( document.querySelectorAll(
					'.editor-post-taxonomies__hierarchical-terms-input:checked'
				) ).map( ( node ) => {
					return node.parentElement.querySelector(
						'label'
					).innerText;
				} );
			}
		);
	};

	it( 'should be able to open the categories panel and create a new main category if the user has the right capabilities', async () => {
		await createNewPost();

		await openDocumentSettingsSidebar();

		const categoriesPanel = await findSidebarPanelWithTitle( 'Categories' );
		expect( categoriesPanel ).toBeDefined();

		// Open the categories panel.
		await categoriesPanel.click( 'button' );

		// If the user has no permission to add a new category finish the test.
		if ( ! ( await canCreatTermInTaxonomy( 'category' ) ) ) {
			return;
		}

		await page.waitForSelector( 'button.editor-post-taxonomies__hierarchical-terms-add' );

		// Click add new category button.
		await page.click( 'button.editor-post-taxonomies__hierarchical-terms-add' );

		// Type the category name in the field.
		await page.type(
			'.editor-post-taxonomies__hierarchical-terms-input[type=text]',
			'z rand category 1'
		);

		// Click the submit button.
		await page.click( '.editor-post-taxonomies__hierarchical-terms-submit' );

		// Wait for the categories to load.
		await page.waitForSelector( '.editor-post-taxonomies__hierarchical-terms-input:checked' );

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
		await page.waitForSelector( '.editor-post-taxonomies__hierarchical-terms-input:checked' );

		selectedCategories = await getSelectCategories();

		// The category selection was persisted after the publish process.
		expect( selectedCategories ).toHaveLength( 1 );
		expect( selectedCategories[ 0 ] ).toEqual( 'z rand category 1' );
	} );
} );
