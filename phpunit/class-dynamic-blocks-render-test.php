<?php
/**
 * Dynamic blocks rendering Test
 *
 * @package Gutenberg
 */

/**
 * Test do_blocks, WP_Block_Type::render
 */
class Dynamic_Blocks_Render_Test extends WP_UnitTestCase {

	/**
	 * Dummy block instance number.
	 *
	 * @var int
	 */
	protected $dummy_block_instance_number = 0;

	/**
	 * Dummy block rendering function.
	 *
	 * @param  array $attributes Block attributes.
	 *
	 * @return string             Block output.
	 */
	function render_dummy_block( $attributes ) {
		$this->dummy_block_instance_number += 1;
		return $this->dummy_block_instance_number . ':' . $attributes['value'];
	}

	/**
	 * Dummy block rendering function, returning numeric value.
	 *
	 * @return number Block output.
	 */
	function render_dummy_block_numeric() {
		return 10;
	}


	function render_test_inner_block( $atts, $content ) {
		return json_encode( func_get_args() );
	}

	function render_test_outer_block( $atts, $content ) {
		return '<pre>' . json_encode( $atts ) . $content . '</pre>';
	}

	/**
	 * Dummy block rendering function, creating a new WP_Query instance.
	 *
	 * @return string Block output.
	 */
	function render_dummy_block_wp_query() {
		$content = '';
		$recent  = new WP_Query( array(
			'numberposts'      => 10,
			'orderby'          => 'ID',
			'order'            => 'DESC',
			'post_type'        => 'post',
			'post_status'      => 'draft, publish, future, pending, private',
			'suppress_filters' => true,
		) );

		while ( $recent->have_posts() ) {
			$recent->the_post();

			$content .= get_the_title();
		}

		wp_reset_postdata();

		return $content;
	}

	/**
	 * Tear down.
	 */
	function tearDown() {
		parent::tearDown();

		$this->dummy_block_instance_number = 0;

		$registry = WP_Block_Type_Registry::get_instance();
		$registry->unregister( 'core/dummy' );
	}

	/**
	 * Test dynamic blocks that lack content, including void blocks.
	 *
	 * @covers ::do_blocks
	 */
	function test_dynamic_block_rendering() {
		$settings = array(
			'render_callback' => array(
				$this,
				'render_dummy_block',
			),
		);
		register_block_type( 'core/dummy', $settings );

		// The duplicated dynamic blocks below are there to ensure that do_blocks() replaces each one-by-one.
		$post_content =
			'before' .
			'<!-- wp:core/dummy {"value":"b1"} --><!-- /wp:core/dummy -->' .
			'<!-- wp:core/dummy {"value":"b1"} --><!-- /wp:core/dummy -->' .
			'between' .
			'<!-- wp:core/dummy {"value":"b2"} /-->' .
			'<!-- wp:core/dummy {"value":"b2"} /-->' .
			'after';

		$updated_post_content = do_blocks( $post_content );
		$this->assertEquals(
			$updated_post_content,
			'before' .
			'1:b1' .
			'2:b1' .
			'between' .
			'3:b2' .
			'4:b2' .
			'after'
		);
	}

	/**
	 * Tests that do_blocks() maintains the global $post variable when dynamic
	 * blocks create new WP_Query instances in their callbacks.
	 *
	 * @covers ::do_blocks
	 */
	function test_global_post_persistence() {
		global $post;

		register_block_type(
			'core/dummy',
			array(
				'render_callback' => array(
					$this,
					'render_dummy_block_wp_query',
				),
			)
		);

		$posts = self::factory()->post->create_many( 5 );
		$post  = get_post( end( $posts ) );

		$global_post = $post;
		do_blocks( '<!-- wp:core/dummy /-->' );

		$this->assertEquals( $global_post, $post );
	}

	/**
	 * Test dynamic blocks return string value from render, even if render
	 * callback does not.
	 *
	 * @covers WP_Block_Type::render
	 */
	function test_dynamic_block_renders_string() {
		$settings = array(
			'render_callback' => array(
				$this,
				'render_dummy_block_numeric',
			),
		);

		register_block_type( 'core/dummy', $settings );
		$block_type = new WP_Block_Type( 'core/dummy', $settings );

		$rendered = $block_type->render();

		$this->assertSame( '10', $rendered );
		$this->assertInternalType( 'string', $rendered );
	}

	function test_dynamic_block_with_inner_blocks() {
		register_block_type(
			'test/outer',
			array(
				'render_callback' => array(
					$this,
					'render_test_outer_block'
				),
			)
		);

		register_block_type(
			'test/inner',
			array(
				'render_callback' => array(
					$this,
					'render_test_inner_block'
				),
			)
		);

		$content = <<<BLOCKS
<!-- wp:test/outer {"thing":"value"} -->
<!-- wp:test/inner {"firstthing":"firstvalue"} /-->
<h1>before</h1>
<!-- wp:test/inner {"innerthing":"innervalue"} -->
<small>ittybittybunny</small>
<!-- /wp:test/inner -->
<p>after</p>
<!-- wp:test/inner {"lastthing":"lastvalue"} /-->
<!-- /wp:test/outer -->
BLOCKS;

		$expected = '<pre>{"thing":"value"}
[{"firstthing":"firstvalue"},""]
<h1>before</h1>
[{"innerthing":"innervalue"},"\\n<small>ittybittybunny<\\/small>\\n"]
<p>after</p>
[{"lastthing":"lastvalue"},""]
</pre>';
		$this->assertEquals( $expected, do_blocks( $content ) );
	}
}
