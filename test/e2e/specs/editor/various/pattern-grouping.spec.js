const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * Returns an unsynced pricing pattern whose cards are named groups inside a
 * named "Pricing table" group.
 *
 * @param {Object}  options                 Options.
 * @param {boolean} options.allowReordering Whether the pricing table lets its
 *                                          cards be reordered.
 * @return {string} The pattern markup.
 */
function getPricingPattern( { allowReordering = false } = {} ) {
	const tableMetadata = JSON.stringify( {
		name: 'Pricing table',
		...( allowReordering ? { allowReordering: true } : {} ),
	} );
	return `<!-- wp:group {"metadata":{"patternName":"core/block/123","name":"Pricing"},"layout":{"type":"constrained"}} -->
<div class="wp-block-group"><!-- wp:group {"metadata":${ tableMetadata },"layout":{"type":"flex"}} -->
<div class="wp-block-group"><!-- wp:group {"metadata":{"name":"Lite"},"layout":{"type":"constrained"}} -->
<div class="wp-block-group"><!-- wp:heading -->
<h2 class="wp-block-heading">Lite plan</h2>
<!-- /wp:heading --></div>
<!-- /wp:group -->

<!-- wp:group {"metadata":{"name":"Premium"},"layout":{"type":"constrained"}} -->
<div class="wp-block-group"><!-- wp:heading -->
<h2 class="wp-block-heading">Premium plan</h2>
<!-- /wp:heading --></div>
<!-- /wp:group --></div>
<!-- /wp:group -->

<!-- wp:paragraph -->
<p>Prices include tax.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->`;
}

test.describe( 'Pattern grouping', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-pattern-grouping',
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'shows named blocks as nested groups in List View', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.setContent( getPricingPattern() );

		await pageUtils.pressKeys( 'access+o' );
		const listView = page.getByRole( 'treegrid', {
			name: 'Block navigation structure',
		} );
		const expand = ( name ) =>
			listView
				.getByRole( 'gridcell', { name, exact: true } )
				.getByTestId( 'list-view-expander' )
				.click( { force: true } );

		await expand( 'Pricing' );
		await expand( 'Pricing table' );
		await expand( 'Lite' );
		await expect(
			listView.getByRole( 'gridcell', { name: 'Premium', exact: true } )
		).toBeVisible();
		await expect(
			listView.getByRole( 'gridcell', { name: 'Lite plan' } )
		).toBeVisible();

		// A group can be selected, unlike the faded rows around it.
		const liteRow = listView.getByRole( 'row' ).filter( {
			has: page.getByRole( 'gridcell', { name: 'Lite', exact: true } ),
		} );
		await liteRow
			.getByRole( 'link', { name: 'Lite', exact: true } )
			.click();
		await expect(
			liteRow.getByRole( 'gridcell', { name: 'Lite', exact: true } )
		).toHaveAttribute( 'aria-selected', 'true' );
	} );

	test( 'shows groups in the Content panel and selects them from it', async ( {
		editor,
		page,
	} ) => {
		await editor.setContent( getPricingPattern() );
		await editor.selectBlocks(
			editor.canvas.locator( '[data-type="core/group"]' ).first()
		);
		await editor.openDocumentSettingsSidebar();

		const contentPanel = page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'group', { name: 'Pricing table' } );
		const liteGroup = contentPanel.getByRole( 'group', { name: 'Lite' } );
		await expect(
			liteGroup.getByRole( 'button', { name: 'Lite plan' } )
		).toBeVisible();
		await expect(
			contentPanel
				.getByRole( 'group', { name: 'Premium' } )
				.getByRole( 'button', { name: 'Premium plan' } )
		).toBeVisible();

		// Content after the groups isn't part of them.
		await expect(
			contentPanel.getByRole( 'button', { name: 'Prices include tax.' } )
		).toBeHidden();

		await liteGroup
			.getByRole( 'button', { name: 'Lite', exact: true } )
			.click();
		await expect
			.poll( () =>
				page.evaluate(
					() =>
						window.wp.data
							.select( 'core/block-editor' )
							.getSelectedBlock()?.attributes.metadata?.name
				)
			)
			.toBe( 'Lite' );
	} );

	test( 'reorders groups only when their container allows it', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		const blockToolbar = page.getByRole( 'toolbar', {
			name: 'Block tools',
		} );
		const selectLite = async () => {
			await pageUtils.pressKeys( 'access+o' );
			const listView = page.getByRole( 'treegrid', {
				name: 'Block navigation structure',
			} );
			for ( const name of [ 'Pricing', 'Pricing table' ] ) {
				await listView
					.getByRole( 'gridcell', { name, exact: true } )
					.getByTestId( 'list-view-expander' )
					.click( { force: true } );
			}
			await listView
				.getByRole( 'link', { name: 'Lite', exact: true } )
				.click();
			await editor.showBlockToolbar();
		};

		await editor.setContent( getPricingPattern() );
		await selectLite();
		await expect(
			blockToolbar.getByRole( 'button', { name: 'Move right' } )
		).toBeHidden();

		await editor.setContent(
			getPricingPattern( { allowReordering: true } )
		);
		await selectLite();

		// Selecting a group doesn't come with a way to change its design or
		// drag it somewhere it can't land.
		await expect(
			blockToolbar.getByRole( 'button', { name: 'Drag' } )
		).toBeHidden();

		await blockToolbar
			.getByRole( 'button', { name: 'Move right' } )
			.click();
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				innerBlocks: [
					{
						innerBlocks: [
							{ attributes: { metadata: { name: 'Premium' } } },
							{ attributes: { metadata: { name: 'Lite' } } },
						],
					},
					{ name: 'core/paragraph' },
				],
			},
		] );
	} );

	test( 'lets a pattern author allow reordering', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/group',
			innerBlocks: [ { name: 'core/paragraph' } ],
		} );
		await editor.openDocumentSettingsSidebar();
		const settings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await settings.getByRole( 'button', { name: 'Advanced' } ).click();
		await settings
			.getByRole( 'switch', { name: 'Allow reordering in patterns' } )
			.click();

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/group',
				attributes: { metadata: { allowReordering: true } },
			},
		] );
	} );
} );
