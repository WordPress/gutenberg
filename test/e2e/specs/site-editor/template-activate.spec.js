/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Template Activate', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
		// Enable the template activation feature.
		await requestUtils.setGutenbergExperiments( [ 'active_templates' ] );
	} );
	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
		await requestUtils.activateTheme( 'twentytwentyone' );
		// Disable the template activation experiment.
		await requestUtils.setGutenbergExperiments( [] );
	} );
	test.beforeEach( async ( { admin, requestUtils } ) => {
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await admin.visitSiteEditor( { postType: 'wp_template' } );
	} );

	test( 'should duplicate and activate', async ( {
		page,
		admin,
		editor,
	} ) => {
		// Inside the grid cell, find the button with the text "Actions"
		const index = page.locator(
			'.dataviews-view-grid__card:has-text("Index")'
		);
		let actionsButton = index.getByRole( 'button', { name: 'Actions' } );
		await actionsButton.click();

		const duplicateButton = page.getByRole( 'menuitem', {
			name: 'Duplicate',
		} );
		await duplicateButton.click();

		await page.keyboard.press( 'Enter' );

		// Wait for the snackbar message.
		await page.waitForSelector( '.components-snackbar__content' );

		await admin.visitSiteEditor( {
			postType: 'wp_template',
			activeView: 'user',
		} );

		const indexCopy = page.locator(
			'.dataviews-view-grid__card:has-text("Index (Copy)")'
		);

		await expect( indexCopy ).toContainText( 'Inactive' );

		actionsButton = indexCopy.getByRole( 'button', {
			name: 'Actions',
		} );
		await actionsButton.click();

		const activateButton = page.getByRole( 'menuitem', {
			name: 'Activate',
		} );
		await activateButton.click();

		await page.waitForSelector(
			'.dataviews-view-grid__field-value .is-success:has-text("Active")'
		);

		await page
			.getByRole( 'button', { name: 'Index (Copy)', exact: true } )
			.first()
			.click();

		await expect( editor.canvas.getByText( 'gutenberg' ) ).toBeVisible();

		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Copied from Index.' },
		} );

		await editor.saveSiteEditorEntities( {
			isOnlyCurrentEntityDirty: true,
		} );

		await page
			.getByRole( 'button', {
				name: 'View',
				exact: true,
			} )
			.click();

		const [ previewPage ] = await Promise.all( [
			page.context().waitForEvent( 'page' ),
			page
				.getByRole( 'menuitem', {
					name: 'View site',
				} )
				.click(),
		] );

		await expect( previewPage.locator( 'body' ) ).toContainText(
			'Copied from Index.'
		);

		await page.bringToFront();

		await page.getByRole( 'button', { name: 'Open Navigation' } ).click();

		await actionsButton.click();

		const deactivateButton = page.getByRole( 'menuitem', {
			name: 'Deactivate',
		} );
		await deactivateButton.click();

		await expect(
			page.locator(
				'.dataviews-view-grid__card:has-text("Index (Copy)") .is-success'
			)
		).toBeHidden();

		await previewPage.bringToFront();
		await previewPage.reload();

		await expect( previewPage.locator( 'body' ) ).not.toContainText(
			'Copied from Index.'
		);
	} );

	test( 'should deactivate after theme change', async ( {
		admin,
		page,
		requestUtils,
		editor,
	} ) => {
		await admin.visitSiteEditor( { postType: 'wp_template' } );
		await page.getByRole( 'button', { name: 'Add Template' } ).click();
		await page.getByRole( 'button', { name: 'Blog Home' } ).click();
		await page.waitForSelector( 'iframe[name="editor-canvas"]' );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'My home template test.' },
		} );
		await page.getByRole( 'button', { name: 'Save', exact: true } ).click();
		await page.getByRole( 'button', { name: 'Activate' } ).click();
		await expect( page.locator( '.components-notice' ) ).toContainText(
			'Template activated.'
		);
		await page.goto( '/' );
		await expect( page.locator( 'body' ) ).toContainText(
			'My home template test.'
		);
		await requestUtils.activateTheme( 'twentytwentyfive' );
		await page.reload();
		await expect( page.locator( 'body' ) ).not.toContainText(
			'My home template test.'
		);
	} );

	test( 'should use correct template ID format based on experiment status', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		await admin.visitSiteEditor();
		const resultWithExperimentEnabled = await page.evaluate( async () => {
			const template = await window.wp.apiFetch( {
				path: '/wp/v2/templates/lookup?slug=index&is_custom=false',
			} );
			const defaultTemplateId = await window.wp.data
				.resolveSelect( 'core' )
				.getDefaultTemplateId( {
					slug: 'index',
					is_custom: false,
				} );
			const record = await window.wp.data
				.resolveSelect( 'core' )
				.getEntityRecord(
					'postType',
					'wp_template',
					defaultTemplateId
				);
			return {
				apiTemplateId: template?.id,
				apiTemplateWpId: template?.wp_id,
				resolverReturnedId: defaultTemplateId,
				recordId: record?.id,
				recordWpId: record?.wp_id,
				experimentEnabled: window?.__experimentalTemplateActivate,
			};
		} );

		expect( resultWithExperimentEnabled.experimentEnabled ).toBe( true );

		const expectedIdWhenEnabled =
			resultWithExperimentEnabled.apiTemplateWpId ||
			resultWithExperimentEnabled.apiTemplateId;
		expect( resultWithExperimentEnabled.resolverReturnedId ).toBe(
			expectedIdWhenEnabled
		);
		expect( resultWithExperimentEnabled.recordId ).toBe(
			resultWithExperimentEnabled.resolverReturnedId
		);
		expect( resultWithExperimentEnabled.recordWpId ).toBe(
			resultWithExperimentEnabled.apiTemplateWpId
		);

		await requestUtils.setGutenbergExperiments( [] );
		await page.reload();
		await admin.visitSiteEditor();

		const resultWithExperimentDisabled = await page.evaluate( async () => {
			const template = await window.wp.apiFetch( {
				path: '/wp/v2/templates/lookup?slug=index&is_custom=false',
			} );
			const defaultTemplateId = await window.wp.data
				.resolveSelect( 'core' )
				.getDefaultTemplateId( {
					slug: 'index',
					is_custom: false,
				} );
			const record = await window.wp.data
				.resolveSelect( 'core' )
				.getEntityRecord(
					'postType',
					'wp_template',
					defaultTemplateId
				);
			return {
				apiTemplateId: template?.id,
				apiTemplateWpId: template?.wp_id,
				resolverReturnedId: defaultTemplateId,
				recordId: record?.id,
				recordWpId: record?.wp_id,
				experimentEnabled: window?.__experimentalTemplateActivate,
			};
		} );

		expect(
			resultWithExperimentDisabled.experimentEnabled
		).toBeUndefined();

		const expectedIdWhenDisabled =
			resultWithExperimentDisabled.apiTemplateId;
		expect( resultWithExperimentDisabled.resolverReturnedId ).toBe(
			expectedIdWhenDisabled
		);
		expect( typeof resultWithExperimentDisabled.resolverReturnedId ).toBe(
			'string'
		);
		expect( resultWithExperimentDisabled.recordId ).toBe(
			resultWithExperimentDisabled.resolverReturnedId
		);
		expect( resultWithExperimentDisabled.recordWpId ).toBe(
			resultWithExperimentDisabled.apiTemplateWpId
		);

		await requestUtils.setGutenbergExperiments( [ 'active_templates' ] );
	} );
} );
