const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Video', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-plugin-disable-client-side-media-processing'
		);
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-plugin-disable-client-side-media-processing'
		);
	} );

	test( 'preserves Preload values through keyboard selection, reset, and reload @webkit @firefox', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/video',
			attributes: { src: 'https://example.com/video.mp4' },
		} );
		await editor.openDocumentSettingsSidebar();
		const preload = page.getByRole( 'combobox', { name: 'Preload' } );
		await expect( preload ).toHaveText( 'Metadata' );

		const choices = [
			{ value: 'auto', label: 'Auto' },
			{ value: 'metadata', label: 'Metadata' },
			{ value: 'none', label: 'None' },
		];
		for ( const [ index, { value } ] of choices.entries() ) {
			await preload.focus();
			await page.keyboard.press( 'Enter' );
			await expect( page.getByRole( 'listbox' ) ).toBeVisible();
			await expect(
				page.getByRole( 'option', {
					name: choices[ index - 1 ]?.label ?? 'Metadata',
					exact: true,
				} )
			).toBeFocused();
			await page.keyboard.press( 'Home' );
			await expect(
				page.getByRole( 'option', { name: 'Auto', exact: true } )
			).toBeFocused();
			for ( let step = 0; step < index; step++ ) {
				await page.keyboard.press( 'ArrowDown' );
				await expect(
					page.getByRole( 'option', {
						name: choices[ step + 1 ].label,
						exact: true,
					} )
				).toBeFocused();
			}
			await page.keyboard.press( 'Enter' );
			await expect( page.getByRole( 'listbox' ) ).toBeHidden();
			await expect( preload ).toBeFocused();
			await expect
				.poll( editor.getBlocks )
				.toMatchObject( [ { attributes: { preload: value } } ] );
		}

		await preload.press( 'Enter' );
		await expect(
			page.getByRole( 'option', { name: 'None', exact: true } )
		).toBeFocused();
		await page.keyboard.press( 'Home' );
		await expect(
			page.getByRole( 'option', { name: 'Auto', exact: true } )
		).toBeFocused();
		await page.keyboard.press( 'Escape' );
		await expect( preload ).toBeFocused();
		await expect( preload ).toHaveText( 'None' );
		await editor.saveDraft();
		await page.reload();
		await editor.selectBlocks(
			editor.canvas.getByRole( 'document', { name: 'Block: Video' } )
		);
		await expect( preload ).toHaveText( 'None' );
		await page
			.getByRole( 'button', { name: 'Settings options', exact: true } )
			.click();
		await page.getByRole( 'menuitem', { name: 'Reset all' } ).click();
		await expect( preload ).toHaveText( 'Metadata' );
		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [ { attributes: { preload: 'metadata' } } ] );
	} );

	test( 'keeps track edits pending until Apply while Kind supports selection, Escape, and focus return inside the dropdown @webkit @firefox', async ( {
		editor,
		page,
	} ) => {
		const track = {
			id: 123,
			src: 'https://example.com/subtitles.vtt',
			label: 'English subtitles',
			srcLang: 'en',
			kind: 'subtitles',
			default: false,
		};
		await editor.insertBlock( {
			name: 'core/video',
			attributes: {
				src: 'https://example.com/video.mp4',
				tracks: [ track ],
			},
		} );
		await editor.clickBlockToolbarButton( 'Text tracks' );
		await page
			.getByRole( 'button', { name: 'Edit English subtitles' } )
			.click();
		const kind = page.getByRole( 'combobox', {
			name: 'Kind',
			exact: true,
		} );
		const apply = page.getByRole( 'button', {
			name: 'Apply',
			exact: true,
		} );
		await expect( kind ).toHaveText( 'Subtitles' );
		await kind.focus();
		await page.keyboard.press( 'Enter' );
		await expect( page.getByRole( 'listbox' ) ).toBeVisible();
		await expect(
			page.getByRole( 'option', { name: 'Subtitles', exact: true } )
		).toBeFocused();
		await page.keyboard.press( 'ArrowDown' );
		await expect(
			page.getByRole( 'option', { name: 'Captions', exact: true } )
		).toBeFocused();
		await page.keyboard.press( 'Enter' );
		await expect( kind ).toHaveText( 'Captions' );
		await expect( kind ).toBeFocused();
		await expect( apply ).toBeVisible();

		await kind.press( 'Enter' );
		await expect(
			page.getByRole( 'option', { name: 'Captions', exact: true } )
		).toBeFocused();
		await page.keyboard.press( 'ArrowDown' );
		await expect(
			page.getByRole( 'option', { name: 'Descriptions', exact: true } )
		).toBeFocused();
		await page.keyboard.press( 'Escape' );
		await expect( page.getByRole( 'listbox' ) ).toBeHidden();
		await expect( kind ).toBeFocused();
		await expect( kind ).toHaveText( 'Captions' );
		await expect( apply ).toBeVisible();

		// Pointer selection in the portaled popup must also keep the editor open.
		for ( const label of [ 'Descriptions', 'Chapters', 'Metadata' ] ) {
			await kind.click();
			await page
				.getByRole( 'option', { name: label, exact: true } )
				.click();
			await expect( kind ).toHaveText( label );
			await expect( apply ).toBeVisible();
		}
		await page
			.getByRole( 'textbox', { name: 'Label', exact: true } )
			.fill( 'French metadata' );
		await page
			.getByRole( 'textbox', { name: 'Source language' } )
			.fill( 'fr' );
		await page
			.getByRole( 'checkbox', { name: 'Set as default track' } )
			.check();
		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [ { attributes: { tracks: [ track ] } } ] );
		await apply.click();
		const editedTrack = {
			...track,
			label: 'French metadata',
			srcLang: 'fr',
			kind: 'metadata',
			default: true,
		};
		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [ { attributes: { tracks: [ editedTrack ] } } ] );
		await page
			.getByRole( 'button', { name: 'Edit French metadata' } )
			.click();
		await expect( kind ).toHaveText( 'Metadata' );
		await kind.press( 'Enter' );
		await expect(
			page.getByRole( 'option', { name: 'Metadata', exact: true } )
		).toBeFocused();
		await page.keyboard.press( 'Home' );
		await expect(
			page.getByRole( 'option', { name: 'Subtitles', exact: true } )
		).toBeFocused();
		await page.keyboard.press( 'Enter' );
		await expect( kind ).toHaveText( 'Subtitles' );
		await kind.press( 'Escape' );
		await expect( apply ).toBeHidden();
		await expect(
			page.getByRole( 'button', { name: 'Text tracks', exact: true } )
		).toBeFocused();
		await editor.saveDraft();
		await page.reload();
		await editor.selectBlocks(
			editor.canvas.getByRole( 'document', { name: 'Block: Video' } )
		);
		await editor.clickBlockToolbarButton( 'Text tracks' );
		await page
			.getByRole( 'button', { name: 'Edit French metadata' } )
			.click();
		await expect( kind ).toHaveText( 'Metadata' );
		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [ { attributes: { tracks: [ editedTrack ] } } ] );
		await page.getByRole( 'button', { name: 'Remove track' } ).click();
		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [ { attributes: { tracks: [] } } ] );
	} );

	test( 'keeps the video when a replacement upload fails, and Reset still removes it', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		const poster = await requestUtils.uploadMedia(
			'./assets/10x10_e2e_test_image_z9T8jK.png'
		);
		const src = 'https://example.com/e2e-test-video.mp4';
		await editor.insertBlock( {
			name: 'core/video',
			attributes: {
				src,
				poster: poster.source_url,
				caption: 'Original caption',
			},
		} );

		// Make the replacement upload fail on the server.
		await page.route( '**/wp/v2/media**', async ( route ) => {
			if ( route.request().method() !== 'POST' ) {
				return route.continue();
			}
			await route.fulfill( {
				status: 500,
				contentType: 'application/json',
				body: JSON.stringify( {
					code: 'simulated_failure',
					message: 'Simulated upload failure.',
				} ),
			} );
		} );

		await editor.clickBlockToolbarButton( 'Replace' );
		// The upload fails before the server reads the file, so its content
		// does not matter.
		await page
			.getByRole( 'menu' )
			.getByTestId( 'form-file-upload-input' )
			.setInputFiles( {
				name: 'e2e-test-video.mp4',
				mimeType: 'video/mp4',
				buffer: Buffer.from( 'video' ),
			} );
		await expect(
			page
				.getByTestId( 'snackbar' )
				.filter( { hasText: 'Simulated upload failure.' } )
		).toBeVisible();

		// The failed upload leaves the current video, poster and caption.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/video',
				attributes: {
					src,
					poster: poster.source_url,
					caption: 'Original caption',
				},
			},
		] );

		// Reset still removes the video.
		await editor.clickBlockToolbarButton( 'Replace' );
		await page.getByRole( 'menuitem', { name: 'Reset' } ).click();
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/video',
				attributes: {
					src: undefined,
					poster: undefined,
					caption: undefined,
				},
			},
		] );
	} );
} );
