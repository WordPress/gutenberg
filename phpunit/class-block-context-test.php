<?php
/**
 * Test block context.
 *
 * @package Gutenberg
 */

class Block_Context_Test extends WP_UnitTestCase {

	/**
	 * Registered block names.
	 *
	 * @var string[]
	 */
	private $registered_block_names = [];

	/**
	 * Sets up each test method.
	 */
	public function setUp() {
		global $post;

		parent::setUp();

		$args = array(
			'post_content' => 'example',
			'post_excerpt' => '',
		);

		$post = $this->factory()->post->create_and_get( $args );
		setup_postdata( $post );
	}

	/**
	 * Tear down each test method.
	 */
	public function tearDown() {
		parent::tearDown();

		while ( ! empty( $this->registered_block_names ) ) {
			$block_name = array_pop( $this->registered_block_names );
			unregister_block_type( $block_name );
		}
	}

	/**
	 * Registers a block type.
	 *
	 * @param string|WP_Block_Type $name Block type name including namespace, or alternatively a
	 *                                   complete WP_Block_Type instance. In case a WP_Block_Type
	 *                                   is provided, the $args parameter will be ignored.
	 * @param array                $args {
	 *     Optional. Array of block type arguments. Any arguments may be defined, however the
	 *     ones described below are supported by default. Default empty array.
	 *
	 *     @type callable $render_callback Callback used to render blocks of this block type.
	 * }
	 */
	protected function register_block_type( $name, $args ) {
		register_block_type( $name, $args );

		$this->registered_block_names[] = $name;
	}

	/**
	 * Tests that a block which provides context makes that context available to
	 * its inner blocks.
	 */
	function test_provides_block_context() {
		$provided_context = [];

		$this->register_block_type(
			'gutenberg/test-context-provider',
			[
				'attributes'      => [
					'contextWithAssigned'   => [
						'type' => 'number',
					],
					'contextWithDefault'    => [
						'type'    => 'number',
						'default' => 0,
					],
					'contextWithoutDefault' => [
						'type' => 'number',
					],
					'contextNotRequested'   => [
						'type' => 'number',
					],
				],
				'providesContext' => [
					'gutenberg/contextWithAssigned'   => 'contextWithAssigned',
					'gutenberg/contextWithDefault'    => 'contextWithDefault',
					'gutenberg/contextWithoutDefault' => 'contextWithoutDefault',
					'gutenberg/contextNotRequested'   => 'contextNotRequested',
				],
			]
		);

		$this->register_block_type(
			'gutenberg/test-context-consumer',
			[
				'context'         => [
					'gutenberg/contextWithDefault',
					'gutenberg/contextWithAssigned',
					'gutenberg/contextWithoutDefault',
				],
				'render_callback' => function() use ( &$provided_context ) {
					global $block;
					$provided_context[] = $block['context'];

					return '';
				},
			]
		);

		$parsed_blocks = parse_blocks(
			'<!-- wp:gutenberg/test-context-provider {"contextWithAssigned":10} -->' .
			'<!-- wp:gutenberg/test-context-consumer /-->' .
			'<!-- /wp:gutenberg/test-context-provider -->'
		);

		render_block( $parsed_blocks[0] );

		$this->assertEquals(
			[
				'gutenberg/contextWithDefault'  => 0,
				'gutenberg/contextWithAssigned' => 10,
			],
			$provided_context[0]
		);
	}

	/**
	 * Tests that a block render assigns the block global, bottom-up, and resets
	 * it for each new block.
	 */
	function test_sets_and_resets_block_global() {
		$block_globals = [];

		$this->register_block_type(
			'gutenberg/test-parent',
			[
				'render_callback' => function() use ( &$block_globals ) {
					global $block;
					$block_globals[] = $block;
				},
			]
		);
		$this->register_block_type(
			'gutenberg/test-child',
			[
				'render_callback' => function() use ( &$block_globals ) {
					global $block;
					$block_globals[] = $block;
				},
			]
		);

		$parsed_blocks = parse_blocks(
			'<!-- wp:gutenberg/test-parent -->' .
			'<!-- wp:gutenberg/test-child /-->' .
			'<!-- wp:gutenberg/test-child /-->' .
			'<!-- /wp:gutenberg/test-parent -->'
		);

		render_block( $parsed_blocks[0] );

		$this->assertCount( 3, $block_globals );
		$this->assertEquals( 'gutenberg/test-child', $block_globals[0]['blockName'] );
		$this->assertEquals( 'gutenberg/test-child', $block_globals[1]['blockName'] );
		$this->assertEquals( 'gutenberg/test-parent', $block_globals[2]['blockName'] );
	}

}
