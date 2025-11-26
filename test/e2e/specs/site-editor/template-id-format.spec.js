/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Template ID Format', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
		await requestUtils.activateTheme( 'twentytwentyone' );
		// Ensure experiment is disabled after test.
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( 'should use correct template ID format based on experiment status', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		// Test with experiment enabled first.
		await requestUtils.setGutenbergExperiments( [ 'active_templates' ] );
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

		// Test with experiment disabled.
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
	} );
} );
