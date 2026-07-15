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

	private $registered_patterns = array();

	public function set_up() {
		parent::set_up();
		switch_theme( 'emptytheme' );
	}

	public function tear_down() {
		foreach ( $this->registered_patterns as $pattern_name ) {
			$registry = WP_Block_Patterns_Registry::get_instance();
			if ( $registry->is_registered( $pattern_name ) ) {
				unregister_block_pattern( $pattern_name );
			}
		}
		$this->registered_patterns = array();

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

		$nav = $this->get_table_of_contents_html( $this->render_table_of_contents_for_post( $post_id ) );

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

	/**
	 * @covers ::gutenberg_block_core_table_of_contents_render
	 */
	public function test_render_uses_synced_pattern_overrides_for_heading_content() {
		$heading_name = 'Section title';
		$pattern_id   = $this->create_synced_pattern_with_content(
			'Reusable section',
			$this->pattern_override_heading_block(
				'Reusable section title',
				'custom-section-title',
				$heading_name
			)
		);
		$post_id      = self::factory()->post->create(
			array(
				'post_status'  => 'publish',
				'post_content' => implode(
					"\n",
					array(
						$this->table_of_contents_block(),
						$this->synced_pattern_block_with_attributes(
							array(
								'ref'     => $pattern_id,
								'content' => array(
									$heading_name => array(
										'content' => 'Custom section title',
									),
								),
							)
						),
					)
				),
			)
		);

		$nav = $this->get_table_of_contents_html( $this->render_post_content( $post_id ) );

		$this->assertStringContainsString( 'Custom section title', $nav );
		$this->assertStringContainsString( '#custom-section-title', $nav );
		$this->assertStringNotContainsString( 'Reusable section title', $nav );
	}

	/**
	 * @covers ::gutenberg_block_core_table_of_contents_get_headings_from_content
	 */
	public function test_heading_resolver_includes_registered_pattern_headings() {
		$this->register_pattern(
			'test/table-of-contents-pattern',
			$this->heading_block( 'Registered pattern heading', 'registered-pattern-heading' )
		);

		$headings = gutenberg_block_core_table_of_contents_get_headings_from_content(
			$this->pattern_block( 'test/table-of-contents-pattern' )
		);

		$this->assertSame(
			array( 'Registered pattern heading' ),
			wp_list_pluck( $headings, 'content' )
		);
	}

	/**
	 * @covers ::gutenberg_block_core_table_of_contents_get_headings_from_content
	 */
	public function test_heading_resolver_includes_repeated_registered_pattern_references() {
		$this->register_pattern(
			'test/repeated-table-of-contents-pattern',
			$this->heading_block( 'Repeated registered pattern', 'repeated-registered-pattern' )
		);
		$content = implode(
			"\n",
			array(
				$this->pattern_block( 'test/repeated-table-of-contents-pattern' ),
				$this->pattern_block( 'test/repeated-table-of-contents-pattern' ),
			)
		);

		$headings = gutenberg_block_core_table_of_contents_get_headings_from_content( $content );

		$this->assertSame(
			array( 'Repeated registered pattern', 'Repeated registered pattern' ),
			wp_list_pluck( $headings, 'content' )
		);
	}

	/**
	 * @covers ::gutenberg_block_core_table_of_contents_get_heading_link
	 */
	public function test_heading_link_handles_empty_unpaginated_and_paginated_links() {
		$permalink_with_stale_page = add_query_arg( 'page', 99, home_url( '/sample-post/' ) );

		$this->assertSame( '', gutenberg_block_core_table_of_contents_get_heading_link( '' ) );
		$this->assertSame( '#intro', gutenberg_block_core_table_of_contents_get_heading_link( 'intro' ) );
		$this->assertSame(
			'#intro',
			gutenberg_block_core_table_of_contents_get_heading_link(
				'intro',
				array(
					'is_paginated' => false,
					'permalink'    => $permalink_with_stale_page,
				)
			)
		);
		$this->assertSame(
			remove_query_arg( 'page', $permalink_with_stale_page ) . '#intro',
			gutenberg_block_core_table_of_contents_get_heading_link(
				'intro',
				array(
					'current_page' => 1,
					'is_paginated' => true,
					'permalink'    => $permalink_with_stale_page,
				)
			)
		);
		$this->assertSame(
			add_query_arg( 'page', 2, remove_query_arg( 'page', $permalink_with_stale_page ) ) . '#intro',
			gutenberg_block_core_table_of_contents_get_heading_link(
				'intro',
				array(
					'current_page' => 2,
					'is_paginated' => true,
					'permalink'    => $permalink_with_stale_page,
				)
			)
		);
	}

	/**
	 * @covers ::gutenberg_block_core_table_of_contents_normalize_nextpage_blocks
	 */
	public function test_normalize_nextpage_blocks_wraps_raw_markers_once() {
		$nextpage_block = '<!-- wp:nextpage --><!--nextpage--><!-- /wp:nextpage -->';

		$this->assertSame(
			'Before' . $nextpage_block . 'After',
			gutenberg_block_core_table_of_contents_normalize_nextpage_blocks( 'Before<!--nextpage-->After' )
		);
		$this->assertSame(
			$nextpage_block,
			gutenberg_block_core_table_of_contents_normalize_nextpage_blocks( $nextpage_block )
		);
		$this->assertSame(
			'One' . $nextpage_block . 'Two' . $nextpage_block . 'Three',
			gutenberg_block_core_table_of_contents_normalize_nextpage_blocks( 'One<!--nextpage-->Two' . $nextpage_block . 'Three' )
		);
	}

	/**
	 * @covers ::gutenberg_block_core_table_of_contents_linear_to_nested_heading_list
	 */
	public function test_linear_to_nested_heading_list_skips_empty_headings_and_nests_skipped_levels() {
		$headings = array(
			array(
				'content' => '',
				'level'   => 2,
				'link'    => '',
			),
			array(
				'content' => 'Parent',
				'level'   => 2,
				'link'    => '#parent',
			),
			array(
				'content' => 'Skipped level child',
				'level'   => 4,
				'link'    => '#skipped-level-child',
			),
			array(
				'content' => 'Sibling',
				'level'   => 2,
				'link'    => '#sibling',
			),
		);

		$this->assertSame(
			array(
				array(
					'heading'  => $headings[1],
					'children' => array(
						array(
							'heading'  => $headings[2],
							'children' => null,
						),
					),
				),
				array(
					'heading'  => $headings[3],
					'children' => null,
				),
			),
			gutenberg_block_core_table_of_contents_linear_to_nested_heading_list( $headings )
		);
	}

	/**
	 * @covers ::gutenberg_block_core_table_of_contents_build_list_items
	 */
	public function test_build_list_items_renders_links_spans_nested_lists_and_escapes_content() {
		$nested_headings = array(
			array(
				'heading'  => array(
					'content' => 'Linked <b>heading</b>',
					'level'   => 2,
					'link'    => 'https://example.org/?a=1&b=2#linked-heading',
				),
				'children' => array(
					array(
						'heading'  => array(
							'content' => 'Plain & child',
							'level'   => 3,
							'link'    => '',
						),
						'children' => null,
					),
				),
			),
		);

		$list_items = gutenberg_block_core_table_of_contents_build_list_items( $nested_headings, 'ul' );

		$this->assertStringContainsString(
			'<a class="wp-block-table-of-contents__entry" href="' . esc_url( 'https://example.org/?a=1&b=2#linked-heading' ) . '">Linked &lt;b&gt;heading&lt;/b&gt;</a>',
			$list_items
		);
		$this->assertStringContainsString(
			'<ul><li><span class="wp-block-table-of-contents__entry">Plain &amp; child</span></li></ul>',
			$list_items
		);
		$this->assertStringNotContainsString( '<b>heading</b>', $list_items );
	}

	/**
	 * @covers ::gutenberg_block_core_table_of_contents_get_headings_from_content
	 */
	public function test_heading_resolver_halts_synced_pattern_cycles() {
		$first_pattern_id  = $this->create_synced_pattern_with_content( 'First synced pattern', '' );
		$second_pattern_id = $this->create_synced_pattern_with_content(
			'Second synced pattern',
			implode(
				"\n",
				array(
					$this->heading_block( 'Second synced pattern', 'second-synced-pattern' ),
					$this->synced_pattern_block( $first_pattern_id ),
				)
			)
		);

		wp_update_post(
			array(
				'ID'           => $first_pattern_id,
				'post_content' => implode(
					"\n",
					array(
						$this->heading_block( 'First synced pattern', 'first-synced-pattern' ),
						$this->synced_pattern_block( $second_pattern_id ),
					)
				),
			)
		);

		$headings = gutenberg_block_core_table_of_contents_get_headings_from_content( $this->synced_pattern_block( $first_pattern_id ) );

		$this->assertSame(
			array( 'First synced pattern', 'Second synced pattern' ),
			wp_list_pluck( $headings, 'content' )
		);
	}

	/**
	 * @covers ::gutenberg_block_core_table_of_contents_get_headings_from_content
	 */
	public function test_heading_resolver_halts_template_part_cycles() {
		$first_template_part_id = $this->create_template_part( 'first-cycle-part', '' );
		$this->create_template_part(
			'second-cycle-part',
			implode(
				"\n",
				array(
					$this->heading_block( 'Second template part', 'second-template-part' ),
					$this->template_part_block( 'first-cycle-part' ),
				)
			)
		);

		wp_update_post(
			array(
				'ID'           => $first_template_part_id,
				'post_content' => implode(
					"\n",
					array(
						$this->heading_block( 'First template part', 'first-template-part' ),
						$this->template_part_block( 'second-cycle-part' ),
					)
				),
			)
		);

		$headings = gutenberg_block_core_table_of_contents_get_headings_from_content( $this->template_part_block( 'first-cycle-part' ) );

		$this->assertSame(
			array( 'First template part', 'Second template part' ),
			wp_list_pluck( $headings, 'content' )
		);
	}

	/**
	 * @covers ::gutenberg_block_core_table_of_contents_get_headings_from_content
	 */
	public function test_heading_resolver_halts_registered_pattern_cycles() {
		$this->register_pattern(
			'test/first-cycle-pattern',
			implode(
				"\n",
				array(
					$this->heading_block( 'First registered pattern', 'first-registered-pattern' ),
					$this->pattern_block( 'test/second-cycle-pattern' ),
				)
			)
		);
		$this->register_pattern(
			'test/second-cycle-pattern',
			implode(
				"\n",
				array(
					$this->heading_block( 'Second registered pattern', 'second-registered-pattern' ),
					$this->pattern_block( 'test/first-cycle-pattern' ),
				)
			)
		);

		$headings = gutenberg_block_core_table_of_contents_get_headings_from_content(
			$this->pattern_block( 'test/first-cycle-pattern' )
		);

		$this->assertSame(
			array( 'First registered pattern', 'Second registered pattern' ),
			wp_list_pluck( $headings, 'content' )
		);
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
	 * @covers ::gutenberg_block_core_table_of_contents_get_template_part_content
	 */
	public function test_template_part_content_matches_renderable_template_part_sources() {
		$database_content = $this->heading_block( 'Database template part', 'database-template-part' );
		$this->create_template_part( 'database-template-part', $database_content );
		$this->create_template_part(
			'draft-template-part',
			$this->heading_block( 'Draft template part', 'draft-template-part' ),
			array(
				'post_status' => 'draft',
			)
		);

		$this->assertSame(
			$database_content,
			gutenberg_block_core_table_of_contents_get_template_part_content(
				array(
					'slug' => 'database-template-part',
				)
			)
		);
		$this->assertSame(
			'',
			gutenberg_block_core_table_of_contents_get_template_part_content(
				array(
					'slug' => 'draft-template-part',
				)
			)
		);
		$this->assertSame(
			'',
			gutenberg_block_core_table_of_contents_get_template_part_content(
				array(
					'slug'  => 'database-template-part',
					'theme' => 'twentytwentyone',
				)
			)
		);
		$this->assertStringContainsString(
			'<!-- wp:site-title /-->',
			gutenberg_block_core_table_of_contents_get_template_part_content(
				array(
					'slug' => 'header',
				)
			)
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

	private function render_table_of_contents_for_post( $post_id ) {
		$this->go_to( add_query_arg( 'p', $post_id, home_url( '/' ) ) );
		$GLOBALS['post'] = get_post( $post_id );
		setup_postdata( $GLOBALS['post'] );

		$GLOBALS['_wp_current_template_content'] = '<!-- wp:post-content /-->';

		return do_blocks( $this->table_of_contents_block() );
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
		return $this->create_synced_pattern_with_content(
			$heading,
			$this->heading_block( $heading, $anchor ),
			$args
		);
	}

	private function create_synced_pattern_with_content( $title, $content, $args = array() ) {
		return self::factory()->post->create(
			array_merge(
				array(
					'post_type'    => 'wp_block',
					'post_status'  => 'publish',
					'post_title'   => $title,
					'post_content' => $content,
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

	private function synced_pattern_block( $ref ) {
		return '<!-- wp:block {"ref":' . (int) $ref . '} /-->';
	}

	private function synced_pattern_block_with_attributes( $attributes ) {
		return '<!-- wp:block ' . wp_json_encode( $attributes ) . ' /-->';
	}

	private function template_part_block( $slug, $theme = '' ) {
		$attributes = array(
			'slug' => $slug,
		);

		if ( '' !== $theme ) {
			$attributes['theme'] = $theme;
		}

		return '<!-- wp:template-part ' . wp_json_encode( $attributes ) . ' /-->';
	}

	private function pattern_block( $slug ) {
		return '<!-- wp:pattern ' . wp_json_encode( array( 'slug' => $slug ) ) . ' /-->';
	}

	private function register_pattern( $slug, $content ) {
		register_block_pattern(
			$slug,
			array(
				'title'   => $slug,
				'content' => $content,
			)
		);
		$this->registered_patterns[] = $slug;
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

	private function pattern_override_heading_block( $content, $anchor, $name, $level = 2 ) {
		$attributes = array(
			'anchor'   => $anchor,
			'level'    => $level,
			'metadata' => array(
				'name'     => $name,
				'bindings' => array(
					'__default' => array(
						'source' => 'core/pattern-overrides',
					),
				),
			),
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
