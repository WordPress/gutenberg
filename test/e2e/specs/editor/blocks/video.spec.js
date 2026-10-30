const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Video', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'keeps focus in the text tracks popover while editing a track', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/video',
			attributes: {
				src: 'https://example.com/video.mp4',
				tracks: [
					{
						src: 'https://example.com/english.vtt',
						label: 'English',
						kind: 'subtitles',
						srcLang: 'en',
					},
				],
			},
		} );
		const textTracksButton = page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Text tracks' } );
		const editButton = page.getByRole( 'button', { name: 'Edit English' } );
		const labelField = page.getByRole( 'textbox', { name: 'Label' } );
		await textTracksButton.focus();
		await page.keyboard.press( 'Enter' );
		await expect( editButton ).toBeVisible();

		// Escape only closes the popover if focus stayed in it.
		await editButton.focus();
		await page.keyboard.press( 'Enter' );
		await expect( labelField ).toBeVisible();
		await page.keyboard.press( 'Escape' );
		await expect( labelField ).toBeHidden();
		await expect( textTracksButton ).toBeFocused();

		await page.keyboard.press( 'Enter' );
		await editButton.focus();
		await page.keyboard.press( 'Enter' );
		await page
			.getByRole( 'button', { name: 'Apply', exact: true } )
			.focus();
		await page.keyboard.press( 'Enter' );
		await expect( editButton ).toBeVisible();
		await page.keyboard.press( 'Escape' );
		await expect( editButton ).toBeHidden();
		await expect( textTracksButton ).toBeFocused();
	} );
} );
