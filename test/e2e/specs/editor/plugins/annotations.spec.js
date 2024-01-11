/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/** @typedef {import('@playwright/test').Page} Page */

test.use( {
	annotations: async ( { page, editor }, use ) => {
		await use( new AnnotationsUtils( { page, editor } ) );
	},
} );

test.describe( 'Annotations', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-plugin-plugins-api'
		);
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-plugin-plugins-api'
		);
	} );

	test( 'allows a block to be annotated', async ( {
		editor,
		page,
		annotations,
	} ) => {
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Title' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Paragraph to annotate' );

		await annotations.openAnnotationsSidebar();
		await annotations.annotateFirstBlock( 9, 13 );

		const block = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		const blockAnnotation = block.locator( '.annotation-text-e2e-tests' );

		await expect( blockAnnotation ).toBeVisible();
		await expect( blockAnnotation ).toHaveText( ' to ' );

		await editor.clickBlockOptionsMenuItem( 'Edit as HTML' );

		// There should be no <mark> tags in the raw content.
		await expect(
			block.locator( '.block-editor-block-list__block-html-textarea' )
		).toHaveValue( '<p>Paragraph to annotate</p>' );
	} );

	test( 'keeps the cursor in the same location when applying annotation', async ( {
		editor,
		page,
		annotations,
	} ) => {
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Title' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'ABC' );

		await annotations.openAnnotationsSidebar();
		await annotations.annotateFirstBlock( 1, 2 );

		// The selection should still be at the end, so test that by typing:
		await page.keyboard.type( 'D' );
		await annotations.removeAnnotations();

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'ABCD' },
			},
		] );
	} );

	test( 'moves when typing before it', async ( {
		editor,
		page,
		pageUtils,
		annotations,
	} ) => {
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Title' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'ABC' );

		await annotations.openAnnotationsSidebar();
		await annotations.annotateFirstBlock( 1, 2 );

		// Requires pressing `ArrowLeft` four times to exit the annotation boundary.
		await pageUtils.pressKeys( 'ArrowLeft', { times: 4 } );

		// Put an 1 after the A, it should not be annotated.
		await page.keyboard.type( '1' );

		await expect(
			editor.canvas
				.getByRole( 'document', {
					name: 'Block: Paragraph',
				} )
				.locator( '.annotation-text-e2e-tests' )
		).toHaveText( 'B' );

		await annotations.removeAnnotations();
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'A1BC' },
			},
		] );
	} );

	test( 'grows when typing inside it', async ( {
		editor,
		page,
		pageUtils,
		annotations,
	} ) => {
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Title' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'ABC' );

		await annotations.openAnnotationsSidebar();
		await annotations.annotateFirstBlock( 1, 2 );

		// Pressing `ArrowLeft` two times enter annotation boundary.
		await pageUtils.pressKeys( 'ArrowLeft', { times: 2 } );

		// Put an 2 before the B, it should be annotated.
		await page.keyboard.type( '2' );

		await expect(
			editor.canvas
				.getByRole( 'document', {
					name: 'Block: Paragraph',
				} )
				.locator( '.annotation-text-e2e-tests' )
		).toHaveText( 'B2' );

		await annotations.removeAnnotations();
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'AB2C' },
			},
		] );
	} );
} );

class AnnotationsUtils {
	constructor( { page, editor } ) {
		/** @type {Page} */
		this.page = page;
		this.editor = editor;
	}

	async openAnnotationsSidebar() {
		await this.page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Annotations' } )
			.click();
	}

	async annotateFirstBlock( start, end ) {
		const editorSettings = this.page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		await editorSettings
			.locator( '#annotations-tests-range-start' )
			.fill( `${ start }` );
		await editorSettings
			.locator( '#annotations-tests-range-end' )
			.fill( `${ end }` );
		await editorSettings
			.getByRole( 'button', { name: 'Add annotation' } )
			.click();

		// Return focus to the first block.
		await this.editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.focus();
	}

	async removeAnnotations() {
		await this.page
			.getByRole( 'region', {
				name: 'Editor settings',
			} )
			.getByRole( 'button', { name: 'Remove annotations' } )
			.click();

		// Return focus to the first block.
		await this.editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.focus();
	}
}
