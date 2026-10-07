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
			"<!-- wp:navigation-link {\"label\":\"Metal Dogs\",\"type\":\"dogs\",\"kind\":\"post-type\",\"id\":{$page_id},\"url\":\"{$url}/?page_id={$page_id}\"} /-->"
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

	/**
	 * Focus states are generated against the block's style root, the `<li>`
	 * wrapper, which never receives focus. They need rules of their own,
	 * scoped to the link inside the item.
	 */
	public function test_focus_state_styles_are_scoped_to_the_link() {
		WP_Style_Engine_CSS_Rules_Store_Gutenberg::remove_all_stores();

		$class_name = gutenberg_block_core_navigation_link_get_focus_state_class(
			array(
				'style' => array(
					':focus' => array( 'color' => array( 'text' => '#0000ff' ) ),
				),
			)
		);

		$this->assertNotEmpty( $class_name, 'A focus state should produce an instance class.' );

		$stylesheet = gutenberg_style_engine_get_stylesheet_from_context(
			'block-supports',
			array( 'prettify' => false )
		);
		$this->assertStringContainsString(
			".$class_name > .wp-block-navigation-item__content:focus{color:#0000ff !important;}",
			$stylesheet
		);
	}

	/**
	 * `:hover` and `:active` already match while a descendant of the wrapper is
	 * hovered or activated, so they must not gain a second rule.
	 */
	public function test_hover_state_styles_are_left_to_the_states_block_support() {
		WP_Style_Engine_CSS_Rules_Store_Gutenberg::remove_all_stores();

		$class_name = gutenberg_block_core_navigation_link_get_focus_state_class(
			array(
				'style' => array(
					':hover'  => array( 'color' => array( 'text' => '#ff0000' ) ),
					':active' => array( 'color' => array( 'text' => '#00ff00' ) ),
				),
			)
		);

		$this->assertSame( '', $class_name );
		$this->assertSame(
			'',
			gutenberg_style_engine_get_stylesheet_from_context(
				'block-supports',
				array( 'prettify' => false )
			)
		);
	}

	/**
	 * Focus styles nested under a viewport state are wrapped in that
	 * breakpoint's media query.
	 */
	public function test_responsive_focus_state_styles_are_wrapped_in_a_media_query() {
		WP_Style_Engine_CSS_Rules_Store_Gutenberg::remove_all_stores();

		$class_name = gutenberg_block_core_navigation_link_get_focus_state_class(
			array(
				'style' => array(
					'@mobile' => array(
						':focus' => array( 'color' => array( 'text' => '#0000ff' ) ),
					),
				),
			)
		);

		$this->assertNotEmpty( $class_name );
		$this->assertStringContainsString(
			'{.' . $class_name . ' > .wp-block-navigation-item__content:focus{color:#0000ff !important;}}',
			gutenberg_style_engine_get_stylesheet_from_context( 'block-supports', array( 'prettify' => false ) )
		);
	}

	/**
	 * Preset references cannot rely on preset classnames once emitted as a CSS
	 * rule, so they resolve to the preset custom property.
	 */
	public function test_focus_state_preset_values_resolve_to_custom_properties() {
		WP_Style_Engine_CSS_Rules_Store_Gutenberg::remove_all_stores();

		$class_name = gutenberg_block_core_navigation_link_get_focus_state_class(
			array(
				'style' => array(
					':focus' => array( 'color' => array( 'text' => 'var:preset|color|accent-1' ) ),
				),
			)
		);

		$this->assertStringContainsString(
			'color:var(--wp--preset--color--accent-1) !important;',
			gutenberg_style_engine_get_stylesheet_from_context( 'block-supports', array( 'prettify' => false ) )
		);
		$this->assertNotEmpty( $class_name );
	}
}
