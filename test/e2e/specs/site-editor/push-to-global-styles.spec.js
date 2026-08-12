const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Push to Global Styles button', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	/**
	 * Returns the modal row (a listbox option) for a style label. Clicking the
	 * row toggles its selection, shown by `aria-selected`.
	 *
	 * @param {Object} modal Playwright locator for the review modal.
	 * @param {string} label Style label, e.g. 'Letter case'.
	 *
	 * @return {Object} Playwright locator for the matching row.
	 */
	function styleRow( modal, label ) {
		return modal.getByRole( 'option' ).filter( { hasText: label } );
	}

	/**
	 * Adds a Heading block, opens its Advanced panel and turns on Letter case
	 * so there's a change to push.
	 *
	 * @param {Object} options        Playwright fixtures.
	 * @param {Object} options.page   Playwright page.
	 * @param {Object} options.editor Editor utilities.
	 */
	async function setupHeadingWithUppercase( { page, editor } ) {
		// Add a Heading block.
		await editor.insertBlock( { name: 'core/heading' } );
		await page.keyboard.type( 'A heading' );

		// Go to block settings and open the Advanced panel.
		await editor.openDocumentSettingsSidebar();
		await page.getByRole( 'button', { name: 'Advanced' } ).click();

		// Push button should be disabled with no changes.
		await expect(
			page.getByRole( 'button', { name: 'Apply globally' } )
		).toBeDisabled();

		// Enable letter case.
		const typographyOptions = page.getByRole( 'button', {
			name: 'Typography options',
		} );
		await typographyOptions.click();
		await page
			.getByRole( 'menuitemcheckbox', { name: 'Letter case' } )
			.click();
		await typographyOptions.click();

		// Make the Heading block uppercase.
		await page.getByRole( 'button', { name: 'Uppercase' } ).click();

		// Push button should now be enabled.
		await expect(
			page.getByRole( 'button', { name: 'Apply globally' } )
		).toBeEnabled();
	}

	test( 'should apply Heading block styles to all Heading blocks', async ( {
		page,
		editor,
	} ) => {
		const settingsPanel = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		await setupHeadingWithUppercase( { page, editor } );

		// Open the review modal.
		await page.getByRole( 'button', { name: 'Apply globally' } ).click();

		// The modal should be titled after the block and show the lead text.
		const modal = page.getByRole( 'dialog', {
			name: 'Apply Heading styles globally',
		} );
		await expect( modal ).toBeVisible();
		await expect(
			modal.getByText(
				'Choose which styles to make default for all Heading blocks.'
			)
		).toBeVisible();

		// The Letter case row is listed and selected by default.
		const letterCase = styleRow( modal, 'Letter case' );
		await expect( letterCase ).toBeVisible();
		await expect( letterCase ).toHaveAttribute( 'aria-selected', 'true' );

		// Confirm the push.
		await modal
			.getByRole( 'button', { name: 'Apply', exact: true } )
			.click();
		await expect( modal ).toBeHidden();

		// Snackbar notification should appear.
		await expect(
			page.getByRole( 'button', {
				name: 'Dismiss this notice',
				text: 'Heading styles applied.',
			} )
		).toBeVisible();

		// Push button should be disabled again.
		await expect(
			page.getByRole( 'button', { name: 'Apply globally' } )
		).toBeDisabled();

		// Navigate to Styles -> Blocks -> Heading -> Typography.
		await page
			.getByRole( 'button', { name: 'Styles', exact: true } )
			.click();
		await page.getByRole( 'button', { name: 'Blocks' } ).click();
		await settingsPanel
			.getByRole( 'button', { name: 'Heading', exact: true } )
			.click();

		// Headings should now have uppercase.
		await expect(
			page.getByRole( 'button', { name: 'Uppercase' } )
		).toHaveAttribute( 'aria-pressed', 'true' );
	} );

	test( 'should push only the selected subset of styles', async ( {
		page,
		editor,
	} ) => {
		await setupHeadingWithUppercase( { page, editor } );

		// Enable and set a letter spacing so there is a second pushable change.
		const typographyOptions = page.getByRole( 'button', {
			name: 'Typography options',
		} );
		await typographyOptions.click();
		await page
			.getByRole( 'menuitemcheckbox', { name: 'Letter spacing' } )
			.click();
		await typographyOptions.click();
		await page
			.getByRole( 'spinbutton', { name: 'Letter spacing' } )
			.fill( '2' );

		// Open the modal; both styles should be listed.
		await page.getByRole( 'button', { name: 'Apply globally' } ).click();
		const modal = page.getByRole( 'dialog', {
			name: 'Apply Heading styles globally',
		} );
		await expect( styleRow( modal, 'Letter case' ) ).toBeVisible();
		await expect( styleRow( modal, 'Letter spacing' ) ).toBeVisible();

		// Deselect Letter case so only Letter spacing is pushed.
		const letterCase = styleRow( modal, 'Letter case' );
		await letterCase.click();
		await expect( letterCase ).toHaveAttribute( 'aria-selected', 'false' );
		await modal
			.getByRole( 'button', { name: 'Apply', exact: true } )
			.click();
		await expect( modal ).toBeHidden();

		// Snackbar notification should appear for the pushed subset.
		await expect(
			page.getByRole( 'button', {
				name: 'Dismiss this notice',
				text: 'Heading styles applied.',
			} )
		).toBeVisible();

		// Letter case is still only set on the block, so there's a change to push.
		await expect(
			page.getByRole( 'button', { name: 'Apply globally' } )
		).toBeEnabled();

		// Reopening the modal should now list only the unpushed Letter case.
		await page.getByRole( 'button', { name: 'Apply globally' } ).click();
		await expect( styleRow( modal, 'Letter case' ) ).toBeVisible();
		await expect( styleRow( modal, 'Letter spacing' ) ).toBeHidden();
		await modal.getByRole( 'button', { name: 'Close' } ).click();
	} );

	test( 'should disable Apply when no styles are selected', async ( {
		page,
		editor,
	} ) => {
		await setupHeadingWithUppercase( { page, editor } );

		await page.getByRole( 'button', { name: 'Apply globally' } ).click();
		const modal = page.getByRole( 'dialog', {
			name: 'Apply Heading styles globally',
		} );

		// Deselect the only row; Apply becomes disabled.
		const letterCase = styleRow( modal, 'Letter case' );
		await letterCase.click();
		await expect( letterCase ).toHaveAttribute( 'aria-selected', 'false' );
		await expect(
			modal.getByRole( 'button', { name: 'Apply', exact: true } )
		).toBeDisabled();

		// Closing the modal makes no changes.
		await modal.getByRole( 'button', { name: 'Close' } ).click();
		await expect( modal ).toBeHidden();
		await expect(
			page.getByRole( 'button', {
				name: 'Dismiss this notice',
				text: 'Heading styles applied.',
			} )
		).toBeHidden();

		// The change is still pending because nothing was pushed.
		await expect(
			page.getByRole( 'button', { name: 'Apply globally' } )
		).toBeEnabled();
	} );

	test( 'should make no changes when the modal is dismissed', async ( {
		page,
		editor,
	} ) => {
		await setupHeadingWithUppercase( { page, editor } );

		await page.getByRole( 'button', { name: 'Apply globally' } ).click();
		const modal = page.getByRole( 'dialog', {
			name: 'Apply Heading styles globally',
		} );
		await expect( modal ).toBeVisible();

		// Dismiss without applying.
		await modal.getByRole( 'button', { name: 'Close' } ).click();
		await expect( modal ).toBeHidden();

		// No snackbar, and the change remains pending.
		await expect(
			page.getByRole( 'button', {
				name: 'Dismiss this notice',
				text: 'Heading styles applied.',
			} )
		).toBeHidden();
		await expect(
			page.getByRole( 'button', { name: 'Apply globally' } )
		).toBeEnabled();
	} );
} );
