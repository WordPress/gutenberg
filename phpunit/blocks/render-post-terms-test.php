<?php
/**
 * Tests for the Post Terms block rendering.
 *
 * @package WordPress
 * @subpackage Blocks
 * @since 7.2.0
 *
 * @group blocks
 */
class Tests_Blocks_RenderPostTermsBlock extends WP_UnitTestCase {

	private static $post_id;

	public function set_up() {
		parent::set_up();

		self::$post_id = self::factory()->post->create( array( 'post_status' => 'publish' ) );
		$category_ids  = array(
			self::factory()->category->create( array( 'name' => 'First' ) ),
			self::factory()->category->create( array( 'name' => 'Second' ) ),
		);
		wp_set_post_categories( self::$post_id, $category_ids );
	}

	private function render( $attributes ) {
		$GLOBALS['post'] = get_post( self::$post_id );
		setup_postdata( $GLOBALS['post'] );

		return do_blocks( '<!-- wp:post-terms ' . wp_json_encode( array_merge( array( 'term' => 'category' ), $attributes ) ) . ' /-->' );
	}

	/**
	 * Blocks saved without a layout keep their markup, without the flow classes
	 * the layout support adds to every block that supports layout.
	 */
	public function test_block_without_layout_renders_as_before() {
		$html = $this->render( array() );

		$this->assertStringNotContainsString( 'is-layout-', $html );
		$this->assertStringContainsString( 'class="taxonomy-category wp-block-post-terms"', $html );
		$this->assertStringContainsString( 'wp-block-post-terms__separator', $html );
	}

	public function test_flex_layout_drops_the_separator_and_keeps_the_gap() {
		$html = $this->render(
			array(
				'layout' => array(
					'type'     => 'flex',
					'flexWrap' => 'wrap',
				),
				'style'  => array( 'spacing' => array( 'blockGap' => '1rem' ) ),
			)
		);

		$this->assertStringContainsString( 'is-layout-flex', $html );
		$this->assertStringNotContainsString( 'wp-block-post-terms__separator', $html );
		$this->assertStringContainsString( 'First', $html );
		$this->assertStringContainsString( 'Second', $html );
	}

	public function test_grid_layout_drops_the_separator() {
		$html = $this->render( array( 'layout' => array( 'type' => 'grid' ) ) );

		$this->assertStringContainsString( 'is-layout-grid', $html );
		$this->assertStringNotContainsString( 'wp-block-post-terms__separator', $html );
	}

	public function test_unexpected_layout_value_does_not_error() {
		$html = $this->render( array( 'layout' => 'flex' ) );

		$this->assertStringContainsString( 'wp-block-post-terms__separator', $html );
	}

	public function test_variations_only_set_the_term() {
		foreach ( gutenberg_block_core_post_terms_build_variations() as $variation ) {
			$this->assertSame( array( 'term' ), array_keys( $variation['attributes'] ) );
		}
	}
}
