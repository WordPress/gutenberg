<?php
/**
 * Site Logo block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Site Logo block.
 *
 * @group blocks
 *
 * @covers ::gutenberg_render_block_core_site_logo
 */
class Render_Block_Site_Logo_Test extends WP_UnitTestCase {

	/**
	 * @var int
	 */
	private static $attachment_id;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$attachment_id = $factory->attachment->create_upload_object( DIR_TESTDATA . '/images/canola.jpg' );
	}

	public static function wpTearDownAfterClass() {
		wp_delete_post( self::$attachment_id, true );
	}

	public function set_up() {
		parent::set_up();
		update_option( 'site_logo', self::$attachment_id );
	}

	/**
	 * Renders a Site Logo block and returns the wrapper and image attributes.
	 *
	 * @param array $attributes Block attributes.
	 * @return array Class and style of the wrapper and the image.
	 */
	private function render_logo( $attributes ) {
		$block = new WP_Block(
			array(
				'blockName' => 'core/site-logo',
				'attrs'     => $attributes,
			)
		);

		$processor = new WP_HTML_Tag_Processor( $block->render() );
		$this->assertTrue( $processor->next_tag( 'div' ) );
		$wrapper = array(
			'class' => $processor->get_attribute( 'class' ),
			'style' => $processor->get_attribute( 'style' ),
		);
		$this->assertTrue( $processor->next_tag( 'img' ) );
		$image = array(
			'class' => $processor->get_attribute( 'class' ),
			'style' => $processor->get_attribute( 'style' ),
		);

		return array(
			'wrapper' => $wrapper,
			'image'   => $image,
		);
	}

	public function test_border_is_on_the_image_not_the_wrapper() {
		$actual = $this->render_logo(
			array(
				'borderColor' => 'accent-2',
				'style'       => array(
					'border' => array(
						'radius' => '12px',
						'style'  => 'dashed',
						'width'  => '3px',
					),
				),
			)
		);

		$this->assertSame(
			array(
				'class' => 'is-default-size wp-block-site-logo',
				'style' => null,
			),
			$actual['wrapper']
		);
		$this->assertSame(
			array(
				'class' => 'custom-logo has-border-color has-accent-2-border-color',
				'style' => 'border-radius:12px;border-style:dashed;border-width:3px;',
			),
			$actual['image']
		);
	}

	public function test_individual_side_borders_are_on_the_image() {
		$actual = $this->render_logo(
			array(
				'style' => array(
					'border' => array(
						'top' => array(
							'color' => '#ff0000',
							'style' => 'solid',
							'width' => '2px',
						),
					),
				),
			)
		);

		$this->assertSame( 'custom-logo', $actual['image']['class'] );
		$this->assertSame( 'border-top-width:2px;border-top-color:#ff0000;border-top-style:solid;', $actual['image']['style'] );
	}

	public function test_shadow_is_on_the_image_not_the_wrapper() {
		$actual = $this->render_logo(
			array(
				'style' => array(
					'shadow' => '6px 6px 9px rgba(0, 0, 0, 0.2)',
				),
			)
		);

		$this->assertSame(
			array(
				'class' => 'is-default-size wp-block-site-logo',
				'style' => null,
			),
			$actual['wrapper']
		);
		$this->assertSame(
			array(
				'class' => 'custom-logo',
				'style' => 'box-shadow:6px 6px 9px rgba(0, 0, 0, 0.2);',
			),
			$actual['image']
		);
	}

	public function test_border_and_shadow_share_the_image_style() {
		$actual = $this->render_logo(
			array(
				'style' => array(
					'border' => array(
						'radius' => '24px',
					),
					'shadow' => 'var:preset|shadow|natural',
				),
			)
		);

		$this->assertNull( $actual['wrapper']['style'] );
		$this->assertSame( 'custom-logo', $actual['image']['class'] );
		$this->assertSame( 'border-radius:24px;box-shadow:var(--wp--preset--shadow--natural);', $actual['image']['style'] );
	}

	public function test_no_border_or_shadow_leaves_the_image_unchanged() {
		$actual = $this->render_logo( array() );

		$this->assertSame( 'custom-logo', $actual['image']['class'] );
		$this->assertNull( $actual['image']['style'] );
	}
}
