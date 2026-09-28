const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Typography style and weight controls', () => {
	test.beforeEach( async ( { admin, editor } ) => {
		await admin.createNewPost();
		// The tests read the block inspector, and the sidebar's visibility is
		// a persisted user preference, so a preceding test that closed it
		// would otherwise leave these tests without an inspector.
		await editor.openDocumentSettingsSidebar();
	} );

	/**
	 * Inserts a paragraph carrying the given typography styles and opens the
	 * Typography options menu, which is what makes Style and Weight visible.
	 *
	 * @param {Object} editor     The editor fixture.
	 * @param {Object} page       The page fixture.
	 * @param {string} content    The paragraph's text.
	 * @param {Object} typography The `style.typography` to give it.
	 */
	async function insertStyledParagraph( editor, page, content, typography ) {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content, style: { typography } },
		} );
		await page
			.getByRole( 'button', { name: 'Typography options' } )
			.click();
	}

	test( 'should read a weight and a style back as their own controls', async ( {
		editor,
		page,
	} ) => {
		// One value each, in two controls, where Appearance was one control
		// over the cross product of both.
		await insertStyledParagraph( editor, page, 'Regular', {
			fontWeight: '400',
			fontStyle: 'normal',
		} );
		await expect(
			page.getByRole( 'combobox', { name: 'Weight' } )
		).toHaveText( 'Regular' );
		await expect(
			page.getByRole( 'combobox', { name: 'Style' } )
		).toHaveText( 'Normal' );

		await insertStyledParagraph( editor, page, 'Extra Light Italic', {
			fontWeight: '200',
			fontStyle: 'italic',
		} );
		await expect(
			page.getByRole( 'combobox', { name: 'Weight' } )
		).toHaveText( 'Extra Light' );
		await expect(
			page.getByRole( 'combobox', { name: 'Style' } )
		).toHaveText( 'Italic' );

		await insertStyledParagraph( editor, page, 'Bold Italic', {
			fontWeight: '700',
			fontStyle: 'italic',
		} );
		await expect(
			page.getByRole( 'combobox', { name: 'Weight' } )
		).toHaveText( 'Bold' );
		await expect(
			page.getByRole( 'combobox', { name: 'Style' } )
		).toHaveText( 'Italic' );
	} );

	test( 'should offer the styles a font with no declared faces may have', async ( {
		editor,
		page,
	} ) => {
		// Style lists what the family's faces declare. This theme registers no
		// faces, so nothing has been declared, and leaving italic out would
		// take it away on the word of a font that never spoke.
		await insertStyledParagraph( editor, page, 'Styles', {} );
		await page
			.getByRole( 'menuitemcheckbox', { name: 'Show Style' } )
			.click();
		await page.getByRole( 'combobox', { name: 'Style' } ).click();
		await expect( page.getByRole( 'option' ) ).toHaveText( [
			'Default',
			'Normal',
			'Italic',
		] );
	} );

	test( 'should show Default for a weight and a style that are not valid', async ( {
		editor,
		page,
	} ) => {
		await insertStyledParagraph( editor, page, 'Default', {
			fontWeight: '',
			fontStyle: 'invalid-style',
		} );
		await page
			.getByRole( 'menuitemcheckbox', { name: 'Show Weight' } )
			.click();
		await expect(
			page.getByRole( 'combobox', { name: 'Weight' } )
		).toHaveText( 'Default' );
		await expect(
			page.getByRole( 'combobox', { name: 'Style' } )
		).toHaveText( 'Default' );
	} );

	test( 'should not offer a width for a font that declares none', async ( {
		editor,
		page,
	} ) => {
		// Width is the one axis a browser will not stand in for, so a family
		// with no widths has nothing to offer and the control is not there to
		// be added.
		await insertStyledParagraph( editor, page, 'Width', {} );
		await expect(
			page.getByRole( 'menuitemcheckbox', { name: 'Width' } )
		).toHaveCount( 0 );
	} );
} );
