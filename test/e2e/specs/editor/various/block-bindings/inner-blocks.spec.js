const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const PATTERN_CONTENT = `<!-- wp:paragraph -->
<p>Locked paragraph</p>
<!-- /wp:paragraph -->

<!-- wp:group {"metadata":{"name":"Body","bindings":{"innerBlocks":{"source":"core/pattern-overrides"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group"><!-- wp:paragraph -->
<p>Default content</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->`;

const PATTERN_WITH_OVERRIDABLE_BLOCK_CONTENT = `<!-- wp:group {"metadata":{"name":"Body","bindings":{"innerBlocks":{"source":"core/pattern-overrides"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group"><!-- wp:paragraph {"metadata":{"name":"Intro","bindings":{"__default":{"source":"core/pattern-overrides"}}}} -->
<p>Intro</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Details</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->`;

/**
 * Moves a block with the block editor store, as dragging it in List View does,
 * without selecting it.
 *
 * @param {Object} page             The page.
 * @param {Object} options          Options.
 * @param {string} options.from     Path of client IDs to the block.
 * @param {string} options.to       Path of client IDs to the new parent, empty for the root.
 * @param {number} options.index    The index in the new parent.
 * @param {string} options.selected Path of client IDs to the block to select.
 */
async function moveBlock( page, { from, to, index, selected } ) {
	await page.evaluate(
		( args ) => {
			const { select, dispatch } = window.wp.data;
			const { getBlockOrder } = select( 'core/block-editor' );
			const resolve = ( path ) =>
				path.reduce(
					( parent, position ) => getBlockOrder( parent )[ position ],
					''
				);
			const clientId = resolve( args.from );
			const actions = dispatch( 'core/block-editor' );
			actions.selectBlock( resolve( args.selected ) );
			actions.moveBlocksToPosition(
				[ clientId ],
				resolve( args.from.slice( 0, -1 ) ),
				resolve( args.to ),
				args.index
			);
		},
		{ from, to, index, selected }
	);
}

test.describe( 'Inner blocks bindings', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-inner-blocks-bindings',
		] );
		await Promise.all( [
			requestUtils.activateTheme( 'emptytheme' ),
			requestUtils.activatePlugin(
				'gutenberg-test-inner-blocks-bindings'
			),
		] );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllBlocks(),
			requestUtils.deleteAllPosts(),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [] );
		await Promise.all( [
			requestUtils.activateTheme( 'twentytwentyone' ),
			requestUtils.deactivatePlugin(
				'gutenberg-test-inner-blocks-bindings'
			),
		] );
	} );

	test.describe( 'in a synced pattern', () => {
		let pattern;

		test.beforeEach( async ( { admin, editor, requestUtils } ) => {
			pattern = await requestUtils.createBlock( {
				title: 'Card',
				status: 'publish',
				content: PATTERN_CONTENT,
			} );
			await admin.createNewPost();
			await editor.insertBlock( {
				name: 'core/block',
				attributes: { ref: pattern.id },
			} );
		} );

		test( 'lets each instance edit the area, and saves it as an override', async ( {
			editor,
			page,
			requestUtils,
		} ) => {
			const area = editor.canvas.getByRole( 'document', {
				name: 'Block: Group',
			} );
			const paragraph = area.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			await expect( paragraph ).toHaveText( 'Default content' );

			await paragraph.click();
			await page.keyboard.press( 'End' );
			await page.keyboard.type( ' and more' );
			await page.keyboard.press( 'Enter' );
			await page.keyboard.type( 'A new paragraph' );

			await expect(
				area.getByRole( 'document', { name: 'Block: Paragraph' } )
			).toHaveText( [ 'Default content and more', 'A new paragraph' ] );
			// The locked paragraph of the pattern stays locked.
			await expect(
				editor.canvas.getByRole( 'document', {
					name: 'Block: Paragraph',
					includeHidden: true,
				} )
			).toHaveCount( 3 );

			const [ instance ] = await editor.getBlocks();
			expect( instance.attributes.content.Body.innerBlocks ).toContain(
				'Default content and more'
			);
			expect( instance.attributes.content.Body.innerBlocks ).toContain(
				'A new paragraph'
			);

			const postId = await editor.publishPost();

			const { content } = await requestUtils.rest( {
				path: `/wp/v2/blocks/${ pattern.id }`,
				params: { context: 'edit' },
			} );
			expect( content.raw ).toBe( PATTERN_CONTENT );

			await page.goto( `/?p=${ postId }` );
			await expect(
				page.getByText( 'Default content and more' )
			).toBeVisible();
			await expect( page.getByText( 'A new paragraph' ) ).toBeVisible();
			await expect( page.getByText( 'Locked paragraph' ) ).toBeVisible();
		} );

		test( 'undoes typing in the area at once', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			const paragraph = editor.canvas
				.getByRole( 'document', { name: 'Block: Group' } )
				.getByRole( 'document', { name: 'Block: Paragraph' } );
			await paragraph.click();
			await page.keyboard.press( 'End' );
			await page.keyboard.type( ' typed' );
			await expect( paragraph ).toHaveText( 'Default content typed' );

			await pageUtils.pressKeys( 'primary+z' );

			await expect( paragraph ).toHaveText( 'Default content' );
			const [ instance ] = await editor.getBlocks();
			expect(
				instance.attributes.content?.Body?.innerBlocks ?? ''
			).not.toContain( 'typed' );
		} );

		test( 'moves a block into the area, and undoes it at once', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Moved in' },
			} );

			// From the root into the area, with the pattern selected.
			await moveBlock( page, {
				from: [ 1 ],
				to: [ 0, 1 ],
				index: 1,
				selected: [ 0 ],
			} );

			const area = editor.canvas.getByRole( 'document', {
				name: 'Block: Group',
			} );
			await expect(
				area.getByRole( 'document', { name: 'Block: Paragraph' } )
			).toHaveText( [ 'Default content', 'Moved in' ] );
			let blocks = await editor.getBlocks();
			expect( blocks ).toHaveLength( 1 );
			expect( blocks[ 0 ].attributes.content.Body.innerBlocks ).toContain(
				'Moved in'
			);

			await page
				.getByRole( 'toolbar', { name: 'Document tools' } )
				.getByRole( 'button', { name: 'Undo' } )
				.click();

			await expect(
				area.getByRole( 'document', { name: 'Block: Paragraph' } )
			).toHaveText( [ 'Default content' ] );
			blocks = await editor.getBlocks();
			expect( blocks.map( ( { name } ) => name ) ).toEqual( [
				'core/block',
				'core/paragraph',
			] );
			expect(
				blocks[ 0 ].attributes.content?.Body?.innerBlocks ?? ''
			).not.toContain( 'Moved in' );
		} );

		test( 'moves a block out of the area once, and undoes it at once', async ( {
			editor,
			page,
		} ) => {
			// From the area to the root, with the pattern selected.
			await moveBlock( page, {
				from: [ 0, 1, 0 ],
				to: [],
				index: 1,
				selected: [ 0 ],
			} );

			const area = editor.canvas.getByRole( 'document', {
				name: 'Block: Group',
			} );
			await expect(
				area.getByRole( 'document', { name: 'Block: Paragraph' } )
			).toHaveCount( 0 );
			const content = await editor.getEditedPostContent();
			expect( content.match( /Default content/g ) ).toHaveLength( 1 );

			await page
				.getByRole( 'toolbar', { name: 'Document tools' } )
				.getByRole( 'button', { name: 'Undo' } )
				.click();

			await expect(
				area.getByRole( 'document', { name: 'Block: Paragraph' } )
			).toHaveText( [ 'Default content' ] );
			const blocks = await editor.getBlocks();
			expect( blocks.map( ( { name } ) => name ) ).toEqual( [
				'core/block',
			] );
		} );

		test( 'resets the area to the content of the pattern', async ( {
			editor,
			page,
		} ) => {
			const area = editor.canvas.getByRole( 'document', {
				name: 'Block: Group',
			} );
			const paragraph = area.getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			await paragraph.click();
			await page.keyboard.press( 'End' );
			await page.keyboard.type( ' overridden' );
			await expect( paragraph ).toHaveText(
				'Default content overridden'
			);

			await editor.selectBlocks( area );
			await editor.clickBlockToolbarButton( 'Reset' );

			await expect( paragraph ).toHaveText( 'Default content' );
		} );

		test( 'keeps the overridden area when detaching the pattern', async ( {
			editor,
			page,
		} ) => {
			const paragraph = editor.canvas
				.getByRole( 'document', { name: 'Block: Group' } )
				.getByRole( 'document', { name: 'Block: Paragraph' } );
			await paragraph.click();
			await page.keyboard.press( 'End' );
			await page.keyboard.type( ' detached' );

			await editor.selectBlocks(
				editor.canvas.getByRole( 'document', {
					name: 'Block: Pattern',
				} )
			);
			await editor.clickBlockOptionsMenuItem( 'Detach' );
			await page
				.getByRole( 'dialog', { name: 'Detach pattern?' } )
				.getByRole( 'button', { name: 'Detach' } )
				.click();

			const blocks = await editor.getBlocks();
			expect( blocks.map( ( { name } ) => name ) ).toEqual( [
				'core/paragraph',
				'core/group',
			] );
			expect( blocks[ 1 ].attributes.metadata?.bindings ).toBeUndefined();
			expect( blocks[ 1 ].innerBlocks[ 0 ].attributes.content ).toBe(
				'Default content detached'
			);
		} );
	} );

	test( 'keeps the overrides of the overridable blocks in an area', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const { id } = await requestUtils.createBlock( {
			title: 'Card with an overridable paragraph',
			status: 'publish',
			content: PATTERN_WITH_OVERRIDABLE_BLOCK_CONTENT,
		} );
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/block',
			attributes: { ref: id },
		} );
		const [ intro, details ] = await editor.canvas
			.getByRole( 'document', { name: 'Block: Group' } )
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.all();

		await intro.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' overridden' );
		await details.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' edited' );

		await expect( intro ).toHaveText( 'Intro overridden' );
		await expect( details ).toHaveText( 'Details edited' );
		const [ instance ] = await editor.getBlocks();
		expect( instance.attributes.content.Intro.content ).toBe(
			'Intro overridden'
		);
		// The area keeps the overridable paragraph as it is.
		expect( instance.attributes.content.Body.innerBlocks ).toContain(
			'"name":"Intro"'
		);
		expect( instance.attributes.content.Body.innerBlocks ).toContain(
			'Details edited'
		);

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );
		await expect( page.getByText( 'Intro overridden' ) ).toBeVisible();
		await expect( page.getByText( 'Details edited' ) ).toBeVisible();
	} );

	test.describe( 'bound to a custom field', () => {
		test.beforeEach( async ( { admin, editor } ) => {
			await admin.createNewPost();
			await editor.insertBlock( {
				name: 'core/group',
				attributes: {
					layout: { type: 'constrained' },
					metadata: {
						bindings: {
							innerBlocks: {
								source: 'testing/inner-blocks-field',
							},
						},
					},
				},
				innerBlocks: [
					{
						name: 'core/paragraph',
						attributes: { content: 'Fallback content' },
					},
				],
			} );
		} );

		test( 'writes edits to the field, and keeps the own inner blocks in the post', async ( {
			editor,
			page,
		} ) => {
			const paragraph = editor.canvas
				.getByRole( 'document', { name: 'Block: Group' } )
				.getByRole( 'document', { name: 'Block: Paragraph' } );
			await expect( paragraph ).toHaveText( 'Fallback content' );

			await paragraph.click();
			await page.keyboard.press( 'End' );
			await page.keyboard.type( ' from the field' );
			await expect( paragraph ).toHaveText(
				'Fallback content from the field'
			);

			const field = await page.evaluate(
				() =>
					window.wp.data
						.select( 'core/editor' )
						.getEditedPostAttribute( 'meta' ).inner_blocks_field
			);
			expect( field ).toContain( 'Fallback content from the field' );
			const content = await editor.getEditedPostContent();
			expect( content ).toContain( '<p>Fallback content</p>' );
			expect( content ).not.toContain( 'from the field' );

			const postId = await editor.publishPost();
			await page.goto( `/?p=${ postId }` );
			await expect(
				page.getByText( 'Fallback content from the field' )
			).toBeVisible();
		} );

		test( 'keeps the own inner blocks in the post after an undo', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			const paragraph = editor.canvas
				.getByRole( 'document', { name: 'Block: Group' } )
				.getByRole( 'document', { name: 'Block: Paragraph' } );
			await paragraph.click();
			await page.keyboard.press( 'End' );
			await page.keyboard.type( ' edited' );
			await page.keyboard.press( 'Enter' );
			await page.keyboard.type( 'Another' );

			await pageUtils.pressKeys( 'primary+z' );

			const content = await editor.getEditedPostContent();
			expect( content ).toContain( '<p>Fallback content</p>' );
			expect( content ).not.toContain( 'edited' );
			expect( content ).not.toContain( 'Another' );
		} );
	} );
} );
