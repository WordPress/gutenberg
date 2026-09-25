const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'undo', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'does not empty header', async ( { admin, page, editor } ) => {
		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );

		// Check if there's a valid child block with a type (not appender).
		await expect(
			editor.canvas.locator(
				'[data-type="core/template-part"] [data-type]'
			)
		).not.toHaveCount( 0 );

		// insert a block
		await editor.insertBlock( { name: 'core/paragraph' } );

		// undo
		await page
			.getByRole( 'button', {
				name: 'Undo',
			} )
			.click();

		// Check if there's a valid child block with a type (not appender).
		await expect(
			editor.canvas.locator(
				'[data-type="core/template-part"] [data-type]'
			)
		).not.toHaveCount( 0 );
	} );
} );

const CONTAINER_CONTENT =
	'<!-- wp:paragraph --><p>Some container content</p><!-- /wp:paragraph -->' +
	'<!-- wp:paragraph --><p>More container content</p><!-- /wp:paragraph -->';

// Two Template Parts pointing at one entity are both inner block controllers
// synced from the same record, so an edit in one re-syncs the other. That
// re-sync is what these tests pin down: it must not split a typed run into
// separate undo levels, nor strand the caret where the container was entered.
test.describe( 'undo in a container duplicated from one entity', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { admin, editor, requestUtils } ) => {
		await requestUtils.createTemplate( 'wp_template_part', {
			slug: 'content-test',
			title: 'Content Test',
			content: CONTAINER_CONTENT,
		} );

		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );

		for ( let i = 0; i < 2; i++ ) {
			await editor.insertBlock( {
				name: 'core/template-part',
				attributes: { slug: 'content-test', theme: 'emptytheme' },
			} );
		}

		await expect(
			editor.canvas.getByText( 'Some container content' )
		).toHaveCount( 2 );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'keeps every typed character in a duplicated container', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		const edited = editor.canvas
			.getByText( 'Some container content' )
			.first();
		const duplicate = editor.canvas
			.getByText( 'Some container content' )
			.last();

		// A block overlay covers an unselected Template Part, so the container
		// is clicked before the paragraph inside it.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Content Test' } )
			.first()
			.click();
		await edited.click();
		await pageUtils.pressKeys( 'End' );
		// Typed at a human cadence on purpose: an instant `type()` outruns the
		// re-sync between the two containers and hides the defect.
		await page.keyboard.type( 'Hello', { delay: 150 } );

		// Each keystroke re-syncs the other container. That must not discard
		// the keystrokes that follow it.
		await expect( edited ).toHaveText( 'Some container contentHello' );
		await expect( duplicate ).toHaveText( 'Some container contentHello' );
	} );

	test( 'removes the entire typed run when undoing inside a duplicated container', async ( {
		editor,
		page,
		pageUtils,
	} ) => {
		const edited = editor.canvas
			.getByText( 'Some container content' )
			.first();

		// A block overlay covers an unselected Template Part, so the container
		// is clicked before the paragraph inside it.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Content Test' } )
			.first()
			.click();
		await edited.click();
		await pageUtils.pressKeys( 'End' );
		// Typed at a human cadence on purpose: an instant `type()` outruns the
		// re-sync between the two containers and hides the defect.
		await page.keyboard.type( 'Hello', { delay: 150 } );

		await expect( edited ).toHaveText( 'Some container contentHello' );

		await pageUtils.pressKeys( 'primary+z' );

		// One undo level for one typed run, not one level per character.
		await expect( edited ).toHaveText( 'Some container content' );
	} );
} );

// Two Template Parts backed by different entities are two inner block
// controllers. An undo that reverts an edit in one of them while the caret sits
// in the other should bring the caret back to the reverted block, the way it
// does for blocks at the root of the document.
//
// It does not yet: a nested controller only restores the selection recorded
// on the root record, which an undo of its own entity never changes. This is
// unrelated to duplicated containers and predates
// https://github.com/WordPress/gutenberg/pull/82706, which documents it as out
// of scope.
test.describe( 'undo across containers of different entities', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { admin, editor, requestUtils } ) => {
		for ( const part of [ 'A', 'B' ] ) {
			await requestUtils.createTemplate( 'wp_template_part', {
				slug: `part-${ part.toLowerCase() }`,
				title: `Part ${ part }`,
				content: `<!-- wp:paragraph --><p>Part ${ part } text</p><!-- /wp:paragraph -->`,
			} );
		}

		await admin.visitSiteEditor( {
			postId: 'emptytheme//index',
			postType: 'wp_template',
			canvas: 'edit',
		} );

		for ( const slug of [ 'part-a', 'part-b' ] ) {
			await editor.insertBlock( {
				name: 'core/template-part',
				attributes: { slug, theme: 'emptytheme' },
			} );
		}

		await expect( editor.canvas.getByText( 'Part B text' ) ).toBeVisible();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.fixme(
		'returns the caret to the reverted container',
		async ( { editor, page, pageUtils } ) => {
			const partA = editor.canvas.getByText( 'Part A text' );
			const partB = editor.canvas.getByText( 'Part B text' );

			const containerTexts = () =>
				page.evaluate( () => {
					const {
						getBlocksByName,
						getBlockOrder,
						getBlockAttributes,
					} = window.wp.data.select( 'core/block-editor' );
					// The template also carries the theme's header part.
					return getBlocksByName( 'core/template-part' )
						.filter( ( clientId ) =>
							getBlockAttributes( clientId ).slug.startsWith(
								'part-'
							)
						)
						.map( ( clientId ) =>
							getBlockAttributes(
								getBlockOrder( clientId )[ 0 ]
							)?.content?.toString?.()
						);
				} );

			// A block overlay covers an unselected Template Part, so each
			// container is clicked before the paragraph inside it.
			await editor.canvas
				.getByRole( 'document', { name: 'Block: Part A' } )
				.click();
			await partA.click();
			await pageUtils.pressKeys( 'End' );
			await page.keyboard.type( '-a' );
			await expect
				.poll( containerTexts )
				.toEqual( [ 'Part A text-a', 'Part B text' ] );

			await editor.canvas
				.getByRole( 'document', { name: 'Block: Part B' } )
				.click();
			await partB.click();
			await pageUtils.pressKeys( 'End' );
			await page.keyboard.type( '-b' );
			await expect
				.poll( containerTexts )
				.toEqual( [ 'Part A text-a', 'Part B text-b' ] );

			// Typing coalesces into undo levels on a timer, so the number of
			// levels the two edits produce is not fixed. Undo until the first
			// container's edit is gone rather than assuming a count.
			let reverted = false;
			for ( let i = 0; i < 8 && ! reverted; i++ ) {
				await pageUtils.pressKeys( 'primary+z' );
				try {
					await expect
						.poll( containerTexts, { timeout: 1000 } )
						.toEqual( [ 'Part A text', 'Part B text' ] );
					reverted = true;
				} catch {
					// Not there yet; undo again.
				}
			}
			expect( reverted ).toBe( true );

			// The caret was in the second container and has to follow the undo
			// into the first one.
			const selected = await page.evaluate( () => {
				const { getSelectedBlockClientId, getBlockAttributes } =
					window.wp.data.select( 'core/block-editor' );
				const clientId = getSelectedBlockClientId();
				return clientId
					? getBlockAttributes( clientId )?.content?.toString?.()
					: null;
			} );
			expect( selected ).toBe( 'Part A text' );
		}
	);
} );
