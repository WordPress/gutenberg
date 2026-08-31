/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * Builds a page whose content is a Query Loop, filtered to a single taxonomy
 * term, that renders a Post Terms block with the `post-terms-variation` block
 * style variation applied.
 *
 * The Post Terms block is set to the `post_tag` taxonomy so that whether it
 * renders any markup depends entirely on whether the queried post has tags.
 *
 * @param {Object} filter Query taxonomy filter, e.g. `{ tagIds: [ 1 ] }`.
 * @return {string} Serialized block markup.
 */
function queryLoopWithPostTerms( filter ) {
	const query = {
		perPage: 10,
		pages: 0,
		offset: 0,
		postType: 'post',
		order: 'desc',
		orderBy: 'date',
		inherit: false,
		...filter,
	};

	return `<!-- wp:query {"queryId":0,"query":${ JSON.stringify( query ) }} -->
<div class="wp-block-query">
<!-- wp:post-template -->
<!-- wp:post-terms {"term":"post_tag","className":"is-style-post-terms-variation"} /-->
<!-- /wp:post-template -->
</div>
<!-- /wp:query -->`;
}

/**
 * Creates a taxonomy term, first removing any existing term with the same name
 * so an interrupted previous run doesn't cause a `term_exists` error.
 *
 * @param {Object} requestUtils Playwright request utils.
 * @param {string} restBase     Taxonomy REST base, e.g. `categories` or `tags`.
 * @param {string} name         Term name.
 * @return {Promise<number>} The created term's id.
 */
async function createUniqueTerm( requestUtils, restBase, name ) {
	const existing = await requestUtils.rest( {
		path: `/wp/v2/${ restBase }`,
		params: { search: name, per_page: 100 },
	} );

	await Promise.all(
		existing
			.filter( ( term ) => term.name === name )
			.map( ( term ) =>
				requestUtils.rest( {
					method: 'DELETE',
					path: `/wp/v2/${ restBase }/${ term.id }`,
					params: { force: true },
				} )
			)
	);

	const term = await requestUtils.createRecord( restBase, { name } );
	return term.id;
}

test.describe( 'Post Terms block style variation styles', () => {
	let controlPageId;
	let emptyPageId;
	let categoryId;
	let tagId;

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme(
			'gutenberg-test-themes/style-variations'
		);

		// Terms aren't removed by `deleteAll*`, so clear any left over from a
		// previously interrupted run to avoid a `term_exists` error.
		categoryId = await createUniqueTerm(
			requestUtils,
			'categories',
			'Post terms variation category'
		);
		tagId = await createUniqueTerm(
			requestUtils,
			'tags',
			'Post terms variation tag'
		);

		// A post with the tag: the Post Terms block renders the tag markup.
		await requestUtils.createPost( {
			title: 'Post with a tag',
			status: 'publish',
			tags: [ tagId ],
		} );

		// A post with a category but no tags: the Post Terms block (set to
		// `post_tag`) renders no markup for it.
		await requestUtils.createPost( {
			title: 'Post without tags',
			status: 'publish',
			categories: [ categoryId ],
		} );

		// Container pages are `page` post type so they don't match the
		// `post`-type Query Loops they hold.
		const controlPage = await requestUtils.createPage( {
			title: 'Post terms variation control',
			status: 'publish',
			content: queryLoopWithPostTerms( { tagIds: [ tagId ] } ),
		} );
		controlPageId = controlPage.id;

		const emptyPage = await requestUtils.createPage( {
			title: 'Post terms variation empty',
			status: 'publish',
			content: queryLoopWithPostTerms( { categoryIds: [ categoryId ] } ),
		} );
		emptyPageId = emptyPage.id;
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPosts(),
			requestUtils.deleteAllPages(),
		] );
		await Promise.all( [
			requestUtils.rest( {
				method: 'DELETE',
				path: `/wp/v2/categories/${ categoryId }`,
				params: { force: true },
			} ),
			requestUtils.rest( {
				method: 'DELETE',
				path: `/wp/v2/tags/${ tagId }`,
				params: { force: true },
			} ),
		] );
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'are emitted and applied when the block renders markup', async ( {
		page,
	} ) => {
		await page.goto( `/?page_id=${ controlPageId }` );

		const postTerms = page.locator( '.wp-block-post-terms' );

		// The block rendered markup, so its variation styles should apply.
		await expect( postTerms ).toBeVisible();
		await expect( postTerms ).toHaveCSS( 'color', 'rgb(255, 0, 128)' );

		// The instance-scoped variation stylesheet should be present in the page.
		expect( await page.content() ).toContain(
			'is-style-post-terms-variation--'
		);
	} );

	test( 'are not emitted when the block renders no markup', async ( {
		page,
	} ) => {
		await page.goto( `/?page_id=${ emptyPageId }` );

		// The Query Loop found a post, but the Post Terms block rendered
		// nothing because the post has no tags.
		await expect( page.locator( '.wp-block-post-terms' ) ).toHaveCount( 0 );

		// The variation's instance-scoped stylesheet must not be emitted for a
		// block instance that isn't present in the markup.
		// See https://github.com/WordPress/gutenberg/issues/80718.
		expect( await page.content() ).not.toContain(
			'is-style-post-terms-variation--'
		);
	} );
} );
