const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Query Pagination', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'shows the label text when the arrow is set to none, and undoes both', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		await editor.insertBlock( {
			name: 'core/query',
			innerBlocks: [
				{
					name: 'core/query-pagination',
					attributes: { paginationArrow: 'arrow', showLabel: false },
					innerBlocks: [
						{ name: 'core/query-pagination-previous' },
						{ name: 'core/query-pagination-next' },
					],
				},
			],
		} );
		await editor.selectBlocks(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Pagination',
				exact: true,
			} )
		);
		await editor.openDocumentSettingsSidebar();
		const pagination = () =>
			editor.getBlocks().then( ( [ query ] ) => query.innerBlocks[ 0 ] );
		expect( ( await pagination() ).attributes ).toEqual( {
			paginationArrow: 'arrow',
			showLabel: false,
		} );

		await page.getByRole( 'radio', { name: 'Arrow', exact: true } ).focus();
		await page.keyboard.press( 'ArrowLeft' );
		await expect(
			page.getByRole( 'radio', { name: 'None', exact: true } )
		).toBeChecked();
		expect( ( await pagination() ).attributes ).toEqual( {
			paginationArrow: 'none',
			showLabel: true,
		} );

		await pageUtils.pressKeys( 'primary+z' );
		expect( ( await pagination() ).attributes ).toEqual( {
			paginationArrow: 'arrow',
			showLabel: false,
		} );
	} );

	test( 'shows the label text when the arrow setting is reset', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/query',
			innerBlocks: [
				{
					name: 'core/query-pagination',
					attributes: { paginationArrow: 'arrow', showLabel: false },
					innerBlocks: [
						{ name: 'core/query-pagination-previous' },
						{ name: 'core/query-pagination-next' },
					],
				},
			],
		} );
		await editor.selectBlocks(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Pagination',
				exact: true,
			} )
		);
		await editor.openDocumentSettingsSidebar();
		const pagination = () =>
			editor.getBlocks().then( ( [ query ] ) => query.innerBlocks[ 0 ] );
		expect( ( await pagination() ).attributes ).toEqual( {
			paginationArrow: 'arrow',
			showLabel: false,
		} );

		await page
			.getByRole( 'button', { name: 'Settings options', exact: true } )
			.click();
		await page
			.getByRole( 'menuitem', {
				name: 'Pagination arrow, reset to default',
				exact: true,
			} )
			.click();

		expect( ( await pagination() ).attributes ).toEqual( {
			paginationArrow: 'none',
			showLabel: true,
		} );
	} );
} );
