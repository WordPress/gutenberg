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

	/**
	 * Tests that the context available to the `core/term-template` block is passed on to its inner blocks,
	 * at any depth, while the `termId` and `taxonomy` of the term being iterated take precedence over
	 * values the block received from its ancestors.
	 */
	public function test_rendering_term_template_passes_context_to_inner_blocks() {
		$logged_contexts = array();
		register_block_type(
			'test/context-logger',
			array(
				'uses_context'    => array( 'termId', 'taxonomy', 'test/custom' ),
				'render_callback' => static function ( $attributes, $content, $block ) use ( &$logged_contexts ) {
					$logged_contexts[] = $block->context;
					return '';
				},
			)
		);

		// Add a custom context value to the Term Template block, as an extender would,
		// along with a stale term context that must not reach the inner blocks.
		$add_custom_context = static function ( $context, $parsed_block ) {
			if ( 'core/term-template' === $parsed_block['blockName'] ) {
				$context['test/custom'] = 'custom value';
				$context['termId']      = 'stale';
				$context['taxonomy']    = 'stale';
			}
			return $context;
		};
		add_filter( 'render_block_context', $add_custom_context, 10, 2 );

		// One logger as a direct child of the Term Template block, one nested inside a Group block.
		$inner_blocks  = '<!-- wp:test/context-logger /-->';
		$inner_blocks .= '<!-- wp:group --><div class="wp-block-group"><!-- wp:test/context-logger /--></div><!-- /wp:group -->';

		do_blocks( self::get_terms_query_markup( $inner_blocks ) );

		remove_filter( 'render_block_context', $add_custom_context, 10 );
		unregister_block_type( 'test/context-logger' );

		$expected = array();
		foreach ( self::$term_ids as $term_id ) {
			$term_context = array(
				'termId'      => $term_id,
				'taxonomy'    => 'category',
				'test/custom' => 'custom value',
			);
			$expected[]   = $term_context;
			$expected[]   = $term_context;
		}

		$this->assertCount( 4, $logged_contexts, 'Unexpected number of rendered inner blocks' );
		foreach ( $expected as $index => $expected_context ) {
			// The block also sets `termData` on every inner block; only the keys under test are compared.
			$this->assertSameSetsWithIndex(
				$expected_context,
				array_intersect_key( $logged_contexts[ $index ], $expected_context ),
				"Unexpected context for inner block at index $index"
			);
		}
	}
}
