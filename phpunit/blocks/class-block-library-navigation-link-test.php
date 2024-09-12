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
}
