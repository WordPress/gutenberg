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
				'border'     => array(
					'width' => '3px',
					'style' => 'dashed',
				),
				'dimensions' => array(
					'minHeight' => '100px',
					'minWidth'  => '200px',
				),
				'shadow'     => '10px 10px 5px #000000',
				'spacing'    => array(
					'padding' => array( 'top' => '20px' ),
					'margin'  => array( 'top' => '30px' ),
				),
			),
		);
	}

	public function test_empty_wrapper_omits_border_dimensions_shadow_and_spacing() {
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

	public function test_rendered_link_includes_border_dimensions_shadow_and_spacing() {
		$output = $this->render_block( self::$second_post_id, $this->styled_attributes() );

		$this->assertStringContainsString( 'border-style:dashed', $output );
		$this->assertStringContainsString( 'border-width:3px', $output );
		$this->assertStringContainsString( 'min-height:100px', $output );
		$this->assertStringContainsString( 'min-width:200px', $output );
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

	/**
	 * Returns attributes setting a background image and a gradient.
	 *
	 * @return array Block attributes.
	 */
	private function background_attributes() {
		return array(
			'type'  => 'previous',
			'style' => array(
				'background' => array(
					'backgroundImage' => array( 'url' => 'https://example.com/image.jpg' ),
					'gradient'        => 'linear-gradient(135deg,#000000 0%,#ffffff 100%)',
				),
			),
		);
	}

	public function test_empty_wrapper_omits_the_background() {
		$output = $this->render_block( self::$first_post_id, $this->background_attributes() );

		$this->assertStringContainsString( '></div>', $output, 'The wrapper should render with no content.' );
		$this->assertStringNotContainsString( 'style=', $output );
		$this->assertStringNotContainsString( 'has-background', $output );
	}

	public function test_rendered_link_includes_the_background() {
		$output = $this->render_block( self::$second_post_id, $this->background_attributes() );

		$this->assertStringContainsString( 'https://example.com/image.jpg', $output );
		$this->assertStringContainsString( 'linear-gradient(135deg,#000000 0%,#ffffff 100%)', $output );
		$this->assertStringContainsString( 'background-size:cover', $output );
		$this->assertSame( 1, substr_count( $output, 'has-background' ) );
	}

	public function test_background_image_without_a_gradient_adds_the_background_class() {
		$attributes = array(
			'type'  => 'previous',
			'style' => array(
				'background' => array(
					'backgroundImage' => array( 'url' => 'https://example.com/image.jpg' ),
					'backgroundSize'  => 'contain',
				),
			),
		);

		$output = $this->render_block( self::$second_post_id, $attributes );

		$this->assertStringContainsString( 'background-size:contain', $output );
		$this->assertStringContainsString( 'background-position:50% 50%', $output );
		$this->assertStringContainsString( 'has-background', $output );
	}

	public function test_null_from_the_post_link_filter_omits_the_styles() {
		add_filter( 'previous_post_link', '__return_null' );
		$output = $this->render_block( self::$second_post_id, $this->styled_attributes() );
		remove_filter( 'previous_post_link', '__return_null' );

		$this->assertStringContainsString( '></div>', $output, 'The wrapper should render with no content.' );
		$this->assertStringNotContainsString( 'style=', $output );
		$this->assertStringNotContainsString( 'has-border-color', $output );
	}

	/**
	 * Creates an attachment whose navigation can be rendered through a real query.
	 *
	 * @param int $parent_id Parent post ID, or zero for unattached media.
	 * @return int Attachment ID.
	 */
	private function create_attachment( $parent_id = 0 ) {
		update_option( 'wp_attachment_pages_enabled', 1 );

		return self::factory()->attachment->create(
			array(
				'post_parent'    => $parent_id,
				'post_status'    => 'inherit',
				'post_title'     => 'Attachment navigation test',
				'post_mime_type' => 'image/jpeg',
			)
		);
	}

	/**
	 * Checks the link color generated for this particular block wrapper.
	 *
	 * @param string $output Rendered block.
	 */
	private function assert_link_color( $output ) {
		$this->assertSame( 1, preg_match( '/\bwp-elements-[\w-]+/', $output, $matches ) );
		$this->assertStringContainsString(
			'.' . $matches[0] . ' a:where(:not(.wp-element-button)){color:#123456;}',
			gutenberg_style_engine_get_stylesheet_from_context( 'block-supports', array( 'prettify' => false ) )
		);
	}

	public function test_unattached_attachment_has_no_previous_link() {
		$attachment_id = $this->create_attachment();
		$output        = $this->render_block( $attachment_id, array( 'type' => 'previous' ) );

		$this->assertTrue( is_attachment() );
		$this->assertStringContainsString( 'post-navigation-link-previous', $output );
		$this->assertStringContainsString( '></div>', $output );
		$this->assertStringNotContainsString( '<a ', $output );
	}

	public function test_unattached_attachment_previous_link_withholds_empty_wrapper_styles() {
		$attributes          = $this->styled_attributes();
		$attributes['style'] = array_merge( $attributes['style'], $this->background_attributes()['style'] );
		$output              = $this->render_block( $this->create_attachment(), $attributes );

		$this->assertStringContainsString( '></div>', $output );
		$this->assertStringNotContainsString( 'style=', $output );
		$this->assertStringNotContainsString( 'has-border-color', $output );
		$this->assertStringNotContainsString( 'has-background', $output );
	}

	public function test_unattached_attachment_previous_link_has_no_orphan_label_or_arrow() {
		$output = $this->render_block(
			$this->create_attachment(),
			array(
				'type'      => 'previous',
				'label'     => 'Back to the parent',
				'showTitle' => true,
				'linkLabel' => true,
				'arrow'     => 'chevron',
				'style'     => array( 'elements' => array( 'link' => array( 'color' => array( 'text' => '#123456' ) ) ) ),
			)
		);

		$this->assertStringContainsString( '></div>', $output );
		$this->assertStringNotContainsString( '<a ', $output );
		$this->assertStringNotContainsString( 'Back to the parent', $output );
		$this->assertStringNotContainsString( 'post-navigation-link__arrow', $output );
	}

	public function test_attached_attachment_previous_link_points_to_its_parent() {
		$attachment_id = $this->create_attachment( self::$first_post_id );
		$output        = $this->render_block( $attachment_id, array( 'type' => 'previous' ) );

		$this->assertTrue( is_attachment() );
		$this->assertStringContainsString( 'href="' . esc_url( get_permalink( self::$first_post_id ) ) . '"', $output );
		$this->assertStringContainsString( 'rel="prev"', $output );
		$this->assertStringNotContainsString( 'href="' . esc_url( get_permalink( $attachment_id ) ) . '"', $output );
	}

	public function test_attached_attachment_previous_link_keeps_custom_content_and_link_color() {
		$output = $this->render_block(
			$this->create_attachment( self::$first_post_id ),
			array(
				'type'      => 'previous',
				'label'     => '<em>Back</em>',
				'showTitle' => true,
				'linkLabel' => true,
				'arrow'     => 'arrow',
				'style'     => array( 'elements' => array( 'link' => array( 'color' => array( 'text' => '#123456' ) ) ) ),
			)
		);

		$this->assertStringContainsString( 'href="' . esc_url( get_permalink( self::$first_post_id ) ) . '"', $output );
		$this->assertStringContainsString( '<em>Back</em>', $output );
		$this->assertStringContainsString( 'First post', $output );
		$this->assertStringContainsString( 'is-arrow-arrow', $output );
		$this->assert_link_color( $output );
	}

	public function test_unattached_attachment_next_link_is_unchanged() {
		$output = $this->render_block( $this->create_attachment(), array( 'type' => 'next' ) );

		$this->assertStringContainsString( 'post-navigation-link-next', $output );
		$this->assertStringContainsString( '></div>', $output );
		$this->assertStringNotContainsString( '<a ', $output );
	}

	public function test_attached_attachment_next_link_is_unchanged() {
		$output = $this->render_block( $this->create_attachment( self::$first_post_id ), array( 'type' => 'next' ) );

		$this->assertStringContainsString( 'post-navigation-link-next', $output );
		$this->assertStringContainsString( '></div>', $output );
		$this->assertStringNotContainsString( '<a ', $output );
	}

	public function test_ordinary_post_previous_link_is_unchanged() {
		$output = $this->render_block( self::$second_post_id, array( 'type' => 'previous' ) );

		$this->assertFalse( is_attachment() );
		$this->assertStringContainsString( 'href="' . esc_url( get_permalink( self::$first_post_id ) ) . '"', $output );
		$this->assertStringContainsString( 'rel="prev"', $output );
	}

	public function test_ordinary_post_next_link_is_unchanged() {
		$output = $this->render_block(
			self::$first_post_id,
			array(
				'type'  => 'next',
				'label' => 'Ahead',
				'style' => array( 'elements' => array( 'link' => array( 'color' => array( 'text' => '#123456' ) ) ) ),
			)
		);

		$this->assertStringContainsString( 'href="' . esc_url( get_permalink( self::$second_post_id ) ) . '"', $output );
		$this->assertStringContainsString( 'rel="next"', $output );
		$this->assertStringContainsString( 'Ahead', $output );
		$this->assert_link_color( $output );
	}

	public function test_unattached_attachment_previous_link_filter_can_supply_a_link() {
		$calls    = array();
		$callback = static function ( $output, $format, $link, $post, $adjacent ) use ( &$calls ) {
			$calls[] = array( $output, $format, $link, $post, $adjacent );
			return '<a href="https://example.org/media/">Media library</a>';
		};
		add_filter( 'previous_post_link', $callback, 10, 5 );
		try {
			$output = $this->render_block( $this->create_attachment(), $this->styled_attributes() );
		} finally {
			remove_filter( 'previous_post_link', $callback, 10 );
		}

		$this->assertSame( array( array( '', '%link', _x( 'Previous', 'label for previous post link', 'default' ), '', 'previous' ) ), $calls );
		$this->assertStringContainsString( '<a href="https://example.org/media/">Media library</a>', $output );
		$this->assertStringContainsString( 'border-style:dashed', $output );
	}

	public function test_unattached_attachment_previous_link_filter_can_return_null() {
		$calls    = array();
		$callback = static function ( $output, $format, $link, $post, $adjacent ) use ( &$calls ) {
			$calls[] = array( $output, $format, $link, $post, $adjacent );
			return null;
		};
		add_filter( 'previous_post_link', $callback, 10, 5 );
		try {
			$output = $this->render_block( $this->create_attachment(), $this->styled_attributes() );
		} finally {
			remove_filter( 'previous_post_link', $callback, 10 );
		}

		$this->assertSame( array( array( '', '%link', _x( 'Previous', 'label for previous post link', 'default' ), '', 'previous' ) ), $calls );
		$this->assertStringContainsString( '></div>', $output );
		$this->assertStringNotContainsString( 'style=', $output );
	}
}
