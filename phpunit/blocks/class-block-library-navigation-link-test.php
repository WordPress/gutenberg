<?php
/**
 * Tests server side rendering of core/navigation-link
 *
 * @package    Gutenberg
 * @subpackage block-library
 */

/**
 * Tests for various cases in Navigation Link rendering
 */
class Block_Library_Navigation_Link_Test extends WP_UnitTestCase {
	private static $category;
	private static $tag;
	private static $page;
	private static $post;
	private static $draft;
	private static $custom_draft;
	private static $custom_post;

	private static $pages;
	private static $terms;
	/**
	 * @var array|null
	 */
	private $original_block_supports;

	public static function wpSetUpBeforeClass() {
		// Register a unique CPT before creating posts of that type so go_to() can resolve them.
		// has_archive enables get_post_type_archive_link() for the archive branch tests.
		register_post_type(
			'gutenberg_test_nav_cpt',
			array(
				'public'             => true,
				'publicly_queryable' => true,
				'has_archive'        => true,
			)
		);

		self::$draft   = self::factory()->post->create_and_get(
			array(
				'post_type'    => 'page',
				'post_status'  => 'draft',
				'post_name'    => 'ceilingcat',
				'post_title'   => 'Ceiling Cat',
				'post_content' => 'Ceiling Cat content',
				'post_excerpt' => 'Ceiling Cat',
			)
		);
		self::$pages[] = self::$draft;

		self::$custom_draft = self::factory()->post->create_and_get(
			array(
				'post_type'    => 'cats',
				'post_status'  => 'draft',
				'post_name'    => 'metalcat',
				'post_title'   => 'Metal Cat',
				'post_content' => 'Metal Cat content',
				'post_excerpt' => 'Metal Cat',
			)
		);
		self::$pages[]      = self::$custom_draft;

		self::$custom_post = self::factory()->post->create_and_get(
			array(
				'post_type'    => 'gutenberg_test_nav_cpt',
				'post_status'  => 'publish',
				'post_name'    => 'metaldog',
				'post_title'   => 'Metal Dog',
				'post_content' => 'Metal Dog content',
				'post_excerpt' => 'Metal Dog',
			)
		);
		self::$pages[]     = self::$custom_post;

		self::$page    = self::factory()->post->create_and_get(
			array(
				'post_type'    => 'page',
				'post_status'  => 'publish',
				'post_name'    => 'tabby',
				'post_title'   => 'Tabby cats',
				'post_content' => 'Tabby cat content',
				'post_excerpt' => 'Tabby cat',
			)
		);
		self::$pages[] = self::$page;

		self::$post    = self::factory()->post->create_and_get(
			array(
				'post_type'   => 'post',
				'post_status' => 'publish',
				'post_title'  => 'Test Post',
			)
		);
		self::$pages[] = self::$post;

		self::$category = self::factory()->category->create_and_get(
			array(
				'taxonomy'    => 'category',
				'name'        => 'cats',
				'slug'        => 'cats',
				'description' => 'Cats Category',
			)
		);
		self::$terms[]  = self::$category;

		self::$tag     = self::factory()->tag->create_and_get(
			array(
				'name' => 'dogs',
				'slug' => 'dogs',
			)
		);
		self::$terms[] = self::$tag;
	}

	public static function wpTearDownAfterClass() {
		unregister_post_type( 'gutenberg_test_nav_cpt' );
		foreach ( self::$pages as $page_to_delete ) {
			wp_delete_post( $page_to_delete->ID );
		}
		foreach ( self::$terms as $term_to_delete ) {
			wp_delete_term( $term_to_delete->term_id, $term_to_delete->taxonomy );
		}
	}

	public function set_up() {
		parent::set_up();

		$this->original_block_supports      = WP_Block_Supports::$block_to_render;
		WP_Block_Supports::$block_to_render = array(
			'attrs'     => array(),
			'blockName' => '',
		);
	}

	public function tear_down() {
		WP_Block_Supports::$block_to_render = $this->original_block_supports;
		parent::tear_down();
	}

	/**
	 * Renders a navigation-link block with the given attributes and returns the HTML output.
	 */
	private function render_nav_link( array $attrs ): string {
		$json          = wp_json_encode( $attrs );
		$parsed_blocks = parse_blocks( "<!-- wp:navigation-link {$json} /-->" );
		$block         = new WP_Block( $parsed_blocks[0], array() );
		return gutenberg_render_block_core_navigation_link(
			$block->attributes,
			array(),
			$block
		);
	}

	// -------------------------------------------------------------------------
	// Group 1: Active state — Post-type links
	// -------------------------------------------------------------------------

	public function test_current_menu_item_for_page_link() {
		$this->go_to( get_permalink( self::$page->ID ) );
		$output = $this->render_nav_link(
			array(
				'label' => 'Page',
				'type'  => 'page',
				'kind'  => 'post-type',
				'id'    => self::$page->ID,
				'url'   => get_permalink( self::$page->ID ),
			)
		);
		$this->assertStringContainsString( 'current-menu-item', $output );
		$this->assertStringContainsString( 'aria-current="page"', $output );
	}

	public function test_current_menu_item_for_standard_post_link() {
		$this->go_to( get_permalink( self::$post->ID ) );
		$output = $this->render_nav_link(
			array(
				'label' => 'Post',
				'type'  => 'post',
				'kind'  => 'post-type',
				'id'    => self::$post->ID,
				'url'   => get_permalink( self::$post->ID ),
			)
		);
		$this->assertStringContainsString( 'current-menu-item', $output );
		$this->assertStringContainsString( 'aria-current="page"', $output );
	}

	public function test_current_menu_item_for_custom_post_type_link() {
		$this->go_to( get_permalink( self::$custom_post->ID ) );
		$output = $this->render_nav_link(
			array(
				'label' => 'Metal Dog',
				'type'  => 'gutenberg_test_nav_cpt',
				'kind'  => 'post-type',
				'id'    => self::$custom_post->ID,
				'url'   => get_permalink( self::$custom_post->ID ),
			)
		);
		$this->assertStringContainsString( 'current-menu-item', $output );
		$this->assertStringContainsString( 'aria-current="page"', $output );
	}

	public function test_current_menu_item_for_legacy_link_without_kind() {
		$this->go_to( get_permalink( self::$page->ID ) );
		// Omit 'kind' entirely to simulate an older serialised block.
		$output = $this->render_nav_link(
			array(
				'label' => 'Page',
				'type'  => 'page',
				'id'    => self::$page->ID,
				'url'   => get_permalink( self::$page->ID ),
			)
		);
		$this->assertStringContainsString( 'current-menu-item', $output );
		$this->assertStringContainsString( 'aria-current="page"', $output );
	}

	/**
	 * Confirmed failing test (TDD red): a link with kind "custom" and a numeric id
	 * must receive current-menu-item when on the matching page.
	 *
	 * Fails before fix because $kind = "custom", get_queried_object()->custom
	 * does not exist on any WP object, so ! empty(...) is always false.
	 */
	public function test_current_menu_item_for_custom_kind_link_with_id() {
		$this->go_to( get_permalink( self::$page->ID ) );
		$output = $this->render_nav_link(
			array(
				'label' => 'Page',
				'type'  => 'page',
				'kind'  => 'custom',
				'id'    => self::$page->ID,
				'url'   => get_permalink( self::$page->ID ),
			)
		);
		$this->assertStringContainsString( 'current-menu-item', $output );
		$this->assertStringContainsString( 'aria-current="page"', $output );
	}

	/**
	 * When kind is absent but type is "page", the link should still be treated as a post-type
	 * link. Covers WP 6.7 blocks created via Custom Link variation where kind may be omitted
	 * for built-in types.
	 */
	public function test_current_menu_item_for_page_type_without_kind() {
		$this->go_to( get_permalink( self::$page->ID ) );
		$output = $this->render_nav_link(
			array(
				'label' => 'Page',
				'type'  => 'page',
				// No 'kind' — simulates older/custom-link-variation blocks.
				'id'    => self::$page->ID,
				'url'   => get_permalink( self::$page->ID ),
			)
		);
		$this->assertStringContainsString( 'current-menu-item', $output );
		$this->assertStringContainsString( 'aria-current="page"', $output );
	}

	// -------------------------------------------------------------------------
	// Group 2: Active state — Taxonomy links
	// -------------------------------------------------------------------------

	public function test_current_menu_item_for_category_link() {
		$this->go_to( get_term_link( self::$category ) );
		$output = $this->render_nav_link(
			array(
				'label' => 'Cats',
				'type'  => 'category',
				'kind'  => 'taxonomy',
				'id'    => self::$category->term_id,
				'url'   => get_term_link( self::$category ),
			)
		);
		$this->assertStringContainsString( 'current-menu-item', $output );
		$this->assertStringContainsString( 'aria-current="page"', $output );
	}

	public function test_current_menu_item_for_tag_link() {
		$this->go_to( get_term_link( self::$tag ) );
		$output = $this->render_nav_link(
			array(
				'label' => 'Dogs',
				'type'  => 'post_tag',
				'kind'  => 'taxonomy',
				'id'    => self::$tag->term_id,
				'url'   => get_term_link( self::$tag ),
			)
		);
		$this->assertStringContainsString( 'current-menu-item', $output );
		$this->assertStringContainsString( 'aria-current="page"', $output );
	}

	/**
	 * When kind is absent but type is "category", the link should be inferred as a taxonomy
	 * link via taxonomy_exists(). Fails before fix because kind defaults to 'post-type' and
	 * instanceof WP_Post check fails on a term archive page.
	 */
	public function test_current_menu_item_for_category_type_without_kind() {
		$this->go_to( get_term_link( self::$category ) );
		$output = $this->render_nav_link(
			array(
				'label' => 'Cats',
				'type'  => 'category',
				// No 'kind' stored — JS omits kind when newKind is empty and type is built-in.
				'id'    => self::$category->term_id,
				'url'   => get_term_link( self::$category ),
			)
		);
		$this->assertStringContainsString( 'current-menu-item', $output );
		$this->assertStringContainsString( 'aria-current="page"', $output );
	}

	/**
	 * Same as above but for tags. JS normalises 'post_tag' → 'tag' before storing in type,
	 * so the fix must map 'tag' back to 'post_tag' for taxonomy_exists() to return true.
	 */
	public function test_current_menu_item_for_tag_type_without_kind() {
		$this->go_to( get_term_link( self::$tag ) );
		$output = $this->render_nav_link(
			array(
				'label' => 'Dogs',
				'type'  => 'tag', // stored as 'tag', not 'post_tag'.
				// No 'kind' stored.
				'id'    => self::$tag->term_id,
				'url'   => get_term_link( self::$tag ),
			)
		);
		$this->assertStringContainsString( 'current-menu-item', $output );
		$this->assertStringContainsString( 'aria-current="page"', $output );
	}

	// -------------------------------------------------------------------------
	// Group 3: Not active — non-matching page (no go_to)
	// -------------------------------------------------------------------------

	public function test_no_current_menu_item_when_not_on_linked_page() {
		// No go_to() — get_queried_object_id() returns 0, so no id can match.
		$output = $this->render_nav_link(
			array(
				'label' => 'Page',
				'type'  => 'page',
				'kind'  => 'post-type',
				'id'    => self::$page->ID,
				'url'   => get_permalink( self::$page->ID ),
			)
		);
		$this->assertStringNotContainsString( 'current-menu-item', $output );
		$this->assertStringNotContainsString( 'aria-current', $output );
	}

	// -------------------------------------------------------------------------
	// Group 4: Not active — ID edge cases
	// -------------------------------------------------------------------------

	public function test_no_current_menu_item_when_id_is_absent() {
		$this->go_to( get_permalink( self::$page->ID ) );
		$output = $this->render_nav_link(
			array(
				'label' => 'Page',
				'type'  => 'page',
				'kind'  => 'post-type',
				'url'   => get_permalink( self::$page->ID ),
				// No 'id' attribute.
			)
		);
		$this->assertStringNotContainsString( 'current-menu-item', $output );
		$this->assertStringNotContainsString( 'aria-current', $output );
	}

	public function test_no_current_menu_item_when_id_is_zero() {
		$this->go_to( get_permalink( self::$page->ID ) );
		$output = $this->render_nav_link(
			array(
				'label' => 'Page',
				'type'  => 'page',
				'kind'  => 'post-type',
				'id'    => 0,
				'url'   => get_permalink( self::$page->ID ),
			)
		);
		$this->assertStringNotContainsString( 'current-menu-item', $output );
		$this->assertStringNotContainsString( 'aria-current', $output );
	}

	public function test_no_current_menu_item_when_id_is_string_url() {
		$this->go_to( get_permalink( self::$page->ID ) );
		// Render with id set to a URL string — the historical bug scenario.
		// is_numeric() must prevent this from ever matching.
		$output = $this->render_nav_link(
			array(
				'label' => 'Page',
				'type'  => 'page',
				'kind'  => 'post-type',
				'id'    => 'https://example.com',
				'url'   => get_permalink( self::$page->ID ),
			)
		);
		$this->assertStringNotContainsString( 'current-menu-item', $output );
		$this->assertStringNotContainsString( 'aria-current', $output );
	}

	// -------------------------------------------------------------------------
	// Group 5: Not active — post/term ID collision guards
	// -------------------------------------------------------------------------

	public function test_taxonomy_link_not_active_when_on_post_page_with_matching_id() {
		// Simulate being on a post page. The taxonomy link carries the same integer
		// id as the post — this must NOT produce a false positive.
		$this->go_to( get_permalink( self::$page->ID ) );
		$output = $this->render_nav_link(
			array(
				'label' => 'Category',
				'type'  => 'category',
				'kind'  => 'taxonomy',
				'id'    => self::$page->ID,
				'url'   => get_term_link( self::$category ),
			)
		);
		$this->assertStringNotContainsString( 'current-menu-item', $output );
		$this->assertStringNotContainsString( 'aria-current', $output );
	}

	public function test_post_type_link_not_active_when_on_term_page_with_matching_id() {
		// Simulate being on a term archive page. The post-type link carries the same
		// integer id as the term — this must NOT produce a false positive.
		$this->go_to( get_term_link( self::$category ) );
		$output = $this->render_nav_link(
			array(
				'label' => 'Page',
				'type'  => 'page',
				'kind'  => 'post-type',
				'id'    => self::$category->term_id,
				'url'   => get_permalink( self::$page->ID ),
			)
		);
		$this->assertStringNotContainsString( 'current-menu-item', $output );
		$this->assertStringNotContainsString( 'aria-current', $output );
	}

	// -------------------------------------------------------------------------
	// Group 6: Active state — post type archive (Branch C, mirrors classic menu)
	// -------------------------------------------------------------------------

	/**
	 * A post-type-archive link should receive current-menu-item when on the matching
	 * archive page. Mirrors Branch C of _wp_menu_item_classes_by_context().
	 */
	public function test_current_menu_item_for_post_type_archive_link() {
		$archive_url = get_post_type_archive_link( 'gutenberg_test_nav_cpt' );
		$this->go_to( $archive_url );
		$output = $this->render_nav_link(
			array(
				'label' => 'Custom CPT Archive',
				'type'  => 'gutenberg_test_nav_cpt',
				'kind'  => 'post-type-archive',
				'url'   => $archive_url,
			)
		);
		$this->assertStringContainsString( 'current-menu-item', $output );
	}

	/**
	 * A post-type-archive link should NOT be active when on a different post type's archive.
	 */
	public function test_no_current_menu_item_for_archive_link_on_wrong_archive() {
		// Go to the custom CPT archive but render a link pointing to the posts archive.
		$this->go_to( get_post_type_archive_link( 'gutenberg_test_nav_cpt' ) );
		$output = $this->render_nav_link(
			array(
				'label' => 'Posts Archive',
				'type'  => 'post',
				'kind'  => 'post-type-archive',
				'url'   => get_post_type_archive_link( 'post' ),
			)
		);
		$this->assertStringNotContainsString( 'current-menu-item', $output );
	}

	/**
	 * A post-type-archive link should NOT be active on a non-archive page even if the URL
	 * happens to be set — is_post_type_archive() must be true for the branch to fire.
	 */
	public function test_no_current_menu_item_for_archive_link_on_singular_page() {
		$archive_url = get_post_type_archive_link( 'gutenberg_test_nav_cpt' );
		$this->go_to( get_permalink( self::$page->ID ) );
		$output = $this->render_nav_link(
			array(
				'label' => 'Custom CPT Archive',
				'type'  => 'gutenberg_test_nav_cpt',
				'kind'  => 'post-type-archive',
				'url'   => $archive_url,
			)
		);
		$this->assertStringNotContainsString( 'current-menu-item', $output );
	}

	public function test_returns_link_when_post_is_published() {
		$page_id = self::$page->ID;
		$url     = 'http://' . WP_TESTS_DOMAIN;

		$parsed_blocks = parse_blocks(
			"<!-- wp:navigation-link {\"label\":\"Sample Page\",\"type\":\"page\",\"id\":{$page_id},\"url\":\"{$url}/?page_id={$page_id}\"} /-->"
		);
		$this->assertEquals( 1, count( $parsed_blocks ) );

		$navigation_link_block = new WP_Block( $parsed_blocks[0], array() );
		$this->assertEquals(
			true,
			strpos(
				gutenberg_render_block_core_navigation_link(
					$navigation_link_block->attributes,
					array(),
					$navigation_link_block
				),
				'Sample Page'
			) !== false
		);
	}

	public function test_returns_empty_when_label_is_missing() {
		$page_id = self::$page->ID;
		$url     = 'http://' . WP_TESTS_DOMAIN;

		$parsed_blocks = parse_blocks(
			"<!-- wp:navigation-link {\"type\":\"page\",\"id\":{$page_id},\"url\":\"{$url}/?page_id={$page_id}\"} /-->"
		);
		$this->assertEquals( 1, count( $parsed_blocks ) );

		$navigation_link_block = new WP_Block( $parsed_blocks[0], array() );
		$this->assertEquals(
			'',
			gutenberg_render_block_core_navigation_link(
				$navigation_link_block->attributes,
				array(),
				$navigation_link_block
			)
		);
	}

	public function test_returns_empty_when_draft() {
		$page_id = self::$draft->ID;
		$url     = 'http://' . WP_TESTS_DOMAIN;

		$parsed_blocks = parse_blocks(
			"<!-- wp:navigation-link {\"label\":\"Draft Page\",\"type\":\"page\",\"id\":{$page_id},\"url\":\"{$url}/?page_id={$page_id}\"} /-->"
		);
		$this->assertEquals( 1, count( $parsed_blocks ) );

		$navigation_link_block = new WP_Block( $parsed_blocks[0], array() );

		$this->assertEquals(
			'',
			gutenberg_render_block_core_navigation_link(
				$navigation_link_block->attributes,
				array(),
				$navigation_link_block
			)
		);
	}

	public function test_returns_link_for_category() {
		$category_id = self::$category->term_id;
		$url         = 'http://' . WP_TESTS_DOMAIN;

		$parsed_blocks = parse_blocks(
			"<!-- wp:navigation-link {\"label\":\"Cats\",\"type\":\"category\",\"id\":{$category_id},\"url\":\"{$url}/?cat={$category_id}\"} /-->"
		);
		$this->assertEquals( 1, count( $parsed_blocks ) );

		$navigation_link_block = new WP_Block( $parsed_blocks[0], array() );
		$this->assertEquals(
			true,
			strpos(
				gutenberg_render_block_core_navigation_link(
					$navigation_link_block->attributes,
					array(),
					$navigation_link_block
				),
				'Cats'
			) !== false
		);
	}

	public function test_returns_link_for_plain_link() {
		$parsed_blocks = parse_blocks(
			'<!-- wp:navigation-link {"label":"My Website","url":"https://example.com"} /-->'
		);
		$this->assertEquals( 1, count( $parsed_blocks ) );

		$navigation_link_block = new WP_Block( $parsed_blocks[0], array() );
		$this->assertEquals(
			true,
			strpos(
				gutenberg_render_block_core_navigation_link(
					$navigation_link_block->attributes,
					array(),
					$navigation_link_block
				),
				'My Website'
			) !== false
		);
	}

	public function test_returns_link_for_decoded_link() {

		$urls_before_render = array(
			'https://example.com/?id=10&data=lzB%252Fzd%252FZA%253D%253D',
			'https://example.com/?id=10&data=lzB%2Fzd%FZA%3D%3D',
			'https://example.com/?id=10&data=1234',
			'https://example.com/?arrayParams[]=1&arrayParams[]=2&arrayParams[]=3',
		);

		$urls_after_render = array(
			'https://example.com/?id=10&#038;data=lzB%2Fzd%2FZA%3D%3D',
			'https://example.com/?id=10&#038;data=lzB%2Fzd%FZA%3D%3D',
			'https://example.com/?id=10&#038;data=1234',
			'https://example.com/?arrayParams%5B%5D=1&#038;arrayParams%5B%5D=2&#038;arrayParams%5B%5D=3',
		);

		foreach ( $urls_before_render as $idx => $link ) {
				$parsed_blocks = parse_blocks( '<!-- wp:navigation-link {"label":"test label", "url": "' . $link . '"} /-->' );
			$this->assertEquals( 1, count( $parsed_blocks ) );
				$block             = $parsed_blocks[0];
			$navigation_link_block = new WP_Block( $block, array() );
				$this->assertEquals(
					true,
					strpos(
						gutenberg_render_block_core_navigation_link(
							$navigation_link_block->attributes,
							array(),
							$navigation_link_block
						),
						$urls_after_render[ $idx ]
					) !== false
				);
		}
	}

	public function test_returns_empty_when_custom_post_type_draft() {
		$page_id = self::$custom_draft->ID;
		$url     = 'http://' . WP_TESTS_DOMAIN;

		$parsed_blocks = parse_blocks(
			"<!-- wp:navigation-link {\"label\":\"Draft Custom Post Type\",\"type\":\"cats\",\"kind\":\"post-type\",\"id\":{$page_id},\"url\":\"{$url}/?page_id={$page_id}\"} /-->"
		);
		$this->assertEquals( 1, count( $parsed_blocks ) );

		$navigation_link_block = new WP_Block( $parsed_blocks[0], array() );

		$this->assertEquals(
			'',
			gutenberg_render_block_core_navigation_link(
				$navigation_link_block->attributes,
				array(),
				$navigation_link_block
			)
		);
	}

	public function test_returns_link_when_custom_post_is_published() {
		$page_id = self::$custom_post->ID;
		$url     = 'http://' . WP_TESTS_DOMAIN;

		$parsed_blocks = parse_blocks(
			"<!-- wp:navigation-link {\"label\":\"Metal Dogs\",\"type\":\"gutenberg_test_nav_cpt\",\"kind\":\"post-type\",\"id\":{$page_id},\"url\":\"{$url}/?page_id={$page_id}\"} /-->"
		);
		$this->assertEquals( 1, count( $parsed_blocks ) );

		$navigation_link_block = new WP_Block( $parsed_blocks[0], array() );
		$this->assertEquals(
			true,
			strpos(
				gutenberg_render_block_core_navigation_link(
					$navigation_link_block->attributes,
					array(),
					$navigation_link_block
				),
				'Metal Dogs'
			) !== false
		);
	}
}
