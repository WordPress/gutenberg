/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	createNewPost,
	deactivatePlugin,
	publishPost,
	findSidebarPanelWithTitle,
	clickBlockAppender,
} from '@wordpress/e2e-test-utils';

const openPageAttributesPanel = async () => {
	const openButton = await findSidebarPanelWithTitle( 'Page Attributes' );

	// Get the classes from the panel.
	const buttonClassName = await (
		await openButton.getProperty( 'className' )
	 ).jsonValue();

	// Open the panel if needed.
	if ( -1 === buttonClassName.indexOf( 'is-opened' ) ) {
		await openButton.click();
	}
};

describe( 'Test Custom Post Types', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-custom-post-types' );
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-custom-post-types' );
	} );

	it( 'should be able to create an hierarchical post without title support', async () => {
		const PARENT_PAGE_INPUT =
			'.editor-page-attributes__parent input:not([disabled])';
		const SUGGESTION =
			'.editor-page-attributes__parent .components-form-token-field__suggestion:first-child';

		// Create a parent post.
		await createNewPost( { postType: 'hierar-no-title' } );
		await clickBlockAppender();
		await page.keyboard.type( 'Parent Post' );
		await publishPost();
		// Create a post that is a child of the previously created post.
		await createNewPost( { postType: 'hierar-no-title' } );
		await openPageAttributesPanel();
		await page.waitForSelector( PARENT_PAGE_INPUT );
		await page.click( PARENT_PAGE_INPUT );
		await page.waitForSelector( SUGGESTION );
		const optionToSelect = await page.$( SUGGESTION );
		const valueToSelect = await page.$eval(
			SUGGESTION,
			( element ) => element.textContent
		);
		await optionToSelect.click();
		await clickBlockAppender();
		await page.keyboard.type( 'Child Post' );
		await publishPost();
		// Reload the child post and verify it is still correctly selected as a child post.
		await page.reload();
		await page.waitForSelector( PARENT_PAGE_INPUT );
		// Wait for the list of suggestions to fetch
		// There should be a better way to do that.
		await page.waitForFunction(
			( [ value, inputSelector ] ) =>
				document.querySelector( inputSelector ).value === value,
			{},
			[ valueToSelect, PARENT_PAGE_INPUT ]
		);
	} );
	it( 'should create a cpt with a legacy block in its template without WSOD', async () => {
		await createNewPost( { postType: 'leg_block_in_tpl' } );
		await clickBlockAppender();
		await page.keyboard.type( 'Hello there' );
		await page.waitForSelector( '[data-type="core/embed"]' );
		await publishPost();
	} );
} );
