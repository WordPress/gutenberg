const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const PATTERN_CONTENT = `<!-- wp:paragraph -->
<p>Locked paragraph</p>
<!-- /wp:paragraph -->

<!-- wp:group {"metadata":{"name":"Body","bindings":{"innerBlocks":{"source":"core/pattern-overrides"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group"><!-- wp:paragraph -->
<p>Default content</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->`;

test.describe( 'Inner blocks bindings in a synced pattern', () => {
	let pattern;

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-inner-blocks-bindings',
		] );
		await requestUtils.activateTheme( 'emptytheme' );
	} );

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

	test.afterEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllBlocks(),
			requestUtils.deleteAllPosts(),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [] );
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'saves the edited area as an override of the instance', async ( {
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

		const [ instance ] = await editor.getBlocks();
		expect( instance.attributes.content.Body.innerBlocks ).toContain(
			'A new paragraph'
		);

		const postId = await editor.publishPost();

		// The pattern itself is unchanged.
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

	// Each typed character is its own undo level for now.
	test( 'restores the default content on undo', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		const paragraph = editor.canvas
			.getByRole( 'document', { name: 'Block: Group' } )
			.getByRole( 'document', { name: 'Block: Paragraph' } );
		await paragraph.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( '!' );
		await expect( paragraph ).toHaveText( 'Default content!' );

		await pageUtils.pressKeys( 'primary+z' );

		await expect( paragraph ).toHaveText( 'Default content' );
		const [ instance ] = await editor.getBlocks();
		expect( instance.attributes.content?.Body ).toBeUndefined();
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
		await page.keyboard.type( ' edited' );

		await editor.selectBlocks(
			editor.canvas.getByRole( 'document', { name: 'Block: Pattern' } )
		);
		await editor.showBlockToolbar();
		await editor.clickBlockOptionsMenuItem( 'Detach' );
		await page
			.getByRole( 'dialog' )
			.getByRole( 'button', { name: 'Detach' } )
			.click();

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{ name: 'core/paragraph' },
			{
				name: 'core/group',
				innerBlocks: [
					{
						name: 'core/paragraph',
						attributes: { content: 'Default content edited' },
					},
				],
			},
		] );
	} );
} );

test.describe( 'Inner blocks bindings to a read-only source', () => {
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
		await requestUtils.deleteAllPosts();
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

	test( 'previews the supplied blocks and keeps the own ones', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/group',
			attributes: {
				metadata: {
					bindings: {
						innerBlocks: {
							source: 'testing/inner-blocks',
							args: { text: 'From the source' },
						},
					},
				},
			},
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: 'Own content' },
				},
			],
		} );

		const group = editor.canvas.getByRole( 'document', {
			name: 'Block: Group',
		} );
		await expect( group ).toContainText( 'From the source' );
		await expect( group ).not.toContainText( 'Own content' );
		// The preview can't be edited.
		await expect( group.locator( '[contenteditable="true"]' ) ).toHaveCount(
			0
		);

		// The own inner blocks are still saved with the post.
		const [ groupBlock ] = await editor.getBlocks();
		expect( groupBlock.innerBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'Own content' },
			},
		] );

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );
		await expect( page.getByText( 'From the source' ) ).toBeVisible();
		await expect( page.getByText( 'Own content' ) ).toBeHidden();
	} );

	test( 'previews the supplied blocks of a Group without its own', async ( {
		admin,
		editor,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/group',
			attributes: {
				metadata: {
					bindings: {
						innerBlocks: {
							source: 'testing/inner-blocks',
							args: { text: 'From the source' },
						},
					},
				},
			},
		} );

		const group = editor.canvas.getByRole( 'document', {
			name: 'Block: Group',
		} );
		await expect( group ).toContainText( 'From the source' );
		// Not the placeholder to choose a layout for an empty Group.
		await expect(
			group.getByRole( 'button', { name: 'Stack' } )
		).toHaveCount( 0 );
	} );

	test( 'keeps the own blocks without a value', async ( {
		admin,
		editor,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/group',
			attributes: {
				metadata: {
					bindings: {
						innerBlocks: { source: 'testing/inner-blocks' },
					},
				},
			},
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: 'Own content' },
				},
			],
		} );

		await expect(
			editor.canvas
				.getByRole( 'document', { name: 'Block: Group' } )
				.getByRole( 'document', { name: 'Block: Paragraph' } )
		).toHaveText( 'Own content' );
	} );
} );
