/**
 * WordPress dependencies
 */
import {
	insertBlock,
	activateTheme,
	setOption,
	visitSiteEditor,
	enterEditMode,
	deleteAllTemplates,
	canvas,
} from '@wordpress/e2e-test-utils';

describe( 'Post Comments Form', () => {
	let previousCommentStatus;

	beforeAll( async () => {
		await activateTheme( 'emptytheme' );
		await deleteAllTemplates( 'wp_template' );
		previousCommentStatus = await setOption(
			'default_comment_status',
			'closed'
		);
	} );

	afterAll( async () => {
		await setOption( 'default_comment_status', previousCommentStatus );
	} );

	describe( 'placeholder', () => {
		it( 'displays in site editor even when comments are closed by default', async () => {
			// Navigate to "Singular" post template
			await visitSiteEditor();
			await expect( page ).toClick(
				'.edit-site-sidebar-navigation-item',
				{ text: /templates/i }
			);
			await expect( page ).toClick(
				'.edit-site-sidebar-navigation-item',
				{ text: /single entries/i }
			);
			await enterEditMode();

			// Insert post comments form
			await insertBlock( 'Post Comments Form' );

			// Ensure the placeholder is there
			await expect( canvas() ).toMatchElement(
				'.wp-block-post-comments-form .comment-form'
			);
		} );
	} );
} );
