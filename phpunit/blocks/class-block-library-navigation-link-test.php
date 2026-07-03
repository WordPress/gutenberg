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
	private static $page;
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
				'post_type'    => 'dogs',
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

		self::$category = self::factory()->category->create_and_get(
			array(
				'taxonomy'    => 'category',
				'name'        => 'cats',
				'slug'        => 'cats',
				'description' => 'Cats Category',
			)
		);

		self::$terms[] = self::$category;
	}

	public static function wpTearDownAfterClass() {
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

	public function test_returns_link_when_post_is_published() {
		$page_id = self::$page->ID;
		$url     = 'http://' . WP_TESTS_DOMAIN;

		$parsed_blocks = parse_blocks(
			"<!-- wp:navigation-link {\"label\":\"Sample Page\",\"type\":\"page\",\"id\":{$page_id},\"url\":\"{$url}/?page_id={$page_id}\",\"kind\":\"post-type\"} /-->"
		);
		$this->assertEquals( 1, count( $parsed_blocks ) );

		$navigation_link_block = new WP_Block( $parsed_blocks[0], array() );
		// Dynamic label: uses the actual post title ('Tabby cats'), not the stored label.
		$this->assertEquals(
			true,
			strpos(
				gutenberg_render_block_core_navigation_link(
					$navigation_link_block->attributes,
					array(),
					$navigation_link_block
				),
				self::$page->post_title
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
			"<!-- wp:navigation-link {\"label\":\"Cats\",\"type\":\"category\",\"id\":{$category_id},\"url\":\"{$url}/?cat={$category_id}\",\"kind\":\"taxonomy\"} /-->"
		);
		$this->assertEquals( 1, count( $parsed_blocks ) );

		$navigation_link_block = new WP_Block( $parsed_blocks[0], array() );
		// Dynamic label: uses the actual term name.
		$this->assertEquals(
			true,
			strpos(
				gutenberg_render_block_core_navigation_link(
					$navigation_link_block->attributes,
					array(),
					$navigation_link_block
				),
				self::$category->name
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
			"<!-- wp:navigation-link {\"label\":\"Metal Dogs\",\"type\":\"dogs\",\"kind\":\"post-type\",\"id\":{$page_id},\"url\":\"{$url}/?page_id={$page_id}\"} /-->"
		);
		$this->assertEquals( 1, count( $parsed_blocks ) );

		$navigation_link_block = new WP_Block( $parsed_blocks[0], array() );
		// Dynamic label: uses the actual post title ('Metal Dog'), not the stored label.
		$this->assertEquals(
			true,
			strpos(
				gutenberg_render_block_core_navigation_link(
					$navigation_link_block->attributes,
					array(),
					$navigation_link_block
				),
				self::$custom_post->post_title
			) !== false
		);
	}

	/**
	 * Tests that the render function uses the current permalink when a post's
	 * slug has been changed after the menu item was saved.
	 *
	 * This is the core scenario reported in GitHub issue #38253.
	 */
	public function test_uses_dynamic_permalink_after_post_slug_changes() {
		// Create a published page.
		$post = self::factory()->post->create_and_get(
			array(
				'post_type'   => 'page',
				'post_status' => 'publish',
				'post_name'   => 'test-page',
				'post_title'  => 'Test Page',
			)
		);
		self::$pages[] = $post;

		$page_id    = $post->ID;
		$stored_url = 'http://' . WP_TESTS_DOMAIN . '/?page_id=' . $page_id;

		// Simulate the block as saved with the original URL.
		$parsed_blocks = parse_blocks(
			"<!-- wp:navigation-link {\"label\":\"Test Page\",\"type\":\"page\",\"kind\":\"post-type\",\"id\":{$page_id},\"url\":\"{$stored_url}\"} /-->"
		);
		$this->assertEquals( 1, count( $parsed_blocks ) );

		// Now change the slug (simulating a post update after menu item was saved).
		wp_update_post(
			array(
				'ID'        => $page_id,
				'post_name' => 'my-changed-page',
			)
		);

		$new_permalink = get_permalink( $page_id );

		$navigation_link_block = new WP_Block( $parsed_blocks[0], array() );
		$rendered              = gutenberg_render_block_core_navigation_link(
			$navigation_link_block->attributes,
			array(),
			$navigation_link_block
		);

		// The rendered href should use the NEW dynamic permalink, not the stale stored one.
		$this->assertStringContainsString(
			'href="' . esc_url( $new_permalink ) . '"',
			$rendered,
			'Expected the rendered href to use the new dynamic permalink after slug change.'
		);
		$this->assertStringNotContainsString(
			$stored_url,
			$rendered,
			'Expected the rendered href NOT to use the old stored URL after slug change.'
		);
	}

	/**
	 * Tests that the render function uses the current post title when it has
	 * been changed after the menu item was saved.
	 *
	 * This is the label update part of GitHub issue #38253.
	 */
	public function test_uses_dynamic_label_after_post_title_changes() {
		// Create a published page.
		$post = self::factory()->post->create_and_get(
			array(
				'post_type'   => 'page',
				'post_status' => 'publish',
				'post_name'   => 'original-title-page',
				'post_title'  => 'Original Title',
			)
		);
		self::$pages[] = $post;

		$page_id    = $post->ID;
		$stored_url = 'http://' . WP_TESTS_DOMAIN . '/?page_id=' . $page_id;

		// Simulate block saved with the original label.
		$parsed_blocks = parse_blocks(
			"<!-- wp:navigation-link {\"label\":\"Original Title\",\"type\":\"page\",\"kind\":\"post-type\",\"id\":{$page_id},\"url\":\"{$stored_url}\"} /-->"
		);
		$this->assertEquals( 1, count( $parsed_blocks ) );

		// Now change the post title.
		wp_update_post(
			array(
				'ID'         => $page_id,
				'post_title' => 'My Changed Page',
			)
		);

		$navigation_link_block = new WP_Block( $parsed_blocks[0], array() );
		$rendered              = gutenberg_render_block_core_navigation_link(
			$navigation_link_block->attributes,
			array(),
			$navigation_link_block
		);

		// The rendered label should use the NEW title, not the stale stored label.
		$this->assertStringContainsString(
			'My Changed Page',
			$rendered,
			'Expected rendered label to use the new post title after it changed.'
		);
		$this->assertStringNotContainsString(
			'Original Title',
			$rendered,
			'Expected rendered label NOT to use the old stored label after title change.'
		);
	}

	/**
	 * Tests that the render function uses the current term link when a
	 * taxonomy term's slug has been changed after the menu item was saved.
	 */
	public function test_uses_dynamic_term_link_after_term_slug_changes() {
		$category_id = self::$category->term_id;
		$stored_url  = 'http://' . WP_TESTS_DOMAIN . '/?cat=' . $category_id;

		// Simulate block saved with old URL.
		$parsed_blocks = parse_blocks(
			"<!-- wp:navigation-link {\"label\":\"Cats\",\"type\":\"category\",\"kind\":\"taxonomy\",\"id\":{$category_id},\"url\":\"{$stored_url}\"} /-->"
		);
		$this->assertEquals( 1, count( $parsed_blocks ) );

		$current_term_link = get_term_link( $category_id, 'category' );

		$navigation_link_block = new WP_Block( $parsed_blocks[0], array() );
		$rendered              = gutenberg_render_block_core_navigation_link(
			$navigation_link_block->attributes,
			array(),
			$navigation_link_block
		);

		// The rendered href should use the dynamic term link.
		$this->assertStringContainsString(
			'href="' . esc_url( $current_term_link ) . '"',
			$rendered,
			'Expected the rendered href to use the dynamic term link.'
		);
	}

	/**
	 * Tests that for a plain custom link (no id), the render function falls
	 * back to the stored URL and label.
	 */
	public function test_falls_back_to_stored_url_for_custom_link() {
		$custom_url   = 'https://example.com/custom';
		$custom_label = 'My Custom Link';

		$parsed_blocks = parse_blocks(
			"<!-- wp:navigation-link {\"label\":\"{$custom_label}\",\"url\":\"{$custom_url}\"} /-->"
		);
		$this->assertEquals( 1, count( $parsed_blocks ) );

		$navigation_link_block = new WP_Block( $parsed_blocks[0], array() );
		$rendered              = gutenberg_render_block_core_navigation_link(
			$navigation_link_block->attributes,
			array(),
			$navigation_link_block
		);

		// Custom links should use stored URL and label unchanged.
		$this->assertStringContainsString(
			'href="' . esc_url( $custom_url ) . '"',
			$rendered,
			'Expected custom link to use stored URL as href.'
		);
		$this->assertStringContainsString(
			$custom_label,
			$rendered,
			'Expected custom link to use stored label.'
		);
	}
}
