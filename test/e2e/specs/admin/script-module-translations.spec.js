const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Script module translations', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-script-module-translations'
		);
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.visitAdminPage(
			'tools.php',
			'page=gutenberg-test-script-module-translations'
		);
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-script-module-translations'
		);
	} );

	test( 'translates a script module that the page enqueues', async ( {
		page,
	} ) => {
		await expect(
			page.getByText(
				'This string comes from an enqueued script module. (translated)',
				{ exact: true }
			)
		).toBeVisible();
	} );

	test( 'translates a script module that a classic script imports', async ( {
		page,
	} ) => {
		await expect(
			page.getByText(
				'This string comes from a script module that a classic script imports. (translated)',
				{ exact: true }
			)
		).toBeVisible();
	} );
} );
