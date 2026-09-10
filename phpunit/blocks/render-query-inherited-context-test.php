<?php
/**
 * Tests for the `core/query` block's inherited context normalization.
 *
 * @package WordPress
 * @subpackage Blocks
 *
 * @group blocks
 */
class Tests_Blocks_RenderQueryInheritedContext extends WP_UnitTestCase {

	public static function wpSetUpBeforeClass() {
		register_block_type(
			'test/query-context-probe',
			array(
				'uses_context'    => array( 'query' ),
				'render_callback' => static function ( $attributes, $content, $block ) {
					return sprintf(
						'<div class="query-context-probe" data-per-page="%s" data-offset="%s"></div>',
						esc_attr( $block->context['query']['perPage'] ?? 'null' ),
						esc_attr( $block->context['query']['offset'] ?? 'null' )
					);
				},
			)
		);
	}

	public static function wpTearDownAfterClass() {
		unregister_block_type( 'test/query-context-probe' );
	}

	/**
	 * When a Query Loop inherits the main query, the block only ever renders
	 * according to `$wp_query`'s own `posts_per_page`, ignoring its own
	 * `perPage`/`offset` attributes. Descendant blocks should see that same,
	 * truthful value via context rather than the block's raw (and possibly
	 * stale or divergent) attributes.
	 */
	public function test_inherited_query_context_reflects_main_query_posts_per_page() {
		global $wp_query, $wp_the_query;

		$content = <<<HTML
		<!-- wp:query {"query":{"inherit":true,"perPage":25,"offset":10}} -->
		<div class="wp-block-query">
			<!-- wp:test/query-context-probe /-->
		</div>
		<!-- /wp:query -->
HTML;

		$wp_query     = new WP_Query( array( 'posts_per_page' => 5 ) );
		$wp_the_query = $wp_query;

		$output = do_blocks( $content );

		$p = new WP_HTML_Tag_Processor( $output );
		$p->next_tag( array( 'class_name' => 'query-context-probe' ) );

		$this->assertSame( '5', $p->get_attribute( 'data-per-page' ) );
		$this->assertSame( '0', $p->get_attribute( 'data-offset' ) );
	}

	/**
	 * Non-inheriting queries build their own `WP_Query`, so their declared
	 * `perPage`/`offset` attributes are the source of truth and must be left
	 * untouched.
	 */
	public function test_non_inherited_query_context_keeps_declared_per_page() {
		global $wp_query, $wp_the_query;

		$content = <<<HTML
		<!-- wp:query {"query":{"inherit":false,"perPage":25,"offset":10,"postType":"post"}} -->
		<div class="wp-block-query">
			<!-- wp:test/query-context-probe /-->
		</div>
		<!-- /wp:query -->
HTML;

		$wp_query     = new WP_Query( array( 'posts_per_page' => 5 ) );
		$wp_the_query = $wp_query;

		$output = do_blocks( $content );

		$p = new WP_HTML_Tag_Processor( $output );
		$p->next_tag( array( 'class_name' => 'query-context-probe' ) );

		$this->assertSame( '25', $p->get_attribute( 'data-per-page' ) );
		$this->assertSame( '10', $p->get_attribute( 'data-offset' ) );
	}
}
