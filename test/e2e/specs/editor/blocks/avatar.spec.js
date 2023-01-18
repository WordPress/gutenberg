/**
 * WordPress dependencies
 */

const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Avatar', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllUsers();
	} );

	test.beforeEach( async ( { admin, requestUtils } ) => {
		await requestUtils.createUser( {
			username: 'user',
			email: 'gravatartest@gmail.com',
			firstName: 'Gravatar',
			lastName: 'Gravatar',
			roles: [ 'author' ],
			password: 'gravatargravatar123magic',
		} );

		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllUsers();
	} );

	test( 'should change image when user is changed', async ( {
		editor,
		page,
	} ) => {
		// Inserting a quote block
		await editor.insertBlock( {
			name: 'core/avatar',
		} );

		const username = 'Gravatar Gravatar';

		const avatarBlock = page.locator(
			'role=document[name="Block: Avatar"i]'
		);

		const avatarImage = avatarBlock.locator( 'img' );

		await expect( avatarImage ).toBeVisible();

		const originalSrc = await avatarImage.getAttribute( 'src' );

		const blockInspectorControls = page.locator(
			'.block-editor-block-inspector'
		);

		await expect( blockInspectorControls ).toBeVisible();
		await page.click(
			`role=region[name="Editor settings"i] >> role=tab[name="Settings"i]`
		);

		const userInput = page.locator(
			'role=region[name="Editor settings"i] >> role=combobox[name="User"i]'
		);

		// Set new user.
		await userInput.click();

		const newUser = page.locator( 'role=option[name="' + username + '"]' );

		await newUser.click();

		const updatedAvatarImage = avatarBlock.locator( 'img' );
		const newSrc = await updatedAvatarImage.getAttribute( 'src' );

		expect( newSrc ).not.toBe( originalSrc );
	} );
} );
