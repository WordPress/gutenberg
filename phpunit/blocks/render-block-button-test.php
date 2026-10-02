<?php
/**
 * Button block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Button block.
 *
 * @group blocks
 */
class Render_Block_Button_Test extends WP_UnitTestCase {

	/**
	 * Button content with a link element.
	 *
	 * @var string
	 */
	private static $button_content = '<div class="wp-block-button"><a class="wp-block-button__link wp-element-button">Click me</a></div>';

	/**
	 * @covers ::gutenberg_render_block_core_button
	 */
	public function test_empty_button_renders_nothing() {
		$content = '<div class="wp-block-button"><a class="wp-block-button__link wp-element-button"></a></div>';
		$result  = gutenberg_render_block_core_button( array(), $content );
		$this->assertEmpty( $result );
	}

	/**
	 * @covers ::gutenberg_render_block_core_button
	 */
	public function test_button_without_width_returns_content_unchanged() {
		$result = gutenberg_render_block_core_button( array(), self::$button_content );
		$this->assertStringNotContainsString( 'has-custom-width', $result );
	}

	/**
	 * @covers ::gutenberg_render_block_core_button
	 */
	public function test_non_percentage_fixed_width_applies_inline_style() {
		$attributes = array(
			'style' => array(
				'dimensions' => array(
					'width' => '200px',
				),
			),
		);

		$result = gutenberg_render_block_core_button( $attributes, self::$button_content );

		$this->assertStringContainsString( 'has-custom-width', $result );
		$this->assertStringContainsString( 'width: 200px;', $result );
		$this->assertStringNotContainsString( 'wp-block-button__width', $result );
	}

	/**
	 * @covers ::gutenberg_render_block_core_button
	 */
	public function test_non_percentage_preset_width_applies_css_var() {
		$attributes = array(
			'style' => array(
				'dimensions' => array(
					'width' => 'var:preset|dimension|custom-width',
				),
			),
		);

		$result = gutenberg_render_block_core_button( $attributes, self::$button_content );

		$this->assertStringContainsString( 'has-custom-width', $result );
		$this->assertStringContainsString( 'width: var(--wp--preset--dimension--custom-width);', $result );
		$this->assertStringNotContainsString( 'wp-block-button__width', $result );
		$this->assertStringNotContainsString( 'var:preset|dimension|custom-width', $result );
	}

	/**
	 * @covers ::gutenberg_render_block_core_button
	 */
	public function test_percentage_width_applies_custom_property_and_classes() {
		$attributes = array(
			'style' => array(
				'dimensions' => array(
					'width' => '50%',
				),
			),
		);

		$result = gutenberg_render_block_core_button( $attributes, self::$button_content );

		$this->assertStringContainsString( 'has-custom-width', $result );
		$this->assertStringContainsString( 'wp-block-button__width', $result );
		$this->assertStringContainsString( 'wp-block-button__width-50', $result );
		$this->assertStringContainsString( '--wp--block-button--width: 50;', $result );
	}

	/**
	 * @covers ::gutenberg_render_block_core_button
	 */
	public function test_percentage_preset_width_applies_custom_property_and_classes() {
		// Use the default '50' dimension preset which resolves to '50%'.
		$attributes = array(
			'style' => array(
				'dimensions' => array(
					'width' => 'var:preset|dimension|50',
				),
			),
		);

		$result = gutenberg_render_block_core_button( $attributes, self::$button_content );

		$this->assertStringContainsString( 'has-custom-width', $result );
		$this->assertStringContainsString( 'wp-block-button__width', $result );
		$this->assertStringContainsString( 'wp-block-button__width-50', $result );
		$this->assertStringContainsString( '--wp--block-button--width: 50;', $result );
	}

	/**
	 * @covers ::gutenberg_render_block_core_button
	 */
	public function test_custom_percentage_width_adds_generic_class_without_legacy() {
		$attributes = array(
			'style' => array(
				'dimensions' => array(
					'width' => '33%',
				),
			),
		);

		$result = gutenberg_render_block_core_button( $attributes, self::$button_content );

		$this->assertStringContainsString( 'has-custom-width', $result );
		$this->assertStringContainsString( 'wp-block-button__width', $result );
		$this->assertStringNotContainsString( 'wp-block-button__width-33', $result );
		$this->assertStringContainsString( '--wp--block-button--width: 33;', $result );
	}

	/**
	 * @covers ::gutenberg_render_block_core_button
	 */
	public function test_background_image_applies_to_link() {
		$attributes = array(
			'style' => array(
				'background' => array(
					'backgroundImage' => array(
						'url' => 'https://example.com/image.jpg',
					),
				),
			),
		);

		$result    = gutenberg_render_block_core_button( $attributes, self::$button_content );
		$processor = new WP_HTML_Tag_Processor( $result );
		$processor->next_tag( 'a' );

		$this->assertSame( "background-image:url('https://example.com/image.jpg');background-size:cover;", $processor->get_attribute( 'style' ) );
		$this->assertTrue( $processor->has_class( 'has-background' ) );
	}

	/**
	 * @covers ::gutenberg_render_block_core_button
	 */
	public function test_background_gradient_appends_to_existing_link_style() {
		$content    = '<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" style="color:#fff">Click me</a></div>';
		$attributes = array(
			'style' => array(
				'background' => array(
					'gradient' => 'linear-gradient(red, blue)',
				),
			),
		);

		$result = gutenberg_render_block_core_button( $attributes, $content );

		$this->assertSame(
			'<div class="wp-block-button"><a class="wp-block-button__link wp-element-button has-background" style="color:#fff;background-image:linear-gradient(red, blue);">Click me</a></div>',
			$result
		);
	}
}
