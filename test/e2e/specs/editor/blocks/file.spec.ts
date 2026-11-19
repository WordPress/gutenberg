import {
	test,
	expect,
	type Editor,
	type RequestUtils,
} from '@wordpress/e2e-test-utils-playwright';

const filePath = './assets/playlist-e2e-test.wav';

async function insertFileBlock( editor: Editor, requestUtils: RequestUtils ) {
	const media = await requestUtils.uploadMedia( filePath );
	const attributes = {
		id: media.id,
		href: media.source_url,
		textLinkHref: media.source_url,
		fileName: 'Original file',
	};
	await editor.insertBlock( { name: 'core/file', attributes } );
	return attributes;
}

test.describe( 'File', () => {
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

	test( 'keeps the file when a replacement upload fails, and Reset still removes it', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		const attributes = await insertFileBlock( editor, requestUtils );

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
		await page
			.getByRole( 'menu' )
			.getByTestId( 'form-file-upload-input' )
			.setInputFiles( filePath );
		await expect(
			page
				.getByTestId( 'snackbar' )
				.filter( { hasText: 'Simulated upload failure.' } )
		).toBeVisible();

		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [ { name: 'core/file', attributes } ] );

		await editor.clickBlockToolbarButton( 'Replace' );
		await page.getByRole( 'menuitem', { name: 'Reset' } ).click();
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/file',
				attributes: {
					id: undefined,
					href: undefined,
					textLinkHref: undefined,
					fileName: undefined,
				},
			},
		] );
	} );

	test( 'keeps the file when the replacement file type is not allowed', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		const attributes = await insertFileBlock( editor, requestUtils );

		await editor.clickBlockToolbarButton( 'Replace' );
		await page
			.getByRole( 'menu' )
			.getByTestId( 'form-file-upload-input' )
			.setInputFiles( {
				name: 'program.exe',
				mimeType: 'application/x-msdownload',
				buffer: Buffer.from( 'x' ),
			} );
		await expect(
			page
				.getByTestId( 'snackbar' )
				.filter( { hasText: 'not allowed to upload this file type' } )
		).toBeVisible();

		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [ { name: 'core/file', attributes } ] );
	} );
} );
