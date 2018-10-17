/**
 * Node dependencies
 */
import path from 'path';
import fs from 'fs';
import os from 'os';
import uuid from 'uuid/v4';

/**
 * Internal dependencies
 */
import {
	newPost,
	pressWithModifier,
	META_KEY,
	pressTimes,
	getEditedPostContent,
} from '../support/utils';

async function tabUntilElementIsActive( checkActiveElement ) {
	const isFocusedButton = async () =>
		await page.$eval( ':focus', checkActiveElement );

	let isFocused = false;
	do {
		await page.keyboard.press( 'Tab' );
		isFocused = await isFocusedButton();
	} while ( ! isFocused );
}

const moveMouse = async () => {
	await page.mouse.move( 200, 300, { steps: 10 } );
	await page.mouse.move( 250, 350, { steps: 10 } );
};

async function uploadImageInTheMediaLibrary( assetFileName ) {
	await page.waitForSelector( '.media-modal input[type=file]' );
	const inputElement = await page.$( '.media-modal input[type=file]' );
	const testImagePath = path.join( __dirname, '..', 'assets', assetFileName );
	const filename = uuid();
	const tmpFileName = path.join( os.tmpdir(), filename + '.png' );
	fs.copyFileSync( testImagePath, tmpFileName );
	await inputElement.uploadFile( tmpFileName );
	await page.waitForSelector( `.media-modal li[aria-label="${ filename }"]` );
}

async function navigateToNextRegion() {
	await pressWithModifier( [ 'Alt', 'Shift' ], 'n' );
}

async function createBlockAfter() {
	await pressWithModifier( [ META_KEY, 'Alt' ], 'y' );
}

// Creating the demo post may take more time than the default test timeout.
jest.setTimeout( 1000000 );

describe( 'Demo content post', () => {
	beforeEach( async () => {
		await newPost();
	} );

	it( 'should be created with keyboard', async () => {
		// Title of the page
		await page.keyboard.type( 'Welcome to the Gutenberg Editor' );

		// Creating the cover image
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '/cover' );
		await page.keyboard.press( 'Enter' );

		// Apply center alignment (wide alignment is not available in the default theme)
		await pressWithModifier( 'Alt', 'F10' );
		await pressTimes( 'Tab', 2 );
		await page.keyboard.press( 'Enter' );

		// Upload the image
		await tabUntilElementIsActive( ( element ) => element.textContent === 'Media Library' ); // We should have a way to focus the block content
		await page.keyboard.press( 'Enter' );
		await uploadImageInTheMediaLibrary( 'cover-1.jpg' );
		await tabUntilElementIsActive( ( element ) => element.classList.contains( 'media-button-select' ) );
		await page.keyboard.press( 'Enter' );

		// Enter the text of image
		await page.keyboard.press( 'Tab' );
		await page.keyboard.type( 'Of Mountains & Printing Presses' );

		// Create the next paragraph
		await page.keyboard.press( 'Tab' );
		await page.keyboard.type( 'The goal of this new editor is to make adding rich content to WordPress simple and enjoyable. This whole post is composed of ' );
		await pressWithModifier( META_KEY, 'i' );
		await page.keyboard.type( 'pieces of content' );
		await pressWithModifier( META_KEY, 'i' );
		await page.keyboard.type( '—somewhat similar to LEGO bricks—that you can move around and interact with. Move your cursor around and you’ll notice the different blocks light up with outlines and arrows. Press the arrows to reposition blocks quickly, without fearing about losing things in the process of copying and pasting.' );

		// Create the second paragraph
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'What you are reading now is a ' );
		await pressWithModifier( META_KEY, 'b' );
		await page.keyboard.type( 'text block' );
		await pressWithModifier( META_KEY, 'b' );
		await page.keyboard.type( ' the most basic block of all. The text block has its own controls to be moved freely around the post..' );

		// Create the aligned right paragraph
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '... like this one, which is right aligned.' );
		await moveMouse(); // This shouldn't be necessary to show the toolbar
		await pressWithModifier( 'Alt', 'F10' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Escape' );

		// Another paragraph
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Headings are separate blocks as well, which helps with the outline and organization of your content.' );

		// Heading block
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '/heading' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'A Picture is Worth a Thousand Words' );

		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Handling images and media with the utmost care is a primary focus of the new editor. Hopefully, you’ll find aspects of adding captions or going full-width with your pictures much easier and robust than before.' );

		// Image with caption
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '/image' );
		await page.keyboard.press( 'ArrowDown' ); // The cover image shows up first because we uses it
		await page.keyboard.press( 'Enter' );
		await tabUntilElementIsActive( ( element ) => element.textContent === 'Media Library' ); // We should have a way to focus the block content
		await page.keyboard.press( 'Enter' );
		await uploadImageInTheMediaLibrary( 'image-1.jpg' );
		await tabUntilElementIsActive( ( element ) => element.classList.contains( 'media-button-select' ) );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.type( 'If your theme supports it, you’ll see the "wide" button on the image toolbar. Give it a try.' );

		await page.keyboard.press( 'Tab' );
		await page.keyboard.type( 'Try selecting and removing or editing the caption, now you don’t have to be careful about selecting the image or other text by mistake and ruining the presentation.' );

		// Another Heading block
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '/heading' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'The ' );
		await pressWithModifier( META_KEY, 'i' );
		await page.keyboard.type( 'Inserter' );
		await pressWithModifier( META_KEY, 'i' );
		await page.keyboard.type( ' Tool' );

		// Paragraph with code
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Imagine everything that WordPress can do is available to you quickly and in the same place on the interface. No need to figure out HTML tags, classes, or remember complicated shortcode syntax. That’s the spirit behind the inserter—the `(+)`' );
		await page.keyboard.press( 'ArrowRight' ); // This shouldn't be necessary
		await page.keyboard.type( ' button you’ll see around the editor—which allows you to browse all available content blocks and add them into your post.Plugins and themes are able to register their own, opening up all sort of possibilities for rich editing and publishing.' );

		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Go give it a try, you may discover things WordPress can already add into your posts that you didn’t know about. Here’s a short list of what you can currently find there:' );

		// List block
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '/list' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Text & Headings' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Images & Videos' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Galleries' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Embeds, like YouTube, Tweets, or other WordPress posts.' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Layout blocks, like Buttons, Hero Images, Separators, etc.' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'And Lists like this one of course :)' );
		await page.keyboard.press( 'Enter' );

		// Separator block
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '/separator' );
		await page.keyboard.press( 'Enter' );

		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '/heading' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Visual Editing' );

		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'A huge benefit of blocks is that you can edit them in place and manipulate your content directly. Instead of having fields for editing things like the source of a quote, or the text of a button, you can directly change the content. Try editing the following quote:' );

		// Quote block
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '/quote' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'The editor will endeavor to create a new page and post building experience that makes writing rich posts effortless, and has “blocks” to make it easy what today might take shortcodes, custom HTML, or “mystery meat” embed discovery.' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.type( 'Matt Mullenweg, 2017' );

		await page.keyboard.press( 'Tab' );
		await page.keyboard.type( 'The information corresponding to the source of the quote is a separate text field, similar to captions under images, so the structure of the quote is protected even if you select, modify, or remove the source. It’s always easy to add it back.' );

		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Blocks can be anything you need. For instance, you may want to add a subdued quote as part of the composition of your text, or you may prefer to display a giant stylized one. All of these options are available in the inserter.' );

		// Gallery block
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '/gallery' );
		await page.keyboard.press( 'Enter' );
		await tabUntilElementIsActive( ( element ) => element.textContent === 'Media Library' ); // We should have a way to focus the block content
		await page.keyboard.press( 'Enter' );
		await uploadImageInTheMediaLibrary( 'gallery-1.jpg' );
		await uploadImageInTheMediaLibrary( 'gallery-2.jpg' );
		await uploadImageInTheMediaLibrary( 'gallery-3.jpg' );
		await tabUntilElementIsActive( ( element ) => element.classList.contains( 'media-button-gallery' ) );
		await page.keyboard.press( 'Enter' );
		await tabUntilElementIsActive( ( element ) => element.classList.contains( 'media-button-insert' ) );
		await page.keyboard.press( 'Enter' );

		// Set to two columns gallery (the way we enter and exit the inspector could be improved)
		await navigateToNextRegion();
		await navigateToNextRegion();
		await navigateToNextRegion();
		await navigateToNextRegion();
		await pressTimes( 'Tab', 5 );
		await page.keyboard.press( 'ArrowLeft' );
		await pressTimes( 'Tab', 5 );
		await page.keyboard.press( 'Enter' );

		await createBlockAfter();
		await page.keyboard.type( 'You can change the amount of columns in your galleries by dragging a slider in the block inspector in the sidebar.' );

		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '/heading' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Media Rich' );

		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'If you combine the new ' );
		await pressWithModifier( META_KEY, 'b' );
		await page.keyboard.type( 'wide' );
		await pressWithModifier( META_KEY, 'b' );
		await page.keyboard.type( ' and ' );
		await pressWithModifier( META_KEY, 'b' );
		await page.keyboard.type( 'full' );
		await pressWithModifier( META_KEY, 'b' );
		await page.keyboard.type( ' - wide alignments with galleries, you can create a very media rich layout, very quickly: ' );

		/* This block is commented because of an error in the media library
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '/image' );
		await page.keyboard.press( 'Enter' );
		await tabUntilElementIsActive( ( element ) => element.textContent === 'Media Library' ); // We should have a way to focus the block content
		await page.keyboard.press( 'Enter' );
		await uploadImageInTheMediaLibrary( 'image-2.jpg' );
		await tabUntilElementIsActive( ( element ) => element.classList.contains( 'media-button-select' ) );
		await page.keyboard.press( 'Enter' );
		await pressWithModifier( 'Alt', 'F10' );
		await pressTimes( 'Tab', 2 );
		await page.keyboard.press( 'Enter' ); // Align center instead of full (full not available in the default theme for now)
		*/

		await createBlockAfter();
		await page.keyboard.type( 'Sure, the full-wide image can be pretty big. But sometimes the image is worth it.' );

		/* This block is commented because of an error in the media library
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '/gallery' );
		await page.keyboard.press( 'Enter' );
		await tabUntilElementIsActive( ( element ) => element.textContent === 'Media Library' ); // We should have a way to focus the block content
		await page.keyboard.press( 'Enter' );
		await uploadImageInTheMediaLibrary( 'gallery-4.jpg' );
		await uploadImageInTheMediaLibrary( 'gallery-5.jpg' );
		await tabUntilElementIsActive( ( element ) => element.classList.contains( 'media-button-gallery' ) );
		await page.keyboard.press( 'Enter' );
		await tabUntilElementIsActive( ( element ) => element.classList.contains( 'media-button-insert' ) );
		await page.keyboard.press( 'Enter' );

		await pressWithModifier( 'Alt', 'F10' );
		await pressTimes( 'Tab', 2 );
		await page.keyboard.press( 'Enter' ); // Align center instead of full (full not available in the default theme for now)
		*/

		await createBlockAfter();
		await page.keyboard.type( 'The above is a gallery with just two images. It’s an easier way to create visually appealing layouts, without having to deal with floats. You can also easily convert the gallery back to individual images again, by using the block switcher.' );

		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Any block can opt into these alignments. The embed block has them also, and is responsive out of the box:' );

		// Vimeo embed block
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '/vimeo' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'https://vimeo.com/22439234' );
		await page.keyboard.press( 'Enter' );

		await moveMouse(); // This shouldn't be necessary to show the toolbar
		await pressWithModifier( 'Alt', 'F10' );
		await pressTimes( 'Tab', 3 );
		await page.keyboard.press( 'Enter' ); // Align center instead of full (full not available in the default theme for now)

		await createBlockAfter();
		await page.keyboard.type( 'You can build any block you like, static or dynamic, decorative or plain. Here’s a pullquote block:' );

		// Pullquote
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '/pullquote' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Code is Poetry' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.type( 'THE WORDPRESS COMMUNITY' );

		// italic and centered paragraph with a link
		await page.keyboard.press( 'Tab' );
		await pressWithModifier( META_KEY, 'i' );
		await page.keyboard.type( 'If you want to learn more about how to build additional blocks, or if you are interested in helping with the project, head over to the GitHub repository.' );

		// Adding the link
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.down( 'Shift' );
		await pressTimes( 'ArrowLeft', 17 ); // Select the text
		await page.keyboard.up( 'Shift' );
		await pressWithModifier( META_KEY, 'k' );
		await page.keyboard.type( 'https://github.com/WordPress/gutenberg' );
		await page.keyboard.press( 'Enter' );

		// Center align
		await moveMouse(); // This shouldn't be necessary to show the toolbar
		await pressWithModifier( 'Alt', 'F10' );
		await pressTimes( 'Tab', 2 );
		await page.keyboard.press( 'Enter' ); // Align center instead of full (full not available in the default theme for now)

		// Button block
		await createBlockAfter();
		await page.keyboard.type( '/button' );
		await page.keyboard.press( 'Enter' );
		await pressWithModifier( 'Shift', 'Tab' ); // This shouldn't be needed.
		await page.keyboard.type( 'Help build Gutenberg' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.type( 'https://github.com/WordPress/gutenberg' );
		await moveMouse(); // This shouldn't be necessary to show the toolbar
		await pressWithModifier( 'Alt', 'F10' );
		await pressTimes( 'Tab', 2 );
		await page.keyboard.press( 'Enter' ); // Align center instead of full (full not available in the default theme for now)

		await createBlockAfter();
		await page.keyboard.type( '/separator' );
		await page.keyboard.press( 'Enter' );

		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Thanks for testing Gutenberg!' );
		await moveMouse(); // This shouldn't be necessary to show the toolbar
		await pressWithModifier( 'Alt', 'F10' );
		await pressTimes( 'Tab', 2 );
		await page.keyboard.press( 'Enter' ); // Align center instead of full (full not available in the default theme for now)

		const postContent = await getEditedPostContent();

		// Some random asserters to ensure blocks have been inserted and the navigation went well
		expect( postContent ).toMatch( `<p style="text-align:center">Thanks for testing Gutenberg!</p>` );
		expect( postContent ).toMatch( `<div class="wp-block-button aligncenter"><a class="wp-block-button__link" href="https://github.com/WordPress/gutenberg">Help build Gutenberg</a></div>` );
		expect( postContent ).toMatch( `<p style="text-align:center"><em>If you want to learn more about how to build additional blocks, or if you are interested in helping with the project, head over to the <a href="https://github.com/WordPress/gutenberg">GitHub repository</a>.</em></p>` );
		expect( postContent ).toMatch( new RegExp( `<figure class=\\"wp-block-embed-vimeo wp-block-embed is-type-video is-provider-vimeo wp-embed-aspect-16-9 wp-has-aspect-ratio\\"><div class=\\"wp-block-embed__wrapper\\">\\s*https://vimeo.com/22439234\\s*</div></figure>` ) );
	} );
} );
