<?php
/**
 * Tests server side rendering of core/navigation-link
 *
 * @package    gutenberg
 * @subpackage block-library
 */

/**
 * Tests for various cases in Navigation Link rendering
 */
class Block_Library_Navigation_Link_Test extends WP_UnitTestCase {
	private static $category;
	private static $tag;
	private static $page;
	private static $other_page;
	private static $post;
	private static $draft;
	private static $custom_draft;
	private static $custom_post;
	private static $custom_term;

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
			'gb_test_nav_cpt',
			array(
				'public'             => true,
				'publicly_queryable' => true,
				'has_archive'        => true,
			)
		);
		// Custom taxonomy for links stored with kind "custom" and a taxonomy type.
		register_taxonomy(
			'gb_test_nav_tax',
			'post',
			array(
				'public'             => true,
				'publicly_queryable' => true,
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
				'post_type'    => 'gb_test_nav_cpt',
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

		self::$other_page = self::factory()->post->create_and_get(
			array(
				'post_type'   => 'page',
				'post_status' => 'publish',
				'post_title'  => 'Other page',
			)
		);
		self::$pages[]    = self::$other_page;

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

		self::$custom_term = self::factory()->term->create_and_get(
			array(
				'taxonomy' => 'gb_test_nav_tax',
				'name'     => 'birds',
				'slug'     => 'birds',
			)
		);
		self::$terms[]     = self::$custom_term;
	}

	public static function wpTearDownAfterClass() {
		foreach ( self::$pages as $page_to_delete ) {
			wp_delete_post( $page_to_delete->ID );
		}
		foreach ( self::$terms as $term_to_delete ) {
			wp_delete_term( $term_to_delete->term_id, $term_to_delete->taxonomy );
		}
		unregister_taxonomy( 'gb_test_nav_tax' );
		unregister_post_type( 'gb_test_nav_cpt' );
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

	/**
	 * Renders a list of navigation-link blocks in a single do_blocks() pass, as a menu would.
	 */
	private function render_nav_links( array $links ): string {
		$markup = '';
		foreach ( $links as $attrs ) {
			$markup .= '<!-- wp:navigation-link ' . wp_json_encode( $attrs ) . ' /-->';
		}
		return do_blocks( $markup );
	}

	/**
	 * Returns the href of every rendered item with the current-menu-item class.
	 */
	private function get_current_item_urls( string $html ): array {
		$urls      = array();
		$processor = new WP_HTML_Tag_Processor( $html );
		while ( $processor->next_tag( array( 'class_name' => 'current-menu-item' ) ) ) {
			$processor->next_tag( 'a' );
			$urls[] = $processor->get_attribute( 'href' );
		}
		return $urls;
	}

	/**
	 * Returns attributes for a set of links covering each kind of entity and URL.
	 */
	private function get_mixed_menu_links(): array {
		return array(
			array(
				'label' => 'Page',
				'type'  => 'page',
				'kind'  => 'post-type',
				'id'    => self::$page->ID,
				'url'   => get_permalink( self::$page->ID ),
			),
			array(
				'label' => 'Other page',
				'type'  => 'page',
				'kind'  => 'post-type',
				'id'    => self::$other_page->ID,
				'url'   => get_permalink( self::$other_page->ID ),
			),
			array(
				'label' => 'Post',
				'type'  => 'post',
				'kind'  => 'post-type',
				'id'    => self::$post->ID,
				'url'   => get_permalink( self::$post->ID ),
			),
			array(
				'label' => 'Metal Dog',
				'type'  => 'gb_test_nav_cpt',
				'kind'  => 'post-type',
				'id'    => self::$custom_post->ID,
				'url'   => get_permalink( self::$custom_post->ID ),
			),
			array(
				'label' => 'Cats',
				'type'  => 'category',
				'kind'  => 'taxonomy',
				'id'    => self::$category->term_id,
				'url'   => get_term_link( self::$category ),
			),
			array(
				'label' => 'Dogs',
				'type'  => 'tag',
				'kind'  => 'taxonomy',
				'id'    => self::$tag->term_id,
				'url'   => get_term_link( self::$tag ),
			),
			array(
				'label' => 'Birds',
				'type'  => 'gb_test_nav_tax',
				'kind'  => 'custom',
				'id'    => self::$custom_term->term_id,
				'url'   => get_term_link( self::$custom_term ),
			),
			array(
				'label' => 'External',
				'type'  => 'custom',
				'kind'  => 'custom',
				'url'   => 'https://example.com/',
			),
			array(
				'label' => 'Custom CPT Archive',
				'type'  => 'gb_test_nav_cpt',
				'kind'  => 'post-type-archive',
				'url'   => get_post_type_archive_link( 'gb_test_nav_cpt' ),
			),
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
				'type'  => 'gb_test_nav_cpt',
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
	 * A link stored with kind "custom" and a numeric id is active on the matching page.
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
	 * The editor stores kind "custom" for links to non-built-in types, such as a custom
	 * post type, while keeping the entity id. These links are active on the matching post.
	 */
	public function test_current_menu_item_for_custom_kind_custom_post_type_link() {
		$this->go_to( get_permalink( self::$custom_post->ID ) );
		$output = $this->render_nav_link(
			array(
				'label' => 'Metal Dog',
				'type'  => 'gb_test_nav_cpt',
				'kind'  => 'custom',
				'id'    => self::$custom_post->ID,
				'url'   => get_permalink( self::$custom_post->ID ),
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
	 * When kind is absent but type is "category", the link is inferred to be a taxonomy
	 * link via taxonomy_exists() and is active on the category archive.
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
	 * Same as above but for tags. The editor stores 'post_tag' as 'tag' in type, which
	 * must be mapped back to 'post_tag' for taxonomy_exists() to recognise it.
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

	/**
	 * The editor stores kind "custom" for links to non-built-in types, such as a custom
	 * taxonomy, while keeping the term id. The kind is inferred from type, so these links
	 * are active on the matching term archive.
	 */
	public function test_current_menu_item_for_custom_kind_custom_taxonomy_link() {
		$this->go_to( get_term_link( self::$custom_term ) );
		$output = $this->render_nav_link(
			array(
				'label' => 'Birds',
				'type'  => 'gb_test_nav_tax',
				'kind'  => 'custom',
				'id'    => self::$custom_term->term_id,
				'url'   => get_term_link( self::$custom_term ),
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

	public function test_no_current_menu_item_for_link_to_a_different_page() {
		// Same kind and type as the current page, but a different id.
		$this->go_to( get_permalink( self::$page->ID ) );
		$output = $this->render_nav_link(
			array(
				'label' => 'Other page',
				'type'  => 'page',
				'kind'  => 'post-type',
				'id'    => self::$other_page->ID,
				'url'   => get_permalink( self::$other_page->ID ),
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
		// absint() must prevent this from ever matching.
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

	public function test_custom_kind_taxonomy_link_not_active_when_on_post_page_with_matching_id() {
		// A custom-kind link whose type is a taxonomy refers to a term, so it must not be
		// treated as a post link and match a post with the same integer id.
		$this->go_to( get_permalink( self::$post->ID ) );
		$output = $this->render_nav_link(
			array(
				'label' => 'Birds',
				'type'  => 'gb_test_nav_tax',
				'kind'  => 'custom',
				'id'    => self::$post->ID,
				'url'   => get_term_link( self::$custom_term ),
			)
		);
		$this->assertStringNotContainsString( 'current-menu-item', $output );
		$this->assertStringNotContainsString( 'aria-current', $output );
	}

	// -------------------------------------------------------------------------
	// Group 6: Active state — post type archive (matched by URL)
	// -------------------------------------------------------------------------

	/**
	 * A post-type-archive link receives current-menu-item on the matching archive page,
	 * mirroring the post type archive check in _wp_menu_item_classes_by_context().
	 */
	public function test_current_menu_item_for_post_type_archive_link() {
		$archive_url = get_post_type_archive_link( 'gb_test_nav_cpt' );
		$this->go_to( $archive_url );
		$output = $this->render_nav_link(
			array(
				'label' => 'Custom CPT Archive',
				'type'  => 'gb_test_nav_cpt',
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
		$this->go_to( get_post_type_archive_link( 'gb_test_nav_cpt' ) );
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
		$archive_url = get_post_type_archive_link( 'gb_test_nav_cpt' );
		$this->go_to( get_permalink( self::$page->ID ) );
		$output = $this->render_nav_link(
			array(
				'label' => 'Custom CPT Archive',
				'type'  => 'gb_test_nav_cpt',
				'kind'  => 'post-type-archive',
				'url'   => $archive_url,
			)
		);
		$this->assertStringNotContainsString( 'current-menu-item', $output );
	}

	/**
	 * Post-type-archive links are matched by URL only. A stray id that matches the current
	 * post must not make the archive link active.
	 */
	public function test_no_current_menu_item_for_archive_link_with_id_matching_singular_post() {
		$archive_url = get_post_type_archive_link( 'gb_test_nav_cpt' );
		$this->go_to( get_permalink( self::$custom_post->ID ) );
		$output = $this->render_nav_link(
			array(
				'label' => 'Custom CPT Archive',
				'type'  => 'gb_test_nav_cpt',
				'kind'  => 'post-type-archive',
				'id'    => self::$custom_post->ID,
				'url'   => $archive_url,
			)
		);
		$this->assertStringNotContainsString( 'current-menu-item', $output );
		$this->assertStringNotContainsString( 'aria-current', $output );
	}

	// -------------------------------------------------------------------------
	// Group 7: Only the matching item is active in a menu
	// -------------------------------------------------------------------------

	public function test_only_the_link_to_the_current_page_is_active_in_a_menu() {
		$this->go_to( get_permalink( self::$page->ID ) );
		$output = $this->render_nav_links( $this->get_mixed_menu_links() );

		$this->assertSame(
			array( get_permalink( self::$page->ID ) ),
			$this->get_current_item_urls( $output ),
			'Only the link to the current page should have current-menu-item.'
		);
		$this->assertSame( 1, substr_count( $output, 'aria-current="page"' ) );
	}

	public function test_only_the_link_to_the_current_term_is_active_in_a_menu() {
		$this->go_to( get_term_link( self::$category ) );
		$output = $this->render_nav_links( $this->get_mixed_menu_links() );

		$this->assertSame(
			array( get_term_link( self::$category ) ),
			$this->get_current_item_urls( $output ),
			'Only the link to the current term should have current-menu-item.'
		);
		$this->assertSame( 1, substr_count( $output, 'aria-current="page"' ) );
	}

	public function test_returns_link_when_post_is_published() {
		$page_id = self::$page->ID;
		$url     = 'http://' . WP_TESTS_DOMAIN;

		$parsed_blocks = parse_blocks(
			"<!-- wp:navigation-link {\"label\":\"Sample Page\",\"type\":\"page\",\"id\":{$page_id},\"url\":\"{$url}/?page_id={$page_id}\"} /-->"
		);
		$this->assertCount( 1, $parsed_blocks );

		$navigation_link_block = new WP_Block( $parsed_blocks[0], array() );
		$this->assertStringContainsString(
			'Sample Page',
			gutenberg_render_block_core_navigation_link(
				$navigation_link_block->attributes,
				array(),
				$navigation_link_block
			)
		);
	}

	public function test_returns_empty_when_label_is_missing() {
		$page_id = self::$page->ID;
		$url     = 'http://' . WP_TESTS_DOMAIN;

		$parsed_blocks = parse_blocks(
			"<!-- wp:navigation-link {\"type\":\"page\",\"id\":{$page_id},\"url\":\"{$url}/?page_id={$page_id}\"} /-->"
		);
		$this->assertCount( 1, $parsed_blocks );

		$navigation_link_block = new WP_Block( $parsed_blocks[0], array() );
		$this->assertSame(
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
		$this->assertCount( 1, $parsed_blocks );

		$navigation_link_block = new WP_Block( $parsed_blocks[0], array() );

		$this->assertSame(
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
		$this->assertCount( 1, $parsed_blocks );

		$navigation_link_block = new WP_Block( $parsed_blocks[0], array() );
		$this->assertStringContainsString(
			'Cats',
			gutenberg_render_block_core_navigation_link(
				$navigation_link_block->attributes,
				array(),
				$navigation_link_block
			)
		);
	}

	public function test_returns_link_for_plain_link() {
		$parsed_blocks = parse_blocks(
			'<!-- wp:navigation-link {"label":"My Website","url":"https://example.com"} /-->'
		);
		$this->assertCount( 1, $parsed_blocks );

		$navigation_link_block = new WP_Block( $parsed_blocks[0], array() );
		$this->assertStringContainsString(
			'My Website',
			gutenberg_render_block_core_navigation_link(
				$navigation_link_block->attributes,
				array(),
				$navigation_link_block
			)
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
			$this->assertCount( 1, $parsed_blocks );
			$block                 = $parsed_blocks[0];
			$navigation_link_block = new WP_Block( $block, array() );
			$this->assertStringContainsString(
				$urls_after_render[ $idx ],
				gutenberg_render_block_core_navigation_link(
					$navigation_link_block->attributes,
					array(),
					$navigation_link_block
				)
			);
		}
	}

	public function test_returns_empty_when_custom_post_type_draft() {
		$page_id = self::$custom_draft->ID;
		$url     = 'http://' . WP_TESTS_DOMAIN;

		$parsed_blocks = parse_blocks(
			"<!-- wp:navigation-link {\"label\":\"Draft Custom Post Type\",\"type\":\"cats\",\"kind\":\"post-type\",\"id\":{$page_id},\"url\":\"{$url}/?page_id={$page_id}\"} /-->"
		);
		$this->assertCount( 1, $parsed_blocks );

		$navigation_link_block = new WP_Block( $parsed_blocks[0], array() );

		$this->assertSame(
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
			"<!-- wp:navigation-link {\"label\":\"Metal Dogs\",\"type\":\"gb_test_nav_cpt\",\"kind\":\"post-type\",\"id\":{$page_id},\"url\":\"{$url}/?page_id={$page_id}\"} /-->"
		);
		$this->assertCount( 1, $parsed_blocks );

		$navigation_link_block = new WP_Block( $parsed_blocks[0], array() );
		$this->assertStringContainsString(
			'Metal Dogs',
			gutenberg_render_block_core_navigation_link(
				$navigation_link_block->attributes,
				array(),
				$navigation_link_block
			)
		);
	}
}
