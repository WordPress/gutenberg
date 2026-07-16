<?php
/**
 * Tests for the Table of Contents block rendering.
 *
 * @package WordPress
 * @subpackage Blocks
 *
 * @group blocks
 */
class Tests_Blocks_Render_Table_Of_Contents_Test extends WP_UnitTestCase {

	public function tear_down() {
		unset( $GLOBALS['page'] );
		wp_reset_postdata();
		parent::tear_down();
	}

	/**
	 * @covers ::gutenberg_block_core_table_of_contents_render
	 */
	public function test_render_uses_current_post_headings_instead_of_saved_headings() {
		$post_id = self::factory()->post->create(
			array(
				'post_status'  => 'publish',
				'post_content' => implode(
					"\n",
					array(
						$this->table_of_contents_block(
							array(
								'headings' => array(
									array(
										'content' => 'Stale section',
										'level'   => 2,
										'link'    => '#stale-section',
									),
								),
							),
							'<nav class="wp-block-table-of-contents"><ol><li><a class="wp-block-table-of-contents__entry" href="#stale-section">Stale section</a></li></ol></nav>'
						),
						$this->heading_block( 'Current section', 'current-section' ),
					)
				),
			)
		);

		$nav = $this->get_table_of_contents_html( $this->render_post_content( $post_id ) );

		$this->assertStringContainsString( 'Current section', $nav );
		$this->assertStringContainsString( '#current-section', $nav );
		$this->assertStringNotContainsString( 'Stale section', $nav );
	}

	/**
	 * @covers ::gutenberg_block_core_table_of_contents_render
	 */
	public function test_render_returns_empty_markup_when_the_current_post_has_no_headings() {
		$post_id = self::factory()->post->create(
			array(
				'post_status'  => 'publish',
				'post_content' => implode(
					"\n",
					array(
						$this->table_of_contents_block(),
						'<!-- wp:paragraph --><p>No headings here.</p><!-- /wp:paragraph -->',
					)
				),
			)
		);

		$this->assertStringNotContainsString(
			'wp-block-table-of-contents',
			$this->render_post_content( $post_id )
		);
	}

	/**
	 * @covers ::gutenberg_block_core_table_of_contents_render
	 */
	public function test_render_respects_ordering_and_max_heading_level() {
		$post_id = self::factory()->post->create(
			array(
				'post_status'  => 'publish',
				'post_content' => implode(
					"\n",
					array(
						$this->table_of_contents_block(
							array(
								'maxLevel' => 3,
								'ordered'  => false,
							)
						),
						$this->heading_block( 'Section', 'section', 2 ),
						$this->heading_block( 'Subsection', 'subsection', 3 ),
						$this->heading_block( 'Detailed aside', 'detailed-aside', 4 ),
					)
				),
			)
		);

		$nav = $this->get_table_of_contents_html( $this->render_post_content( $post_id ) );

		$this->assertStringContainsString( '<ul>', $nav );
		$this->assertStringContainsString( 'Section', $nav );
		$this->assertStringContainsString( 'Subsection', $nav );
		$this->assertStringNotContainsString( 'Detailed aside', $nav );
	}

	/**
	 * @covers ::gutenberg_block_core_table_of_contents_render
	 */
	public function test_render_nests_subheadings_under_their_parent_heading() {
		$post_id = self::factory()->post->create(
			array(
				'post_status'  => 'publish',
				'post_content' => implode(
					"\n",
					array(
						$this->table_of_contents_block(),
						$this->heading_block( 'Main Section', 'main-section', 2 ),
						$this->heading_block( 'Subsection', 'subsection', 3 ),
					)
				),
			)
		);

		$nav = $this->get_table_of_contents_html( $this->render_post_content( $post_id ) );

		$this->assertStringContainsString(
			'<a class="wp-block-table-of-contents__entry" href="#main-section">Main Section</a><ol><li><a class="wp-block-table-of-contents__entry" href="#subsection">Subsection</a></li></ol>',
			$nav
		);
	}

	/**
	 * @covers ::gutenberg_block_core_table_of_contents_render
	 */
	public function test_render_uses_a_span_for_unanchored_headings() {
		$post_id = self::factory()->post->create(
			array(
				'post_status'  => 'publish',
				'post_content' => implode(
					"\n",
					array(
						$this->table_of_contents_block(),
						$this->heading_block( 'Unlinked section', '' ),
					)
				),
			)
		);

		$nav = $this->get_table_of_contents_html( $this->render_post_content( $post_id ) );

		$this->assertStringContainsString(
			'<span class="wp-block-table-of-contents__entry">Unlinked section</span>',
			$nav
		);
		$this->assertStringNotContainsString( '<a class="wp-block-table-of-contents__entry"', $nav );
	}

	/**
	 * @covers ::gutenberg_block_core_table_of_contents_render
	 */
	public function test_render_escapes_heading_entities_once() {
		$post_id = self::factory()->post->create(
			array(
				'post_status'  => 'publish',
				'post_content' => implode(
					"\n",
					array(
						$this->table_of_contents_block(),
						$this->heading_block( 'Research & Development', 'research-development' ),
					)
				),
			)
		);

		$nav = $this->get_table_of_contents_html( $this->render_post_content( $post_id ) );

		$this->assertStringContainsString( 'Research &amp; Development', $nav );
		$this->assertStringNotContainsString( '&amp;amp;', $nav );
	}

	/**
	 * @covers ::gutenberg_block_core_table_of_contents_render
	 */
	public function test_render_only_include_current_page_uses_current_paginated_page() {
		$post_id = self::factory()->post->create(
			array(
				'post_status'  => 'publish',
				'post_content' => implode(
					"\n",
					array(
						$this->table_of_contents_block(
							array(
								'onlyIncludeCurrentPage' => true,
							)
						),
						$this->heading_block( 'Page one heading', 'page-one-heading' ),
						$this->nextpage_block(),
						$this->heading_block( 'Page two heading', 'page-two-heading' ),
					)
				),
			)
		);

		$nav = $this->get_table_of_contents_html( $this->render_post_content( $post_id, 2 ) );

		$this->assertStringContainsString( 'Page two heading', $nav );
		$this->assertStringNotContainsString( 'Page one heading', $nav );
		$this->assertStringContainsString( 'page=2#page-two-heading', $nav );
	}

	/**
	 * @covers ::gutenberg_block_core_table_of_contents_render
	 */
	public function test_render_all_paginated_headings_links_to_each_page_when_current_page_filtering_is_disabled() {
		$post_id = self::factory()->post->create(
			array(
				'post_status'  => 'publish',
				'post_content' => implode(
					"\n",
					array(
						$this->table_of_contents_block(),
						$this->heading_block( 'Page one heading', 'page-one-heading' ),
						$this->nextpage_block(),
						$this->heading_block( 'Page two heading', 'page-two-heading' ),
					)
				),
			)
		);

		$nav       = $this->get_table_of_contents_html( $this->render_post_content( $post_id, 2 ) );
		$permalink = get_permalink( $post_id );

		$this->assertStringContainsString( 'Page one heading', $nav );
		$this->assertStringContainsString( 'Page two heading', $nav );
		$this->assertStringContainsString( 'href="' . esc_url( $permalink . '#page-one-heading' ) . '"', $nav );
		$this->assertStringContainsString(
			'href="' . esc_url( add_query_arg( 'page', 2, $permalink ) . '#page-two-heading' ) . '"',
			$nav
		);
	}

	/**
	 * @covers ::gutenberg_block_core_table_of_contents_render
	 */
	public function test_render_preserves_saved_markup_outside_the_content_filter() {
		$rendered = gutenberg_block_core_table_of_contents_render(
			array(),
			'<nav class="wp-block-table-of-contents"><ol><li><a class="wp-block-table-of-contents__entry" href="#saved-section">Saved section</a></li></ol></nav>'
		);

		$this->assertStringContainsString( 'Saved section', $rendered );
		$this->assertStringContainsString( 'aria-label="Table of Contents"', $rendered );
	}

	private function render_post_content( $post_id, $page_number = 1 ) {
		global $page;

		$url = add_query_arg( 'p', $post_id, home_url( '/' ) );
		if ( 1 < $page_number ) {
			$url = add_query_arg( 'page', $page_number, $url );
		}

		$this->go_to( $url );
		$GLOBALS['post'] = get_post( $post_id );
		setup_postdata( $GLOBALS['post'] );
		$page = $page_number;

		return apply_filters( 'the_content', $GLOBALS['post']->post_content );
	}

	private function get_table_of_contents_html( $content ) {
		$matched = preg_match(
			'/<nav\b[^>]*class="[^"]*\bwp-block-table-of-contents\b[^"]*"[^>]*>.*?<\/nav>/s',
			$content,
			$matches
		);

		$this->assertSame( 1, $matched, 'Expected rendered table of contents markup.' );

		return $matches[0];
	}

	private function table_of_contents_block( $attributes = array(), $content = '' ) {
		$serialized_attributes = empty( $attributes ) ? '' : ' ' . wp_json_encode( $attributes );

		if ( '' === $content ) {
			return '<!-- wp:table-of-contents' . $serialized_attributes . ' /-->';
		}

		return '<!-- wp:table-of-contents' . $serialized_attributes . ' -->' . $content . '<!-- /wp:table-of-contents -->';
	}

	private function heading_block( $content, $anchor = '', $level = 2 ) {
		$attributes = array(
			'level' => $level,
		);
		if ( '' !== $anchor ) {
			$attributes['anchor'] = $anchor;
		}

		$id = '' === $anchor ? '' : ' id="' . esc_attr( $anchor ) . '"';

		return sprintf(
			'<!-- wp:heading %1$s --><h%2$d%3$s class="wp-block-heading">%4$s</h%2$d><!-- /wp:heading -->',
			wp_json_encode( $attributes ),
			$level,
			$id,
			esc_html( $content )
		);
	}

	private function nextpage_block() {
		return '<!--nextpage-->';
	}
}
