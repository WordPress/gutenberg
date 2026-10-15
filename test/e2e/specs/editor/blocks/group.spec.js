const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Group', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'can be created using the block inserter', async ( {
		editor,
		page,
	} ) => {
		// Search for the group block and insert it.
		const inserterButton = page.locator(
			'role=button[name="Block Inserter"i]'
		);

		await inserterButton.click();

		await page.getByRole( 'searchbox', { name: 'Search' } ).type( 'Group' );

		await page
			.getByRole( 'listbox', { name: 'Blocks' } )
			.getByRole( 'option', { name: 'Group' } )
			.click();

		// Select the default, selected Group layout from the variation picker.
		await editor.canvas
			.locator(
				'role=button[name="Group: Gather blocks in a container."i]'
			)
			.click();

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'can be created using the slash inserter', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '/group' );
		await expect(
			page.locator( 'role=option[name="Group"i][selected]' )
		).toBeVisible();
		await page.keyboard.press( 'Enter' );

		// Select the default, selected Group layout from the variation picker.
		await editor.canvas
			.locator(
				'role=button[name="Group: Gather blocks in a container."i]'
			)
			.click();

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'can have other blocks appended to it using the button appender', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/group' } );
		await editor.canvas
			.locator(
				'button[aria-label="Group: Gather blocks in a container."]'
			)
			.click();
		await editor.canvas.locator( 'role=button[name="Add block"i]' ).click();
		await page
			.getByRole( 'listbox', { name: 'Blocks' } )
			.getByRole( 'option', { name: 'Paragraph' } )
			.click();
		await page.keyboard.type( 'Group Block with a Paragraph' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'is selected with Backspace instead of merged into', async ( {
		editor,
		page,
	} ) => {
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '1' );
		await editor.transformBlockTo( 'core/group' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '2' );

		const expectedBlocks = [
			{
				name: 'core/group',
				innerBlocks: [
					{ name: 'core/paragraph', attributes: { content: '1' } },
				],
			},
			{ name: 'core/paragraph', attributes: { content: '2' } },
		];

		await expect.poll( editor.getBlocks ).toMatchObject( expectedBlocks );

		// The group is a hard boundary: Backspace at the start of the
		// following paragraph selects it and merges nothing.
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.press( 'Backspace' );

		await expect
			.poll( () =>
				page.evaluate( () => {
					const { getSelectedBlockClientId, getBlockName } =
						window.wp.data.select( 'core/block-editor' );
					return getBlockName( getSelectedBlockClientId() );
				} )
			)
			.toBe( 'core/group' );
		await expect.poll( editor.getBlocks ).toMatchObject( expectedBlocks );
	} );

	test.describe( 'Layout', () => {
		// The Layout panel is only shown for themes that support layout.
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( 'emptytheme' );
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( 'twentytwentyone' );
		} );

		test( 'resets the content width toggle to the variation default', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( { name: 'core/group' } );
			// The default Group variation uses a constrained layout.
			await editor.canvas
				.getByRole( 'button', {
					name: 'Group: Gather blocks in a container.',
				} )
				.click();
			await editor.openDocumentSettingsSidebar();

			const settings = page.getByRole( 'region', {
				name: 'Editor settings',
			} );
			const contentWidthToggle = settings.getByRole( 'checkbox', {
				name: 'Inner blocks use content width',
			} );
			const layoutOptions = settings.getByRole( 'button', {
				name: 'Layout options',
			} );
			const expectedLayout = [
				{
					name: 'core/group',
					attributes: { layout: { type: 'constrained' } },
				},
			];

			await test.step( 'the variation default is not reported as a change', async () => {
				await expect( contentWidthToggle ).toBeChecked();
				await layoutOptions.click();
				await expect(
					page.getByRole( 'menuitem', { name: 'Reset all' } )
				).toHaveAttribute( 'aria-disabled', 'true' );
				await expect(
					page.getByRole( 'menuitemcheckbox', {
						name: 'Use content width',
					} )
				).toHaveAttribute( 'aria-disabled', 'true' );
				await page.keyboard.press( 'Escape' );
			} );

			await test.step( 'Reset all restores the content width', async () => {
				await contentWidthToggle.click();
				await expect( contentWidthToggle ).not.toBeChecked();

				await layoutOptions.click();
				await page
					.getByRole( 'menuitem', { name: 'Reset all' } )
					.click();

				await expect( contentWidthToggle ).toBeChecked();
				await expect
					.poll( editor.getBlocks )
					.toMatchObject( expectedLayout );
			} );

			await test.step( 'resetting the control restores the content width', async () => {
				await contentWidthToggle.click();
				await expect( contentWidthToggle ).not.toBeChecked();

				await layoutOptions.click();
				await page
					.getByRole( 'menuitem', {
						name: 'Use content width, reset to default',
					} )
					.click();

				await expect( contentWidthToggle ).toBeChecked();
				await expect
					.poll( editor.getBlocks )
					.toMatchObject( expectedLayout );
			} );
		} );
	} );
} );
