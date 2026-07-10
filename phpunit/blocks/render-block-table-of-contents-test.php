<?php
/**
 * Tests for the Table of Contents block rendering.
 *
 * @package WordPress
 * @subpackage Blocks
 *
 * @group blocks
 */
class Tests_Blocks_Render_Table_Of_Contents extends WP_UnitTestCase {

	public function set_up() {
		parent::set_up();
		switch_theme( 'emptytheme' );
	}

	public function tear_down() {
		unset( $GLOBALS['_wp_current_template_content'] );
		unset( $GLOBALS['page'] );
		wp_reset_postdata();
		parent::tear_down();
	}

	/**
	 * @covers ::gutenberg_block_core_table_of_contents_render
	 */
	public function test_render_ignores_unrenderable_synced_pattern_headings() {
		$published_pattern_id = $this->create_synced_pattern(
			'Published synced pattern',
			'published-synced-pattern'
		);
		$draft_pattern_id     = $this->create_synced_pattern(
			'Draft synced pattern',
			'draft-synced-pattern',
			array(
				'post_status' => 'draft',
			)
		);
		$protected_pattern_id = $this->create_synced_pattern(
			'Protected synced pattern',
			'protected-synced-pattern',
			array(
				'post_password' => 'secret',
			)
		);
		$post_id              = self::factory()->post->create(
			array(
				'post_status'  => 'publish',
				'post_content' => implode(
					"\n",
					array(
						$this->table_of_contents_block(),
						'<!-- wp:block {"ref":' . $published_pattern_id . '} /-->',
						'<!-- wp:block {"ref":' . $draft_pattern_id . '} /-->',
						'<!-- wp:block {"ref":' . $protected_pattern_id . '} /-->',
					)
				),
			)
		);

		$nav = $this->get_table_of_contents_html( $this->render_post_content( $post_id ) );

		$this->assertStringContainsString( 'Published synced pattern', $nav );
		$this->assertStringNotContainsString( 'Draft synced pattern', $nav );
		$this->assertStringNotContainsString( 'Protected synced pattern', $nav );
	}

	/**
	 * @covers ::gutenberg_block_core_table_of_contents_render
	 */
	public function test_render_ignores_unrenderable_template_part_headings() {
		$this->create_template_part(
			'published-template-part',
			$this->heading_block( 'Published template part', 'published-template-part-heading' )
		);
		$this->create_template_part(
			'draft-template-part',
			$this->heading_block( 'Draft template part', 'draft-template-part-heading' ),
			array(
				'post_status' => 'draft',
			)
		);
		$post_id = self::factory()->post->create(
			array(
				'post_status'  => 'publish',
				'post_content' => implode(
					"\n",
					array(
						$this->table_of_contents_block(),
						'<!-- wp:template-part {"slug":"published-template-part"} /-->',
						'<!-- wp:template-part {"slug":"draft-template-part"} /-->',
					)
				),
			)
		);

		$nav = $this->get_table_of_contents_html( $this->render_post_content( $post_id ) );

		$this->assertStringContainsString( 'Published template part', $nav );
		$this->assertStringNotContainsString( 'Draft template part', $nav );
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
						$this->heading_block( 'Page one heading', 'page-one-heading' ),
						$this->nextpage_block(),
						$this->table_of_contents_block(
							array(
								'onlyIncludeCurrentPage' => true,
							)
						),
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
	public function test_render_in_template_detects_post_content_inside_template_part() {
		$this->create_template_part(
			'toc-post-content',
			'<!-- wp:post-content /-->'
		);

		$GLOBALS['_wp_current_template_content'] = '<!-- wp:template-part {"slug":"toc-post-content"} /-->';
		$post_id                                 = self::factory()->post->create(
			array(
				'post_status'  => 'publish',
				'post_content' => $this->heading_block( 'Post content heading', 'post-content-heading' ),
			)
		);

		$this->go_to( add_query_arg( 'p', $post_id, home_url( '/' ) ) );
		$GLOBALS['post'] = get_post( $post_id );
		setup_postdata( $GLOBALS['post'] );

		$nav = $this->get_table_of_contents_html( do_blocks( $this->table_of_contents_block() ) );

		$this->assertStringContainsString( 'Post content heading', $nav );
		$this->assertStringContainsString( '#post-content-heading', $nav );
	}

	/**
	 * @covers ::gutenberg_block_core_table_of_contents_get_headings_from_content
	 */
	public function test_heading_resolver_includes_repeated_synced_pattern_references() {
		$pattern_id = $this->create_synced_pattern(
			'Repeated synced pattern',
			'repeated-synced-pattern'
		);
		$content    = implode(
			"\n",
			array(
				'<!-- wp:block {"ref":' . $pattern_id . '} /-->',
				'<!-- wp:block {"ref":' . $pattern_id . '} /-->',
			)
		);

		$headings = gutenberg_block_core_table_of_contents_get_headings_from_content( $content );

		$this->assertSame(
			array( 'Repeated synced pattern', 'Repeated synced pattern' ),
			wp_list_pluck( $headings, 'content' )
		);
	}

	/**
	 * @covers ::gutenberg_block_core_table_of_contents_get_headings_from_content
	 */
	public function test_heading_resolver_includes_repeated_template_part_references() {
		$this->create_template_part(
			'repeated-template-part',
			$this->heading_block( 'Repeated template part', 'repeated-template-part-heading' )
		);
		$content = implode(
			"\n",
			array(
				'<!-- wp:template-part {"slug":"repeated-template-part"} /-->',
				'<!-- wp:template-part {"slug":"repeated-template-part"} /-->',
			)
		);

		$headings = gutenberg_block_core_table_of_contents_get_headings_from_content( $content );

		$this->assertSame(
			array( 'Repeated template part', 'Repeated template part' ),
			wp_list_pluck( $headings, 'content' )
		);
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

	private function create_synced_pattern( $heading, $anchor, $args = array() ) {
		return self::factory()->post->create(
			array_merge(
				array(
					'post_type'    => 'wp_block',
					'post_status'  => 'publish',
					'post_title'   => $heading,
					'post_content' => $this->heading_block( $heading, $anchor ),
				),
				$args
			)
		);
	}

	private function create_template_part( $slug, $content, $args = array() ) {
		$template_part_id = self::factory()->post->create(
			array_merge(
				array(
					'post_type'    => 'wp_template_part',
					'post_status'  => 'publish',
					'post_title'   => $slug,
					'post_name'    => $slug,
					'post_content' => $content,
				),
				$args
			)
		);

		wp_set_post_terms( $template_part_id, array( get_stylesheet() ), 'wp_theme' );
		wp_set_post_terms( $template_part_id, array( WP_TEMPLATE_PART_AREA_UNCATEGORIZED ), 'wp_template_part_area' );

		return $template_part_id;
	}

	private function table_of_contents_block( $attributes = array() ) {
		if ( empty( $attributes ) ) {
			return '<!-- wp:table-of-contents /-->';
		}

		return '<!-- wp:table-of-contents ' . wp_json_encode( $attributes ) . ' /-->';
	}

	private function heading_block( $content, $anchor, $level = 2 ) {
		$attributes = array(
			'level'  => $level,
			'anchor' => $anchor,
		);

		return sprintf(
			'<!-- wp:heading %1$s --><h%2$d class="wp-block-heading" id="%3$s">%4$s</h%2$d><!-- /wp:heading -->',
			wp_json_encode( $attributes ),
			$level,
			esc_attr( $anchor ),
			esc_html( $content )
		);
	}

	private function nextpage_block() {
		return '<!--nextpage-->';
	}
}
