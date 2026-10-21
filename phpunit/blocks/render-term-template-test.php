<?php
/**
 * Tests for the Term Template block rendering.
 *
 * @package WordPress
 * @subpackage Blocks
 * @since 7.2.0
 *
 * @group blocks
 */
class Tests_Blocks_RenderTermTemplateBlock extends WP_UnitTestCase {

	private static $term_ids;

	public function set_up() {
		parent::set_up();

		self::$term_ids = array(
			self::factory()->category->create( array( 'name' => 'Metal Dogs' ) ),
			self::factory()->category->create( array( 'name' => 'Ceiling Cats' ) ),
		);
	}

	/**
	 * Returns the markup of a Terms Query block listing the test categories, with the given blocks
	 * inside its Term Template block.
	 *
	 * @param string $inner_blocks Inner blocks markup.
	 * @return string Block markup.
	 */
	private static function get_terms_query_markup( $inner_blocks ) {
		$term_query = wp_json_encode(
			array(
				'perPage'   => 10,
				'taxonomy'  => 'category',
				'order'     => 'asc',
				'orderBy'   => 'name',
				'include'   => self::$term_ids,
				'hideEmpty' => false,
			)
		);

		return '<!-- wp:terms-query {"termQuery":' . $term_query . '} -->'
			. '<!-- wp:term-template -->' . $inner_blocks . '<!-- /wp:term-template -->'
			. '<!-- /wp:terms-query -->';
	}

	/**
	 * Tests that the inner blocks of the `core/term-template` block are rendered once per term,
	 * and not an additional time for the template itself.
	 */
	public function test_rendering_term_template_renders_inner_blocks_once_per_term() {
		$render_count = 0;
		register_block_type(
			'test/render-counter',
			array(
				'render_callback' => static function () use ( &$render_count ) {
					++$render_count;
					return '';
				},
			)
		);

		do_blocks( self::get_terms_query_markup( '<!-- wp:test/render-counter /-->' ) );

		unregister_block_type( 'test/render-counter' );

		$this->assertSame( count( self::$term_ids ), $render_count );
	}
}
