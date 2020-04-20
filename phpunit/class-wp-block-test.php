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
		$this->registry->register( 'core/example', array() );

		$parsed_blocks = parse_blocks( '<!-- wp:example {"ok":true} -->a<!-- wp:example /-->b<!-- /wp:example -->' );
		$parsed_block  = $parsed_blocks[0];
		$context       = array();
		$block         = new WP_Block( $parsed_block, $context, $this->registry );

		$this->assertEquals( $parsed_block['blockName'], $block->name );
		$this->assertEquals( $parsed_block['attrs'], $block->attributes );
		$this->assertEquals( $parsed_block['innerContent'], $block->inner_content );
		$this->assertEquals( $parsed_block['innerHTML'], $block->inner_html );
	}

	function test_constructor_assigns_block_type_from_registry() {
		$block_type_settings = array(
			'attributes' => array(
				'defaulted' => array(
					'type'    => 'number',
					'default' => 10,
				),
			),
		);
		$this->registry->register( 'core/example', $block_type_settings );

		$parsed_block = array( 'blockName' => 'core/example' );
		$context      = array();
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
			array(
				'attributes' => array(
					'defaulted' => array(
						'type'    => 'number',
						'default' => 10,
					),
				),
			)
		);

		$parsed_block = array(
			'blockName' => 'core/example',
			'attrs'     => array(
				'explicit' => 20,
			),
		);
		$context      = array();
		$block        = new WP_Block( $parsed_block, $context, $this->registry );

		$this->assertEquals(
			array(
				'defaulted' => 10,
				'explicit'  => 20,
			),
			$block->attributes
		);
	}

	function test_constructor_assigns_attributes_with_only_defaults() {
		$this->registry->register(
			'core/example',
			array(
				'attributes' => array(
					'defaulted' => array(
						'type'    => 'number',
						'default' => 10,
					),
				),
			)
		);

		$parsed_block = array(
			'blockName' => 'core/example',
			'attrs'     => array(),
		);
		$context      = array();
		$block        = new WP_Block( $parsed_block, $context, $this->registry );

		$this->assertEquals( array( 'defaulted' => 10 ), $block->attributes );
	}

	function test_constructor_assigns_context_from_block_type() {
		$this->registry->register(
			'core/example',
			array(
				'context' => array( 'requested' ),
			)
		);

		$parsed_block = array( 'blockName' => 'core/example' );
		$context      = array(
			'requested'   => 'included',
			'unrequested' => 'not included',
		);
		$block        = new WP_Block( $parsed_block, $context, $this->registry );

		$this->assertEquals( array( 'requested' => 'included' ), $block->context );
	}

	function test_constructor_maps_inner_blocks() {
		$this->registry->register( 'core/example', array() );

		$parsed_blocks = parse_blocks( '<!-- wp:example {"ok":true} -->a<!-- wp:example /-->b<!-- /wp:example -->' );
		$parsed_block  = $parsed_blocks[0];
		$context       = array();
		$block         = new WP_Block( $parsed_block, $context, $this->registry );

		$this->assertCount( 1, $block->inner_blocks );
		$this->assertInstanceOf( WP_Block::class, $block->inner_blocks[0] );
		$this->assertEquals( 'core/example', $block->inner_blocks[0]->name );
	}

	function test_constructor_prepares_context_for_inner_blocks() {
		$this->registry->register(
			'core/outer',
			array(
				'attributes'      => array(
					'recordId' => array(
						'type' => 'number',
					),
				),
				'providesContext' => array(
					'core/recordId' => 'recordId',
				),
			)
		);
		$this->registry->register(
			'core/inner',
			array(
				'context' => array( 'core/recordId' ),
			)
		);

		$parsed_blocks = parse_blocks( '<!-- wp:outer {"recordId":10} --><!-- wp:inner /--><!-- /wp:outer -->' );
		$parsed_block  = $parsed_blocks[0];
		$context       = array( 'unrequested' => 'not included' );
		$block         = new WP_Block( $parsed_block, $context, $this->registry );

		$this->assertCount( 0, $block->context );
		$this->assertEquals(
			array( 'core/recordId' => 10 ),
			$block->inner_blocks[0]->context
		);
	}

	function test_constructor_assigns_merged_context() {
		$this->registry->register(
			'core/example',
			array(
				'attributes'      => array(
					'value' => array(
						'type' => array( 'string', 'null' ),
					),
				),
				'providesContext' => array(
					'core/value' => 'value',
				),
				'context'         => array( 'core/value' ),
			)
		);

		$parsed_blocks = parse_blocks(
			'<!-- wp:example {"value":"merged"} -->' .
			'<!-- wp:example {"value":null} -->' .
			'<!-- wp:example /-->' .
			'<!-- /wp:example -->' .
			'<!-- /wp:example -->'
		);
		$parsed_block  = $parsed_blocks[0];
		$context       = array( 'core/value' => 'original' );
		$block         = new WP_Block( $parsed_block, $context, $this->registry );

		$this->assertEquals(
			array( 'core/value' => 'original' ),
			$block->context
		);
		$this->assertEquals(
			array( 'core/value' => 'merged' ),
			$block->inner_blocks[0]->context
		);
		$this->assertEquals(
			array( 'core/value' => null ),
			$block->inner_blocks[0]->inner_blocks[0]->context
		);
	}

	function test_render_static_block_type_returns_own_content() {
		$this->registry->register( 'core/static', array() );
		$this->registry->register(
			'core/dynamic',
			array(
				'render_callback' => function() {
					return 'b';
				},
			)
		);

		$parsed_blocks = parse_blocks( '<!-- wp:static -->a<!-- wp:dynamic /-->c<!-- /wp:static -->' );
		$parsed_block  = $parsed_blocks[0];
		$context       = array();
		$block         = new WP_Block( $parsed_block, $context, $this->registry );

		$this->assertSame( 'abc', $block->render() );
	}

	function test_render_passes_instance_to_render_callback() {
		$this->registry->register(
			'core/greeting',
			array(
				'attributes'      => array(
					'toWhom'      => array(
						'type' => 'string',
					),
					'punctuation' => array(
						'type'    => 'string',
						'default' => '!',
					),
				),
				'render_callback' => function( $block ) {
					return sprintf(
						'Hello %s%s',
						$block->attributes['toWhom'],
						$block->attributes['punctuation']
					);
				},
			)
		);

		$parsed_blocks = parse_blocks( '<!-- wp:greeting {"toWhom":"world"} /-->' );
		$parsed_block  = $parsed_blocks[0];
		$context       = array();
		$block         = new WP_Block( $parsed_block, $context, $this->registry );

		$this->assertSame( 'Hello world!', $block->render() );
	}

	function test_passes_attributes_to_render_callback() {
		$this->registry->register(
			'core/greeting',
			array(
				'attributes'      => array(
					'toWhom'      => array(
						'type' => 'string',
					),
					'punctuation' => array(
						'type'    => 'string',
						'default' => '!',
					),
				),
				'render_callback' => function( $block_attributes ) {
					return sprintf(
						'Hello %s%s',
						$block_attributes['toWhom'],
						$block_attributes['punctuation']
					);
				},
			)
		);

		$parsed_blocks = parse_blocks( '<!-- wp:greeting {"toWhom":"world"} /-->' );
		$parsed_block  = $parsed_blocks[0];
		$context       = array();
		$block         = new WP_Block( $parsed_block, $context, $this->registry );

		$this->assertSame( 'Hello world!', $block->render() );
	}

	function test_passes_content_to_render_callback() {
		$this->registry->register(
			'core/outer',
			array(
				'render_callback' => function( $block, $content ) {
					return $content;
				},
			)
		);
		$this->registry->register(
			'core/inner',
			array(
				'render_callback' => function() {
					return 'b';
				},
			)
		);

		$parsed_blocks = parse_blocks( '<!-- wp:outer -->a<!-- wp:inner /-->c<!-- /wp:outer -->' );
		$parsed_block  = $parsed_blocks[0];
		$context       = array();
		$block         = new WP_Block( $parsed_block, $context, $this->registry );

		$this->assertSame( 'abc', $block->render() );
	}

	function test_array_access_attributes() {
		$this->registry->register(
			'core/example',
			array(
				'attributes' => array(
					'value' => array(
						'type' => 'string',
					),
				),
			)
		);
		$parsed_block = array(
			'blockName' => 'core/example',
			'attrs'     => array( 'value' => 'ok' ),
		);
		$context      = array();
		$block        = new WP_Block( $parsed_block, $context, $this->registry );

		$this->assertTrue( isset( $block['value'] ) );
		$this->assertFalse( isset( $block['nonsense'] ) );
		$this->assertEquals( 'ok', $block['value'] );

		$block['value'] = 'changed';
		$this->assertEquals( 'changed', $block['value'] );
		$this->assertEquals( 'changed', $block->attributes['value'] );

		unset( $block['value'] );
		$this->assertFalse( isset( $block['value'] ) );

		$block[] = 'invalid, but still supported';
		$this->assertEquals( 'invalid, but still supported', $block[0] );
	}

}
