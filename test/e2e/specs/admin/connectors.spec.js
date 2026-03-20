/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const SETTINGS_PAGE_PATH = 'options-general.php';
const CONNECTORS_PAGE_QUERY = 'page=options-connectors-wp-admin';

const CONNECTORS = [
	{
		slug: 'ai-provider-for-openai',
		name: 'OpenAI',
		description: 'Text and image generation with GPT and Dall-E.',
	},
	{
		slug: 'ai-provider-for-anthropic',
		name: 'Anthropic',
		description: 'Text generation with Claude.',
	},
	{
		slug: 'ai-provider-for-google',
		name: 'Google',
		description: 'Text and image generation with Gemini and Imagen.',
	},
];

const TEST_PROVIDER_NAME = 'Test Provider';
const TEST_PROVIDER_DESCRIPTION = 'A test AI provider for E2E testing.';

const getConnectorCardByName = ( page, name ) =>
	page
		.locator( '.components-item' )
		.filter( {
			has: page.getByRole( 'heading', { name, level: 2 } ),
		} )
		.first();

test.describe( 'Connectors', () => {
	test( 'should show a Connectors link in the Settings menu', async ( {
		page,
		admin,
	} ) => {
		await admin.visitAdminPage( SETTINGS_PAGE_PATH );

		const settingsMenu = page.locator( '#menu-settings' );
		const connectorsLink = settingsMenu.getByRole( 'link', {
			name: 'Connectors',
		} );
		await expect( connectorsLink ).toBeVisible();
		await expect( connectorsLink ).toHaveAttribute(
			'href',
			`${ SETTINGS_PAGE_PATH }?${ CONNECTORS_PAGE_QUERY }`
		);
	} );

	test( 'should display default providers with install buttons', async ( {
		page,
		admin,
	} ) => {
		await admin.visitAdminPage( SETTINGS_PAGE_PATH, CONNECTORS_PAGE_QUERY );

		// Verify the page title is an h1 heading.
		const pageTitle = page.getByRole( 'heading', {
			name: 'Connectors',
			level: 1,
		} );
		await expect( pageTitle ).toBeVisible();

		// Verify each connector card shows name as heading, description, and Install button.
		for ( const { slug, name, description } of CONNECTORS ) {
			const card = page.locator( `.connector-item--${ slug }` );
			await expect( card ).toBeVisible();

			// Connector name should be an h2 heading.
			const heading = card.getByRole( 'heading', { name, level: 2 } );
			await expect( heading ).toBeVisible();
			await expect( card.getByText( description ) ).toBeVisible();

			// Connector should be wrapped in a group with the heading as label.
			const group = card.getByRole( 'group' );
			await expect( group ).toBeVisible();
			const headingId = await heading.getAttribute( 'id' );
			expect( headingId ).toBeTruthy();
			await expect( group ).toHaveAttribute(
				'aria-labelledby',
				headingId
			);

			const button = card.getByRole( 'button', { name: 'Install' } );
			await expect( button ).toBeVisible();
			// Install button should not have aria-expanded.
			await expect( button ).not.toHaveAttribute( 'aria-expanded' );
		}

		// Verify the plugin directory search link is present.
		await expect(
			page.getByRole( 'link', {
				name: 'search the plugin directory',
			} )
		).toHaveAttribute(
			'href',
			'plugin-install.php?s=connector&tab=search&type=tag'
		);
	} );

	test.describe( 'Test provider setup flow', () => {
		const PLUGIN_SLUG = 'gutenberg-test-connectors-provider';
		const VALID_API_KEY = 'test-api-key-123';

		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activatePlugin( PLUGIN_SLUG );
		} );

		test.afterEach( async ( { requestUtils } ) => {
			await requestUtils.rest( {
				path: '/wp/v2/settings',
				method: 'POST',
				data: {
					connectors_ai_test_provider_api_key: '',
				},
			} );
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.deactivatePlugin( PLUGIN_SLUG );
		} );

		test( 'should display the test provider with a "Set up" button', async ( {
			page,
			admin,
		} ) => {
			await admin.visitAdminPage(
				SETTINGS_PAGE_PATH,
				CONNECTORS_PAGE_QUERY
			);

			const testProviderCard = getConnectorCardByName(
				page,
				TEST_PROVIDER_NAME
			);
			await expect( testProviderCard ).toBeVisible();
			await expect(
				testProviderCard.getByText( TEST_PROVIDER_DESCRIPTION )
			).toBeVisible();

			// The test provider has no plugin dependency so it should show "Set up".
			await expect(
				testProviderCard.getByRole( 'button', { name: 'Set up' } )
			).toBeVisible();
		} );

		test( 'should expand the API key form when clicking "Set up"', async ( {
			page,
			admin,
		} ) => {
			await admin.visitAdminPage(
				SETTINGS_PAGE_PATH,
				CONNECTORS_PAGE_QUERY
			);

			const testProviderCard = getConnectorCardByName(
				page,
				TEST_PROVIDER_NAME
			);
			const setupButton = testProviderCard.getByRole( 'button', {
				name: 'Set up',
			} );
			await setupButton.click();

			// The form should now be visible with an API Key field and Save button.
			await expect(
				testProviderCard.getByPlaceholder( 'Enter your API key' )
			).toBeVisible();
			await expect(
				testProviderCard.getByRole( 'button', { name: 'Save' } )
			).toBeVisible();

			// The button label should change to "Cancel".
			await expect(
				testProviderCard.getByRole( 'button', { name: 'Cancel' } )
			).toBeVisible();
		} );

		test( 'should reject an invalid API key', async ( { page, admin } ) => {
			await admin.visitAdminPage(
				SETTINGS_PAGE_PATH,
				CONNECTORS_PAGE_QUERY
			);

			const testProviderCard = getConnectorCardByName(
				page,
				TEST_PROVIDER_NAME
			);
			await testProviderCard
				.getByRole( 'button', { name: 'Set up' } )
				.click();

			const apiKeyInput =
				testProviderCard.getByPlaceholder( 'Enter your API key' );
			await apiKeyInput.fill( 'wrong-key' );
			await testProviderCard
				.getByRole( 'button', { name: 'Save' } )
				.click();

			// Should show an error message with role="alert" for screen readers.
			const errorAlert = testProviderCard.getByRole( 'alert' );
			await expect( errorAlert ).toBeVisible();
			await expect( errorAlert ).toContainText(
				'It was not possible to connect'
			);
		} );

		test( 'should accept a valid API key and show "Connected"', async ( {
			page,
			admin,
		} ) => {
			await admin.visitAdminPage(
				SETTINGS_PAGE_PATH,
				CONNECTORS_PAGE_QUERY
			);

			const testProviderCard = getConnectorCardByName(
				page,
				TEST_PROVIDER_NAME
			);
			await testProviderCard
				.getByRole( 'button', { name: 'Set up' } )
				.click();

			const apiKeyInput =
				testProviderCard.getByPlaceholder( 'Enter your API key' );
			await apiKeyInput.fill( VALID_API_KEY );
			await testProviderCard
				.getByRole( 'button', { name: 'Save' } )
				.click();

			// The form should close and show the "Connected" badge.
			await expect(
				testProviderCard.getByText( 'Connected', { exact: true } )
			).toBeVisible();

			// The button should now show "Edit" instead of "Set up".
			const editButton = testProviderCard.getByRole( 'button', {
				name: 'Edit',
			} );
			await expect( editButton ).toBeVisible();

			// Focus should be on the Edit button after save.
			await expect( editButton ).toBeFocused();
		} );

		test( 'should keep focus on the action button when toggling "Set up" / "Cancel"', async ( {
			page,
			admin,
		} ) => {
			await admin.visitAdminPage(
				SETTINGS_PAGE_PATH,
				CONNECTORS_PAGE_QUERY
			);

			const testProviderCard = getConnectorCardByName(
				page,
				TEST_PROVIDER_NAME
			);

			// Focus the "Set up" button and activate with keyboard.
			const setupButton = testProviderCard.getByRole( 'button', {
				name: 'Set up',
			} );
			await setupButton.focus();
			await page.keyboard.press( 'Enter' );

			// Focus should remain on the button, now labeled "Cancel".
			const cancelButton = testProviderCard.getByRole( 'button', {
				name: 'Cancel',
			} );
			await expect( cancelButton ).toBeFocused();

			// Press Enter again to collapse.
			await page.keyboard.press( 'Enter' );

			// Focus should remain on the button, now labeled "Set up" again.
			const setupButtonAgain = testProviderCard.getByRole( 'button', {
				name: 'Set up',
			} );
			await expect( setupButtonAgain ).toBeFocused();
		} );

		test( 'should complete the full setup flow using only the keyboard', async ( {
			page,
			admin,
		} ) => {
			await admin.visitAdminPage(
				SETTINGS_PAGE_PATH,
				CONNECTORS_PAGE_QUERY
			);

			const testProviderCard = getConnectorCardByName(
				page,
				TEST_PROVIDER_NAME
			);

			// Focus and activate the "Set up" button with keyboard.
			const setupButton = testProviderCard.getByRole( 'button', {
				name: 'Set up',
			} );
			await setupButton.focus();
			await page.keyboard.press( 'Enter' );

			// Tab into the API key input.
			await page.keyboard.press( 'Tab' );
			await expect(
				testProviderCard.getByPlaceholder( 'Enter your API key' )
			).toBeFocused();

			// Type a valid API key.
			await page.keyboard.type( VALID_API_KEY );

			// Tab to the Save button.
			await page.keyboard.press( 'Tab' );
			await expect(
				testProviderCard.getByRole( 'button', { name: 'Save' } )
			).toBeFocused();

			// Press Enter to save.
			await page.keyboard.press( 'Enter' );

			// Wait for the connected state.
			await expect(
				testProviderCard.getByText( 'Connected', { exact: true } )
			).toBeVisible();

			// Focus should be on the "Edit" button.
			await expect(
				testProviderCard.getByRole( 'button', { name: 'Edit' } )
			).toBeFocused();
		} );

		test( 'should keep focus in the form after a failed save', async ( {
			page,
			admin,
		} ) => {
			await admin.visitAdminPage(
				SETTINGS_PAGE_PATH,
				CONNECTORS_PAGE_QUERY
			);

			const testProviderCard = getConnectorCardByName(
				page,
				TEST_PROVIDER_NAME
			);
			await testProviderCard
				.getByRole( 'button', { name: 'Set up' } )
				.click();

			const apiKeyInput =
				testProviderCard.getByPlaceholder( 'Enter your API key' );
			await apiKeyInput.fill( 'wrong-key' );
			await testProviderCard
				.getByRole( 'button', { name: 'Save' } )
				.click();

			// Error alert should be visible.
			await expect( testProviderCard.getByRole( 'alert' ) ).toBeVisible();

			// The panel should still be expanded (Cancel button visible).
			await expect(
				testProviderCard.getByRole( 'button', { name: 'Cancel' } )
			).toBeVisible();

			// Focus should NOT be on the action button — the form stays
			// open so the user can correct their key.
			await expect(
				testProviderCard.getByRole( 'button', { name: 'Cancel' } )
			).not.toBeFocused();
		} );
	} );

	test( 'should display the AI plugin callout banner with install button', async ( {
		page,
		admin,
	} ) => {
		await admin.visitAdminPage( SETTINGS_PAGE_PATH, CONNECTORS_PAGE_QUERY );

		const banner = page.locator( '.ai-plugin-callout' );
		await expect( banner ).toBeVisible();

		// Verify the banner message mentions the AI plugin.
		await expect( banner.getByText( 'AI plugin' ) ).toBeVisible();

		// Verify the Install button is present.
		await expect(
			banner.getByRole( 'button', { name: 'Install AI Experiments' } )
		).toBeVisible();

		// Verify the Learn more link is present.
		await expect(
			banner.getByRole( 'link', { name: 'Learn more' } )
		).toBeVisible();
	} );

	test.describe( 'Empty state', () => {
		const PLUGIN_SLUG = 'gutenberg-test-connectors-empty-state';

		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activatePlugin( PLUGIN_SLUG );
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.deactivatePlugin( PLUGIN_SLUG );
		} );

		test( 'should display an empty state when no connectors are registered', async ( {
			page,
			admin,
		} ) => {
			await admin.visitAdminPage(
				SETTINGS_PAGE_PATH,
				CONNECTORS_PAGE_QUERY
			);

			// Verify the empty state heading is visible.
			await expect(
				page.getByRole( 'heading', { name: 'No connectors yet' } )
			).toBeVisible();

			// Verify the explanatory description is visible.
			await expect(
				page.getByText(
					'Connectors appear here when you install plugins that use external services.'
				)
			).toBeVisible();

			// Verify the "Learn more" button links to plugin directory.
			const learnMoreButton = page.getByRole( 'link', {
				name: 'Learn more',
			} );
			await expect( learnMoreButton ).toBeVisible();
			await expect( learnMoreButton ).toHaveAttribute(
				'href',
				'plugin-install.php'
			);

			// Verify the AI plugin callout banner is not shown.
			await expect( page.locator( '.ai-plugin-callout' ) ).toBeHidden();

			// Verify none of the default connector cards are shown.
			for ( const { slug } of CONNECTORS ) {
				await expect(
					page.locator( `.connector-item--${ slug }` )
				).toBeHidden();
			}
		} );
	} );

	test.describe( 'Connectors page capability checks', () => {
		const PLUGIN_SLUG = 'gutenberg-test-connectors-capability-restriction';

		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activatePlugin( PLUGIN_SLUG );
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.deactivatePlugin( PLUGIN_SLUG );
		} );

		const capabilities = [
			[ 'no_install', 'user cannot install plugins' ],
			[ 'no_activate', 'user cannot activate plugins' ],
			[
				'no_install_activate',
				'user cannot install or activate plugins',
			],
			[ 'disallow_file_mods', 'DISALLOW_FILE_MODS is active' ],
		];

		capabilities.forEach( ( [ restriction, label ] ) => {
			test( `should show "Not available" when ${ label }`, async ( {
				page,
				admin,
				requestUtils,
			} ) => {
				await requestUtils.rest( {
					path: '/wp/v2/settings',
					method: 'POST',
					data: {
						gutenberg_test_cap_restriction: restriction,
					},
				} );

				await admin.visitAdminPage(
					SETTINGS_PAGE_PATH,
					CONNECTORS_PAGE_QUERY
				);

				// AI plugin callout banner should be hidden when user lacks permissions.
				await expect(
					page.locator( '.ai-plugin-callout' )
				).toBeHidden();

				for ( const { slug } of CONNECTORS ) {
					const card = page.locator( `.connector-item--${ slug }` );
					await expect( card ).toBeVisible();
					await expect(
						card.getByText( 'Not available' )
					).toBeVisible();
					await expect(
						card.getByRole( 'button', { name: 'Install' } )
					).toBeHidden();
				}

				// Plugin directory link should be hidden.
				await expect(
					page.getByRole( 'link', {
						name: 'search the plugin directory',
					} )
				).toBeHidden();
			} );
		} );
	} );

	test.describe( 'JS extensibility', () => {
		const PLUGIN_SLUG = 'gutenberg-test-connectors-js-extensibility';

		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activatePlugin( PLUGIN_SLUG );
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.deactivatePlugin( PLUGIN_SLUG );
		} );

		test( 'should not display a card for a server-only connector without a JS render function', async ( {
			page,
			admin,
		} ) => {
			await admin.visitAdminPage(
				SETTINGS_PAGE_PATH,
				CONNECTORS_PAGE_QUERY
			);

			// The server registers test_server_only_service but no JS
			// registerConnector call provides a render function for it,
			// so no card should appear in the UI.
			await expect(
				page.getByRole( 'heading', {
					name: 'Test Server Only Service',
					level: 2,
				} )
			).toBeHidden();
		} );

		test( 'should display a custom connector registered via JS with merging strategy', async ( {
			page,
			admin,
		} ) => {
			await admin.visitAdminPage(
				SETTINGS_PAGE_PATH,
				CONNECTORS_PAGE_QUERY
			);

			const card = page.locator( '.connector-item--test_custom_service' );
			await expect( card ).toBeVisible();

			// Verify the custom content from the render function is visible.
			await expect(
				card.getByText( 'Custom rendered content for testing.' )
			).toBeVisible();

			// Verify label and description from the server-side PHP registration
			// are merged with the client-side JS render function.
			await expect(
				card.getByRole( 'heading', {
					name: 'Test Custom Service',
					level: 2,
				} )
			).toBeVisible();
			await expect(
				card.getByText( 'A custom service for E2E testing.' )
			).toBeVisible();
		} );
	} );
} );
