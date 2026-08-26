const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * Markup both runtimes are expected to turn into the same blocks, with the same
 * attributes and the same nesting.
 *
 * Blocks whose `save` rebuilds its markup rather than wrapping the source —
 * Image and Table — decline server conversion and are covered separately, as
 * are the pre-filters PHP does not have (shortcodes, embeds, Markdown).
 */
const AGREED = [
	// Headings at both ends of the range, and the class a block support reads.
	'<h1>Top</h1>',
	'<h6>Deep</h6>',
	'<h2 class="fancy">Ingredients</h2>',
	'<p class="lead">Intro text.</p>',

	// Lists: nesting, and the attributes sourced off the wrapper.
	'<ul><li>Flour<ul><li>Plain</li><li>Self raising</li></ul></li><li>Water</li></ul>',
	'<ol start="3"><li>Three</li><li>Four</li></ol>',
	'<ol reversed><li>Two</li><li>One</li></ol>',
	'<ul><li><p>Para in li</p></li></ul>',

	// Quotes hold inner blocks of their own.
	'<blockquote><p>First.</p><p>Second.</p></blockquote>',

	// Text that survives a round trip through two different HTML parsers.
	'<pre><code>if (a &lt; b &amp;&amp; c) { echo "hi"; }</code></pre>',
	'<pre>  indented\n  lines</pre>',
	'<p>Some <em>em</em>, <strong>strong</strong>, <code>code</code> and a <a href="https://example.com/?a=1&amp;b=2">link</a>.</p>',
	'<p>One<br />Two</p>',
	'<p>Caf&eacute; &amp; cr&egrave;me &mdash; 5 &lt; 6.</p>',
	'<p>She said "hello" and \'bye\'.</p>',
	'<p>Emoji 🎉 and ünïcödé.</p>',
	'<p>&nbsp;</p>',
	'<h2>Outer <b>bold</b></h2>',

	// The content schema strips what the block cannot save: Code keeps no
	// attribute on its inner element.
	'<pre><code class="language-js">const a = 1;</code></pre>',

	// Markup no block claims, at the top level and wrapping blocks.
	'<div class="widget"><span>Legacy</span></div>',
	'<div><h2>Inside</h2><p>Also inside.</p></div>',
	'<section><h2>Section</h2><p>Body.</p></section>',
	'Just some text.',
];

/**
 * Markup that must convert without producing an invalid block, whatever block
 * it lands on.
 *
 * These carry the legacy attributes a block cannot hold, so the two runtimes
 * read different attributes out of them even though neither produces anything
 * the editor flags.
 */
const LEGACY = [
	'<p style="text-align:center">Centered.</p>',
	'<p dir="rtl" title="tip" data-legacy="1">Attributes everywhere.</p>',
	'<h2 id="ingredients">Anchored</h2>',
	'<hr class="is-style-dots" />',
	'<p>Teaser.</p><!--more--><p>Rest.</p>',
	'<p>Page one.</p><!--nextpage--><p>Page two.</p>',
	'<h1>Title</h1><p class="intro">Intro.</p><div class="ad">Ad</div><h2 id="s1">Section</h2><ul><li>a</li></ul><blockquote><p>Q</p></blockquote><pre><code>x</code></pre><hr /><table><tbody><tr><td>t</td></tr></tbody></table><p>Bye.</p>',
];

/**
 * Markup whose block rebuilds it on save, so the server declines to convert it.
 */
const DECLINED = [
	'<table><caption>Amounts</caption><tbody><tr><td colspan="2">Flour</td></tr></tbody></table>',
	'<figure><img src="https://example.com/a.png" alt="A" /></figure>',
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

/**
 * Reads every block the editor holds, flattened, as name, attributes and
 * validity.
 *
 * @param {Object} page Playwright page.
 *
 * @return {Promise<Object[]>} Blocks in document order.
 */
function readEditorBlocks( page ) {
	return page.evaluate( () => {
		const flatten = ( blocks ) =>
			blocks.flatMap( ( block ) => [
				block,
				...flatten( block.innerBlocks ),
			] );

		return flatten(
			window.wp.data.select( 'core/block-editor' ).getBlocks()
		).map( ( { name, attributes, isValid } ) => ( {
			name,
			attributes,
			isValid,
		} ) );
	} );
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
			[ ...AGREED, ...LEGACY, ...DECLINED ].join( '' )
		);

		const post = await requestUtils.createPost( {
			title: 'Converted on the server',
			content: markup,
			status: 'publish',
		} );

		await admin.editPost( post.id );

		const invalid = ( await readEditorBlocks( page ) )
			.filter( ( block ) => false === block.isValid )
			.map( ( block ) => block.name );

		expect( invalid ).toEqual( [] );
	} );

	test( 'agree with the editor on what the same markup becomes', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const converted = await Promise.all(
			AGREED.map( async ( html ) => ( {
				html,
				markup: await convertOnServer( requestUtils, html ),
			} ) )
		);

		await admin.createNewPost();

		const comparison = await page.evaluate( ( cases ) => {
			// Names alone would pass a heading that came out at the wrong
			// level, so attributes and nesting are compared too.
			const shape = ( blocks ) =>
				blocks.map( ( block ) => ( {
					name: block.name,
					attributes: block.attributes,
					innerBlocks: shape( block.innerBlocks ),
				} ) );

			return cases.map( ( { html, markup } ) => ( {
				html,
				server: shape( window.wp.blocks.parse( markup ) ),
				editor: shape( window.wp.blocks.rawHandler( { HTML: html } ) ),
			} ) );
		}, converted );

		for ( const { html, server, editor } of comparison ) {
			// Compared with the markup alongside, so a failure names the
			// fragment that diverged rather than just the block list.
			expect( { html, blocks: server } ).toEqual( {
				html,
				blocks: editor,
			} );
		}
	} );

	test( 'leave markup alone when a block declines server conversion', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const support = await requestUtils.rest( {
			path: '/gutenberg-test/v1/conversion-support',
		} );

		expect( support.declines ).toEqual(
			expect.arrayContaining( [ 'core/image', 'core/table' ] )
		);
		expect( support.converts ).toEqual(
			expect.arrayContaining( [ 'core/heading', 'core/paragraph' ] )
		);

		const markup = await convertOnServer(
			requestUtils,
			DECLINED.join( '' )
		);

		const post = await requestUtils.createPost( {
			title: 'Declined by the server',
			content: markup,
			status: 'publish',
		} );

		await admin.editPost( post.id );

		const blocks = await readEditorBlocks( page );

		// Custom HTML rather than a Table or an Image the editor would flag,
		// and the source markup is still there to convert later.
		expect( blocks.map( ( block ) => block.name ) ).toEqual( [
			'core/html',
			'core/html',
		] );
		expect(
			blocks
				.filter( ( block ) => false === block.isValid )
				.map( ( block ) => block.name )
		).toEqual( [] );
		expect( markup ).toContain( '<caption>Amounts</caption>' );
		expect( markup ).toContain( 'src="https://example.com/a.png"' );
	} );

	test( 'survive a round trip through the editor', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const markup = await convertOnServer(
			requestUtils,
			[ ...AGREED, ...LEGACY, ...DECLINED ].join( '' )
		);

		const post = await requestUtils.createPost( {
			title: 'Round trip',
			content: markup,
			status: 'draft',
		} );

		await admin.editPost( post.id );

		const before = await readEditorBlocks( page );

		await editor.saveDraft();
		await admin.editPost( post.id );

		// Saving rewrites every block through its own `save`, so this is where
		// markup the server only got away with would come apart.
		expect( await readEditorBlocks( page ) ).toEqual( before );
	} );
} );
