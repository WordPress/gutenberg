/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Relocated color controls with block style states', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'stores relocated text and background colors under the selected viewport state', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/group' } );
		await editor.openDocumentSettingsSidebar();

		const settings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		await page.getByRole( 'button', { name: 'View', exact: true } ).click();
		await page
			.getByRole( 'menuitemcheckbox', { name: 'Responsive editing' } )
			.click();
		await page.getByRole( 'menuitemradio', { name: 'Mobile' } ).click();
		await page.keyboard.press( 'Escape' );

		// Text color now lives in the Typography panel.
		await settings
			.locator( '.components-tools-panel' )
			.filter( {
				has: page.getByRole( 'heading', { name: 'Typography' } ),
			} )
			.getByRole( 'button', { name: 'Color', exact: true } )
			.click();
		await page.getByRole( 'option', { name: 'Vivid red' } ).click();

		// Background color now lives in the Background panel.
		await settings
			.locator( '.components-tools-panel' )
			.filter( {
				has: page.getByRole( 'heading', { name: 'Background' } ),
			} )
			.getByRole( 'button', { name: 'Color', exact: true } )
			.click();
		await page.getByRole( 'option', { name: 'Vivid cyan blue' } ).click();

		const [ block ] = await editor.getBlocks();

		// Values are stored inline under the selected state slice...
		expect( block.attributes.style?.[ '@mobile' ]?.color?.text ).toBe(
			'var:preset|color|vivid-red'
		);
		expect( block.attributes.style?.[ '@mobile' ]?.color?.background ).toBe(
			'var:preset|color|vivid-cyan-blue'
		);

		// ...and the default state is untouched (no bleed across contexts).
		expect( block.attributes.style?.color ).toBeUndefined();

		// State values stay in `style`; they are not hoisted to the
		// textColor/backgroundColor attributes the way the default state is.
		expect( block.attributes.textColor ).toBeUndefined();
		expect( block.attributes.backgroundColor ).toBeUndefined();
	} );

	test( 'stores relocated element colors under the selected viewport state', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/group' } );
		await editor.openDocumentSettingsSidebar();

		const settings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		// Switch the block's editing context to the Mobile viewport state.
		await page.getByRole( 'button', { name: 'View', exact: true } ).click();
		await page
			.getByRole( 'menuitemcheckbox', { name: 'Responsive editing' } )
			.click();
		await page.getByRole( 'menuitemradio', { name: 'Mobile' } ).click();
		await page.keyboard.press( 'Escape' );

		const elementsPanel = settings
			.locator( '.components-tools-panel' )
			.filter( {
				has: page.getByRole( 'heading', { name: 'Elements' } ),
			} );

		// The Link element control is hidden by default; enable it via the
		// Elements panel options menu.
		await elementsPanel
			.getByRole( 'button', { name: 'Elements options' } )
			.click();
		await page
			.getByRole( 'menuitemcheckbox', { name: 'Show Link' } )
			.click();
		await elementsPanel
			.getByRole( 'button', { name: 'Elements options' } )
			.click();

		// Set the link color while the Mobile state is selected.
		await elementsPanel
			.getByRole( 'button', { name: 'Link', exact: true } )
			.click();
		await page.getByRole( 'option', { name: 'Vivid red' } ).click();

		const [ block ] = await editor.getBlocks();

		// The element color is stored under the selected state slice...
		expect(
			block.attributes.style?.[ '@mobile' ]?.elements?.link?.color?.text
		).toBe( 'var:preset|color|vivid-red' );

		// ...and the default state's elements are untouched.
		expect( block.attributes.style?.elements ).toBeUndefined();
	} );

	test( 'reset all in a viewport state clears only that viewport state colors', async ( {
		editor,
		page,
	} ) => {
		// The default state has a text color; the Mobile state has its own
		// text and background colors.
		await editor.insertBlock( {
			name: 'core/group',
			attributes: {
				style: {
					color: { text: 'var:preset|color|vivid-red' },
					'@mobile': {
						color: {
							text: 'var:preset|color|vivid-cyan-blue',
							background: 'var:preset|color|vivid-red',
						},
					},
				},
			},
		} );
		await editor.openDocumentSettingsSidebar();

		const settings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		await page.getByRole( 'button', { name: 'View', exact: true } ).click();
		await page
			.getByRole( 'menuitemcheckbox', { name: 'Responsive editing' } )
			.click();
		await page.getByRole( 'menuitemradio', { name: 'Mobile' } ).click();
		await page.keyboard.press( 'Escape' );

		// Reset all of the Background panel while the Mobile state is selected.
		await settings
			.locator( '.components-tools-panel' )
			.filter( {
				has: page.getByRole( 'heading', { name: 'Background' } ),
			} )
			.getByRole( 'button', { name: 'Background options' } )
			.click();
		await page.getByRole( 'menuitem', { name: 'Reset all' } ).click();

		const [ block ] = await editor.getBlocks();

		// Only the Mobile background color is cleared.
		expect(
			block.attributes.style?.[ '@mobile' ]?.color?.background
		).toBeUndefined();
		// The Mobile text color (owned by a different panel) is preserved.
		expect( block.attributes.style?.[ '@mobile' ]?.color?.text ).toBe(
			'var:preset|color|vivid-cyan-blue'
		);
		// The default-state text color is preserved.
		expect( block.attributes.style?.color?.text ).toBe(
			'var:preset|color|vivid-red'
		);
	} );
} );
