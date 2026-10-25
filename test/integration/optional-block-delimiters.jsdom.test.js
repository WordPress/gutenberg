import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
	createBlock,
	getBlockTypes,
	parse,
	serialize,
	setFreeformContentHandlerName,
	unregisterBlockType,
} from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

const fixturesDirectory = path.join(
	path.dirname( fileURLToPath( import.meta.url ) ),
	'fixtures/blocks'
);

const classicPost = `Hello <strong>world</strong>, this is a classic post.
It has a line break.

<h2 id="intro" data-x="">A heading</h2>
A second paragraph &amp; <em>more</em>.

<!--more-->

<ul class="custom">
	<li>One</li>
	<li>Two</li>
</ul>
<p class="intro" style="color:red;margin:0" data-x="1">Styled</p>
<script>if ( a < b ) {}</script>
<div class="unknown"><p>Kept as is</p></div>
`;

function update( block, attributes ) {
	return { ...block, attributes: { ...block.attributes, ...attributes } };
}

describe( 'optional block delimiters', () => {
	beforeAll( () => {
		registerCoreBlocks();
	} );

	afterAll( () => {
		getBlockTypes().forEach( ( { name } ) => unregisterBlockType( name ) );
	} );

	it( 'reads HTML without delimiters as blocks', () => {
		expect( parse( classicPost ).map( ( block ) => block.name ) ).toEqual( [
			'core/paragraph',
			'core/heading',
			'core/paragraph',
			'core/html',
			'core/list',
			'core/paragraph',
			'core/html',
			'core/html',
		] );
	} );

	it( 'saves untouched blocks exactly as written', () => {
		expect( serialize( parse( classicPost ) ) ).toBe( classicPost );
	} );

	it( 'saves untouched HTML as the browser writes it, adding nothing', () => {
		expect(
			serialize(
				parse( '<P CLASS=tip>Hi<br />there</P>\n\n<h2 data-x>A</h2>' )
			)
		).toBe( '<p class="tip">Hi<br>there</p>\n\n<h2 data-x="">A</h2>' );
	} );

	it( 'keeps HTML with delimiters as it is', () => {
		const content = `<!-- wp:paragraph {"dropCap":true} -->\n<p class="has-drop-cap">a</p>\n<!-- /wp:paragraph -->\n\n<p>b</p>`;
		expect( serialize( parse( content ) ) ).toBe( content );
	} );

	it( 'saves every untouched block fixture in the current format exactly as written', () => {
		const fixtures = fs
			.readdirSync( fixturesDirectory )
			.filter(
				( file ) =>
					file.endsWith( '.html' ) &&
					! file.endsWith( '.serialized.html' )
			);
		const changed = fixtures.filter( ( file ) => {
			const content = fs.readFileSync(
				path.join( fixturesDirectory, file ),
				'utf8'
			);
			const blocks = parse( content, {
				__unstableSkipMigrationLogs: true,
			} );
			// Blocks read from an old format are saved in the new one.
			return (
				blocks.every(
					( { undelimitedSource } ) => undelimitedSource
				) && serialize( blocks ) !== content
			);
		} );
		expect( changed ).toEqual( [] );
		// Old fixtures use the deprecated children source.
		expect( console ).toHaveWarnedWith(
			expect.stringContaining(
				'wp.blocks.children.matcher is deprecated'
			)
		);
	} );

	it( 'saves a block read from an old format in the new format', () => {
		expect(
			serialize(
				parse( '<!-- wp:navigation {"openSubmenusOnClick":true} /-->' )
			)
		).toBe( '<!-- wp:navigation {"submenuVisibility":"click"} /-->' );
	} );

	it( 'keeps the delimiter and unknown attributes of an edited block', () => {
		const content = `<!-- wp:heading {"level":3} -->\n<h3 class="wp-block-heading" data-x>Old</h3>\n<!-- /wp:heading -->`;
		const [ block ] = parse( content );
		expect( serialize( [ update( block, { content: 'New' } ) ] ) ).toBe(
			content.replace( 'data-x>Old', 'data-x="">New' )
		);
	} );

	it( 'changes only the edited text of a paragraph', () => {
		const blocks = parse( classicPost );
		blocks[ 0 ] = update( blocks[ 0 ], {
			content: 'Hi <strong>all</strong>',
		} );
		blocks[ 5 ] = update( blocks[ 5 ], { content: 'Restyled' } );
		expect( serialize( blocks ) ).toBe(
			classicPost
				.replace(
					'Hello <strong>world</strong>, this is a classic post.\nIt has a line break.',
					'Hi <strong>all</strong>'
				)
				.replace( '>Styled<', '>Restyled<' )
		);
	} );

	it( 'saves an edited list item without delimiters', () => {
		const [ list ] = parse( '<ul>\n\t<li>One</li>\n\t<li>Two</li>\n</ul>' );
		list.innerBlocks[ 0 ] = update( list.innerBlocks[ 0 ], {
			content: 'Uno',
		} );
		const content = serialize( [ list ] );
		expect( content ).toBe( '<ul><li>Uno</li><li>Two</li></ul>' );
		expect( serialize( parse( content ) ) ).toBe( content );
	} );

	it( 'keeps unknown attributes when a setting changes', () => {
		const blocks = parse( classicPost );
		blocks[ 1 ] = update( blocks[ 1 ], { level: 3 } );
		blocks[ 5 ] = update( blocks[ 5 ], { anchor: 'styled' } );
		expect( serialize( blocks ) ).toBe(
			classicPost
				.replace(
					'<h2 id="intro" data-x="">A heading</h2>',
					'<h3 id="intro" data-x="">A heading</h3>'
				)
				.replace( 'data-x="1">Styled', 'data-x="1" id="styled">Styled' )
		);
	} );

	it( 'keeps unknown attributes inside a delimiter when one is needed', () => {
		const blocks = parse( classicPost );
		blocks[ 5 ] = update( blocks[ 5 ], {
			style: { typography: { textAlign: 'center' } },
		} );
		const content = serialize( blocks );
		expect( content ).toBe(
			classicPost.replace(
				'<p class="intro" style="color:red;margin:0" data-x="1">Styled</p>',
				'<!-- wp:paragraph {"className":"intro","style":{"typography":{"textAlign":"center"}}} -->\n<p class="intro has-text-align-center" style="color:red;margin:0" data-x="1">Styled</p>\n<!-- /wp:paragraph -->'
			)
		);
		expect( serialize( parse( content ) ) ).toBe( content );
	} );

	it( 'reads attributes a block does not know into htmlAttributes', () => {
		const content = `<p style="background:#fffbe6;padding:12px" data-note="tip" hidden>Tip</p>`;
		const [ block ] = parse( content );
		expect( block.attributes.htmlAttributes ).toEqual( {
			style: 'background:#fffbe6;padding:12px',
			'data-note': 'tip',
			hidden: '',
		} );
		expect( serialize( [ update( block, { content: 'Tip!' } ) ] ) ).toBe(
			content.replace( 'hidden>Tip<', 'hidden="">Tip!<' )
		);
	} );

	it( 'keeps a delimited block with unknown attributes valid', () => {
		const content = `<!-- wp:paragraph -->\n<p data-note="tip">Tip</p>\n<!-- /wp:paragraph -->`;
		const [ block ] = parse( content );
		expect( block.isValid ).toBe( true );
		expect( block.attributes.htmlAttributes ).toEqual( {
			'data-note': 'tip',
		} );
	} );

	it( 'saves htmlAttributes of a new block, under its own styles', () => {
		const content = serialize( [
			createBlock( 'core/paragraph', {
				content: 'New',
				htmlAttributes: {
					style: 'color:red;border-left:4px solid',
					'data-note': 'tip',
				},
				style: { color: { text: '#000000' } },
			} ),
		] );
		expect( content ).toBe(
			`<!-- wp:paragraph {"style":{"color":{"text":"#000000"}}} -->\n<p class="has-text-color" style="color:#000000;border-left:4px solid" data-note="tip">New</p>\n<!-- /wp:paragraph -->`
		);
		expect( serialize( parse( content ) ) ).toBe( content );
	} );

	it( 'gives a new HTML block a delimiter when it handles classic content', () => {
		setFreeformContentHandlerName( 'core/html' );
		const content = serialize( [
			createBlock( 'core/html', {}, [], [ 'hello' ] ),
		] );
		setFreeformContentHandlerName( 'core/freeform' );
		expect( content ).toBe( '<!-- wp:html -->\nhello\n<!-- /wp:html -->' );
	} );

	it( 'drops the whitespace before a removed first block', () => {
		const [ , ...blocks ] = parse( '\n<p>a</p>\n\n<p>b</p>\n' );
		expect( serialize( blocks ) ).toBe( '<p>b</p>\n' );
	} );

	it( 'gives new blocks delimiters', () => {
		const [ old ] = parse( '<p>Old</p>' );
		const content = serialize( [
			old,
			createBlock( 'core/paragraph', { content: 'New' } ),
		] );
		expect( content ).toBe(
			`<p>Old</p>\n\n<!-- wp:paragraph -->\n<p>New</p>\n<!-- /wp:paragraph -->`
		);
		expect( serialize( parse( content ) ) ).toBe( content );
	} );

	describe( 'blocks inside HTML no block reads', () => {
		const cards = `<section class="cards">
	<article class="card">
		<span class="badge">Wildlife</span>
		<h3>Heron island</h3>
		<p>Six nests this year.</p>
	</article>
	<article class="card"><p style="opacity:.9">Rope grooves.</p></article>
</section>`;

		it( 'reads them as inner blocks of an HTML block', () => {
			const [ block ] = parse( cards );
			expect( block.name ).toBe( 'core/html' );
			expect(
				block.innerBlocks.map( ( { name, attributes } ) => [
					name,
					attributes.content.toString(),
				] )
			).toEqual( [
				[ 'core/heading', 'Heron island' ],
				[ 'core/paragraph', 'Six nests this year.' ],
				[ 'core/paragraph', 'Rope grooves.' ],
			] );
			expect( serialize( [ block ] ) ).toBe( cards );
		} );

		it( 'saves an edited inner block without a delimiter', () => {
			const [ block ] = parse( cards );
			block.innerBlocks[ 2 ] = update( block.innerBlocks[ 2 ], {
				content: 'Deep rope grooves.',
			} );
			const content = serialize( [ block ] );
			expect( content ).toBe(
				cards.replace( 'Rope grooves.', 'Deep rope grooves.' )
			);
			expect( serialize( parse( content ) ) ).toBe( content );
		} );

		it( 'adds a delimiter only to the inner block that needs one', () => {
			const [ block ] = parse( cards );
			block.innerBlocks[ 1 ] = update( block.innerBlocks[ 1 ], {
				dropCap: true,
			} );
			const content = serialize( [ block ] );
			expect( content ).toBe(
				cards.replace(
					'<p>Six nests this year.</p>',
					'<!-- wp:paragraph {"dropCap":true} -->\n<p class="has-drop-cap">Six nests this year.</p>\n<!-- /wp:paragraph -->'
				)
			);
			const [ readBack ] = parse( content );
			expect( readBack.innerBlocks.map( ( { name } ) => name ) ).toEqual(
				[ 'core/heading', 'core/paragraph', 'core/paragraph' ]
			);
			expect( readBack.innerBlocks[ 1 ].attributes.dropCap ).toBe( true );
			expect( serialize( [ readBack ] ) ).toBe( content );
		} );
	} );
} );
