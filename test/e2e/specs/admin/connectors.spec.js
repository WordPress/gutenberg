/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const SETTINGS_PAGE_PATH = 'options-general.php';
const CONNECTORS_PAGE_QUERY = 'page=connectors-wp-admin';

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

	test.describe( 'Connectors page', () => {
		test.beforeEach( async ( { admin } ) => {
			await admin.visitAdminPage(
				SETTINGS_PAGE_PATH,
				CONNECTORS_PAGE_QUERY
			);
		} );

		test( 'should display default providers with install buttons', async ( {
			page,
		} ) => {
			// Verify the page title is visible.
			await expect(
				page.getByRole( 'heading', { name: 'Connectors' } )
			).toBeVisible();

			// Verify each connector card allows installing the plugin.
			const openaiCard = page.locator(
				'.connector-item--ai-provider-for-openai'
			);
			await expect( openaiCard ).toBeVisible();
			await expect(
				openaiCard.getByText( 'OpenAI', { exact: true } )
			).toBeVisible();
			await expect(
				openaiCard.getByText(
					'Text, image, and code generation with GPT and DALL-E.'
				)
			).toBeVisible();
			await expect(
				openaiCard.getByRole( 'button', { name: 'Install' } )
			).toBeVisible();

			const claudeCard = page.locator(
				'.connector-item--ai-provider-for-anthropic'
			);
			await expect( claudeCard ).toBeVisible();
			await expect(
				claudeCard.getByText( 'Claude', { exact: true } )
			).toBeVisible();
			await expect(
				claudeCard.getByText(
					'Writing, research, and analysis with Claude.'
				)
			).toBeVisible();
			await expect(
				claudeCard.getByRole( 'button', { name: 'Install' } )
			).toBeVisible();

			const geminiCard = page.locator(
				'.connector-item--ai-provider-for-google'
			);
			await expect( geminiCard ).toBeVisible();
			await expect(
				geminiCard.getByText( 'Gemini', { exact: true } )
			).toBeVisible();
			await expect(
				geminiCard.getByText(
					"Content generation, translation, and vision with Google's Gemini."
				)
			).toBeVisible();
			await expect(
				geminiCard.getByRole( 'button', { name: 'Install' } )
			).toBeVisible();

			// Verify the plugin directory search link is present.
			await expect(
				page.getByRole( 'link', {
					name: 'the plugin directory',
				} )
			).toHaveAttribute( 'href', 'plugin-install.php' );
		} );
	} );
} );
