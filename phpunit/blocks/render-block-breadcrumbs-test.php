<?php
/**
 * Breadcrumbs block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Breadcrumbs block.
 *
 * @group blocks
 *
 * @covers ::gutenberg_render_block_core_breadcrumbs
 * @covers ::gutenberg_block_core_breadcrumbs_get_archive_breadcrumbs
 * @covers ::gutenberg_block_core_breadcrumbs_get_posts_page_item
 */
class Tests_Blocks_Render_Breadcrumbs extends WP_UnitTestCase {

	/**
	 * Static front page.
	 *
	 * @var int
	 */
	private static $home_page_id;

	/**
	 * Posts page.
	 *
	 * @var int
	 */
	private static $news_page_id;

	/**
	 * Parent category.
	 *
	 * @var int
	 */
	private static $parent_category_id;

	/**
	 * Child of the parent category.
	 *
	 * @var int
	 */
	private static $child_category_id;

	/**
	 * Tag.
	 *
	 * @var int
	 */
	private static $tag_id;

	/**
	 * Author of the posts.
	 *
	 * @var int
	 */
	private static $author_id;

	/**
	 * Post in the child category and the tag.
	 *
	 * @var int
	 */
	private static $post_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$home_page_id = $factory->post->create(
			array(
				'post_type'  => 'page',
				'post_title' => 'Home',
			)
		);
		self::$news_page_id = $factory->post->create(
			array(
				'post_type'  => 'page',
				'post_title' => 'News',
			)
		);

		self::$parent_category_id = $factory->category->create( array( 'name' => 'Parent Category' ) );
		self::$child_category_id  = $factory->category->create(
			array(
				'name'   => 'Child Category',
				'parent' => self::$parent_category_id,
			)
		);
		self::$tag_id             = $factory->tag->create( array( 'name' => 'Breadcrumb Tag' ) );

		self::$author_id = $factory->user->create(
			array(
				'role'         => 'author',
				'display_name' => 'Breadcrumb Author',
			)
		);

		self::$post_id = $factory->post->create(
			array(
				'post_title'    => 'Breadcrumb Post',
				'post_author'   => self::$author_id,
				'post_date'     => '2024-03-15 10:00:00',
				'post_category' => array( self::$child_category_id ),
				'tags_input'    => array( self::$tag_id ),
			)
		);
		// A second post so that the child category archive has a second page.
		$factory->post->create(
			array(
				'post_title'    => 'Another Breadcrumb Post',
				'post_author'   => self::$author_id,
				'post_date'     => '2024-03-15 11:00:00',
				'post_category' => array( self::$child_category_id ),
			)
		);
	}

	public function set_up() {
		parent::set_up();

		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', self::$home_page_id );
		update_option( 'page_for_posts', self::$news_page_id );
		$this->set_permalink_structure( '/news/%category%/%postname%/' );
		// Taxonomies only add their rewrite rules when registered with pretty permalinks.
		create_initial_taxonomies();

		register_post_type(
			'book',
			array(
				'public'      => true,
				'has_archive' => true,
				'label'       => 'Books',
			)
		);
		register_taxonomy(
			'genre',
			'book',
			array(
				'public'       => true,
				'hierarchical' => true,
				'show_in_rest' => true,
			)
		);
		flush_rewrite_rules();
	}

	public function tear_down() {
		unregister_taxonomy( 'genre' );
		unregister_post_type( 'book' );
		parent::tear_down();
	}

	/**
	 * Renders the Breadcrumbs block for the current query.
	 *
	 * @param array $attributes Block attributes.
	 * @param array $context    Block context.
	 * @return string Rendered block.
	 */
	private function render_breadcrumbs( $attributes = array(), $context = array() ) {
		$block = new WP_Block(
			array(
				'blockName' => 'core/breadcrumbs',
				'attrs'     => $attributes,
			),
			$context
		);

		return $block->render();
	}

	/**
	 * Extracts the breadcrumb trail from the rendered block.
	 *
	 * @param string $html Rendered block.
	 * @return array[] List of items, each with a `label` and a `url` (null for the current item).
	 */
	private function get_trail( $html ) {
		preg_match_all( '#<li>(?:<a href="([^"]*)">(.*?)</a>|<span aria-current="page">(.*?)</span>)</li>#', $html, $matches, PREG_SET_ORDER );

		return array_map(
			static function ( $matched ) {
				if ( '' !== $matched[1] ) {
					return array(
						'label' => $matched[2],
						'url'   => $matched[1],
					);
				}
				return array(
					'label' => $matched[3],
					'url'   => null,
				);
			},
			$matches
		);
	}

	/**
	 * Builds an expected trail item.
	 *
	 * @param string      $label Label.
	 * @param string|null $url   Optional. URL, or null for the current item.
	 * @return array Trail item.
	 */
	private function item( $label, $url = null ) {
		return array(
			'label' => $label,
			'url'   => null === $url ? null : esc_url( $url ),
		);
	}

	private function home_item() {
		return $this->item( 'Home', home_url( '/' ) );
	}

	private function news_item() {
		return $this->item( 'News', get_permalink( self::$news_page_id ) );
	}

	private function parent_category_item() {
		return $this->item( 'Parent Category', get_term_link( self::$parent_category_id, 'category' ) );
	}

	/**
	 * Renders the block for a single post, the way a single template does.
	 *
	 * @param int $post_id Post ID.
	 * @return array[] Breadcrumb trail.
	 */
	private function get_single_post_trail( $post_id ) {
		$this->go_to( get_permalink( $post_id ) );

		return $this->get_trail(
			$this->render_breadcrumbs(
				array(),
				array(
					'postId'   => $post_id,
					'postType' => get_post_type( $post_id ),
				)
			)
		);
	}

	public function test_category_archive_includes_posts_page() {
		$this->go_to( get_term_link( self::$parent_category_id, 'category' ) );

		$this->assertTrue( is_category(), 'Expected a category archive.' );
		$this->assertSame(
			array(
				$this->home_item(),
				$this->news_item(),
				$this->item( 'Parent Category' ),
			),
			$this->get_trail( $this->render_breadcrumbs() )
		);
	}

	public function test_child_category_archive_includes_posts_page_before_ancestors() {
		$this->go_to( get_term_link( self::$child_category_id, 'category' ) );

		$this->assertTrue( is_category(), 'Expected a category archive.' );
		$this->assertSame(
			array(
				$this->home_item(),
				$this->news_item(),
				$this->parent_category_item(),
				$this->item( 'Child Category' ),
			),
			$this->get_trail( $this->render_breadcrumbs() )
		);
	}

	public function test_tag_archive_includes_posts_page() {
		$this->go_to( get_term_link( self::$tag_id, 'post_tag' ) );

		$this->assertTrue( is_tag(), 'Expected a tag archive.' );
		$this->assertSame(
			array(
				$this->home_item(),
				$this->news_item(),
				$this->item( 'Breadcrumb Tag' ),
			),
			$this->get_trail( $this->render_breadcrumbs() )
		);
	}

	public function test_author_archive_includes_posts_page() {
		$this->go_to( get_author_posts_url( self::$author_id ) );

		$this->assertTrue( is_author(), 'Expected an author archive.' );
		$this->assertSame(
			array(
				$this->home_item(),
				$this->news_item(),
				$this->item( 'Breadcrumb Author' ),
			),
			$this->get_trail( $this->render_breadcrumbs() )
		);
	}

	public function test_year_archive_includes_posts_page() {
		$this->go_to( get_year_link( 2024 ) );

		$this->assertTrue( is_year(), 'Expected a year archive.' );
		$this->assertSame(
			array(
				$this->home_item(),
				$this->news_item(),
				$this->item( '2024' ),
			),
			$this->get_trail( $this->render_breadcrumbs() )
		);
	}

	public function test_month_archive_includes_posts_page() {
		$this->go_to( get_month_link( 2024, 3 ) );

		$this->assertTrue( is_month(), 'Expected a month archive.' );
		$this->assertSame(
			array(
				$this->home_item(),
				$this->news_item(),
				$this->item( '2024', get_year_link( 2024 ) ),
				$this->item( 'March' ),
			),
			$this->get_trail( $this->render_breadcrumbs() )
		);
	}

	public function test_day_archive_includes_posts_page() {
		$this->go_to( get_day_link( 2024, 3, 15 ) );

		$this->assertTrue( is_day(), 'Expected a day archive.' );
		$this->assertSame(
			array(
				$this->home_item(),
				$this->news_item(),
				$this->item( '2024', get_year_link( 2024 ) ),
				$this->item( 'March', get_month_link( 2024, 3 ) ),
				$this->item( '15' ),
			),
			$this->get_trail( $this->render_breadcrumbs() )
		);
	}

	public function test_archive_posts_page_item_keeps_html_in_title() {
		wp_update_post(
			array(
				'ID'         => self::$news_page_id,
				'post_title' => 'The <em>News</em>',
			)
		);
		$this->go_to( get_term_link( self::$tag_id, 'post_tag' ) );

		$trail = $this->get_trail( $this->render_breadcrumbs() );

		$this->assertSame( 'The <em>News</em>', $trail[1]['label'] );
	}

	public function test_paged_category_archive_ends_with_page_number() {
		update_option( 'posts_per_page', 1 );
		$this->go_to( trailingslashit( get_term_link( self::$child_category_id, 'category' ) ) . 'page/2/' );

		$this->assertTrue( is_category() && is_paged(), 'Expected page 2 of a category archive.' );
		$this->assertSame(
			array(
				$this->home_item(),
				$this->news_item(),
				$this->parent_category_item(),
				$this->item( 'Child Category', get_pagenum_link( 1 ) ),
				$this->item( 'Page 2' ),
			),
			$this->get_trail( $this->render_breadcrumbs() )
		);
	}

	public function test_paged_date_archive_ends_with_page_number() {
		update_option( 'posts_per_page', 1 );
		$this->go_to( trailingslashit( get_year_link( 2024 ) ) . 'page/2/' );

		$this->assertTrue( is_year() && is_paged(), 'Expected page 2 of a year archive.' );
		$this->assertSame(
			array(
				$this->home_item(),
				$this->news_item(),
				$this->item( '2024', get_pagenum_link( 1 ) ),
				$this->item( 'Page 2' ),
			),
			$this->get_trail( $this->render_breadcrumbs() )
		);
	}

	public function test_archive_without_home_item_starts_with_posts_page() {
		$this->go_to( get_term_link( self::$tag_id, 'post_tag' ) );

		$this->assertSame(
			array(
				$this->news_item(),
				$this->item( 'Breadcrumb Tag' ),
			),
			$this->get_trail( $this->render_breadcrumbs( array( 'showHomeItem' => false ) ) )
		);
	}

	/**
	 * @dataProvider data_post_archive_urls
	 *
	 * @param callable $get_url Returns the archive URL.
	 */
	public function test_post_archives_omit_posts_page_when_page_for_posts_is_not_set( $get_url ) {
		update_option( 'page_for_posts', 0 );
		$this->go_to( $get_url() );

		$this->assertNotContains( 'News', wp_list_pluck( $this->get_trail( $this->render_breadcrumbs() ), 'label' ) );
	}

	/**
	 * @dataProvider data_post_archive_urls
	 *
	 * @param callable $get_url Returns the archive URL.
	 */
	public function test_post_archives_omit_posts_page_when_front_page_shows_posts( $get_url ) {
		// `page_for_posts` is left set, as it is after switching back to "Your latest posts".
		update_option( 'show_on_front', 'posts' );
		$this->go_to( $get_url() );

		$this->assertNotContains( 'News', wp_list_pluck( $this->get_trail( $this->render_breadcrumbs() ), 'label' ) );
	}

	/**
	 * @dataProvider data_post_archive_urls
	 *
	 * @param callable $get_url Returns the archive URL.
	 */
	public function test_post_archives_omit_posts_page_when_it_is_the_front_page( $get_url ) {
		update_option( 'page_for_posts', self::$home_page_id );
		$this->go_to( $get_url() );

		$labels = wp_list_pluck( $this->get_trail( $this->render_breadcrumbs() ), 'label' );

		$this->assertSame( 'Home', $labels[0] );
		$this->assertNotSame( 'Home', $labels[1] );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_post_archive_urls() {
		return array(
			'category' => array(
				static function () {
					return get_term_link( self::$child_category_id, 'category' );
				},
			),
			'tag'      => array(
				static function () {
					return get_term_link( self::$tag_id, 'post_tag' );
				},
			),
			'author'   => array(
				static function () {
					return get_author_posts_url( self::$author_id );
				},
			),
			'month'    => array(
				static function () {
					return get_month_link( 2024, 3 );
				},
			),
		);
	}

	public function test_custom_taxonomy_for_other_post_type_omits_posts_page() {
		$genre_id = self::factory()->term->create(
			array(
				'taxonomy' => 'genre',
				'name'     => 'Fantasy',
			)
		);
		$book_id  = self::factory()->post->create( array( 'post_type' => 'book' ) );
		wp_set_object_terms( $book_id, $genre_id, 'genre' );

		$this->go_to( get_term_link( $genre_id, 'genre' ) );

		$this->assertTrue( is_tax( 'genre' ), 'Expected a genre archive.' );
		$this->assertSame(
			array(
				$this->home_item(),
				$this->item( 'Fantasy' ),
			),
			$this->get_trail( $this->render_breadcrumbs() )
		);
	}

	public function test_taxonomy_shared_with_posts_includes_posts_page() {
		register_taxonomy(
			'topic',
			array( 'post', 'book' ),
			array( 'public' => true )
		);
		flush_rewrite_rules();
		$topic_id = self::factory()->term->create(
			array(
				'taxonomy' => 'topic',
				'name'     => 'Shared Topic',
			)
		);
		wp_set_object_terms( self::$post_id, $topic_id, 'topic' );

		$this->go_to( get_term_link( $topic_id, 'topic' ) );
		$trail = $this->get_trail( $this->render_breadcrumbs() );
		unregister_taxonomy( 'topic' );

		$this->assertSame(
			array(
				$this->home_item(),
				$this->news_item(),
				$this->item( 'Shared Topic' ),
			),
			$trail
		);
	}

	public function test_post_type_archive_is_unchanged() {
		self::factory()->post->create( array( 'post_type' => 'book' ) );
		$this->go_to( get_post_type_archive_link( 'book' ) );

		$this->assertTrue( is_post_type_archive( 'book' ), 'Expected a book archive.' );
		$this->assertSame(
			array(
				$this->home_item(),
				$this->item( 'Books' ),
			),
			$this->get_trail( $this->render_breadcrumbs() )
		);
	}

	public function test_single_post_includes_posts_page() {
		$this->assertSame(
			array(
				$this->home_item(),
				$this->news_item(),
				$this->parent_category_item(),
				$this->item( 'Child Category', get_term_link( self::$child_category_id, 'category' ) ),
				$this->item( 'Breadcrumb Post' ),
			),
			$this->get_single_post_trail( self::$post_id )
		);
	}

	public function test_single_post_keeps_html_in_posts_page_title() {
		wp_update_post(
			array(
				'ID'         => self::$news_page_id,
				'post_title' => 'The <em>News</em>',
			)
		);

		$trail = $this->get_single_post_trail( self::$post_id );

		$this->assertSame( 'The <em>News</em>', $trail[1]['label'] );
	}

	public function test_single_post_omits_posts_page_when_page_for_posts_is_not_set() {
		update_option( 'page_for_posts', 0 );

		$this->assertSame(
			array(
				$this->home_item(),
				$this->parent_category_item(),
				$this->item( 'Child Category', get_term_link( self::$child_category_id, 'category' ) ),
				$this->item( 'Breadcrumb Post' ),
			),
			$this->get_single_post_trail( self::$post_id )
		);
	}

	public function test_single_post_omits_posts_page_when_front_page_shows_posts() {
		update_option( 'show_on_front', 'posts' );

		$this->assertSame(
			array(
				$this->home_item(),
				$this->parent_category_item(),
				$this->item( 'Child Category', get_term_link( self::$child_category_id, 'category' ) ),
				$this->item( 'Breadcrumb Post' ),
			),
			$this->get_single_post_trail( self::$post_id )
		);
	}

	public function test_single_post_uses_post_type_archive_link_filter_for_posts_page() {
		$filter = static function ( $link, $post_type ) {
			return 'post' === $post_type ? 'https://example.org/blog/' : $link;
		};
		add_filter( 'post_type_archive_link', $filter, 10, 2 );

		$trail = $this->get_single_post_trail( self::$post_id );

		$this->assertSame( $this->item( 'News', 'https://example.org/blog/' ), $trail[1] );
	}
}
