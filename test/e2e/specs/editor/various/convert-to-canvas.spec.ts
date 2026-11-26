import { test, expect } from '@wordpress/e2e-test-utils-playwright';

test.describe( 'Convert to canvas', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-grid-interactivity',
		] );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( 'keeps the layout of a section, in one undo step', async ( {
		editor,
		pageUtils,
	} ) => {
		// A full width section holding wide Columns at 50/50: a run of text on
		// the left and an image on the right.
		await editor.insertBlock( {
			name: 'core/group',
			attributes: {
				align: 'full',
				layout: { type: 'constrained' },
			},
			innerBlocks: [
				{
					name: 'core/columns',
					attributes: { align: 'wide' },
					innerBlocks: [
						{
							name: 'core/column',
							attributes: {
								width: '50%',
								verticalAlignment: 'center',
							},
							innerBlocks: [
								{
									name: 'core/heading',
									attributes: { content: 'Tell your story' },
								},
								{
									name: 'core/paragraph',
									attributes: {
										content:
											'A paragraph long enough to wrap onto a few lines in half of the section.',
									},
								},
							],
						},
						{
							name: 'core/column',
							attributes: { width: '50%' },
							innerBlocks: [
								{
									name: 'core/image',
									attributes: {
										url: 'https://s.w.org/images/core/5.3/MtBlanc1.jpg',
										align: 'center',
										width: '300px',
									},
								},
							],
						},
					],
				},
			],
		} );
		const original = await editor.getEditedPostContent();

		await editor.selectBlocks(
			editor.canvas.getByRole( 'document', { name: 'Block: Group' } )
		);
		await editor.clickBlockOptionsMenuItem( 'Convert to canvas' );

		const [ canvas ] = await editor.getBlocks();
		expect( canvas.name ).toBe( 'core/group' );
		expect( canvas.attributes.layout ).toMatchObject( {
			type: 'grid',
			isManualPlacement: true,
		} );
		// The Columns are gone: the text is one Stack, the image sits next
		// to it, in the other half, without its alignment and size.
		expect(
			canvas.innerBlocks.map( ( { name, innerBlocks } ) => [
				name,
				innerBlocks.map( ( innerBlock ) => innerBlock.name ),
			] )
		).toEqual( [
			[ 'core/group', [ 'core/heading', 'core/paragraph' ] ],
			[ 'core/image', [] ],
		] );
		const [ text, image ] = canvas.innerBlocks;
		// Block attributes come back from the editor untyped.
		type GridItemLayout = { columnStart: number; columnSpan: number };
		const { columnCount } = canvas.attributes.layout as {
			columnCount: number;
		};
		expect( text.attributes.layout ).toMatchObject( {
			type: 'flex',
			orientation: 'vertical',
			verticalAlignment: 'center',
		} );
		const textLayout = (
			text.attributes.style as { layout: GridItemLayout }
		 ).layout;
		const imageLayout = (
			image.attributes.style as { layout: GridItemLayout }
		 ).layout;
		// Side by side, and as far from the edges as the wide Columns were.
		expect( textLayout.columnStart + textLayout.columnSpan ).toBe(
			imageLayout.columnStart
		);
		expect( textLayout.columnSpan ).toBe( imageLayout.columnSpan );
		expect( textLayout.columnStart - 1 ).toBe(
			columnCount -
				( imageLayout.columnStart + imageLayout.columnSpan - 1 )
		);
		expect( image.attributes.align ).toBeUndefined();
		expect( image.attributes.width ).toBeUndefined();

		await pageUtils.pressKeys( 'primary+z' );
		await expect.poll( editor.getEditedPostContent ).toBe( original );
	} );
} );
