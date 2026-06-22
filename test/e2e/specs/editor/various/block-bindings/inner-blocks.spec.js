/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * Builds the attributes for a `core/group` whose inner blocks are bound to the
 * given source. A `backgroundColor` is set so the group renders as a designed
 * container rather than the empty-group variation picker placeholder (the
 * placeholder gates on the group's own — here, source-controlled — children),
 * which models the real authoring scenario: a locked design with a freeform,
 * source-supplied inner-block area.
 *
 * @param {string} source The binding source name to bind `innerBlocks` to.
 * @return {Object} The `core/group` block attributes.
 */
function boundGroupAttributes( source ) {
	return {
		backgroundColor: 'vivid-cyan-blue',
		metadata: {
			bindings: {
				innerBlocks: { source },
			},
		},
	};
}

test.describe( 'Block bindings: innerBlocks', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-block-bindings' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost( { title: 'Test innerBlocks bindings' } );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( 'gutenberg-test-block-bindings' );
	} );

	test( 'editable source: read path supplies inner blocks in editor and frontend', async ( {
		editor,
		page,
	} ) => {
		// Bind a core/group's inner blocks to the editable example source. The
		// source supplies two paragraphs, which must replace the group's own
		// empty children in the editor.
		await editor.insertBlock( {
			name: 'core/group',
			attributes: boundGroupAttributes( 'testing/inner-blocks-source' ),
		} );

		const groupBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Group',
		} );
		const paragraphs = groupBlock.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );

		// The source-supplied inner blocks appear in the editor.
		await expect( paragraphs.nth( 0 ) ).toHaveText( 'Source Paragraph 1' );
		await expect( paragraphs.nth( 1 ) ).toHaveText( 'Source Paragraph 2' );

		// The same read path renders on the frontend.
		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		await expect(
			page.locator( '.entry-content .wp-block-group p' )
		).toContainText( [ 'Source Paragraph 1', 'Source Paragraph 2' ] );
	} );

	test( 'editable source: edits to the bound area are received by the source (write-back)', async ( {
		editor,
		page,
	} ) => {
		// Editing the bound inner blocks serializes the edited subtree and
		// hands it to the source's setValues, which records it in the
		// `text_custom_field` post meta. Reading the meta back proves the
		// source received the edited blocks.
		await editor.insertBlock( {
			name: 'core/group',
			attributes: boundGroupAttributes( 'testing/inner-blocks-source' ),
		} );

		const groupBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Group',
		} );
		const firstParagraph = groupBlock
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();

		await expect( firstParagraph ).toHaveText( 'Source Paragraph 1' );

		// Edit the first supplied paragraph.
		await editor.selectBlocks( firstParagraph );
		await firstParagraph.selectText();
		await page.keyboard.type( 'Edited Paragraph 1' );

		await expect( firstParagraph ).toHaveText( 'Edited Paragraph 1' );

		// The source stores received serialized blocks in `text_custom_field`.
		await expect
			.poll( async () =>
				page.evaluate(
					() =>
						window.wp.data
							.select( 'core' )
							.getEditedEntityRecord(
								'postType',
								window.wp.data
									.select( 'core/editor' )
									.getCurrentPostType(),
								window.wp.data
									.select( 'core/editor' )
									.getCurrentPostId()
							)?.meta?.text_custom_field
				)
			)
			.toContain( 'Edited Paragraph 1' );
	} );

	test( 'read-only source: the bound area has no appender and children cannot be selected, moved, or removed', async ( {
		editor,
		page,
	} ) => {
		// A source whose canUserEditValue is false locks the bound area: no
		// appender, and the children's editing mode is disabled — they cannot
		// even be selected, so no child toolbar (movers, delete) is reachable.
		await editor.insertBlock( {
			name: 'core/group',
			attributes: boundGroupAttributes(
				'testing/inner-blocks-source-read-only'
			),
		} );

		const groupBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Group',
		} );
		const firstParagraph = groupBlock
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();

		// The supplied inner blocks still render (read path works).
		await expect( firstParagraph ).toHaveText( 'Source Paragraph 1' );

		// No appender is rendered inside the locked area.
		await expect(
			groupBlock.getByRole( 'button', { name: 'Add block' } )
		).toBeHidden();

		// Clicking over a locked child selects the bound container itself —
		// the child is inert, so selection (and with it the child's toolbar,
		// movers, and delete) is unreachable.
		await groupBlock.click();
		await expect
			.poll( () =>
				page.evaluate( () => {
					const { select } = window.wp.data;
					const clientId =
						select(
							'core/block-editor'
						).getSelectedBlockClientId();
					return (
						clientId &&
						select( 'core/block-editor' ).getBlockName( clientId )
					);
				} )
			)
			.toBe( 'core/group' );
	} );

	test( 'read-only source: children cannot be typed into (no silent data loss)', async ( {
		editor,
		page,
	} ) => {
		// The read-only lock must prevent content edits, not only structural
		// changes: an edit that rendered in the canvas but was dropped by the
		// suppressed write-back would silently vanish on reload. The bound
		// subtree's editing mode is disabled (the child wrappers are inert),
		// so typing must not change the content at all.
		await editor.insertBlock( {
			name: 'core/group',
			attributes: boundGroupAttributes(
				'testing/inner-blocks-source-read-only'
			),
		} );

		const groupBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Group',
		} );
		const firstParagraph = groupBlock
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first();

		await expect( firstParagraph ).toHaveText( 'Source Paragraph 1' );

		// The bound subtree's wrappers are inert, so pointer interaction
		// cannot reach the content at all.
		await expect( firstParagraph ).toHaveAttribute( 'inert', 'true' );

		// A selection-driven typing attempt cannot edit the content either.
		await editor.selectBlocks( firstParagraph );
		await page.keyboard.type( 'INJECTED' );

		await expect( firstParagraph ).toHaveText( 'Source Paragraph 1' );
	} );

	test( 'detach: removing the binding keeps the current inner blocks', async ( {
		editor,
		page,
	} ) => {
		// Removing the binding releases control of the area. The block must
		// keep the tree the user was looking at (like detaching a pattern),
		// not be emptied by the controlled-sync teardown.
		await editor.insertBlock( {
			name: 'core/group',
			attributes: boundGroupAttributes( 'testing/inner-blocks-source' ),
		} );

		const groupBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Group',
		} );
		const paragraphs = groupBlock.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );

		await expect( paragraphs.nth( 0 ) ).toHaveText( 'Source Paragraph 1' );

		// Remove the innerBlocks binding, keeping other metadata intact.
		await page.evaluate( () => {
			const { select, dispatch } = window.wp.data;
			const [ group ] = select( 'core/block-editor' ).getBlocks();
			dispatch( 'core/block-editor' ).updateBlockAttributes(
				group.clientId,
				{ metadata: {} }
			);
		} );

		// The source-supplied children survive the detach.
		await expect( paragraphs.nth( 0 ) ).toHaveText( 'Source Paragraph 1' );
		await expect( paragraphs.nth( 1 ) ).toHaveText( 'Source Paragraph 2' );

		// And the area is now an ordinary editable one: edits stay local.
		await editor.selectBlocks( paragraphs.nth( 0 ) );
		await paragraphs.nth( 0 ).selectText();
		await page.keyboard.type( 'Detached edit' );
		await expect( paragraphs.nth( 0 ) ).toHaveText( 'Detached edit' );
	} );

	test( 'absence: a source supplying no value falls back to the block own serialized children', async ( {
		editor,
	} ) => {
		// The absence source returns no `innerBlocks` value, so the bound group
		// stays uncontrolled and renders its own serialized children.
		await editor.insertBlock( {
			name: 'core/group',
			attributes: {
				metadata: {
					bindings: {
						innerBlocks: {
							source: 'testing/inner-blocks-source-absence',
						},
					},
				},
			},
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: 'Own fallback paragraph' },
				},
			],
		} );

		const groupBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Group',
		} );
		const paragraph = groupBlock.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );

		// The block own serialized child renders, not the source fixture.
		await expect( paragraph ).toHaveText( 'Own fallback paragraph' );
		await expect( paragraph ).toHaveCount( 1 );
	} );
} );
