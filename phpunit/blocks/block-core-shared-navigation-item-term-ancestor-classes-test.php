<?php
/**
 * Tests the classes that mark taxonomy navigation items containing the current post.
 *
 * @package    gutenberg
 * @subpackage block-library
 */

/**
 * @covers ::gutenberg_block_core_shared_navigation_item_get_term_ancestor_classes
 */
class Block_Core_Shared_Navigation_Item_Term_Ancestor_Classes_Test extends WP_UnitTestCase {
	const PARENT_CLASSES = array( 'current-menu-parent', 'current-post-parent', 'current-post-ancestor' );

	private static $news;
	private static $local;
	private static $city;
	private static $sports;
	private static $tag;
	private static $post;
	private static $page;

	/**
	 * @var array|null
	 */
	private $original_block_supports;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$news   = $factory->category->create( array( 'name' => 'News' ) );
		self::$local  = $factory->category->create(
			array(
				'name'   => 'Local',
				'parent' => self::$news,
			)
		);
		self::$city   = $factory->category->create(
			array(
				'name'   => 'City',
				'parent' => self::$local,
			)
		);
		self::$sports = $factory->category->create( array( 'name' => 'Sports' ) );
		self::$tag    = $factory->tag->create( array( 'name' => 'Featured' ) );
		self::$post   = $factory->post->create(
			array(
				'post_title'    => 'Post in City',
				'post_category' => array( self::$city ),
				'tags_input'    => array( 'Featured' ),
			)
		);
		self::$page   = $factory->post->create( array( 'post_type' => 'page' ) );
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

	public function test_link_to_post_category_is_marked_as_parent() {
		$this->go_to( get_permalink( self::$post ) );

		$html = do_blocks( $this->get_link_markup( 'category', self::$city ) );

		$this->assertSame( self::PARENT_CLASSES, $this->get_current_classes( $html ) );
		$this->assertStringNotContainsString( 'aria-current', $html );
	}

	public function test_links_to_ancestor_categories_are_marked_as_ancestors() {
		$this->go_to( get_permalink( self::$post ) );

		foreach ( array( self::$local, self::$news ) as $category ) {
			$html = do_blocks( $this->get_link_markup( 'category', $category ) );

			$this->assertSame( array( 'current-post-ancestor' ), $this->get_current_classes( $html ) );
			$this->assertStringNotContainsString( 'aria-current', $html );
		}
	}

	public function test_link_to_unrelated_category_is_not_marked() {
		$this->go_to( get_permalink( self::$post ) );

		$html = do_blocks( $this->get_link_markup( 'category', self::$sports ) );

		$this->assertSame( array(), $this->get_current_classes( $html ) );
	}

	public function test_link_to_post_tag_is_not_marked() {
		$this->go_to( get_permalink( self::$post ) );

		$html = do_blocks( $this->get_link_markup( 'tag', self::$tag ) );

		$this->assertSame( array(), $this->get_current_classes( $html ) );
	}

	public function test_link_to_category_is_not_marked_on_a_page() {
		$this->go_to( get_permalink( self::$page ) );

		$html = do_blocks( $this->get_link_markup( 'category', self::$news ) );

		$this->assertSame( array(), $this->get_current_classes( $html ) );
	}

	public function test_link_to_category_is_current_item_on_its_archive() {
		$this->go_to( get_category_link( self::$city ) );

		$html = do_blocks( $this->get_link_markup( 'category', self::$city ) );

		$this->assertSame( array( 'current-menu-item' ), $this->get_current_classes( $html ) );
		$this->assertStringContainsString( 'aria-current="page"', $html );
	}

	public function test_link_to_parent_category_is_not_marked_on_child_archive() {
		$this->go_to( get_category_link( self::$city ) );

		$html = do_blocks( $this->get_link_markup( 'category', self::$news ) );

		$this->assertSame( array(), $this->get_current_classes( $html ) );
	}

	public function test_custom_taxonomy_link_uses_post_type_in_classes() {
		register_post_type( 'book', array( 'public' => true ) );
		register_taxonomy(
			'book-genre',
			'book',
			array(
				'public'       => true,
				'hierarchical' => true,
			)
		);
		$genre = self::factory()->term->create( array( 'taxonomy' => 'book-genre' ) );
		$book  = self::factory()->post->create( array( 'post_type' => 'book' ) );
		wp_set_object_terms( $book, $genre, 'book-genre' );
		$this->go_to( get_permalink( $book ) );

		// The editor stores hyphens in taxonomy names as underscores.
		$html = do_blocks( $this->get_link_markup( 'book_genre', $genre ) );

		$this->assertSame(
			array( 'current-menu-parent', 'current-book-parent', 'current-book-ancestor' ),
			$this->get_current_classes( $html )
		);

		_unregister_taxonomy( 'book-genre' );
		_unregister_post_type( 'book' );
	}

	public function test_submenu_to_post_category_is_marked_as_parent() {
		$this->go_to( get_permalink( self::$post ) );

		$html = do_blocks( $this->get_submenu_markup( self::$city, self::$sports ) );

		$this->assertSame( self::PARENT_CLASSES, $this->get_current_classes( $html ) );
		$this->assertStringNotContainsString( 'aria-current', $html );
	}

	public function test_submenu_to_ancestor_category_is_marked_as_ancestor() {
		$this->go_to( get_permalink( self::$post ) );

		$html = do_blocks( $this->get_submenu_markup( self::$news, self::$city ) );

		$this->assertSame( array( 'current-post-ancestor' ), $this->get_current_classes( $html ) );
		$this->assertSame( self::PARENT_CLASSES, $this->get_current_classes( $html, 1 ) );
	}

	/**
	 * Returns the markup of a Navigation Link block pointing to a term.
	 *
	 * @param string $type    The link type attribute.
	 * @param int    $term_id The term ID.
	 * @return string The block markup.
	 */
	private function get_link_markup( $type, $term_id ) {
		return '<!-- wp:navigation-link ' . $this->get_term_attributes( $type, $term_id ) . ' /-->';
	}

	/**
	 * Returns the markup of a Navigation Submenu block pointing to a category with one child category link.
	 *
	 * @param int $category_id       The submenu's category ID.
	 * @param int $child_category_id The nested link's category ID.
	 * @return string The block markup.
	 */
	private function get_submenu_markup( $category_id, $child_category_id ) {
		return '<!-- wp:navigation-submenu ' . $this->get_term_attributes( 'category', $category_id ) . ' -->'
			. $this->get_link_markup( 'category', $child_category_id )
			. '<!-- /wp:navigation-submenu -->';
	}

	/**
	 * Returns the JSON attributes of a navigation item pointing to a term.
	 *
	 * @param string $type    The link type attribute.
	 * @param int    $term_id The term ID.
	 * @return string The JSON-encoded attributes.
	 */
	private function get_term_attributes( $type, $term_id ) {
		return wp_json_encode(
			array(
				'label' => 'Term ' . $term_id,
				'type'  => $type,
				'id'    => $term_id,
				'url'   => get_term_link( $term_id ),
				'kind'  => 'taxonomy',
			)
		);
	}

	/**
	 * Returns the `current-*` classes of a rendered navigation item.
	 *
	 * @param string $html  The rendered HTML.
	 * @param int    $index The zero-based index of the navigation item.
	 * @return string[] The `current-*` classes, in document order.
	 */
	private function get_current_classes( $html, $index = 0 ) {
		$processor = new WP_HTML_Tag_Processor( $html );
		for ( $i = 0; $i <= $index; $i++ ) {
			$processor->next_tag( array( 'class_name' => 'wp-block-navigation-item' ) );
		}

		$classes = explode( ' ', (string) $processor->get_attribute( 'class' ) );

		return array_values( preg_grep( '/^current-/', $classes ) );
	}
}
