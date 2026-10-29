const fs = require( 'fs/promises' );
const os = require( 'os' );
const path = require( 'path' );
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// A one-page PDF, small enough to write out before the tests upload it.
const PDF_CONTENT = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >> endobj
trailer << /Root 1 0 R >>
%%EOF
`;

test.use( {
	fileBlockUtils: async ( { page, editor }, use ) => {
		await use( new FileBlockUtils( { page, editor } ) );
	},
} );

test.describe( 'File', () => {
	let tmpDirectory;
	let uploadedPdf;

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
		tmpDirectory = await fs.mkdtemp(
			path.join( os.tmpdir(), 'gutenberg-test-file-' )
		);
		const pdfPath = path.join( tmpDirectory, 'e2e-test-document.pdf' );
		await fs.writeFile( pdfPath, PDF_CONTENT );
		uploadedPdf = await requestUtils.uploadMedia( pdfPath );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
		await fs.rm( tmpDirectory, { recursive: true, force: true } );
	} );

	test( 'opens on the Content tab, with the inline embed settings on the Settings tab', async ( {
		editor,
		page,
		fileBlockUtils,
	} ) => {
		await fileBlockUtils.insertFileBlock( uploadedPdf, {
			displayPreview: true,
		} );

		// The inline embed is showing on the canvas.
		await expect(
			editor.canvas.getByLabel( 'Embed of the selected PDF file.' )
		).toBeAttached();

		const sidebar = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await expect(
			sidebar.getByRole( 'tab', { name: 'Content' } )
		).toHaveAttribute( 'aria-selected', 'true' );

		const content = sidebar.getByRole( 'tabpanel', { name: 'Content' } );
		await expect(
			content.getByRole( 'heading', { name: 'Media' } )
		).toBeVisible();
		await expect(
			content.getByRole( 'button', { name: /e2e-test-document.*\.pdf/ } )
		).toBeVisible();
		await expect(
			content.getByRole( 'textbox', { name: 'File name' } )
		).toHaveValue( 'e2e-test-document' );
		await expect(
			content.getByRole( 'combobox', { name: 'Link to' } )
		).toBeVisible();
		await expect(
			content.getByRole( 'checkbox', { name: 'Open in new tab' } )
		).toBeVisible();
		await expect(
			content.getByRole( 'checkbox', { name: 'Show download button' } )
		).toBeChecked();
		await expect(
			content.getByRole( 'textbox', { name: 'Download button text' } )
		).toHaveValue( 'Download' );
		await expect(
			content.getByRole( 'checkbox', { name: 'Show inline embed' } )
		).toBeHidden();

		await sidebar.getByRole( 'tab', { name: 'Settings' } ).click();
		await expect(
			sidebar
				.getByRole( 'tabpanel', { name: 'Settings' } )
				.getByRole( 'checkbox', { name: 'Show inline embed' } )
		).toBeChecked();

		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [
				{ name: 'core/file', attributes: { displayPreview: true } },
			] );
	} );

	test( 'changes the link from the Content tab', async ( {
		editor,
		fileBlockUtils,
	} ) => {
		await fileBlockUtils.insertFileBlock( uploadedPdf );
		const content = fileBlockUtils.getContentPanel();

		// The attachment page link comes from the attachment record, so wait
		// for the option to be offered before choosing it.
		const linkTo = content.getByRole( 'combobox', { name: 'Link to' } );
		await expect(
			linkTo.getByRole( 'option', { name: 'Attachment page' } )
		).toBeAttached();
		await linkTo.selectOption( { label: 'Attachment page' } );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/file',
				attributes: { textLinkHref: uploadedPdf.link },
			},
		] );

		await linkTo.selectOption( { label: 'Media file' } );
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/file',
				attributes: { textLinkHref: uploadedPdf.source_url },
			},
		] );

		const newTab = content.getByRole( 'checkbox', {
			name: 'Open in new tab',
		} );
		await newTab.check();
		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [
				{ name: 'core/file', attributes: { textLinkTarget: '_blank' } },
			] );
		await expect
			.poll( editor.getEditedPostContent )
			.toContain( 'target="_blank" rel="noreferrer noopener"' );

		await newTab.uncheck();
		await expect
			.poll( editor.getEditedPostContent )
			.not.toContain( 'target=' );
		await expect(
			content.getByRole( 'link', { name: 'View' } )
		).toHaveAttribute( 'href', uploadedPdf.source_url );
	} );

	test( 'edits the file name and download button text from the Content tab', async ( {
		editor,
		fileBlockUtils,
	} ) => {
		await fileBlockUtils.insertFileBlock( uploadedPdf );
		const content = fileBlockUtils.getContentPanel();

		await content
			.getByRole( 'textbox', { name: 'File name' } )
			.fill( 'Annual <report> & notes' );
		await content
			.getByRole( 'textbox', { name: 'Download button text' } )
			.fill( 'Get the report' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/file',
				attributes: {
					fileName: 'Annual &lt;report> &amp; notes',
					downloadButtonText: 'Get the report',
				},
			},
		] );

		const fileBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: File',
		} );
		await expect( fileBlock.getByRole( 'textbox' ).first() ).toHaveText(
			'Annual <report> & notes'
		);
		await expect(
			fileBlock.getByRole( 'textbox', { name: 'Download button text' } )
		).toHaveText( 'Get the report' );

		await content
			.getByRole( 'checkbox', { name: 'Show download button' } )
			.uncheck();
		await expect(
			content.getByRole( 'textbox', { name: 'Download button text' } )
		).toBeHidden();
		await expect(
			fileBlock.getByRole( 'textbox', { name: 'Download button text' } )
		).toBeHidden();
	} );

	test( 'replaces the file from the Media control', async ( {
		editor,
		page,
		fileBlockUtils,
	} ) => {
		await fileBlockUtils.insertFileBlock( uploadedPdf );
		const content = fileBlockUtils.getContentPanel();

		await content
			.getByRole( 'button', { name: /e2e-test-document.*\.pdf/ } )
			.click();
		await page
			.getByTestId( 'form-file-upload-input' )
			.setInputFiles( './assets/playlist-e2e-test.wav' );

		await expect
			.poll( async () => {
				const [ block ] = await editor.getBlocks();
				return block.attributes;
			} )
			.toMatchObject( {
				href: expect.stringMatching( /playlist-e2e-test.*\.wav$/ ),
				textLinkHref: expect.stringMatching(
					/playlist-e2e-test.*\.wav$/
				),
				id: expect.any( Number ),
			} );
		const [ block ] = await editor.getBlocks();
		expect( block.attributes.id ).not.toBe( uploadedPdf.id );
		// A file that is not a PDF has no inline embed.
		expect( block.attributes.displayPreview ).toBeUndefined();
	} );
} );

class FileBlockUtils {
	constructor( { page, editor } ) {
		this.page = page;
		this.editor = editor;
	}

	async insertFileBlock( media, attributes = {} ) {
		await this.editor.insertBlock( {
			name: 'core/file',
			attributes: {
				id: media.id,
				href: media.source_url,
				fileName: media.title.rendered,
				textLinkHref: media.source_url,
				showDownloadButton: true,
				downloadButtonText: 'Download',
				...attributes,
			},
		} );
		await this.editor.openDocumentSettingsSidebar();
	}

	getContentPanel() {
		return this.page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'tabpanel', { name: 'Content' } );
	}
}
