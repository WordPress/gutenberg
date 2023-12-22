/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	postCommentsFormBlockUtils: async (
		{ page, admin, requestUtils },
		use
	) => {
		await use(
			new postCommentsFormBlockUtils( { page, admin, requestUtils } )
		);
	},
} );

test.describe( 'Comments Form', () => {
	let previousCommentStatus;

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.deleteAllTemplates( 'wp_template' );
	} );

	test.beforeEach( async ( { postCommentsFormBlockUtils } ) => {
		// Ideally, we'd set options in beforeAll or afterAll. Unfortunately, these
		// aren't exposed via the REST API, so we have to set them through the
		// relevant wp-admin screen, which involves page utils; but those are
		// prohibited from beforeAll/afterAll.
		previousCommentStatus = await postCommentsFormBlockUtils.setOption(
			'default_comment_status',
			'closed'
		);
	} );

	test.afterEach( async ( { postCommentsFormBlockUtils } ) => {
		await postCommentsFormBlockUtils.setOption(
			'default_comment_status',
			previousCommentStatus
		);
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'placeholder displays in the site editor even when comments are closed by default', async ( {
		admin,
		editor,
	} ) => {
		// Navigate to "Singular" post template
		await admin.visitSiteEditor( {
			postId: 'emptytheme//singular',
			postType: 'wp_template',
			canvas: 'edit',
		} );

		// Insert post comments form
		await editor.insertBlock( { name: 'core/post-comments-form' } );

		// Ensure the placeholder is there
		const postCommentsFormBlock = editor.canvas.locator(
			'role=document[name="Block: Comments Form"i]'
		);
		await expect( postCommentsFormBlock.locator( 'form' ) ).toBeVisible();
	} );
} );

class postCommentsFormBlockUtils {
	constructor( { page, admin, requestUtils } ) {
		this.page = page;
		this.admin = admin;
		this.requestUtils = requestUtils;
	}

	/**
	 * Sets a site option, from the options-general admin page.
	 *
	 * This is a temporary solution until we can handle options through the REST
	 * API.
	 *
	 * @param {string} setting The option, used to get the option by id.
	 * @param {string} value   The value to set the option to.
	 *
	 * @return {Promise<string>} A Promise that resolves to the option's
	 * previous value.
	 */
	async setOption( setting, value ) {
		await this.admin.visitAdminPage( 'options.php', '' );
		const previousValue = await this.page.inputValue( `#${ setting }` );

		await this.page.fill( `#${ setting }`, value );
		await this.page.click( '#Update' );

		return previousValue;
	}
}
