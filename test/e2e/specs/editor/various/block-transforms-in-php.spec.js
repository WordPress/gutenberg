const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * Markup both runtimes are expected to convert the same way.
 *
 * Deliberately limited to what PHP can convert today: media, embeds and
 * shortcodes are left to the editor, and the unit tests cover why.
 */
const FRAGMENTS = [
	'<h2>Ingredients</h2><p>You will need the following.</p>',
	'<ul><li>Flour</li><li>Water</li></ul>',
	'<ol><li>Mix</li><li>Knead</li></ol>',
	'<blockquote><p>All models are wrong.</p></blockquote>',
	'<pre><code>echo 1;</code></pre>',
	'<pre>line one\nline two</pre>',
	'<table><thead><tr><th>Name</th></tr></thead><tbody><tr><td>Flour</td></tr></tbody></table>',
	'<p>Before.</p><hr /><p>After.</p>',
	'<h3>Notes</h3><p>Some <strong>bold</strong> and a <a href="https://example.com/">link</a>.</p>',
];

/**
 * Converts markup the way a server-side importer would.
 *
 * @param {Object} requestUtils Request utils.
 * @param {string} html         Markup to convert.
 *
 * @return {Promise<string>} Serialized blocks.
 */
async function convertOnServer( requestUtils, html ) {
	const { markup } = await requestUtils.rest( {
		path: '/gutenberg-test/v1/html-to-blocks',
		method: 'POST',
		data: { html },
	} );

	return markup;
}

test.describe( 'Block transforms declared in block.json', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-block-transforms' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPosts(),
			requestUtils.deactivatePlugin( 'gutenberg-test-block-transforms' ),
		] );
	} );

	test( 'reach the editor from the server', async ( { admin, page } ) => {
		await admin.createNewPost();

		// Declared in block.json and nowhere else, so their presence here means
		// the whole path from the server to the block type held.
		const selectors = await page.evaluate( () => {
			const rawTransform = ( name ) =>
				window.wp.data
					.select( 'core/blocks' )
					.getBlockType( name )
					?.transforms?.from?.find(
						( transform ) => 'raw' === transform.type
					);

			return {
				code: rawTransform( 'core/code' )?.selector,
				separator: rawTransform( 'core/separator' )?.selector,
			};
		} );

		expect( selectors ).toEqual( {
			code: 'pre:has(> code)',
			separator: 'hr',
		} );
	} );

	test( 'produce markup the editor opens without an invalid block', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const markup = await convertOnServer(
			requestUtils,
			FRAGMENTS.join( '' )
		);

		const post = await requestUtils.createPost( {
			title: 'Converted on the server',
			content: markup,
			status: 'publish',
		} );

		await admin.editPost( post.id );

		const invalid = await page.evaluate( () => {
			const flatten = ( blocks ) =>
				blocks.flatMap( ( block ) => [
					block,
					...flatten( block.innerBlocks ),
				] );

			return flatten(
				window.wp.data.select( 'core/block-editor' ).getBlocks()
			)
				.filter( ( block ) => false === block.isValid )
				.map( ( block ) => block.name );
		} );

		expect( invalid ).toEqual( [] );
	} );

	test( 'agree with the editor on what the same markup becomes', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const converted = await Promise.all(
			FRAGMENTS.map( async ( html ) => ( {
				html,
				markup: await convertOnServer( requestUtils, html ),
			} ) )
		);

		await admin.createNewPost();

		const comparison = await page.evaluate(
			( cases ) =>
				cases.map( ( { html, markup } ) => ( {
					html,
					server: window.wp.blocks
						.parse( markup )
						.map( ( block ) => block.name ),
					editor: window.wp.blocks
						.rawHandler( { HTML: html } )
						.map( ( block ) => block.name ),
				} ) ),
			converted
		);

		for ( const { html, server, editor } of comparison ) {
			// Compared with the markup alongside, so a failure names the
			// fragment that diverged rather than just the block list.
			expect( { html, blocks: server } ).toEqual( {
				html,
				blocks: editor,
			} );
		}
	} );
} );
