/**
 * Internal dependencies
 */
import {
	META_KEY,
	clickBlockAppender,
	getEditedPostContent,
	newPost,
	pressWithModifier,
} from '../support/utils';

/**
 * The modifier keys needed to invoke a 'select the next word' keyboard shortcut.
 *
 * @type {string}
 */
const SELECT_WORD_MODIFIER_KEYS = process.platform === 'darwin' ? [ 'Shift', 'Alt' ] : [ 'Shift', 'Control' ];

describe( 'Links', () => {
	beforeEach( async () => {
		await newPost();
	} );

	const waitForAutoFocus = async () => {
		await page.waitForFunction( () => !! document.activeElement.closest( '.editor-url-input' ) );
	};

	it( 'can be created by selecting text and clicking Link', async () => {
		// Create a block with some text
		await clickBlockAppender();
		await page.keyboard.type( 'This is Gutenberg' );

		// Select some text
		await pressWithModifier( SELECT_WORD_MODIFIER_KEYS, 'ArrowLeft' );

		// Click on the Link button
		await page.click( 'button[aria-label="Link"]' );

		// Wait for the URL field to auto-focus
		await waitForAutoFocus();

		// Type a URL
		await page.keyboard.type( 'https://wordpress.org/gutenberg' );

		// Click on the Apply button
		await page.click( 'button[aria-label="Apply"]' );

		// The link should have been inserted
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be created by selecting text and using keyboard shortcuts', async () => {
		// Create a block with some text
		await clickBlockAppender();
		await page.keyboard.type( 'This is Gutenberg' );

		// Select some text
		await pressWithModifier( SELECT_WORD_MODIFIER_KEYS, 'ArrowLeft' );

		// Press Cmd+K to insert a link
		await pressWithModifier( META_KEY, 'K' );

		// Wait for the URL field to auto-focus
		await waitForAutoFocus();

		// Type a URL
		await page.keyboard.type( 'https://wordpress.org/gutenberg' );

		// Press Enter to apply the link
		await page.keyboard.press( 'Enter' );

		// The link should have been inserted
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be created without any text selected', async () => {
		// Create a block with some text
		await clickBlockAppender();
		await page.keyboard.type( 'This is Gutenberg: ' );

		// Trigger isTyping = false
		await page.mouse.move( 200, 300, { steps: 10 } );
		await page.mouse.move( 250, 350, { steps: 10 } );

		// Press Cmd+K to insert a link
		await pressWithModifier( META_KEY, 'K' );

		// Wait for the URL field to auto-focus
		await waitForAutoFocus();

		// Type a URL
		await page.keyboard.type( 'https://wordpress.org/gutenberg' );

		// Press Enter to apply the link
		await page.keyboard.press( 'Enter' );

		// A link with the URL as its text should have been inserted
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be created instantly when a URL is selected', async () => {
		// Create a block with some text
		await clickBlockAppender();
		await page.keyboard.type( 'This is Gutenberg: https://wordpress.org/gutenberg' );

		// Select the URL
		await pressWithModifier( SELECT_WORD_MODIFIER_KEYS, 'ArrowLeft' );
		await pressWithModifier( SELECT_WORD_MODIFIER_KEYS, 'ArrowLeft' );
		await pressWithModifier( SELECT_WORD_MODIFIER_KEYS, 'ArrowLeft' );
		await pressWithModifier( SELECT_WORD_MODIFIER_KEYS, 'ArrowLeft' );

		// Click on the Link button
		await page.click( 'button[aria-label="Link"]' );

		// A link with the selected URL as its href should have been inserted
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'is not created when we click away from the link input', async () => {
		// Create a block with some text
		await clickBlockAppender();
		await page.keyboard.type( 'This is Gutenberg' );

		// Select some text
		await pressWithModifier( SELECT_WORD_MODIFIER_KEYS, 'ArrowLeft' );

		// Click on the Link button
		await page.click( 'button[aria-label="Link"]' );

		// Wait for the URL field to auto-focus
		await waitForAutoFocus();

		// Type a URL
		await page.keyboard.type( 'https://wordpress.org/gutenberg' );

		// Click somewhere else - it doesn't really matter where
		await page.click( '.editor-post-title' );
	} );

	const createAndReselectLink = async () => {
		// Create a block with some text
		await clickBlockAppender();
		await page.keyboard.type( 'This is Gutenberg' );

		// Select some text
		await pressWithModifier( SELECT_WORD_MODIFIER_KEYS, 'ArrowLeft' );

		// Click on the Link button
		await page.click( 'button[aria-label="Link"]' );

		// Wait for the URL field to auto-focus
		await waitForAutoFocus();

		// Type a URL
		await page.keyboard.type( 'https://wordpress.org/gutenberg' );

		// Click on the Apply button
		await page.click( 'button[aria-label="Apply"]' );
	};

	it( 'can be edited', async () => {
		await createAndReselectLink();

		// Click on the Edit button
		await page.click( 'button[aria-label="Edit"]' );

		// Wait for the URL field to auto-focus
		await waitForAutoFocus();

		// Change the URL
		await page.keyboard.type( '/handbook' );

		// Click on the Apply button
		await page.click( 'button[aria-label="Apply"]' );

		// The link should have been updated
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can be removed', async () => {
		await createAndReselectLink();

		// Click on the Unlink button
		await page.click( 'button[aria-label="Unlink"]' );

		// The link should have been removed
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	const toggleFixedToolbar = async ( b ) => {
		await page.click( '.edit-post-more-menu button' );
		const button = ( await page.$x( "//button[contains(text(), 'Unified Toolbar')]" ) )[ 0 ];
		const buttonClassNameProperty = await button.getProperty( 'className' );
		const buttonClassName = await buttonClassNameProperty.jsonValue();
		const isSelected = buttonClassName.indexOf( 'is-selected' ) !== -1;
		if ( isSelected !== b ) {
			await button.click();
		} else {
			await page.click( '.edit-post-more-menu button' );
		}
	};

	it( 'allows Left to be pressed during creation when the toolbar is fixed to top', async () => {
		await toggleFixedToolbar( true );

		await clickBlockAppender();
		await page.keyboard.type( 'Text' );
		await page.click( 'button[aria-label="Link"]' );

		// Typing "left" should not close the dialog
		await page.keyboard.press( 'ArrowLeft' );
		let modal = await page.$( '.editor-format-toolbar__link-modal' );
		expect( modal ).not.toBeNull();

		// Escape should close the dialog still.
		await page.keyboard.press( 'Escape' );
		modal = await page.$( '.editor-format-toolbar__link-modal' );
		expect( modal ).toBeNull();
	} );

	it( 'allows Left to be pressed during creation in "Docked Toolbar" mode', async () => {
		await toggleFixedToolbar( false );

		await clickBlockAppender();
		await page.keyboard.type( 'Text' );

		// we need to trigger isTyping = false
		await page.mouse.move( 200, 300, { steps: 10 } );
		await page.mouse.move( 250, 350, { steps: 10 } );
		await page.waitForSelector( 'button[aria-label="Link"]' );
		await page.click( 'button[aria-label="Link"]' );

		// Typing "left" should not close the dialog
		await page.keyboard.press( 'ArrowLeft' );
		let modal = await page.$( '.editor-format-toolbar__link-modal' );
		expect( modal ).not.toBeNull();

		// Escape should close the dialog still.
		await page.keyboard.press( 'Escape' );
		modal = await page.$( '.editor-format-toolbar__link-modal' );
		expect( modal ).toBeNull();
	} );
} );
