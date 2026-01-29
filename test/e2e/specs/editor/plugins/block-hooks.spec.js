/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const dummyBlocksContent = `<!-- wp:heading -->
<h2 class="wp-block-heading">This is a dummy heading</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"className":"dummy-paragraph"} -->
<p class="dummy-paragraph">This is a dummy paragraph.</p>
<!-- /wp:paragraph -->`;
const dummyClassicContent =
	'<h2 class="dummy-classic-heading">This is a dummy heading</h2><p class="dummy-classic-paragraph">This is a dummy paragraph.</p>';

const getHookedBlockClassName = ( relativePosition, anchorBlock ) =>
	`hooked-block-${ relativePosition }-${ anchorBlock.replace(
		'core/',
		''
	) }`;

const getHookedBlockContent = ( relativePosition, anchorBlock ) =>
	`This block was inserted by the Block Hooks API in the ${ relativePosition } position next to the ${ anchorBlock } anchor block.`;

test.describe( 'Block Hooks API', () => {
	[
		{
			name: 'Post Content',
			postType: 'post',
			blockType: 'core/post-content',
			createMethod: 'createPost',
		},
		{
			name: 'Synced Pattern',
			postType: 'wp_block',
			blockType: 'core/block',
			createMethod: 'createBlock',
		},
	].forEach( ( { name, postType, blockType, createMethod } ) => {
		test.describe( `Hooked blocks in ${ name } (blocks)`, () => {
			let postObject, containerPost;
			test.beforeAll( async ( { requestUtils } ) => {
				postObject = await requestUtils[ createMethod ]( {
					title: name,
					status: 'publish',
					content: dummyBlocksContent,
				} );

				await requestUtils.activatePlugin(
					'gutenberg-test-block-hooks'
				);

				if ( postType !== 'post' ) {
					// We need a container post to hold our block instance.
					containerPost = await requestUtils.createPost( {
						title: `Block Hooks in ${ name }`,
						status: 'publish',
						content: `<!-- wp:${ blockType } {"ref":${ postObject.id }} /-->`,
						meta: {
							// Prevent Block Hooks from injecting blocks into the container
							// post content so they won't distract from the ones injected
							// into the block instance.
							_wp_ignored_hooked_blocks: '["core/paragraph"]',
						},
					} );
				} else {
					containerPost = postObject;
				}
			} );

			test.afterAll( async ( { requestUtils } ) => {
				await requestUtils.deactivatePlugin(
					'gutenberg-test-block-hooks'
				);

				await requestUtils.deleteAllPosts();
				await requestUtils.deleteAllBlocks();
			} );

			test( `should insert hooked blocks into ${ name } on frontend`, async ( {
				page,
			} ) => {
				await page.goto( `/?p=${ containerPost.id }` );
				await expect(
					page.locator( '.entry-content > *' )
				).toHaveClass( [
					'wp-block-heading',
					getHookedBlockClassName( 'after', 'core/heading' ) +
						' wp-block-paragraph',
					'dummy-paragraph wp-block-paragraph',
					getHookedBlockClassName( 'last_child', blockType ) +
						' wp-block-paragraph',
				] );
			} );

			test( `should insert hooked blocks into ${ name } in editor and respect changes made there`, async ( {
				admin,
				editor,
				page,
			} ) => {
				const expectedHookedBlockAfterHeading = {
					name: 'core/paragraph',
					attributes: {
						className: getHookedBlockClassName(
							'after',
							'core/heading'
						),
					},
				};

				const expectedHookedBlockLastChild = {
					name: 'core/paragraph',
					attributes: {
						className: getHookedBlockClassName(
							'last_child',
							blockType
						),
					},
				};

				await admin.editPost( postObject.id );
				await expect
					.poll( editor.getBlocks )
					.toMatchObject( [
						{ name: 'core/heading' },
						expectedHookedBlockAfterHeading,
						{ name: 'core/paragraph' },
						expectedHookedBlockLastChild,
					] );

				const hookedBlock = editor.canvas.getByText(
					getHookedBlockContent( 'last_child', blockType )
				);
				await editor.selectBlocks( hookedBlock );
				await editor.clickBlockToolbarButton( 'Move up' );

				// Save updated post.
				const saveButton = page
					.getByRole( 'region', { name: 'Editor top bar' } )
					.getByRole( 'button', { name: 'Save', exact: true } );
				await saveButton.click();
				await page
					.getByRole( 'button', { name: 'Dismiss this notice' } )
					.filter( { hasText: 'updated' } )
					.waitFor();

				// Reload and verify that the new position of the hooked block has been persisted.
				await page.reload();
				await expect
					.poll( editor.getBlocks )
					.toMatchObject( [
						{ name: 'core/heading' },
						expectedHookedBlockAfterHeading,
						expectedHookedBlockLastChild,
						{ name: 'core/paragraph' },
					] );

				// Verify that the frontend reflects the changes made in the editor.
				await page.goto( `/?p=${ containerPost.id }` );
				await expect(
					page.locator( '.entry-content > *' )
				).toHaveClass( [
					'wp-block-heading',
					getHookedBlockClassName( 'after', 'core/heading' ) +
						' wp-block-paragraph',
					getHookedBlockClassName( 'last_child', blockType ) +
						' wp-block-paragraph',
					'dummy-paragraph wp-block-paragraph',
				] );
			} );
		} );

		test.describe( `Hooked blocks in ${ name } (classic)`, () => {
			let postObject, containerPost;
			test.beforeAll( async ( { requestUtils } ) => {
				postObject = await requestUtils[ createMethod ]( {
					title: name,
					status: 'publish',
					content: dummyClassicContent,
				} );

				await requestUtils.activatePlugin(
					'gutenberg-test-block-hooks'
				);

				if ( postType !== 'post' ) {
					// We need a container post to hold our block instance.
					containerPost = await requestUtils.createPost( {
						title: `Block Hooks in ${ name }`,
						status: 'publish',
						content: `<!-- wp:${ blockType } {"ref":${ postObject.id }} /-->`,
						meta: {
							// Prevent Block Hooks from injecting blocks into the container
							// post content so they won't distract from the ones injected
							// into the block instance.
							_wp_ignored_hooked_blocks: '["core/paragraph"]',
						},
					} );
				} else {
					containerPost = postObject;
				}
			} );

			test.afterAll( async ( { requestUtils } ) => {
				await requestUtils.deactivatePlugin(
					'gutenberg-test-block-hooks'
				);

				await requestUtils.deleteAllPosts();
				await requestUtils.deleteAllBlocks();
			} );

			test( `should insert hooked blocks into ${ name } on frontend`, async ( {
				page,
			} ) => {
				await page.goto( `/?p=${ containerPost.id }` );
				await expect(
					page.locator( '.entry-content > *' )
				).toHaveClass( [
					'dummy-classic-heading',
					'dummy-classic-paragraph',
					getHookedBlockClassName( 'last_child', blockType ) +
						' wp-block-paragraph',
				] );
			} );

			test( `should insert hooked blocks into ${ name } in editor and respect changes made there`, async ( {
				admin,
				editor,
				page,
			} ) => {
				const expectedHookedBlockLastChild = {
					name: 'core/paragraph',
					attributes: {
						className: getHookedBlockClassName(
							'last_child',
							blockType
						),
					},
				};

				await admin.editPost( postObject.id );
				await expect
					.poll( editor.getBlocks )
					.toMatchObject( [
						{ name: 'core/freeform' },
						expectedHookedBlockLastChild,
					] );

				const hookedBlock = editor.canvas.getByText(
					getHookedBlockContent( 'last_child', blockType )
				);
				await editor.selectBlocks( hookedBlock );
				await editor.clickBlockToolbarButton( 'Move up' );

				// Save updated post.
				const saveButton = page
					.getByRole( 'region', { name: 'Editor top bar' } )
					.getByRole( 'button', { name: 'Save', exact: true } );
				await saveButton.click();
				await page
					.getByRole( 'button', { name: 'Dismiss this notice' } )
					.filter( { hasText: 'updated' } )
					.waitFor();

				// Reload and verify that the new position of the hooked block has been persisted.
				await page.reload();
				await expect
					.poll( editor.getBlocks )
					.toMatchObject( [
						expectedHookedBlockLastChild,
						{ name: 'core/freeform' },
					] );

				// Verify that the frontend reflects the changes made in the editor.
				await page.goto( `/?p=${ containerPost.id }` );
				await expect(
					page.locator( '.entry-content > *' )
				).toHaveClass( [
					getHookedBlockClassName( 'last_child', blockType ) +
						' wp-block-paragraph',
					'dummy-classic-heading',
					'dummy-classic-paragraph',
				] );
			} );
		} );
	} );

	test.describe( 'Hooked blocks in Navigation Menu', () => {
		let postObject, containerPost;
		test.beforeAll( async ( { requestUtils } ) => {
			postObject = await requestUtils.createNavigationMenu( {
				title: 'Navigation Menu',
				status: 'publish',
				content:
					'<!-- wp:navigation-link {"label":"wordpress.org","url":"https://wordpress.org","kind":"custom"} /-->',
			} );

			// The navigation menu in the site editor is only supported in block themes.
			await requestUtils.activateTheme( 'emptytheme' );
			await requestUtils.activatePlugin( 'gutenberg-test-block-hooks' );

			// We need a container to hold our Navigation block instance.
			// We create a page (instead of a post) so that it will also
			// populate the Page List block, which is one of the hooked blocks
			// we use in our testing.
			containerPost = await requestUtils.createPage( {
				title: 'Block Hooks in Navigation Menu',
				status: 'publish',
				content: `<!-- wp:navigation {"ref":${ postObject.id }} /-->`,
			} );
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( 'twentytwentyone' );
			await requestUtils.deactivatePlugin( 'gutenberg-test-block-hooks' );
			await requestUtils.deleteAllPages();
			await requestUtils.deleteAllMenus();
		} );

		test( 'should insert hooked blocks into Navigation Menu on frontend', async ( {
			page,
		} ) => {
			await page.goto( `/?p=${ containerPost.id }` );
			await expect(
				page.locator( '.wp-block-navigation__container > *' )
			).toHaveClass( [
				'wp-block-navigation-item wp-block-home-link',
				' wp-block-navigation-item wp-block-navigation-link',
				'wp-block-page-list',
			] );
		} );

		test( 'should insert hooked blocks into Navigation Menu in editor and respect changes made there', async ( {
			admin,
			editor,
			page,
		} ) => {
			await admin.visitSiteEditor( {
				postId: postObject.id,
				postType: 'wp_navigation',
				canvas: 'edit',
			} );

			// Since the Navigation block is a controlled block, we need
			// to specify its client ID when calling `getBlocks`.
			let navigationBlock = editor.canvas.getByRole( 'document', {
				name: 'Block: Navigation',
			} );
			let navigationClientId =
				await navigationBlock.getAttribute( 'data-block' );

			await expect
				.poll( () =>
					editor.getBlocks( {
						clientId: navigationClientId,
					} )
				)
				.toMatchObject( [
					{ name: 'core/home-link' },
					{ name: 'core/navigation-link' },
					{ name: 'core/page-list' },
				] );

			const hookedBlock = editor.canvas.getByRole( 'document', {
				name: 'Block: Home Link',
			} );
			await editor.selectBlocks( hookedBlock );
			await editor.clickBlockToolbarButton( 'Move right' );

			// Save updated post.
			const saveButton = page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Save', exact: true } );
			await saveButton.click();
			await page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.filter( { hasText: 'updated' } )
				.waitFor();

			// Reload and verify that the new position of the hooked block has been persisted.
			await page.reload();

			navigationBlock = editor.canvas.getByRole( 'document', {
				name: 'Block: Navigation',
			} );
			navigationClientId =
				await navigationBlock.getAttribute( 'data-block' );

			await expect
				.poll( () =>
					editor.getBlocks( {
						clientId: navigationClientId,
					} )
				)
				.toMatchObject( [
					{ name: 'core/navigation-link' },
					{ name: 'core/home-link' },
					{ name: 'core/page-list' },
				] );

			// Verify that the frontend reflects the changes made in the editor.
			await page.goto( `/?p=${ containerPost.id }` );
			await expect(
				page.locator( '.wp-block-navigation__container > *' )
			).toHaveClass( [
				' wp-block-navigation-item wp-block-navigation-link',
				'wp-block-navigation-item wp-block-home-link',
				'wp-block-page-list',
			] );
		} );
	} );
} );
