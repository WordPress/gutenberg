<?php
/**
 * Test WP_Block class.
 *
 * @package Gutenberg
 */

class WP_Block_Test extends WP_UnitTestCase {

	/**
	 * Fake block type registry.
	 *
	 * @var WP_Block_Type_Registry
	 */
	private $registry = null;

	/**
	 * Set up each test method.
	 */
	public function setUp() {
		parent::setUp();

		$this->registry = new WP_Block_Type_Registry();
	}

	/**
	 * Tear down each test method.
	 */
	public function tearDown() {
		parent::tearDown();

		$this->registry = null;
	}

	function test_constructor_assigns_properties_from_parsed_block() {
		$this->registry->register( 'core/example', [] );

		$parsed_blocks = parse_blocks( '<!-- wp:example {"ok":true} -->a<!-- wp:example /-->b<!-- /wp:example -->' );
		$parsed_block  = $parsed_blocks[0];
		$context       = [];
		$block         = new WP_Block( $parsed_block, $context, $this->registry );

		$this->assertEquals( $parsed_block['blockName'], $block->name );
		$this->assertEquals( $parsed_block['attrs'], $block->attributes );
		$this->assertEquals( $parsed_block['innerContent'], $block->inner_content );
		$this->assertEquals( $parsed_block['innerHTML'], $block->inner_html );
	}

	function test_constructor_assigns_block_type_from_registry() {
		$block_type_settings = [
			'attributes' => [
				'defaulted' => [
					'type'    => 'number',
					'default' => 10,
				],
			],
		];
		$this->registry->register( 'core/example', $block_type_settings );

		$parsed_block = [ 'blockName' => 'core/example' ];
		$context      = [];
		$block        = new WP_Block( $parsed_block, $context, $this->registry );

		$this->assertInstanceOf( WP_Block_Type::class, $block->block_type );
		$this->assertEquals(
			$block_type_settings['attributes'],
			$block->block_type->attributes
		);
	}

	function test_constructor_assigns_attributes_with_defaults() {
		$this->registry->register(
			'core/example',
			[
				'attributes' => [
					'defaulted' => [
						'type'    => 'number',
						'default' => 10,
					],
				],
			]
		);

		$parsed_block = [
			'blockName' => 'core/example',
			'attrs'     => [
				'explicit' => 20,
			],
		];
		$context      = [];
		$block        = new WP_Block( $parsed_block, $context, $this->registry );

		$this->assertEquals(
			[
				'defaulted' => 10,
				'explicit'  => 20,
			],
			$block->attributes
		);
	}

	function test_constructor_assigns_attributes_with_only_defaults() {
		$this->registry->register(
			'core/example',
			[
				'attributes' => [
					'defaulted' => [
						'type'    => 'number',
						'default' => 10,
					],
				],
			]
		);

		$parsed_block = [
			'blockName' => 'core/example',
			'attrs'     => [],
		];
		$context      = [];
		$block        = new WP_Block( $parsed_block, $context, $this->registry );

		$this->assertEquals( [ 'defaulted' => 10 ], $block->attributes );
	}

	function test_constructor_assigns_context_from_block_type() {
		$this->registry->register(
			'core/example',
			[
				'context' => [ 'requested' ],
			]
		);

		$parsed_block = [ 'blockName' => 'core/example' ];
		$context      = [
			'requested'   => 'included',
			'unrequested' => 'not included',
		];
		$block        = new WP_Block( $parsed_block, $context, $this->registry );

		$this->assertEquals( [ 'requested' => 'included' ], $block->context );
	}

	function test_constructor_maps_inner_blocks() {
		$this->registry->register( 'core/example', [] );

		$parsed_blocks = parse_blocks( '<!-- wp:example {"ok":true} -->a<!-- wp:example /-->b<!-- /wp:example -->' );
		$parsed_block  = $parsed_blocks[0];
		$context       = [];
		$block         = new WP_Block( $parsed_block, $context, $this->registry );

		$this->assertCount( 1, $block->inner_blocks );
		$this->assertInstanceOf( WP_Block::class, $block->inner_blocks[0] );
		$this->assertEquals( 'core/example', $block->inner_blocks[0]->name );
	}

	function test_constructor_prepares_context_for_inner_blocks() {
		$this->registry->register(
			'core/outer',
			[
				'attributes'      => [
					'recordId' => [
						'type' => 'number',
					],
				],
				'providesContext' => [
					'core/recordId' => 'recordId',
				],
			]
		);
		$this->registry->register(
			'core/inner',
			[
				'context' => [ 'core/recordId' ],
			]
		);

		$parsed_blocks = parse_blocks( '<!-- wp:outer {"recordId":10} --><!-- wp:inner /--><!-- /wp:outer -->' );
		$parsed_block  = $parsed_blocks[0];
		$context       = [ 'unrequested' => 'not included' ];
		$block         = new WP_Block( $parsed_block, $context, $this->registry );

		$this->assertCount( 0, $block->context );
		$this->assertEquals(
			[ 'core/recordId' => 10 ],
			$block->inner_blocks[0]->context
		);
	}

	function test_render_static_block_type_returns_own_content() {
		$this->registry->register( 'core/static', [] );
		$this->registry->register(
			'core/dynamic',
			[
				'render_callback' => function() {
					return 'b';
				},
			]
		);

		$parsed_blocks = parse_blocks( '<!-- wp:static -->a<!-- wp:dynamic /-->c<!-- /wp:static -->' );
		$parsed_block  = $parsed_blocks[0];
		$context       = [];
		$block         = new WP_Block( $parsed_block, $context, $this->registry );

		$this->assertSame( 'abc', $block->render() );
	}

	function test_render_passes_instance_to_render_callback() {
		$this->registry->register(
			'core/greeting',
			[
				'attributes'      => [
					'toWhom'      => [
						'type' => 'string',
					],
					'punctuation' => [
						'type'    => 'string',
						'default' => '!',
					],
				],
				'render_callback' => function( $block ) {
					return sprintf(
						'Hello %s%s',
						$block->attributes['toWhom'],
						$block->attributes['punctuation']
					);
				},
			]
		);

		$parsed_blocks = parse_blocks( '<!-- wp:greeting {"toWhom":"world"} /-->' );
		$parsed_block  = $parsed_blocks[0];
		$context       = [];
		$block         = new WP_Block( $parsed_block, $context, $this->registry );

		$this->assertSame( 'Hello world!', $block->render() );
	}

	function test_passes_attributes_to_render_callback() {
		$this->registry->register(
			'core/greeting',
			[
				'attributes'      => [
					'toWhom'      => [
						'type' => 'string',
					],
					'punctuation' => [
						'type'    => 'string',
						'default' => '!',
					],
				],
				'render_callback' => function( $block_attributes ) {
					return sprintf(
						'Hello %s%s',
						$block_attributes['toWhom'],
						$block_attributes['punctuation']
					);
				},
			]
		);

		$parsed_blocks = parse_blocks( '<!-- wp:greeting {"toWhom":"world"} /-->' );
		$parsed_block  = $parsed_blocks[0];
		$context       = [];
		$block         = new WP_Block( $parsed_block, $context, $this->registry );

		$this->assertSame( 'Hello world!', $block->render() );
	}

	function test_passes_content_to_render_callback() {
		$this->registry->register(
			'core/outer',
			[
				'render_callback' => function( $block, $content ) {
					return $content;
				},
			]
		);
		$this->registry->register(
			'core/inner',
			[
				'render_callback' => function() {
					return 'b';
				},
			]
		);

		$parsed_blocks = parse_blocks( '<!-- wp:outer -->a<!-- wp:inner /-->c<!-- /wp:outer -->' );
		$parsed_block  = $parsed_blocks[0];
		$context       = [];
		$block         = new WP_Block( $parsed_block, $context, $this->registry );

		$this->assertSame( 'abc', $block->render() );
	}

}
