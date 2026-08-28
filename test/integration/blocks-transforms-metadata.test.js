import {
	getBlockTransforms,
	getBlockType,
	pasteHandler,
	rawHandler,
	serialize,
	// eslint-disable-next-line camelcase
	unstable__bootstrapServerSideBlockDefinitions,
} from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';

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
		expect(
			serialize(
				rawHandler( {
					HTML: '<h3 class="wp-block-heading">My Heading</h3>',
				} )
			)
		).toBe(
			'<!-- wp:heading {"level":3,"className":"wp-block-heading"} -->\n' +
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
			// The declared schema reads `{ "default": [ "style", "id" ], "paste": [] }`.
			expect( paste( '<h2 id="x" style="color:red">Hi</h2>' ) ).toBe(
				'<!-- wp:heading -->\n' +
					'<h2 class="wp-block-heading">Hi</h2>\n' +
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
