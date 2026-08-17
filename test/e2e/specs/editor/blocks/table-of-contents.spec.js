const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const CUSTOM_HEADING_SOURCE_PLUGIN =
	'gutenberg-test-table-of-contents-heading-source';

function headingBlock( { content, level = 2, anchor } ) {
	const attributes = { level };
	if ( anchor ) {
		attributes.anchor = anchor;
	}
	const id = anchor ? ` id="${ anchor }"` : '';

	return `<!-- wp:heading ${ JSON.stringify( attributes ) } -->
<h${ level }${ id } class="wp-block-heading">${ content }</h${ level }>
<!-- /wp:heading -->`;
}

function htmlBlock( content ) {
	return `<!-- wp:html -->
${ content }
<!-- /wp:html -->`;
}

function tableOfContentsBlock() {
	return '<!-- wp:table-of-contents /-->';
}

function postContentWithTocAndHeadings( headings, extraBlocks = '' ) {
	return [
		'<!-- wp:table-of-contents /-->',
		...headings.map( headingBlock ),
		extraBlocks,
	]
		.filter( Boolean )
		.join( '\n\n' );
}

function getTableOfContentsEditorBlock( editor ) {
	return editor.canvas.getByRole( 'document', {
		name: 'Block: Table of Contents',
	} );
}

async function createPostWithContent( requestUtils, title, content ) {
	return requestUtils.createPost( {
		title,
		content,
		status: 'publish',
	} );
}

async function getSavedPostContent( requestUtils, postId ) {
	const savedPost = await requestUtils.rest( {
		path: `/wp/v2/posts/${ postId }`,
		params: {
			context: 'edit',
		},
	} );

	return savedPost.content.raw;
}

async function updatePostContent( requestUtils, postId, content ) {
	return requestUtils.rest( {
		method: 'POST',
		path: `/wp/v2/posts/${ postId }`,
		data: { content, status: 'publish' },
	} );
}

async function openPostOnFrontend( page, postId, pageNumber = 1 ) {
	const query = new URLSearchParams( { p: String( postId ) } );
	if ( pageNumber > 1 ) {
		query.set( 'page', String( pageNumber ) );
	}
	await page.goto( `/?${ query.toString() }` );
}

test.describe( 'Table of Contents', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-block-experiments',
		] );
		await requestUtils.activatePlugin( CUSTOM_HEADING_SOURCE_PLUGIN );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPosts(),
			requestUtils.deleteAllPages(),
			requestUtils.deleteAllTemplates( 'wp_template' ),
			requestUtils.deleteAllTemplates( 'wp_template_part' ),
			requestUtils.activateTheme( 'twentytwentyone' ),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( CUSTOM_HEADING_SOURCE_PLUGIN );
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test.describe( 'Writing and editing', () => {
		test.beforeEach( async ( { admin } ) => {
			await admin.createNewPost();
		} );

		test( 'updates in the editor as headings are added, removed, or reordered', async ( {
			editor,
		} ) => {
			await editor.setContent(
				postContentWithTocAndHeadings( [
					{ content: 'First section', anchor: 'first-section' },
				] )
			);

			const tableOfContents = getTableOfContentsEditorBlock( editor );
			await expect(
				tableOfContents.getByRole( 'link', { name: 'First section' } )
			).toBeVisible();

			await editor.setContent(
				postContentWithTocAndHeadings( [
					{ content: 'First section', anchor: 'first-section' },
					{ content: 'Second section', anchor: 'second-section' },
				] )
			);
			await expect( tableOfContents.getByRole( 'link' ) ).toHaveText( [
				'First section',
				'Second section',
			] );

			await editor.setContent(
				postContentWithTocAndHeadings( [
					{ content: 'Second section', anchor: 'second-section' },
				] )
			);
			await expect(
				tableOfContents.getByRole( 'link', { name: 'Second section' } )
			).toBeVisible();
			await expect(
				tableOfContents.getByRole( 'link', { name: 'First section' } )
			).toHaveCount( 0 );

			await editor.setContent(
				postContentWithTocAndHeadings( [
					{ content: 'Second section', anchor: 'second-section' },
					{ content: 'First section', anchor: 'first-section' },
				] )
			);
			await expect( tableOfContents.getByRole( 'link' ) ).toHaveText( [
				'Second section',
				'First section',
			] );
		} );

		test( 'shows the same nested heading list in the editor and after publish', async ( {
			editor,
			page,
			requestUtils,
		} ) => {
			await editor.setContent(
				postContentWithTocAndHeadings( [
					{ content: 'Preview section', anchor: 'preview-section' },
					{
						content: 'Preview subsection',
						level: 3,
						anchor: 'preview-subsection',
					},
				] )
			);

			const tableOfContents = getTableOfContentsEditorBlock( editor );
			await expect( tableOfContents.getByRole( 'link' ) ).toHaveText( [
				'Preview section',
				'Preview subsection',
			] );
			// Looking inside the parent list item checks nesting, not just text order.
			await expect(
				tableOfContents
					.getByRole( 'listitem' )
					.filter( { hasText: 'Preview section' } )
					.first()
					.getByRole( 'link', { name: 'Preview subsection' } )
			).toBeVisible();

			const postId = await editor.publishPost();
			const savedContent = await getSavedPostContent(
				requestUtils,
				postId
			);
			expect( savedContent ).toContain(
				'<!-- wp:table-of-contents /-->'
			);
			expect( savedContent ).not.toContain( '"headings"' );
			expect( savedContent ).not.toContain(
				'wp-block-table-of-contents__entry'
			);

			await openPostOnFrontend( page, postId );

			const frontendToc = page.getByRole( 'navigation', {
				name: 'Table of Contents',
			} );
			await expect( frontendToc.getByRole( 'link' ) ).toHaveText( [
				'Preview section',
				'Preview subsection',
			] );
			// Looking inside the parent list item checks nesting, not just text order.
			await expect(
				frontendToc
					.getByRole( 'listitem' )
					.filter( { hasText: 'Preview section' } )
					.first()
					.getByRole( 'link', { name: 'Preview subsection' } )
			).toBeVisible();
		} );

		test( 'uses the anchor chosen for a heading after publish', async ( {
			admin,
			editor,
			page,
			requestUtils,
		} ) => {
			const headingText = 'Chosen section';
			const chosenAnchor = 'reader-picked-section';
			const post = await requestUtils.createPost( {
				title: 'Chosen anchor table of contents',
				content: postContentWithTocAndHeadings( [
					{ content: headingText },
				] ),
				status: 'draft',
			} );

			await admin.editPost( post.id );

			await editor.canvas
				.getByText( headingText, { exact: true } )
				.last()
				.click();
			await editor.openDocumentSettingsSidebar();
			const editorSettings = page.getByRole( 'region', {
				name: 'Editor settings',
			} );
			await editorSettings
				.getByRole( 'button', { name: 'Advanced' } )
				.click();
			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'textbox', { name: /HTML anchor/i } )
				.fill( chosenAnchor );

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{ name: 'core/table-of-contents' },
				{
					name: 'core/heading',
					attributes: {
						content: headingText,
						anchor: chosenAnchor,
					},
				},
			] );

			const postId = await editor.publishPost();
			await openPostOnFrontend( page, postId );

			const link = page
				.getByRole( 'navigation', { name: 'Table of Contents' } )
				.getByRole( 'link', { name: headingText } );

			await expect( link ).toHaveAttribute(
				'href',
				new RegExp( `#${ chosenAnchor }$` )
			);

			await link.click();
			await expect( page ).toHaveURL(
				new RegExp( `#${ chosenAnchor }$` )
			);
			await expect(
				page.locator( `#${ chosenAnchor }` )
			).toBeInViewport();
		} );

		test( 'limits visible heading levels in the editor and after publish when the block setting changes', async ( {
			editor,
			page,
		} ) => {
			await editor.setContent(
				postContentWithTocAndHeadings( [
					{ content: 'Main section', anchor: 'main-section' },
					{
						content: 'Subsection',
						level: 3,
						anchor: 'subsection',
					},
					{
						content: 'Detailed aside',
						level: 4,
						anchor: 'detailed-aside',
					},
				] )
			);

			await getTableOfContentsEditorBlock( editor ).click();
			await editor.openDocumentSettingsSidebar();
			await page
				.getByRole( 'combobox', {
					name: 'Include headings down to level',
				} )
				.selectOption( '3' );

			const tableOfContents = getTableOfContentsEditorBlock( editor );
			await expect( tableOfContents.getByRole( 'link' ) ).toHaveText( [
				'Main section',
				'Subsection',
			] );
			// Heading 4 is deeper than the selected Heading 3 limit.
			await expect(
				tableOfContents.getByRole( 'link', {
					name: 'Detailed aside',
				} )
			).toHaveCount( 0 );

			const postId = await editor.publishPost();
			await openPostOnFrontend( page, postId );

			const frontendToc = page.getByRole( 'navigation', {
				name: 'Table of Contents',
			} );
			await expect( frontendToc.getByRole( 'link' ) ).toHaveText( [
				'Main section',
				'Subsection',
			] );
			await expect(
				frontendToc.getByRole( 'link', { name: 'Detailed aside' } )
			).toHaveCount( 0 );
		} );

		test( 'switches list styles in the editor and keeps the chosen style after publish', async ( {
			editor,
			page,
		} ) => {
			await editor.setContent(
				postContentWithTocAndHeadings( [
					{ content: 'List style section', anchor: 'list-style' },
				] )
			);

			const tableOfContents = getTableOfContentsEditorBlock( editor );
			const list = tableOfContents.getByRole( 'list' ).first();
			await expect( list ).toHaveCSS( 'list-style-type', 'decimal' );

			await getTableOfContentsEditorBlock( editor ).click();
			await editor.clickBlockToolbarButton( 'Unordered' );
			await expect( list ).toHaveCSS( 'list-style-type', 'disc' );

			await editor.clickBlockToolbarButton( 'Ordered' );
			await expect( list ).toHaveCSS( 'list-style-type', 'decimal' );

			await editor.clickBlockToolbarButton( 'Unordered' );
			// Use a non-default style for the published assertion below.
			await expect( list ).toHaveCSS( 'list-style-type', 'disc' );

			const postId = await editor.publishPost();
			await openPostOnFrontend( page, postId );

			await expect(
				page
					.getByRole( 'navigation', { name: 'Table of Contents' } )
					.getByRole( 'list' )
					.first()
			).toHaveCSS( 'list-style-type', 'disc' );
		} );

		test( 'shows an editor notice and does not render on the front of site when no headings exist', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( { name: 'core/table-of-contents' } );

			const tableOfContents = getTableOfContentsEditorBlock( editor );
			await expect( tableOfContents ).toContainText(
				'Start adding Heading blocks to create a table of contents.'
			);
			await expect( tableOfContents ).toContainText(
				'Headings with HTML anchors will be linked here.'
			);

			const postId = await editor.publishPost();
			await openPostOnFrontend( page, postId );
			await expect(
				page.getByRole( 'navigation', { name: 'Table of Contents' } )
			).toHaveCount( 0 );
		} );
	} );

	test.describe( 'Reading and navigating', () => {
		test( 'front-of-site table of contents reflects updated post headings', async ( {
			admin,
			editor,
			page,
			requestUtils,
		} ) => {
			await admin.createNewPost();
			await editor.setContent(
				postContentWithTocAndHeadings( [
					{
						content: 'Original section',
						anchor: 'original-section',
					},
				] )
			);

			const postId = await editor.publishPost();
			await openPostOnFrontend( page, postId );

			await expect(
				page
					.getByRole( 'navigation', {
						name: 'Table of Contents',
					} )
					.getByRole( 'link', { name: 'Original section' } )
			).toBeVisible();

			// Update the post content without opening the editor so the reader view must reflect the current post headings.
			await updatePostContent(
				requestUtils,
				postId,
				postContentWithTocAndHeadings( [
					{
						content: 'Updated section',
						anchor: 'updated-section',
					},
				] )
			);

			await openPostOnFrontend( page, postId );

			const tableOfContents = page.getByRole( 'navigation', {
				name: 'Table of Contents',
			} );
			await expect(
				tableOfContents.getByRole( 'link', {
					name: 'Updated section',
				} )
			).toBeVisible();
			await expect(
				tableOfContents.getByRole( 'link', {
					name: 'Original section',
				} )
			).toHaveCount( 0 );

			await tableOfContents
				.getByRole( 'link', { name: 'Updated section' } )
				.click();
			await expect( page ).toHaveURL( /#updated-section$/ );
			await expect( page.locator( '#updated-section' ) ).toBeInViewport();
		} );

		test( 'clicking a table of contents item on the front of site scrolls to the matching section', async ( {
			page,
			requestUtils,
		} ) => {
			const post = await createPostWithContent(
				requestUtils,
				'Table of Contents navigation',
				[
					tableOfContentsBlock(),
					// Push the target below the viewport so the click must move the reader to the section, not only update the URL hash.
					'<!-- wp:spacer {"height":"1000px"} --><div style="height:1000px" aria-hidden="true" class="wp-block-spacer"></div><!-- /wp:spacer -->',
					headingBlock( {
						content: 'Destination section',
						anchor: 'destination-section',
					} ),
				].join( '\n\n' )
			);

			await openPostOnFrontend( page, post.id );

			await page
				.getByRole( 'navigation', { name: 'Table of Contents' } )
				.getByRole( 'link', { name: 'Destination section' } )
				.click();

			await expect( page ).toHaveURL( /#destination-section$/ );
			await expect(
				page.locator( '#destination-section' )
			).toBeInViewport();
		} );

		test( 'clicking a front-of-site hash link keeps the reader on the post page', async ( {
			page,
			requestUtils,
		} ) => {
			const post = await createPostWithContent(
				requestUtils,
				'Valid table of contents links',
				[
					tableOfContentsBlock(),
					headingBlock( {
						content: 'Reliable section',
						anchor: 'reliable-section',
					} ),
				].join( '\n\n' )
			);

			await openPostOnFrontend( page, post.id );
			await page
				.getByRole( 'navigation', { name: 'Table of Contents' } )
				.getByRole( 'link', { name: 'Reliable section' } )
				.click();

			// This guards the "no broken page" story separately from scroll position.
			await expect(
				page.getByRole( 'heading', { name: 'Page not found' } )
			).toHaveCount( 0 );
			await expect(
				page.getByRole( 'heading', { name: 'Reliable section' } )
			).toBeVisible();
		} );

		test( 'clicking a front-of-site link to page 2 opens that page and section', async ( {
			page,
			requestUtils,
		} ) => {
			const post = await createPostWithContent(
				requestUtils,
				'Paginated table of contents',
				'Temporary content'
			);
			await updatePostContent(
				requestUtils,
				post.id,
				[
					tableOfContentsBlock(),
					headingBlock( {
						content: 'First page section',
						anchor: 'first-page-section',
					} ),
					'<!-- wp:nextpage --><!--nextpage--><!-- /wp:nextpage -->',
					headingBlock( {
						content: 'Second page section',
						anchor: 'second-page-section',
					} ),
				].join( '\n\n' )
			);

			await openPostOnFrontend( page, post.id );
			await page
				.getByRole( 'navigation', { name: 'Table of Contents' } )
				.getByRole( 'link', { name: 'Second page section' } )
				.click();

			// WordPress may use pretty or query pagination; either way the reader must land on page 2 at this section.
			await expect( page ).toHaveURL(
				/(\/2\/|[?&]page=2).*#second-page-section$/
			);
			await expect(
				page.locator( '#second-page-section' )
			).toBeInViewport();
		} );

		// Editor nesting is covered by the preview test above; this reader-story test checks the published structure.
		test( 'viewing nested headings on the front of site shows subsections nested under their section', async ( {
			page,
			requestUtils,
		} ) => {
			const post = await createPostWithContent(
				requestUtils,
				'Nested table of contents',
				[
					tableOfContentsBlock(),
					headingBlock( {
						content: 'Main Section',
						anchor: 'main-section',
					} ),
					headingBlock( {
						content: 'Subsection',
						level: 3,
						anchor: 'subsection',
					} ),
				].join( '\n\n' )
			);

			await openPostOnFrontend( page, post.id );

			const tableOfContents = page.getByRole( 'navigation', {
				name: 'Table of Contents',
			} );
			const mainItem = tableOfContents
				.getByRole( 'listitem' )
				.filter( { hasText: 'Main Section' } )
				.first();
			// Looking inside the parent list item checks nesting, not just text order.
			await expect(
				mainItem.getByRole( 'link', { name: 'Subsection' } )
			).toBeVisible();
		} );
	} );

	test.describe( 'Accessibility', () => {
		test( 'is exposed as a distinct named region on the front of site', async ( {
			page,
			requestUtils,
		} ) => {
			const post = await createPostWithContent(
				requestUtils,
				'Named table of contents',
				[
					tableOfContentsBlock(),
					headingBlock( {
						content: 'Named region section',
						anchor: 'named-region-section',
					} ),
				].join( '\n\n' )
			);

			await openPostOnFrontend( page, post.id );

			await expect(
				page.getByRole( 'navigation', { name: 'Table of Contents' } )
			).toBeVisible();
		} );

		test( 'keyboard focus reaches and moves through front-of-site links in predictable order', async ( {
			page,
			requestUtils,
		} ) => {
			const post = await createPostWithContent(
				requestUtils,
				'Keyboard table of contents',
				[
					tableOfContentsBlock(),
					headingBlock( {
						content: 'Keyboard first',
						anchor: 'keyboard-first',
					} ),
					headingBlock( {
						content: 'Keyboard second',
						anchor: 'keyboard-second',
					} ),
				].join( '\n\n' )
			);

			await openPostOnFrontend( page, post.id );

			const tableOfContents = page.getByRole( 'navigation', {
				name: 'Table of Contents',
			} );
			const firstLink = tableOfContents.getByRole( 'link', {
				name: 'Keyboard first',
			} );
			const secondLink = tableOfContents.getByRole( 'link', {
				name: 'Keyboard second',
			} );

			for ( let i = 0; i < 20; i++ ) {
				await page.keyboard.press( 'Tab' );
				if (
					await firstLink.evaluate( ( node ) =>
						node.matches( ':focus' )
					)
				) {
					break;
				}
			}
			await expect( firstLink ).toBeFocused();
			await page.keyboard.press( 'Tab' );
			await expect( secondLink ).toBeFocused();
		} );

		test( 'is distinguishable from the site main menu on the front of site', async ( {
			page,
			requestUtils,
		} ) => {
			const post = await createPostWithContent(
				requestUtils,
				'Distinct navigation regions',
				[
					htmlBlock(
						'<nav aria-label="Main menu"><a href="/">Home</a></nav>'
					),
					tableOfContentsBlock(),
					headingBlock( {
						content: 'Content navigation section',
						anchor: 'content-navigation-section',
					} ),
				].join( '\n\n' )
			);

			await openPostOnFrontend( page, post.id );

			await expect(
				page.getByRole( 'navigation', { name: 'Main menu' } )
			).toBeVisible();
			await expect(
				page.getByRole( 'navigation', { name: 'Table of Contents' } )
			).toBeVisible();
		} );
	} );

	test.describe( 'Placing the block across a site', () => {
		test.beforeEach( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( 'emptytheme' );
		} );

		// Desired behavior: ToC in templates should list headings from the viewed post; trunk does not yet support template placement.
		test.fixme(
			'a table of contents added once to a shared template uses each viewed post heading list',
			async ( { page, requestUtils } ) => {
				await requestUtils.createTemplate( 'wp_template', {
					// The single template slug makes this template apply to posts viewed on the front of site.
					slug: 'single',
					title: 'Single',
					content: [
						'<!-- wp:table-of-contents /-->',
						'<!-- wp:post-content {"layout":{"inherit":true}} /-->',
					].join( '\n\n' ),
				} );

				const firstPost = await createPostWithContent(
					requestUtils,
					'First templated post',
					headingBlock( {
						content: 'First post section',
						anchor: 'first-post-section',
					} )
				);
				const secondPost = await createPostWithContent(
					requestUtils,
					'Second templated post',
					headingBlock( {
						content: 'Second post section',
						anchor: 'second-post-section',
					} )
				);

				// The same ToC block lives in the template, so each post should populate it from the post being viewed.
				await openPostOnFrontend( page, firstPost.id );
				await expect(
					page
						.getByRole( 'navigation', {
							name: 'Table of Contents',
						} )
						.getByRole( 'link', { name: 'First post section' } )
				).toBeVisible();

				await openPostOnFrontend( page, secondPost.id );
				await expect(
					page
						.getByRole( 'navigation', {
							name: 'Table of Contents',
						} )
						.getByRole( 'link', { name: 'Second post section' } )
				).toBeVisible();
			}
		);

		// Desired behavior: a template-level ToC should still create working
		// links when headings were authored in the Post Editor without a ToC in
		// post content. In that scenario, the Single template contains the ToC,
		// `generateAnchors` keeps its default false value, and the template is
		// never loaded while editing the post. That means the Heading block's
		// ToC-triggered editor auto-anchor generation never runs for the post
		// heading, so template ToC support needs a separate anchor strategy.
		test.fixme(
			'a table of contents in a shared template links to post headings created without a post-level table of contents',
			async ( { page, requestUtils } ) => {
				await requestUtils.createTemplate( 'wp_template', {
					// The single template slug makes this template apply to posts viewed on the front of site.
					slug: 'single',
					title: 'Single',
					content: [
						'<!-- wp:table-of-contents /-->',
						'<!-- wp:post-content {"layout":{"inherit":true}} /-->',
					].join( '\n\n' ),
				} );
				const post = await createPostWithContent(
					requestUtils,
					'Unanchored templated post',
					headingBlock( {
						content: 'Post editor section',
					} )
				);

				await openPostOnFrontend( page, post.id );

				const tableOfContents = page.getByRole( 'navigation', {
					name: 'Table of Contents',
				} );
				const link = tableOfContents.getByRole( 'link', {
					name: 'Post editor section',
				} );
				await expect( link ).toHaveAttribute(
					'href',
					/#post-editor-section$/
				);
				await link.click();
				await expect( page ).toHaveURL( /#post-editor-section$/ );
				await expect(
					page.locator( '#post-editor-section' )
				).toBeInViewport();
			}
		);

		// Desired behavior: ToC in template editing should explain that it uses viewed post headings; trunk only shows the generic empty-heading placeholder.
		test.fixme(
			'template editing explains when a live example cannot be shown and the front of site uses the viewed post',
			async ( { admin, editor, page, requestUtils } ) => {
				await requestUtils.createTemplate( 'wp_template', {
					slug: 'single',
					title: 'Single',
					content: [
						'<!-- wp:table-of-contents /-->',
						'<!-- wp:post-content {"layout":{"inherit":true}} /-->',
					].join( '\n\n' ),
				} );
				const post = await createPostWithContent(
					requestUtils,
					'Template preview post',
					headingBlock( {
						content: 'Template preview section',
						anchor: 'template-preview-section',
					} )
				);

				await admin.visitSiteEditor( {
					postId: 'emptytheme//single',
					postType: 'wp_template',
					canvas: 'edit',
				} );

				await expect(
					getTableOfContentsEditorBlock( editor )
				).toContainText(
					'This table of contents will show headings from the post being viewed.'
				);

				await openPostOnFrontend( page, post.id );
				await expect(
					page
						.getByRole( 'navigation', {
							name: 'Table of Contents',
						} )
						.getByRole( 'link', {
							name: 'Template preview section',
						} )
				).toBeVisible();
			}
		);

		// Desired behavior: ToC in templates should list only the viewed post's own headings.
		test.fixme(
			'only lists headings from the viewed post content boundary',
			async ( { page, requestUtils } ) => {
				await requestUtils.createTemplate( 'wp_template_part', {
					slug: 'toc-header',
					title: 'ToC Header',
					content: headingBlock( {
						content: 'Header template heading',
						anchor: 'header-template-heading',
					} ),
				} );
				await requestUtils.createTemplate( 'wp_template', {
					slug: 'single',
					title: 'Single',
					content: [
						'<!-- wp:template-part {"slug":"toc-header","tagName":"header","theme":"emptytheme"} /-->',
						headingBlock( {
							content: 'Template heading',
							anchor: 'template-heading',
						} ),
						'<!-- wp:table-of-contents /-->',
						'<!-- wp:post-content {"layout":{"inherit":true}} /-->',
					].join( '\n\n' ),
				} );
				const post = await createPostWithContent(
					requestUtils,
					'Post headings only',
					headingBlock( {
						content: 'Actual post section',
						anchor: 'actual-post-section',
					} )
				);

				await openPostOnFrontend( page, post.id );

				const tableOfContents = page.getByRole( 'navigation', {
					name: 'Table of Contents',
				} );
				await expect(
					tableOfContents.getByRole( 'link', {
						name: 'Actual post section',
					} )
				).toBeVisible();
				// Template-level headings are outside the viewed post context and should be ignored.
				await expect(
					tableOfContents.getByText( 'Template heading' )
				).toHaveCount( 0 );
				// Template part headings, such as header/footer headings, should also be ignored.
				await expect(
					tableOfContents.getByText( 'Header template heading' )
				).toHaveCount( 0 );
			}
		);

		// Desired behavior: ToC in templates without post content should show a specific editor explanation; trunk only shows the generic empty-heading placeholder.
		test.fixme(
			'templates that do not render post content show an editor placeholder and render nothing to readers',
			async ( { admin, editor, page, requestUtils } ) => {
				await requestUtils.createTemplate( 'wp_template', {
					slug: 'archive',
					title: 'Archive',
					content: '<!-- wp:table-of-contents /-->',
				} );

				await admin.visitSiteEditor( {
					postId: 'emptytheme//archive',
					postType: 'wp_template',
					canvas: 'edit',
				} );
				// TODO: Make this placeholder explain how users can fix the template, not only why no ToC can render.
				await expect(
					getTableOfContentsEditorBlock( editor )
				).toContainText(
					'Table of Contents needs a single post or page to list headings.'
				);

				await page.goto( '/?m=202001' );
				await expect(
					page.getByRole( 'navigation', {
						name: 'Table of Contents',
					} )
				).toHaveCount( 0 );
			}
		);
	} );

	test.describe( 'Supporting content built with other blocks', () => {
		test.beforeEach( async ( { admin } ) => {
			await admin.createNewPost();
		} );

		// Desired behavior: ToC should use the visible customized heading text from synced pattern overrides; this PR only handles direct core Heading blocks.
		test.fixme(
			'shows the customized synced pattern heading in the front-of-site table of contents',
			async ( { page, requestUtils } ) => {
				const customizableHeadingName = 'Section title';
				const syncedPattern = await requestUtils.createBlock( {
					title: 'Reusable section',
					status: 'publish',
					content: `<!-- wp:heading {"anchor":"custom-section-title","metadata":{"name":"${ customizableHeadingName }","bindings":{"__default":{"source":"core/pattern-overrides"}}}} -->
<h2 id="custom-section-title" class="wp-block-heading">Reusable section title</h2>
<!-- /wp:heading -->`,
				} );
				const post = await createPostWithContent(
					requestUtils,
					'Customized synced pattern table of contents',
					[
						'<!-- wp:table-of-contents /-->',
						`<!-- wp:block {"ref":${ syncedPattern.id },"content":{"${ customizableHeadingName }":{"content":"Custom section title"}}} /-->`,
					].join( '\n\n' )
				);

				await openPostOnFrontend( page, post.id );

				await expect(
					page.getByRole( 'heading', {
						name: 'Custom section title',
					} )
				).toBeVisible();
				const tableOfContents = page.getByRole( 'navigation', {
					name: 'Table of Contents',
				} );
				await expect(
					tableOfContents.getByRole( 'link', {
						name: 'Custom section title',
					} )
				).toHaveAttribute( 'href', /#custom-section-title$/ );
				await expect(
					tableOfContents.getByText( 'Reusable section title' )
				).toHaveCount( 0 );
			}
		);

		// Desired behavior: ToC should include registered pattern headings once server-side referenced-content traversal is implemented.
		test.fixme(
			'registered pattern block headings appear in the front-of-site table of contents',
			async ( { page, requestUtils } ) => {
				const post = await createPostWithContent(
					requestUtils,
					'Registered pattern heading table of contents',
					[
						'<!-- wp:table-of-contents /-->',
						'<!-- wp:pattern {"slug":"gutenberg-test/table-of-contents-pattern-heading"} /-->',
					].join( '\n\n' )
				);

				await openPostOnFrontend( page, post.id );

				await expect(
					page.getByRole( 'heading', {
						name: 'Registered pattern heading',
						exact: true,
					} )
				).toBeVisible();
				await expect(
					page
						.getByRole( 'navigation', {
							name: 'Table of Contents',
						} )
						.getByRole( 'link', {
							name: 'Registered pattern heading',
						} )
				).toHaveAttribute( 'href', /#registered-pattern-heading$/ );
			}
		);

		// This covers the author story that headings should count no matter which block created them.
		// Desired behavior: ToC should extract heading elements from non-Heading blocks; trunk only observes core Heading blocks.
		test.fixme(
			'heading elements created by non-Heading blocks appear in the editor and after publish',
			async ( { editor, page } ) => {
				await editor.setContent(
					[
						'<!-- wp:table-of-contents /-->',
						htmlBlock(
							'<h2 id="custom-html-heading">Custom HTML heading</h2>'
						),
					].join( '\n\n' )
				);

				await expect(
					getTableOfContentsEditorBlock( editor )
				).toContainText( 'Custom HTML heading' );

				const postId = await editor.publishPost();
				await openPostOnFrontend( page, postId );
				await expect(
					page
						.getByRole( 'navigation', {
							name: 'Table of Contents',
						} )
						.getByRole( 'link', {
							name: 'Custom HTML heading',
						} )
				).toBeVisible();
			}
		);

		// Desired behavior: ToC should support plugin-registered heading sources; trunk has no custom heading-source contract yet.
		test.fixme(
			'a plugin heading-source block appears in the editor and after publish while a plain heading-like block is ignored',
			async ( { editor, page } ) => {
				await editor.setContent(
					[
						'<!-- wp:table-of-contents /-->',
						`<!-- wp:e2e-tests/table-of-contents-heading-source {"content":"Plugin heading source","anchor":"plugin-heading-source"} -->
<h2 id="plugin-heading-source" class="wp-block-e2e-tests-table-of-contents-heading-source">Plugin heading source</h2>
<!-- /wp:e2e-tests/table-of-contents-heading-source -->`,
						`<!-- wp:e2e-tests/table-of-contents-heading-like {"content":"Plain heading-like block","anchor":"plain-heading-like-block"} -->
<h2 id="plain-heading-like-block" class="wp-block-e2e-tests-table-of-contents-heading-like">Plain heading-like block</h2>
<!-- /wp:e2e-tests/table-of-contents-heading-like -->`,
					].join( '\n\n' )
				);

				await expect(
					getTableOfContentsEditorBlock( editor )
				).toContainText( 'Plugin heading source' );
				// Both test blocks are registered block types; only the heading-source block represents the future ToC opt-in contract.
				await expect(
					getTableOfContentsEditorBlock( editor ).getByText(
						'Plain heading-like block'
					)
				).toHaveCount( 0 );

				const postId = await editor.publishPost();
				await openPostOnFrontend( page, postId );
				const tableOfContents = page.getByRole( 'navigation', {
					name: 'Table of Contents',
				} );
				await expect(
					tableOfContents.getByRole( 'link', {
						name: 'Plugin heading source',
					} )
				).toBeVisible();
				await expect(
					tableOfContents.getByText( 'Plain heading-like block' )
				).toHaveCount( 0 );
			}
		);
	} );
} );
