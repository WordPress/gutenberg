const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const FILE_URL = 'http://localhost:8889/wp-content/uploads/report.pdf';

test.describe( 'File', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'moves the download button of an existing block into a Button block', async ( {
		editor,
	} ) => {
		await editor.setContent( `<!-- wp:file {"href":"${ FILE_URL }"} -->
<div class="wp-block-file"><a id="wp-block-file--media-1" href="${ FILE_URL }">report</a><a href="${ FILE_URL }" class="wp-block-file__button wp-element-button" download aria-describedby="wp-block-file--media-1">Get the report</a></div>
<!-- /wp:file -->` );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/file',
				isValid: true,
				innerBlocks: [
					{
						name: 'core/buttons',
						innerBlocks: [
							{
								name: 'core/button',
								attributes: {
									url: FILE_URL,
									text: 'Get the report',
									download: true,
								},
							},
						],
					},
				],
			},
		] );
	} );

	test( 'removes and adds the download button with the toggle', async ( {
		editor,
		page,
	} ) => {
		await editor.setContent( `<!-- wp:file {"href":"${ FILE_URL }"} -->
<div class="wp-block-file"><a id="wp-block-file--media-1" href="${ FILE_URL }">report</a><!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="${ FILE_URL }" download>Download</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:file -->` );

		await editor.canvas
			.getByRole( 'document', { name: 'Block: File' } )
			.click();
		await editor.openDocumentSettingsSidebar();
		const toggle = page.getByRole( 'checkbox', {
			name: 'Show download button',
		} );

		await toggle.click();
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/file',
				attributes: { showDownloadButton: false },
				innerBlocks: [],
			},
		] );

		await toggle.click();
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/file',
				attributes: { showDownloadButton: true },
				innerBlocks: [
					{
						name: 'core/buttons',
						innerBlocks: [
							{
								name: 'core/button',
								attributes: {
									url: FILE_URL,
									text: 'Download',
									download: true,
								},
							},
						],
					},
				],
			},
		] );
	} );
} );
