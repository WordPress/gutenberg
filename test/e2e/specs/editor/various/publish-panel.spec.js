const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Post publish panel', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should move focus back to the Publish panel toggle button when canceling', async ( {
		editor,
		page,
	} ) => {
		// Add a paragraph block.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Dummy text' },
		} );

		// Find and click the Publish panel toggle button.
		const publishPanelToggleButton = page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Publish', exact: true } );
		await publishPanelToggleButton.click();

		// Click the Cancel button.
		const cancelButton = page
			.getByRole( 'region', { name: 'Editor publish' } )
			.getByRole( 'button', { name: 'Cancel' } );
		await expect( cancelButton ).toBeEnabled();
		await cancelButton.click();

		// Wait for the close transition before checking focus return.
		await expect( publishPanelToggleButton ).toHaveAttribute(
			'aria-expanded',
			'false'
		);

		await expect( publishPanelToggleButton ).toBeFocused();
	} );

	test( 'should move focus back to the Publish panel toggle button after publishing and closing the panel', async ( {
		editor,
		page,
	} ) => {
		// Insert a paragraph block.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Dummy text' },
		} );

		await editor.publishPost();

		// Close the publish panel.
		await page
			.getByRole( 'region', { name: 'Editor publish' } )
			.getByRole( 'button', { name: 'Close panel' } )
			.click();

		// Test focus is moved back to the Publish panel toggle button.
		await expect(
			page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Save' } )
		).toBeFocused();
	} );

	test( 'should move focus to the cancel button in the panel', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Test Post' );
		await page
			.getByRole( 'region', 'Editor top bar' )
			.getByRole( 'button', { name: 'Publish', exact: true } )
			.click();

		await expect(
			page
				.getByRole( 'region', { name: 'Editor publish' } )
				.locator( ':focus' )
		).toHaveText( 'Cancel' );
	} );

	test( 'should focus on the post list after publishing', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Test Post' );
		await editor.publishPost();

		await expect(
			page
				.getByRole( 'region', { name: 'Editor publish' } )
				.locator( ':focus' )
		).toContainText( 'Test Post' );
	} );

	test( 'should retain focus within the panel', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Test Post' );
		await page
			.getByRole( 'region', 'Editor top bar' )
			.getByRole( 'button', { name: 'Publish', exact: true } )
			.click();
		await pageUtils.pressKeys( 'shift+Tab' );

		await expect(
			page.getByRole( 'checkbox', {
				name: 'Always show pre-publish checks.',
			} )
		).toBeFocused();
	} );

	test( 'should auto-collapse the publish panel after publishing when the user makes an edit', async ( {
		editor,
		page,
	} ) => {
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Test Post' );
		await editor.publishPost();

		const prePublishChecksToggle = page.getByRole( 'checkbox', {
			name: 'Always show pre-publish checks.',
		} );
		await expect( prePublishChecksToggle ).toBeVisible();

		// Make an edit after publishing.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Edit after publish' },
		} );

		await expect( prePublishChecksToggle ).toBeHidden();
	} );

	test.describe( 'scheduled post message', () => {
		// Relative labels like "Tomorrow" only show when the browser and site
		// timezones match.
		test.use( { timezoneId: 'UTC' } );

		let originalTimezone;

		test.beforeAll( async ( { requestUtils } ) => {
			originalTimezone = ( await requestUtils.getSiteSettings() )
				.timezone;
			await requestUtils.updateSiteSettings( { timezone: 'UTC' } );
			// Published posts show up as events in the calendar day labels.
			await requestUtils.deleteAllPosts();
		} );

		test.beforeEach( async ( { editor, page, pageUtils } ) => {
			await editor.canvas
				.getByRole( 'textbox', { name: 'Add title' } )
				.fill( 'Scheduled Post' );
			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Publish', exact: true } )
				.click();
			await page
				.getByRole( 'region', { name: 'Editor publish' } )
				.getByRole( 'button', {
					name: 'Publish: Immediately',
					exact: true,
				} )
				.click();

			// Set the time to 10:00 am.
			await page.keyboard.press( 'Tab' );
			await pageUtils.pressKeys( 'primary+a' );
			await page.keyboard.type( '10' );
			await page.keyboard.press( 'Tab' );
			await pageUtils.pressKeys( 'primary+a' );
			await page.keyboard.type( '00' );
			await page.keyboard.press( 'Tab' );
			await page.keyboard.press( 'ArrowLeft' );
			await expect(
				page.getByRole( 'radio', { name: 'AM', exact: true } )
			).toBeChecked();
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.updateSiteSettings( {
				timezone: originalTimezone,
			} );
		} );

		test( 'reads as one sentence for a post scheduled tomorrow', async ( {
			page,
			pageUtils,
		} ) => {
			const dateLabel = ( date ) =>
				date.toLocaleDateString( 'en-US', {
					month: 'long',
					day: 'numeric',
					year: 'numeric',
					timeZone: 'UTC',
				} );
			const today = new Date();
			const tomorrow = new Date( today );
			tomorrow.setUTCDate( today.getUTCDate() + 1 );

			// Move from the date fields to today in the calendar, then pick
			// the next day.
			await pageUtils.pressKeys( 'Tab', { times: 6 } );
			await expect(
				page.getByRole( 'button', {
					name: `${ dateLabel( today ) }. Selected. Today`,
					exact: true,
				} )
			).toBeFocused();
			await page.keyboard.press( 'ArrowRight' );
			await page.keyboard.press( 'Enter' );

			const publishPanel = page.getByRole( 'region', {
				name: 'Editor publish',
			} );
			await expect(
				publishPanel.getByRole( 'button', {
					name: 'Publish: Tomorrow at 10:00\xa0am',
					exact: true,
				} )
			).toBeVisible();
			await publishPanel
				.getByRole( 'button', { name: 'Schedule', exact: true } )
				.click();

			await expect(
				publishPanel
					.getByRole( 'link', {
						name: 'Scheduled Post (opens in a new tab)',
						exact: true,
					} )
					.locator( '..' )
			).toHaveText(
				`Scheduled Post↗ is now scheduled. It will go live on ${ dateLabel(
					tomorrow
				) } 10:00\xa0am UTC.`
			);
		} );

		test( 'reads as one sentence for a post scheduled next year', async ( {
			page,
			pageUtils,
		} ) => {
			const nextYear = new Date().getUTCFullYear() + 1;

			// Type March 15 of next year in the date fields.
			await page.keyboard.press( 'Tab' );
			await pageUtils.pressKeys( 'primary+a' );
			await page.keyboard.type( '15' );
			await page.keyboard.press( 'Tab' );
			await page.keyboard.type( 'March' );
			await page.keyboard.press( 'Tab' );
			await pageUtils.pressKeys( 'primary+a' );
			await page.keyboard.type( `${ nextYear }` );
			await page.keyboard.press( 'Tab' );

			const publishPanel = page.getByRole( 'region', {
				name: 'Editor publish',
			} );
			await expect(
				publishPanel.getByRole( 'button', {
					name: `Publish: March 15, ${ nextYear } 10:00\xa0am`,
					exact: true,
				} )
			).toBeVisible();
			await publishPanel
				.getByRole( 'button', { name: 'Schedule', exact: true } )
				.click();

			await expect(
				publishPanel
					.getByRole( 'link', {
						name: 'Scheduled Post (opens in a new tab)',
						exact: true,
					} )
					.locator( '..' )
			).toHaveText(
				`Scheduled Post↗ is now scheduled. It will go live on March 15, ${ nextYear } 10:00\xa0am UTC.`
			);
		} );
	} );
} );
