<?php
/**
 * Post Navigation Link block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Post Navigation Link block.
 *
 * @group blocks
 *
 * @covers ::gutenberg_render_block_core_post_navigation_link
 * @covers ::gutenberg_block_core_post_navigation_link_get_support_styles
 */
class Tests_Blocks_Render_Post_Navigation_Link extends WP_UnitTestCase {

	/**
	 * The oldest post, which has no previous post.
	 *
	 * @var int
	 */
	private static $first_post_id;

	/**
	 * A later post, which does have a previous post.
	 *
	 * @var int
	 */
	private static $second_post_id;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$first_post_id  = $factory->post->create(
			array(
				'post_status' => 'publish',
				'post_title'  => 'First post',
				'post_date'   => '2020-01-01 10:00:00',
			)
		);
		self::$second_post_id = $factory->post->create(
			array(
				'post_status' => 'publish',
				'post_title'  => 'Second post',
				'post_date'   => '2020-01-02 10:00:00',
			)
		);
	}

	/**
	 * Renders a Post Navigation Link block while viewing the given post.
	 *
	 * @param int   $post_id    Post to view.
	 * @param array $attributes Block attributes.
	 * @return string Rendered block.
	 */
	private function render_block( $post_id, $attributes ) {
		$this->go_to( get_permalink( $post_id ) );
		$GLOBALS['post'] = get_post( $post_id );

		return do_blocks( '<!-- wp:post-navigation-link ' . wp_json_encode( $attributes ) . ' /-->' );
	}

	/**
	 * Returns attributes covering each of the supports that skip serialization.
	 *
	 * @return array Block attributes.
	 */
	private function styled_attributes() {
		return array(
			'type'        => 'previous',
			'borderColor' => 'accent-2',
			'style'       => array(
				'border'  => array(
					'width' => '3px',
					'style' => 'dashed',
				),
				'shadow'  => '10px 10px 5px #000000',
				'spacing' => array(
					'padding' => array( 'top' => '20px' ),
					'margin'  => array( 'top' => '30px' ),
				),
			),
		);
	}

	public function test_empty_wrapper_omits_border_shadow_and_spacing() {
		$output = $this->render_block( self::$first_post_id, $this->styled_attributes() );

		$this->assertStringContainsString( '></div>', $output, 'The wrapper should render with no content.' );
		$this->assertStringNotContainsString( 'style=', $output );
		$this->assertStringNotContainsString( 'has-border-color', $output );
	}

	public function test_empty_wrapper_keeps_the_supports_that_serialize_as_usual() {
		$attributes = array(
			'type'      => 'previous',
			'textAlign' => 'center',
			'style'     => array(
				'color'  => array( 'background' => '#eeeeee' ),
				'border' => array( 'width' => '3px' ),
			),
		);

		$output = $this->render_block( self::$first_post_id, $attributes );

		$this->assertStringContainsString( 'has-text-align-center', $output );
		$this->assertStringContainsString( 'background-color:#eeeeee', $output );
		$this->assertStringNotContainsString( 'border-width', $output );
	}

	public function test_rendered_link_includes_border_shadow_and_spacing() {
		$output = $this->render_block( self::$second_post_id, $this->styled_attributes() );

		$this->assertStringContainsString( 'border-style:dashed', $output );
		$this->assertStringContainsString( 'border-width:3px', $output );
		$this->assertStringContainsString( 'box-shadow:10px 10px 5px #000000', $output );
		$this->assertStringContainsString( 'padding-top:20px', $output );
		$this->assertStringContainsString( 'margin-top:30px', $output );
		$this->assertStringContainsString( 'has-border-color', $output );
		$this->assertStringContainsString( 'has-accent-2-border-color', $output );
	}

	public function test_individual_border_sides_match_the_core_declaration_order() {
		$attributes = array(
			'type'  => 'previous',
			'style' => array(
				'border' => array(
					'top' => array(
						'width' => '4px',
						'color' => '#ff0000',
						'style' => 'solid',
					),
				),
			),
		);

		$output = $this->render_block( self::$second_post_id, $attributes );

		$this->assertStringContainsString(
			'border-top-width:4px;border-top-color:#ff0000;border-top-style:solid',
			$output
		);
	}

	public function test_unitless_border_values_are_given_pixel_units() {
		$attributes = array(
			'type'  => 'previous',
			'style' => array(
				'border' => array(
					'radius' => 5,
					'width'  => 2,
				),
			),
		);

		$output = $this->render_block( self::$second_post_id, $attributes );

		$this->assertStringContainsString( 'border-radius:5px', $output );
		$this->assertStringContainsString( 'border-width:2px', $output );
	}

	public function test_null_from_the_post_link_filter_omits_the_styles() {
		add_filter( 'previous_post_link', '__return_null' );
		$output = $this->render_block( self::$second_post_id, $this->styled_attributes() );
		remove_filter( 'previous_post_link', '__return_null' );

		$this->assertStringContainsString( '></div>', $output, 'The wrapper should render with no content.' );
		$this->assertStringNotContainsString( 'style=', $output );
		$this->assertStringNotContainsString( 'has-border-color', $output );
	}
}
