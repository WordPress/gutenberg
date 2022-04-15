/**
 * WordPress dependencies
 */
import {
	insertBlock,
	activateTheme,
	setOption,
	visitSiteEditor,
	openSiteEditorNavigationPanel,
	navigateSiteEditorBackToRoot,
	deleteAllTemplates,
	canvas,
	publishPost,
	createNewPost,
} from '@wordpress/e2e-test-utils';

describe( 'Post Comments Form', () => {
	beforeAll( async () => {
		await activateTheme( 'emptytheme' );
		await deleteAllTemplates( 'wp_template' );
	} );

	describe( 'placeholder', () => {
		it( 'displays in site editor even when comments are closed by default', async () => {
			await setOption( 'default_comment_status', 'closed' );

			// Navigate to "Singular" post template
			await visitSiteEditor();
			await openSiteEditorNavigationPanel();
			await navigateSiteEditorBackToRoot();
			await expect( page ).toClick(
				'.components-navigation__item-title',
				{ text: /templates/i }
			);
			await expect( page ).toClick( '.components-heading > a', {
				text: /singular/i,
			} );

			// Insert post comments form
			await insertBlock( 'Post Comments Form' );

			// Ensure the placeholder is there
			await expect( canvas() ).toMatchElement(
				'.wp-block-post-comments .comment-form'
			);

			// Save
			await expect( page ).toClick( '.edit-site-save-button__button' );
			await expect( page ).toClick(
				'.editor-entities-saved-states__save-button'
			);
		} );

		it( 'html structure is similar to the rendered frontend form', async () => {
			// Handle is for the Post Comments Form root element.
			const getStructureFromHandle = async ( handle ) => {
				const getTagNames = ( elements ) =>
					elements.map( ( e ) => e.tagName ).join( ',' );

				return {
					topLevelItems: await handle.$$eval(
						':scope > *',
						getTagNames
					),
					formClassNames: await handle.$eval(
						':scope > form',
						( e ) => {
							const classes = e.classList;
							return Array.from( classes ).join( ',' );
						}
					),
					submitButtonText: await handle.$eval(
						':scope input[type="submit"]',
						( e ) => e.innerText
					),
				};
			};
			const editorBlockHandle = await canvas().$(
				'.wp-block-post-comments'
			);

			const editorBlockStructure = await getStructureFromHandle(
				editorBlockHandle
			);

			// Enable comments again
			await setOption( 'default_comment_status', 'open' );

			// Create new post
			await createNewPost( { title: 'Test Post', content: 'Something' } );
			await publishPost();

			// Navigate to post frontend
			const viewPostLinks = await page.$x(
				"//a[contains(text(), 'View Post')]"
			);
			await viewPostLinks[ 0 ].click();
			await page.waitForNavigation();

			// Get frontend structure
			const frontendBlockHandle = await page.$(
				'.wp-block-post-comments-form'
			);
			const frontendBlockStructure = await getStructureFromHandle(
				frontendBlockHandle
			);

			// Compare the structures
			expect( editorBlockStructure ).toEqual( frontendBlockStructure );
		} );
	} );
} );
