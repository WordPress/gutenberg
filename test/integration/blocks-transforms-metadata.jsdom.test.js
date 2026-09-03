import fs from 'fs';
import path from 'path';
import {
	createBlock,
	getBlockTransforms,
	getBlockType,
	pasteHandler,
	rawHandler,
	registerBlockType,
	serialize,
	unregisterBlockType,
	// eslint-disable-next-line camelcase
	unstable__bootstrapServerSideBlockDefinitions,
} from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';
import { autop, removep } from '@wordpress/autop';

/**
 * The fields `get_block_editor_server_block_settings()` sends to the editor.
 *
 * Notably absent: `transforms`. The block store keeps a server-provided
 * definition over a client one, so anything the server does not send has to
 * reach the editor another way. Registering core blocks without this bootstrap
 * hides that, which is why these tests perform it first.
 */
const SERVER_PROVIDED_FIELDS = [
	'apiVersion',
	'title',
	'description',
	'icon',
	'attributes',
	'providesContext',
	'usesContext',
	'blockHooks',
	'selectors',
	'supports',
	'category',
	'styles',
	'textdomain',
	'parent',
	'ancestor',
	'keywords',
	'example',
	'variations',
	'allowedBlocks',
];

const BLOCKS_DECLARING_RAW_TRANSFORMS = [
	'code',
	'heading',
	'image',
	'list',
	'list-item',
	'more',
	'nextpage',
	'paragraph',
	'preformatted',
	'quote',
	'separator',
	'table',
];

describe( 'Transforms declared in block metadata', () => {
	beforeAll( () => {
		// Load the hooks that add the block support attributes.
		require( '../../packages/editor/src/hooks' );

		const definitions = {};

		BLOCKS_DECLARING_RAW_TRANSFORMS.forEach( ( slug ) => {
			const metadata = require(
				`../../packages/block-library/src/${ slug }/block.json`
			);

			definitions[ metadata.name ] = Object.fromEntries(
				Object.entries( metadata ).filter( ( [ key ] ) =>
					SERVER_PROVIDED_FIELDS.includes( key )
				)
			);
		} );

		unstable__bootstrapServerSideBlockDefinitions( definitions );

		registerCoreBlocks();
	} );

	it( 'registers the raw transforms of every block declaring them', () => {
		const rawTransforms = getBlockTransforms( 'from' ).filter(
			( { type } ) => 'raw' === type
		);
		const blockNames = rawTransforms.map( ( { blockName } ) => blockName );

		BLOCKS_DECLARING_RAW_TRANSFORMS.forEach( ( slug ) => {
			const { name } = require(
				`../../packages/block-library/src/${ slug }/block.json`
			);

			expect( blockNames ).toContain( name );
		} );
	} );

	it( 'converts a heading, whose matching is declared and level is mapped', () => {
		// The block's own generated class is not a custom class, so it does
		// not survive into `className`.
		expect(
			serialize(
				rawHandler( {
					HTML: '<h3 class="wp-block-heading">My Heading</h3>',
				} )
			)
		).toBe(
			'<!-- wp:heading {"level":3} -->\n' +
				'<h3 class="wp-block-heading">My Heading</h3>\n' +
				'<!-- /wp:heading -->'
		);
	} );

	it( 'converts a preformatted block, which declares its whole transform', () => {
		expect( serialize( rawHandler( { HTML: '<pre>1\n2</pre>' } ) ) ).toBe(
			'<!-- wp:preformatted -->\n' +
				'<pre class="wp-block-preformatted">1\n2</pre>\n' +
				'<!-- /wp:preformatted -->'
		);
	} );

	it( 'tells a code block from a preformatted one by selector alone', () => {
		const blocks = rawHandler( {
			HTML: '<pre><code>echo 1;</code></pre><pre>plain</pre>',
		} );

		expect( blocks.map( ( { name } ) => name ) ).toEqual( [
			'core/code',
			'core/preformatted',
		] );
	} );

	it( 'leaves no gap between the code and preformatted matchers', () => {
		// The two split `<pre>` between them: markup the Code block declines
		// — anything more than a lone `<code>` — belongs to Preformatted, or
		// pasting it would produce no block at all.
		const [ trailing ] = rawHandler( {
			HTML: '<pre><code>echo 1;</code> tail</pre>',
		} );
		expect( trailing.name ).toBe( 'core/preformatted' );

		// Blank text around the `<code>` does not defeat the Code block.
		const [ padded ] = rawHandler( {
			HTML: '<pre>  <code>echo 2;</code>\n</pre>',
		} );
		expect( padded.name ).toBe( 'core/code' );
	} );

	it( 'splits a container around a more comment', () => {
		const blocks = rawHandler( {
			HTML: '<div>Intro<!--more-->Rest</div>',
		} );

		expect( blocks.map( ( { name } ) => name ) ).toEqual( [
			'core/html',
			'core/more',
			'core/html',
		] );
		expect( serialize( blocks ) ).toBe(
			'<!-- wp:html -->\n<div>Intro</div>\n<!-- /wp:html -->\n\n' +
				'<!-- wp:more -->\n<!--more-->\n<!-- /wp:more -->\n\n' +
				'<!-- wp:html -->\n<div>Rest</div>\n<!-- /wp:html -->'
		);
	} );

	it( 'orders media around a more comment as the markup had them', () => {
		// Media before the marker leaves its container before the split, whose
		// emptied halves are dropped; media after it leaves the half the split
		// made, which stays behind empty.
		const before = rawHandler( {
			HTML: '<div><img src="/a.png"><!--more--></div>',
		} );
		expect( before.map( ( { name } ) => name ) ).toEqual( [
			'core/image',
			'core/more',
		] );

		const after = rawHandler( {
			HTML: '<div><!--more--><img src="/a.png"></div>',
		} );
		expect( after.map( ( { name } ) => name ) ).toEqual( [
			'core/more',
			'core/image',
			'core/html',
		] );
	} );

	it( 'converts a list into list items', () => {
		const [ list ] = rawHandler( {
			HTML: '<ul><li>One</li><li>Two</li></ul>',
		} );

		expect( list.name ).toBe( 'core/list' );
		expect( list.innerBlocks.map( ( { name } ) => name ) ).toEqual( [
			'core/list-item',
			'core/list-item',
		] );
	} );

	it( 'keeps the behaviour a declared transform cannot express', () => {
		const [ image ] = rawHandler( {
			HTML:
				'<figure class="alignleft">' +
				'<img src="/a.png" alt="A" class="wp-image-42"/>' +
				'</figure>',
		} );

		// Both are read out of the class names by the transform the Image block
		// still registers in JavaScript.
		expect( image.name ).toBe( 'core/image' );
		expect( image.attributes.id ).toBe( 42 );
		expect( image.attributes.align ).toBe( 'left' );
	} );

	it( 'reads an inline alignment into the nested style attribute', () => {
		const [ paragraph ] = rawHandler( {
			HTML: '<p style="color:red;text-align:center">Centred</p>',
		} );

		expect( paragraph.name ).toBe( 'core/paragraph' );
		expect( paragraph.attributes.style ).toEqual( {
			typography: { textAlign: 'center' },
		} );
	} );

	it( 'leaves an alignment the block does not accept unset', () => {
		const [ paragraph ] = rawHandler( {
			HTML: '<p style="text-align:justify">Justified</p>',
		} );

		// `enum` on a declared attribute is honoured, the same way it is on a
		// block's own attributes.
		expect( paragraph.attributes.style ).toBeUndefined();
	} );

	it( 'keeps the classes of a block whose transform is only declared', () => {
		const [ preformatted ] = rawHandler( {
			HTML: '<pre class="my-custom">Pre</pre>',
		} );

		expect( preformatted.name ).toBe( 'core/preformatted' );
		expect( preformatted.attributes.className ).toBe( 'my-custom' );
	} );

	it( 'coerces a declared numeric attribute against the shared grammar', () => {
		const name = 'test/sized';

		// Declared in metadata, as a `block.json` transform arrives.
		unstable__bootstrapServerSideBlockDefinitions( {
			[ name ]: {
				apiVersion: 3,
				title: 'Sized',
				category: 'text',
				attributes: { size: { type: 'number' } },
				transforms: {
					from: [
						{
							type: 'raw',
							selector: 'aside',
							priority: 1,
							attributes: {
								size: {
									type: 'number',
									source: 'attribute',
									selector: 'aside',
									attribute: 'data-size',
								},
							},
						},
					],
				},
			},
		} );

		registerBlockType( name, {
			title: 'Sized',
			category: 'text',
			save: () => null,
		} );

		const attributesOf = ( html ) =>
			rawHandler( { HTML: html } )[ 0 ].attributes;

		expect( attributesOf( '<aside data-size="600">x</aside>' ).size ).toBe(
			600
		);
		expect(
			attributesOf( '<aside data-size="4.5e1">x</aside>' ).size
		).toBe( 45 );
		// The strict grammar has no whitespace: `Number()` would accept the
		// padded value, and the server would refuse it.
		expect(
			attributesOf( '<aside data-size=" 600">x</aside>' ).size
		).toBeUndefined();
		// A magnitude past the float range coerces to Infinity, which JSON
		// cannot write, so it falls out as type-invalid on both runtimes.
		expect(
			attributesOf( '<aside data-size="1e309">x</aside>' ).size
		).toBeUndefined();

		unregisterBlockType( name );
	} );

	it( 'leaves a node alone when a raw transform returns nothing', () => {
		const name = 'test/skipper';

		registerBlockType( name, {
			apiVersion: 3,
			title: 'Skipper',
			category: 'text',
			supports: { anchor: true },
			attributes: {},
			transforms: {
				from: [
					{
						type: 'raw',
						selector: 'aside',
						transform: () => undefined,
					},
				],
			},
			save: () => null,
		} );

		// The transform declines the node, `id` and all: there is no block
		// to carry the anchor, and nothing to throw over.
		expect( rawHandler( { HTML: '<aside id="a">x</aside>' } ) ).toEqual(
			[]
		);

		unregisterBlockType( name );
	} );

	it( 'ignores a declared require selector that is not valid CSS', () => {
		const name = 'test/required';

		registerBlockType(
			{
				name,
				title: 'Required',
				category: 'text',
				attributes: {},
				transforms: {
					from: [
						{
							type: 'raw',
							selector: 'aside',
							schema: {
								aside: {
									children: { p: {} },
									require: [ 'p:::bad', 'p' ],
								},
							},
						},
					],
				},
			},
			{ save: () => null }
		);

		// The paste handler's content filter hands the selector to
		// `querySelector()`, which would otherwise throw out of every paste
		// holding an aside.
		expect( () =>
			pasteHandler( {
				HTML: '<aside><p>x</p></aside>',
				mode: 'BLOCKS',
			} )
		).not.toThrow();

		expect( console ).toHaveWarned();
		expect( console ).toHaveLogged();

		unregisterBlockType( name );
	} );

	it( 'keeps declared transforms when a block is registered by name', () => {
		const name = 'test/registered-by-name';

		// What a server-bootstrapped definition looks like: `block.json`
		// arrives first, and the block registers itself separately.
		unstable__bootstrapServerSideBlockDefinitions( {
			[ name ]: {
				apiVersion: 3,
				title: 'Registered by name',
				category: 'text',
				attributes: {},
				transforms: {
					from: [
						{ type: 'raw', name: 'from-raw', selector: 'aside' },
					],
				},
			},
		} );

		registerBlockType( name, {
			apiVersion: 3,
			title: 'Registered by name',
			category: 'text',
			transforms: {
				from: [
					{
						type: 'block',
						blocks: [ 'core/paragraph' ],
						transform: () => createBlock( name ),
					},
				],
			},
		} );

		const { transforms } = getBlockType( name );

		expect( transforms.from ).toHaveLength( 2 );
		expect(
			transforms.from.map( ( transform ) => transform.type ).sort()
		).toEqual( [ 'block', 'raw' ] );

		unregisterBlockType( name );
	} );

	it( 'keeps a transforms accessor lazy when nothing is declared for it', () => {
		const { transforms } = getBlockType( 'core/shortcode' );

		// The Shortcode block builds `to` on read, one entry per block
		// declaring a shortcode transform, so reading it while merging would
		// freeze it before the later blocks register.
		expect(
			Object.getOwnPropertyDescriptor( transforms, 'to' ).get
		).toBeInstanceOf( Function );

		const sources = getBlockTransforms( 'from' )
			.filter( ( { type } ) => 'shortcode' === type )
			.map( ( { blockName } ) => blockName );

		expect( sources ).toContain( 'core/video' );
		expect( transforms.to.map( ( { blocks } ) => blocks[ 0 ] ) ).toContain(
			'core/video'
		);
	} );

	it( 'normalises the text a declared shortcode transform stores', () => {
		// Classic content arrives wrapped in the paragraphs `wpautop` added,
		// and the block saves its text back verbatim.
		expect(
			serialize(
				rawHandler( {
					HTML:
						'<p>[su_box title="x"]</p>\n' +
						'<p>Hello <br>there</p>\n' +
						'<p>[/su_box]</p>',
				} )
			)
		).toBe(
			'<!-- wp:shortcode -->\n' +
				'[su_box title="x"]\n\nHello\nthere\n\n[/su_box]\n' +
				'<!-- /wp:shortcode -->'
		);
	} );

	describe( 'pasting, which resolves the schema differently', () => {
		const paste = ( HTML ) =>
			serialize( pasteHandler( { HTML, mode: 'BLOCKS' } ) );

		it( 'drops the attributes a declared schema allows only outside a paste', () => {
			// The declared schema reads `{ "default": [ "style", "id" ], "paste": [] }`,
			// so the inline style goes; the `id` survives as the block's
			// `anchor`, which the anchor support keeps even on paste.
			expect( paste( '<h2 id="x" style="color:red">Hi</h2>' ) ).toBe(
				'<!-- wp:heading {"anchor":"x"} -->\n' +
					'<h2 id="x" class="wp-block-heading">Hi</h2>\n' +
					'<!-- /wp:heading -->'
			);

			// pasteHandler logs what it received and processed.
			expect( console ).toHaveLogged();
		} );

		it( 'keeps a list nested inside a list item', () => {
			const [ list ] = pasteHandler( {
				HTML: '<ul><li>One<ul><li>Nested</li></ul></li></ul>',
				mode: 'BLOCKS',
			} );

			const [ item ] = list.innerBlocks;

			expect( item.name ).toBe( 'core/list-item' );
			expect( item.innerBlocks.map( ( { name } ) => name ) ).toEqual( [
				'core/list',
			] );

			expect( console ).toHaveLogged();
		} );
	} );
} );

describe( 'the text a shortcode transform stores', () => {
	/**
	 * `createShortcodeAttributes()` reads `shortcodeText` as
	 * `removep( autop( text ) )`, and the server reads it as
	 * `remove_paragraphs( wpautop( text ) )`. The fixture pins the round trip
	 * for both runtimes: `phpunit/experimental/block-transforms-test.php`
	 * asserts the same `expected` strings, so a change to either port that
	 * drifts from the other fails one of the two suites.
	 */
	const cases = JSON.parse(
		fs.readFileSync(
			path.join(
				__dirname,
				'fixtures/block-transforms/removep-parity.json'
			),
			'utf8'
		)
	);

	it.each( cases )(
		'reads $input the same as the server',
		( { input, expected } ) => {
			expect( removep( autop( input ) ) ).toBe( expected );
		}
	);
} );
