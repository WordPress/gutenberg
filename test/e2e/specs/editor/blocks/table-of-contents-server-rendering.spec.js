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

test.describe( 'Table of Contents server rendering', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
		await requestUtils.deleteAllBlocks();
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
	} );

	test( 'renders the table from current post headings on the front end', async ( {
		page,
		requestUtils,
	} ) => {
		const staleTableOfContents = tableOfContentsBlock(
			{
				ariaLabel: 'Article index',
				headings: [
					{
						content: 'Stale heading',
						level: 2,
						link: '#stale-heading',
					},
				],
				maxLevel: 3,
				ordered: false,
			},
			'<nav class="wp-block-table-of-contents"><ol><li><a class="wp-block-table-of-contents__entry" href="#stale-heading">Stale heading</a></li></ol></nav>'
		);

		const post = await requestUtils.createPost( {
			title: 'TOC server rendering',
			status: 'publish',
			content: [
				staleTableOfContents,
				headingBlock( {
					anchor: 'introduction',
					content: 'Introduction',
					level: 2,
				} ),
				headingBlock( {
					content: 'Details without anchor',
					level: 3,
				} ),
				headingBlock( {
					anchor: 'too-deep',
					content: 'Too deep',
					level: 4,
				} ),
				headingBlock( { content: '', level: 2 } ),
			].join( '\n' ),
		} );

		await page.goto( `/?p=${ post.id }` );

		const tableOfContents = page.locator(
			'nav.wp-block-table-of-contents'
		);
		await expect( tableOfContents ).toHaveAttribute(
			'aria-label',
			'Article index'
		);
		await expect( tableOfContents.locator( '> ul' ) ).toBeVisible();
		await expect( tableOfContents.locator( '> ol' ) ).toHaveCount( 0 );

		const entries = tableOfContents.locator(
			'.wp-block-table-of-contents__entry'
		);
		await expect( entries ).toHaveText( [
			'Introduction',
			'Details without anchor',
		] );
		await expect(
			tableOfContents.getByRole( 'link', { name: 'Introduction' } )
		).toHaveAttribute( 'href', '#introduction' );
		await expect(
			tableOfContents.getByRole( 'link', {
				name: 'Details without anchor',
			} )
		).toHaveCount( 0 );
		await expect(
			tableOfContents.getByText( 'Stale heading' )
		).toHaveCount( 0 );
		await expect( tableOfContents.getByText( 'Too deep' ) ).toHaveCount(
			0
		);
		await expect(
			tableOfContents.locator( '> ul > li > ul' )
		).toBeVisible();
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
				'<!-- wp:template-part {"slug":"toc-template-part","theme":"emptytheme"} /-->',
			].join( '\n' ),
		} );

		await page.goto( `/?p=${ post.id }` );

		const tableOfContents = page.locator(
			'nav.wp-block-table-of-contents'
		);
		await expect( tableOfContents ).toHaveAttribute(
			'aria-label',
			'Table of Contents'
		);
		await expect( tableOfContents.locator( '> ol' ) ).toBeVisible();
		await expect(
			tableOfContents.locator( '.wp-block-table-of-contents__entry' )
		).toHaveText( [ 'Synced pattern heading', 'Template part heading' ] );
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

	// TODO: Add paginated-post coverage when server rendering supports
	// `onlyIncludeCurrentPage`.
} );
