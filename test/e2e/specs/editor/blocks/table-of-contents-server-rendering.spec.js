/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const headingBlock = ( { level = 2, anchor, content } ) => {
	const attributes = { level };
	if ( anchor ) {
		attributes.anchor = anchor;
	}

	const attributesJSON = JSON.stringify( attributes );
	const idAttribute = anchor ? ` id="${ anchor }"` : '';

	return `<!-- wp:heading ${ attributesJSON } -->
<h${ level } class="wp-block-heading"${ idAttribute }>${ content }</h${ level }>
<!-- /wp:heading -->`;
};

const tableOfContentsBlock = ( attributes = {}, content = '' ) => {
	const attributesJSON = Object.keys( attributes ).length
		? ` ${ JSON.stringify( attributes ) }`
		: '';

	if ( ! content ) {
		return `<!-- wp:table-of-contents${ attributesJSON } /-->`;
	}

	return `<!-- wp:table-of-contents${ attributesJSON } -->
${ content }
<!-- /wp:table-of-contents -->`;
};

const staleSavedTableOfContentsMarkup =
	'<nav class="wp-block-table-of-contents"><ol><li><a class="wp-block-table-of-contents__entry" href="#stale-heading">Stale heading</a></li></ol></nav>';

// Pages may contain other navigation landmarks, such as Navigation blocks.
// Keep the locator semantic, but qualify it to the Table of Contents wrapper.
const getTableOfContents = ( page, name = 'Table of Contents' ) =>
	page
		.getByRole( 'navigation', { name } )
		.and( page.locator( 'nav.wp-block-table-of-contents' ) );

test.describe( 'Table of Contents server rendering', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
		await requestUtils.deleteAllBlocks();
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'renders the block when placed in post content', async ( {
		page,
		requestUtils,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'TOC server rendering',
			status: 'publish',
			content: [
				tableOfContentsBlock(),
				headingBlock( {
					anchor: 'introduction',
					content: 'Introduction',
					level: 2,
				} ),
				headingBlock( {
					anchor: 'details',
					content: 'Details',
					level: 2,
				} ),
			].join( '\n' ),
		} );

		await page.goto( `/?p=${ post.id }` );

		const tableOfContents = getTableOfContents( page );
		await expect( tableOfContents.locator( '> ol' ) ).toBeVisible();
		await expect(
			tableOfContents.getByRole( 'link', { name: 'Introduction' } )
		).toHaveAttribute( 'href', '#introduction' );
		await expect(
			tableOfContents.getByRole( 'link', { name: 'Details' } )
		).toHaveAttribute( 'href', '#details' );
	} );

	test( 'renders nested heading levels as nested lists', async ( {
		page,
		requestUtils,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'TOC nested headings',
			status: 'publish',
			content: [
				tableOfContentsBlock(),
				headingBlock( {
					anchor: 'parent-heading',
					content: 'Parent heading',
					level: 2,
				} ),
				headingBlock( {
					anchor: 'child-heading',
					content: 'Child heading',
					level: 3,
				} ),
			].join( '\n' ),
		} );

		await page.goto( `/?p=${ post.id }` );

		const tableOfContents = getTableOfContents( page );
		await expect(
			tableOfContents.getByRole( 'link', { name: 'Parent heading' } )
		).toBeVisible();
		await expect(
			tableOfContents.getByRole( 'link', { name: 'Child heading' } )
		).toBeVisible();
		// The nested list is the semantic output for heading hierarchy.
		await expect(
			tableOfContents.locator( '> ol > li > ol' )
		).toBeVisible();
	} );

	test( 'renders the block when placed in a Template that contains a core/post-content block', async ( {
		page,
		requestUtils,
	} ) => {
		await requestUtils.createTemplate( 'wp_template', {
			slug: 'singular',
			title: 'Single Posts',
			content: [
				// Template headings must not be included when the TOC block
				// is placed outside the Post Content block.
				headingBlock( {
					anchor: 'template-heading',
					content: 'Template heading',
					level: 2,
				} ),
				tableOfContentsBlock( {
					ariaLabel: 'Template contents',
				} ),
				'<!-- wp:post-content {"layout":{"inherit":true}} /-->',
			].join( '\n' ),
		} );

		const post = await requestUtils.createPost( {
			title: 'TOC in template rendering',
			status: 'publish',
			content: [
				headingBlock( {
					anchor: 'post-heading',
					content: 'Post heading',
					level: 2,
				} ),
				headingBlock( {
					anchor: 'post-subheading',
					content: 'Post subheading',
					level: 3,
				} ),
			].join( '\n' ),
		} );

		await page.goto( `/?p=${ post.id }` );

		const tableOfContents = getTableOfContents( page, 'Template contents' );
		await expect(
			tableOfContents.getByRole( 'link', { name: 'Post heading' } )
		).toHaveAttribute( 'href', '#post-heading' );
		await expect(
			tableOfContents.getByRole( 'link', { name: 'Post subheading' } )
		).toHaveAttribute( 'href', '#post-subheading' );
		await expect(
			tableOfContents.getByText( 'Template heading' )
		).toHaveCount( 0 );
	} );

	test( 'includes headings from synced patterns and template parts inside post content', async ( {
		page,
		requestUtils,
	} ) => {
		const syncedPattern = await requestUtils.createBlock( {
			title: 'TOC synced pattern',
			status: 'publish',
			content: headingBlock( {
				anchor: 'synced-pattern-heading',
				content: 'Synced pattern heading',
				level: 2,
			} ),
		} );

		await requestUtils.createTemplate( 'wp_template_part', {
			slug: 'toc-template-part',
			title: 'TOC Template Part',
			content: headingBlock( {
				anchor: 'template-part-heading',
				content: 'Template part heading',
				level: 3,
			} ),
		} );

		await requestUtils.createTemplate( 'wp_template', {
			slug: 'singular',
			title: 'Singular',
			content: [
				// Template headings must not be included when the TOC block
				// is rendered from inside post content.
				headingBlock( {
					anchor: 'outside-post-content',
					content: 'Outside post content',
					level: 2,
				} ),
				'<!-- wp:post-content {"layout":{"inherit":true}} /-->',
			].join( '\n' ),
		} );

		const post = await requestUtils.createPost( {
			title: 'TOC pattern and template part rendering',
			status: 'publish',
			content: [
				tableOfContentsBlock(),
				`<!-- wp:block {"ref":${ syncedPattern.id }} /-->`,
				'<!-- wp:template-part {"slug":"toc-template-part"} /-->',
			].join( '\n' ),
		} );

		await page.goto( `/?p=${ post.id }` );

		const tableOfContents = getTableOfContents( page );
		await expect( tableOfContents.locator( '> ol' ) ).toBeVisible();
		await expect(
			tableOfContents.getByRole( 'link', {
				name: 'Synced pattern heading',
			} )
		).toHaveAttribute( 'href', '#synced-pattern-heading' );
		await expect(
			tableOfContents.getByRole( 'link', {
				name: 'Template part heading',
			} )
		).toHaveAttribute( 'href', '#template-part-heading' );
		await expect(
			tableOfContents.getByText( 'Outside post content' )
		).toHaveCount( 0 );
	} );

	test( 'respects custom aria label, unordered lists, and maximum heading level', async ( {
		page,
		requestUtils,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'TOC configured rendering',
			status: 'publish',
			content: [
				tableOfContentsBlock( {
					ariaLabel: 'Article index',
					maxLevel: 3,
					ordered: false,
				} ),
				headingBlock( {
					anchor: 'included-heading',
					content: 'Included heading',
					level: 2,
				} ),
				headingBlock( {
					anchor: 'included-subheading',
					content: 'Included subheading',
					level: 3,
				} ),
				headingBlock( {
					anchor: 'too-deep',
					content: 'Too deep',
					level: 4,
				} ),
			].join( '\n' ),
		} );

		await page.goto( `/?p=${ post.id }` );

		const tableOfContents = getTableOfContents( page, 'Article index' );
		await expect( tableOfContents.locator( '> ul' ) ).toBeVisible();
		await expect( tableOfContents.locator( '> ol' ) ).toHaveCount( 0 );
		await expect(
			tableOfContents.getByRole( 'link', { name: 'Included heading' } )
		).toHaveAttribute( 'href', '#included-heading' );
		await expect(
			tableOfContents.getByRole( 'link', {
				name: 'Included subheading',
			} )
		).toHaveAttribute( 'href', '#included-subheading' );
		await expect( tableOfContents.getByText( 'Too deep' ) ).toHaveCount(
			0
		);
	} );

	test( 'skips empty headings and renders headings without anchors as text entries', async ( {
		page,
		requestUtils,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'TOC heading entry edge cases',
			status: 'publish',
			content: [
				tableOfContentsBlock(),
				headingBlock( { content: '', level: 2 } ),
				headingBlock( {
					content: 'Heading without anchor',
					level: 2,
				} ),
				headingBlock( {
					anchor: 'heading-with-anchor',
					content: 'Heading with anchor',
					level: 2,
				} ),
			].join( '\n' ),
		} );

		await page.goto( `/?p=${ post.id }` );

		const tableOfContents = getTableOfContents( page );
		await expect(
			tableOfContents.getByText( 'Heading without anchor' )
		).toBeVisible();
		await expect(
			tableOfContents.getByText( 'Heading with anchor' )
		).toBeVisible();
		await expect(
			tableOfContents.getByRole( 'link', {
				name: 'Heading without anchor',
			} )
		).toHaveCount( 0 );
		await expect(
			tableOfContents.getByRole( 'link', {
				name: 'Heading with anchor',
			} )
		).toHaveAttribute( 'href', '#heading-with-anchor' );
	} );

	test( 'rebuilds entries from current headings instead of stale saved block markup', async ( {
		page,
		requestUtils,
	} ) => {
		const staleTableOfContents = tableOfContentsBlock(
			{
				ariaLabel: 'Current article index',
				headings: [
					{
						content: 'Stale heading',
						level: 2,
						link: '#stale-heading',
					},
				],
			},
			staleSavedTableOfContentsMarkup
		);

		const post = await requestUtils.createPost( {
			title: 'TOC stale saved markup',
			status: 'publish',
			content: [
				staleTableOfContents,
				headingBlock( {
					anchor: 'current-heading',
					content: 'Current heading',
					level: 2,
				} ),
			].join( '\n' ),
		} );

		await page.goto( `/?p=${ post.id }` );

		const tableOfContents = getTableOfContents(
			page,
			'Current article index'
		);
		await expect(
			tableOfContents.getByRole( 'link', { name: 'Current heading' } )
		).toHaveAttribute( 'href', '#current-heading' );
		await expect(
			tableOfContents.getByText( 'Stale heading' )
		).toHaveCount( 0 );
	} );

	test( 'does not render the block when placed in a Template without a core/post-content block', async ( {
		page,
		requestUtils,
	} ) => {
		await requestUtils.createTemplate( 'wp_template', {
			slug: 'singular',
			title: 'Single Posts',
			content: [
				tableOfContentsBlock(
					{
						ariaLabel: 'Template contents',
					},
					// If there is no Post Content block in the template, stale
					// saved TOC markup should not leak onto the front end.
					staleSavedTableOfContentsMarkup
				),
				headingBlock( {
					anchor: 'template-heading',
					content: 'Template heading',
					level: 2,
				} ),
			].join( '\n' ),
		} );

		const post = await requestUtils.createPost( {
			title: 'TOC in template without post content',
			status: 'publish',
			content: headingBlock( {
				anchor: 'post-heading',
				content: 'Post heading',
				level: 2,
			} ),
		} );

		await page.goto( `/?p=${ post.id }` );

		await expect(
			getTableOfContents( page, 'Template contents' )
		).toHaveCount( 0 );
		await expect( page.getByText( 'Template heading' ) ).toBeVisible();
		await expect( page.getByText( 'Post heading' ) ).toHaveCount( 0 );
	} );

	test( 'does not render the block when placed in a 404 Template without a core/post-content block', async ( {
		page,
		requestUtils,
	} ) => {
		await requestUtils.createTemplate( 'wp_template', {
			slug: '404',
			title: '404',
			content: [
				tableOfContentsBlock(
					{
						ariaLabel: 'Missing page contents',
					},
					// The 404 template has no Post Content block, so saved TOC
					// markup should be suppressed here too.
					staleSavedTableOfContentsMarkup
				),
				headingBlock( {
					anchor: 'missing-page-heading',
					content: 'Missing page heading',
					level: 2,
				} ),
			].join( '\n' ),
		} );

		await page.goto( '/missing-table-of-contents-page/' );

		await expect(
			getTableOfContents( page, 'Missing page contents' )
		).toHaveCount( 0 );
	} );

	test.fixme(
		'renders only current-page headings when placed in paginated post content and onlyIncludeCurrentPage is true',
		async ( { page, requestUtils } ) => {
			const post = await requestUtils.createPost( {
				title: 'TOC paginated post content',
				status: 'publish',
				content: [
					headingBlock( {
						anchor: 'page-one-heading',
						content: 'Page one heading',
						level: 2,
					} ),
					'<!--nextpage-->',
					tableOfContentsBlock( {
						onlyIncludeCurrentPage: true,
					} ),
					headingBlock( {
						anchor: 'page-two-heading',
						content: 'Page two heading',
						level: 2,
					} ),
				].join( '\n' ),
			} );

			await page.goto( `/?p=${ post.id }&page=2` );

			const tableOfContents = getTableOfContents( page );
			await expect(
				tableOfContents.getByRole( 'link', {
					name: 'Page two heading',
				} )
			).toHaveAttribute( 'href', '#page-two-heading' );
			await expect(
				tableOfContents.getByText( 'Page one heading' )
			).toHaveCount( 0 );
		}
	);

	test.fixme(
		'renders only current-page headings when placed in a Template and onlyIncludeCurrentPage is true',
		async ( { page, requestUtils } ) => {
			await requestUtils.createTemplate( 'wp_template', {
				slug: 'singular',
				title: 'Single Posts',
				content: [
					tableOfContentsBlock( {
						onlyIncludeCurrentPage: true,
					} ),
					'<!-- wp:post-content {"layout":{"inherit":true}} /-->',
				].join( '\n' ),
			} );

			const post = await requestUtils.createPost( {
				title: 'TOC paginated template',
				status: 'publish',
				content: [
					headingBlock( {
						anchor: 'page-one-heading',
						content: 'Page one heading',
						level: 2,
					} ),
					'<!--nextpage-->',
					headingBlock( {
						anchor: 'page-two-heading',
						content: 'Page two heading',
						level: 2,
					} ),
				].join( '\n' ),
			} );

			await page.goto( `/?p=${ post.id }&page=2` );

			const tableOfContents = getTableOfContents( page );
			await expect(
				tableOfContents.getByRole( 'link', {
					name: 'Page two heading',
				} )
			).toHaveAttribute( 'href', '#page-two-heading' );
			await expect(
				tableOfContents.getByText( 'Page one heading' )
			).toHaveCount( 0 );
		}
	);
} );
