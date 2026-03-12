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

		// Verify the page title is visible.
		await expect(
			page.getByRole( 'heading', { name: 'Connectors' } )
		).toBeVisible();

		// Verify each connector card shows name, description, and Install button.
		for ( const { slug, name, description } of CONNECTORS ) {
			const card = page.locator( `.connector-item--${ slug }` );
			await expect( card ).toBeVisible();
			await expect(
				card.getByText( name, { exact: true } )
			).toBeVisible();
			await expect( card.getByText( description ) ).toBeVisible();
			await expect(
				card.getByRole( 'button', { name: 'Install' } )
			).toBeVisible();
		}

		// Verify the plugin directory search link is present.
		await expect(
			page.getByRole( 'link', {
				name: 'the plugin directory',
			} )
		).toHaveAttribute( 'href', 'plugin-install.php' );
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

			// Verify the test provider card is visible.
			await expect(
				page.getByText( 'Test Provider', { exact: true } )
			).toBeVisible();
			await expect(
				page.getByText( 'A test AI provider for E2E testing.' )
			).toBeVisible();

			// The test provider has no plugin dependency so it should show "Set up".
			await expect(
				page.getByRole( 'button', { name: 'Set up' } )
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

			const setupButton = page.getByRole( 'button', {
				name: 'Set up',
			} );
			await setupButton.click();

			// The form should now be visible with an API Key field and Save button.
			await expect(
				page.getByPlaceholder( 'Enter your API key' )
			).toBeVisible();
			await expect(
				page.getByRole( 'button', { name: 'Save' } )
			).toBeVisible();

			// The button label should change to "Cancel".
			await expect(
				page.getByRole( 'button', { name: 'Cancel' } )
			).toBeVisible();
		} );

		test( 'should reject an invalid API key', async ( { page, admin } ) => {
			await admin.visitAdminPage(
				SETTINGS_PAGE_PATH,
				CONNECTORS_PAGE_QUERY
			);

			await page.getByRole( 'button', { name: 'Set up' } ).click();

			const apiKeyInput = page.getByPlaceholder( 'Enter your API key' );
			await apiKeyInput.fill( 'wrong-key' );
			await page.getByRole( 'button', { name: 'Save' } ).click();

			// Should show an error message.
			await expect(
				page.getByText( 'It was not possible to connect' )
			).toBeVisible();
		} );

		test( 'should accept a valid API key and show "Connected"', async ( {
			page,
			admin,
		} ) => {
			await admin.visitAdminPage(
				SETTINGS_PAGE_PATH,
				CONNECTORS_PAGE_QUERY
			);

			await page.getByRole( 'button', { name: 'Set up' } ).click();

			const apiKeyInput = page.getByPlaceholder( 'Enter your API key' );
			await apiKeyInput.fill( VALID_API_KEY );
			await page.getByRole( 'button', { name: 'Save' } ).click();

			// The form should close and show the "Connected" badge.
			await expect( page.getByText( 'Connected' ) ).toBeVisible();

			// The button should now show "Edit" instead of "Set up".
			await expect(
				page.getByRole( 'button', { name: 'Edit' } )
			).toBeVisible();
		} );
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
						name: 'the plugin directory',
					} )
				).toBeHidden();
			} );
		} );
	} );
} );
