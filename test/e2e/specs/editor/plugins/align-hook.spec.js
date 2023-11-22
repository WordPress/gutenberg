/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const alignLabels = {
	none: 'None',
	left: 'Align left',
	center: 'Align center',
	right: 'Align right',
	wide: 'Wide width',
	full: 'Full width',
};

test.describe( 'Align Hook Works as Expected', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-align-hook' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( 'gutenberg-test-align-hook' );
	} );

	test.describe( 'Block with no alignment set', () => {
		test( 'shows no alignment buttons on the alignment toolbar', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( { name: 'test/test-no-alignment-set' } );
			await editor.showBlockToolbar();

			await expect(
				page
					.getByRole( 'toolbar', { name: 'Block tools' } )
					.getByRole( 'button', { name: 'Align', exact: true } )
			).toBeHidden();
		} );

		test( 'does not save any alignment related attribute or class', async ( {
			editor,
		} ) => {
			await editor.insertBlock( { name: 'test/test-no-alignment-set' } );

			await expect
				.poll( editor.getEditedPostContent )
				.not.toContain( '"align":' );
		} );
	} );

	test.describe( 'Block with align true', () => {
		test( 'shows the expected buttons on the alignment toolbar', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( { name: 'test/test-align-true' } );
			await editor.clickBlockToolbarButton( 'Align' );

			await expect(
				page
					.getByRole( 'menu', { name: 'Align' } )
					.getByRole( 'menuitemradio' )
			).toHaveText( Object.values( alignLabels ) );
		} );

		test( 'applies none alignment by default', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( { name: 'test/test-align-true' } );
			await editor.clickBlockToolbarButton( 'Align' );

			await expect(
				page
					.getByRole( 'menu', { name: 'Align' } )
					.getByRole( 'menuitemradio', { name: 'None' } )
			).toHaveAttribute( 'aria-checked', 'true' );
		} );

		test( 'correctly applies the selected alignment and correctly removes the alignment', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( { name: 'test/test-align-true' } );
			await editor.clickBlockToolbarButton( 'Align' );

			const dropdown = page.getByRole( 'menu', {
				name: 'Align',
			} );

			await dropdown
				.getByRole( 'menuitemradio', { name: 'Align right' } )
				.click();

			// Verify the button of the specified alignment is pressed.
			await editor.clickBlockToolbarButton( 'Align' );
			await expect(
				dropdown.getByRole( 'menuitemradio', { name: 'Align right' } )
			).toHaveAttribute( 'aria-checked', 'true' );

			// Verify the markup of the selected alignment was generated.
			let markup = await editor.getEditedPostContent();
			expect( markup ).toContain( 'alignright' );

			let blocks = await page.evaluate(
				( [ content ] ) => {
					return window.wp.blocks.parse( content );
				},
				[ markup ]
			);
			expect( blocks ).toMatchObject( [
				{
					name: 'test/test-align-true',
					isValid: true,
				},
			] );

			// Remove the alignment. Dropdown should be open.
			await dropdown
				.getByRole( 'menuitemradio', { name: 'Align right' } )
				.click();

			// Verify 'none' alignment button is in pressed state.
			await editor.clickBlockToolbarButton( 'Align' );
			await expect(
				dropdown.getByRole( 'menuitemradio', { name: 'None' } )
			).toHaveAttribute( 'aria-checked', 'true' );

			// Verify alignment markup was removed from the block.
			markup = await editor.getEditedPostContent();
			expect( markup ).not.toContain( 'alignright' );

			blocks = await page.evaluate(
				( [ content ] ) => {
					return window.wp.blocks.parse( content );
				},
				[ markup ]
			);
			expect( blocks ).toMatchObject( [
				{
					name: 'test/test-align-true',
					isValid: true,
				},
			] );
		} );
	} );

	test.describe( 'Block with align array', () => {
		test( 'shows the expected buttons on the alignment toolbar', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( { name: 'test/test-align-array' } );
			await editor.clickBlockToolbarButton( 'Align' );

			await expect(
				page
					.getByRole( 'menu', { name: 'Align' } )
					.getByRole( 'menuitemradio' )
			).toHaveText( [
				alignLabels.none,
				alignLabels.left,
				alignLabels.center,
			] );
		} );

		test( 'applies none alignment by default', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( { name: 'test/test-align-array' } );
			await editor.clickBlockToolbarButton( 'Align' );

			await expect(
				page
					.getByRole( 'menu', { name: 'Align' } )
					.getByRole( 'menuitemradio', { name: 'None' } )
			).toHaveAttribute( 'aria-checked', 'true' );
		} );

		test( 'correctly applies the selected alignment and correctly removes the alignment', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( { name: 'test/test-align-array' } );
			await editor.clickBlockToolbarButton( 'Align' );

			const block = page.getByRole( 'document', {
				name: 'Block: Test Align Array ',
			} );
			const dropdown = page.getByRole( 'menu', {
				name: 'Align',
			} );

			await dropdown
				.getByRole( 'menuitemradio', { name: 'Center' } )
				.click();

			// Verify the button of the specified alignment is pressed.
			await editor.clickBlockToolbarButton( 'Align' );
			await expect(
				dropdown.getByRole( 'menuitemradio', { name: 'Center' } )
			).toHaveAttribute( 'aria-checked', 'true' );

			// Verify the markup of the selected alignment was generated.
			await expect( block ).toHaveAttribute( 'data-align', 'center' );

			// Remove the alignment. Dropdown should be open.
			await dropdown
				.getByRole( 'menuitemradio', { name: 'Center' } )
				.click();

			// Verify 'none' alignment button is in pressed state.
			await editor.clickBlockToolbarButton( 'Align' );
			await expect(
				dropdown.getByRole( 'menuitemradio', { name: 'None' } )
			).toHaveAttribute( 'aria-checked', 'true' );

			// Verify alignment markup was removed from the block.
			await expect( block ).not.toHaveAttribute( 'data-align' );
		} );
	} );

	test.describe( 'Block with default align', () => {
		test( 'shows the expected buttons on the alignment toolbar', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( { name: 'test/test-default-align' } );
			await editor.clickBlockToolbarButton( 'Align' );

			await expect(
				page
					.getByRole( 'menu', { name: 'Align' } )
					.getByRole( 'menuitemradio' )
			).toHaveText( Object.values( alignLabels ) );
		} );

		test( 'applies the selected alignment by default', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( { name: 'test/test-default-align' } );
			await editor.clickBlockToolbarButton( 'Align' );

			await expect(
				page
					.getByRole( 'menu', { name: 'Align' } )
					.getByRole( 'menuitemradio', { name: 'Align right' } )
			).toHaveAttribute( 'aria-checked', 'true' );
		} );

		test( 'the default markup does not contain the alignment attribute but contains the alignment class', async ( {
			editor,
		} ) => {
			await editor.insertBlock( { name: 'test/test-default-align' } );

			const markup = await editor.getEditedPostContent();
			expect( markup ).toContain( 'alignright' );
			expect( markup ).not.toContain( '"align":"right"' );
		} );

		test( 'can remove the default alignment and the align attribute equals none but alignnone class is not applied', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( { name: 'test/test-default-align' } );
			await editor.clickBlockToolbarButton( 'Align' );

			// Remove the alignment.
			await page
				.getByRole( 'menu', { name: 'Align' } )
				.getByRole( 'menuitemradio', { name: 'Align right' } )
				.click();

			const markup = await editor.getEditedPostContent();
			expect( markup ).not.toContain( 'alignnone' );
			expect( markup ).toContain( '"align":""' );
		} );

		test( 'correctly applies the selected alignment and correctly removes the alignment', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( { name: 'test/test-default-align' } );
			await editor.clickBlockToolbarButton( 'Align' );

			const block = page.getByRole( 'document', {
				name: 'Block: Test Default Align ',
			} );
			const dropdown = page.getByRole( 'menu', {
				name: 'Align',
			} );

			await dropdown
				.getByRole( 'menuitemradio', { name: 'Align center' } )
				.click();

			// Verify the button of the specified alignment is pressed.
			await editor.clickBlockToolbarButton( 'Align' );
			await expect(
				dropdown.getByRole( 'menuitemradio', { name: 'Align center' } )
			).toHaveAttribute( 'aria-checked', 'true' );

			// Verify the markup of the selected alignment was generated.
			await expect( block ).toHaveAttribute( 'data-align', 'center' );

			// Remove the alignment. Dropdown should be open.
			await dropdown
				.getByRole( 'menuitemradio', { name: 'Align center' } )
				.click();

			// Verify 'none' alignment button is in pressed state.
			await editor.clickBlockToolbarButton( 'Align' );
			await expect(
				dropdown.getByRole( 'menuitemradio', { name: 'None' } )
			).toHaveAttribute( 'aria-checked', 'true' );

			// Verify alignment markup was removed from the block.
			await expect( block ).not.toHaveAttribute( 'data-align' );
		} );
	} );
} );
