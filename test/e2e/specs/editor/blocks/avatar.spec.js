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

		await expect( avatarBlock ).toBeVisible();

		const avatarImage = avatarBlock.locator( 'img' );

		await expect( avatarImage ).toBeVisible();

		const originalSrc = await avatarImage.getAttribute( 'src' );

		const blockInspectorControls = page.locator(
			'.block-editor-block-inspector'
		);

		await expect( blockInspectorControls ).toBeVisible();

		const userComboBox = blockInspectorControls.locator(
			'.components-combobox-control'
		);

		await expect( userComboBox ).toBeVisible();

		const userInput = userComboBox.locator(
			'.components-combobox-control__input'
		);

		await expect( userInput ).toBeVisible();

		// Set new user.
		await userInput.click();

		const newUser = userComboBox.locator(
			'role=option[name="' + username + '"]'
		);

		await expect( newUser ).toBeVisible();

		await newUser.click();

		const newSrc = await avatarImage.getAttribute( 'src' );

		expect( newSrc ).not.toBe( originalSrc );

		await expect( userInput ).toBeVisible();
	} );
} );
