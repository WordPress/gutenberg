<?php
/**
 * test wp-includes/template.php
 *
 * @group themes
 */
class Tests_Template extends WP_UnitTestCase {

	protected $hierarchy = array();

	protected static $page_on_front;
	protected static $page_for_posts;
	protected static $page;
	protected static $post;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$page_on_front = $factory->post->create_and_get( array(
			'post_type' => 'page',
			'post_name' => 'page-on-front',
		) );

		self::$page_for_posts = $factory->post->create_and_get( array(
			'post_type' => 'page',
			'post_name' => 'page-for-posts',
		) );

		self::$page = $factory->post->create_and_get( array(
			'post_type' => 'page',
			'post_name' => 'page-name',
		) );
		add_post_meta( self::$page->ID, '_wp_page_template', 'templates/page.php' );

		self::$post = $factory->post->create_and_get( array(
			'post_type' => 'post',
			'post_name' => 'post-name',
			'post_date' => '1984-02-25 12:34:56',
		) );
		set_post_format( self::$post, 'quote' );
	}

	public function setUp() {
		parent::setUp();
		register_post_type( 'cpt', array(
			'public' => true,
		) );
		register_taxonomy( 'taxo', 'post', array(
			'public' => true,
			'hierarchical' => true,
		) );
		$this->set_permalink_structure( '/%year%/%monthnum%/%day%/%postname%/' );
	}

	public function tearDown() {
		unregister_post_type( 'cpt' );
		unregister_taxonomy( 'taxo' );
		$this->set_permalink_structure( '' );
		parent::tearDown();
	}


	public function test_404_template_hierarchy() {
		$url = add_query_arg( array(
			'p' => '-1',
		), home_url() );

		$this->assertTemplateHierarchy( $url, array(
			'404.php',
		) );
	}

	public function test_author_template_hierarchy() {
		$author = self::factory()->user->create_and_get( array(
			'user_nicename' => 'foo',
		) );

		$this->assertTemplateHierarchy( get_author_posts_url( $author->ID ), array(
			'author-foo.php',
			"author-{$author->ID}.php",
			'author.php',
			'archive.php',
		) );
	}

	public function test_category_template_hierarchy() {
		$term = self::factory()->term->create_and_get( array(
			'taxonomy' => 'category',
			'slug'     => 'foo',
		) );

		$this->assertTemplateHierarchy( get_term_link( $term ), array(
			'category-foo.php',
			"category-{$term->term_id}.php",
			'category.php',
			'archive.php',
		) );
	}

	public function test_tag_template_hierarchy() {
		$term = self::factory()->term->create_and_get( array(
			'taxonomy' => 'post_tag',
			'slug'     => 'foo',
		) );

		$this->assertTemplateHierarchy( get_term_link( $term ), array(
			'tag-foo.php',
			"tag-{$term->term_id}.php",
			'tag.php',
			'archive.php',
		) );
	}

	public function test_taxonomy_template_hierarchy() {
		$term = self::factory()->term->create_and_get( array(
			'taxonomy' => 'taxo',
			'slug'     => 'foo',
		) );

		$this->assertTemplateHierarchy( get_term_link( $term ), array(
			'taxonomy-taxo-foo.php',
			'taxonomy-taxo.php',
			'taxonomy.php',
			'archive.php',
		) );
	}

	public function test_date_template_hierarchy_for_year() {
		$this->assertTemplateHierarchy( get_year_link( 1984 ), array(
			'date.php',
			'archive.php',
		) );
	}

	public function test_date_template_hierarchy_for_month() {
		$this->assertTemplateHierarchy( get_month_link( 1984, 2 ), array(
			'date.php',
			'archive.php',
		) );
	}

	public function test_date_template_hierarchy_for_day() {
		$this->assertTemplateHierarchy( get_day_link( 1984, 2, 25 ), array(
			'date.php',
			'archive.php',
		) );
	}

	public function test_search_template_hierarchy() {
		$url = add_query_arg( array(
			's' => 'foo',
		), home_url() );

		$this->assertTemplateHierarchy( $url, array(
			'search.php',
		) );
	}

	public function test_front_page_template_hierarchy_with_posts_on_front() {
		$this->assertEquals( 'posts', get_option( 'show_on_front' ) );
		$this->assertTemplateHierarchy( home_url(), array(
			'front-page.php',
			'home.php',
			'index.php',
		) );
	}

	public function test_front_page_template_hierarchy_with_page_on_front() {
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', self::$page_on_front->ID );
		update_option( 'page_for_posts', self::$page_for_posts->ID );

		$this->assertTemplateHierarchy( home_url(), array(
			'front-page.php',
			'page-page-on-front.php',
			'page-' . self::$page_on_front->ID . '.php',
			'page.php',
			'singular.php',
		) );
	}

	public function test_home_template_hierarchy_with_page_on_front() {
		update_option( 'show_on_front', 'page' );
		update_option( 'page_on_front', self::$page_on_front->ID );
		update_option( 'page_for_posts', self::$page_for_posts->ID );

		$this->assertTemplateHierarchy( get_permalink( self::$page_for_posts ), array(
			'home.php',
			'index.php',
		) );
	}

	public function test_page_template_hierarchy() {
		$this->assertTemplateHierarchy( get_permalink( self::$page ), array(
			'templates/page.php',
			'page-page-name.php',
			'page-' . self::$page->ID . '.php',
			'page.php',
			'singular.php',
		) );
	}

	public function test_single_template_hierarchy_for_post() {
		$this->assertTemplateHierarchy( get_permalink( self::$post ), array(
			'single-post-post-name.php',
			'single-post.php',
			'single.php',
			'singular.php',
		) );
	}

	public function test_single_template_hierarchy_for_custom_post_type() {
		$cpt = self::factory()->post->create_and_get( array(
			'post_type' => 'cpt',
			'post_name' => 'cpt-name',
		) );

		$this->assertTemplateHierarchy( get_permalink( $cpt ), array(
			'single-cpt-cpt-name.php',
			'single-cpt.php',
			'single.php',
			'singular.php',
		) );
	}

	public function test_attachment_template_hierarchy() {
		$attachment = self::factory()->attachment->create_and_get( array(
			'post_name'      => 'attachment-name',
			'file'           => 'image.jpg',
			'post_mime_type' => 'image/jpeg',
		) );
		$this->assertTemplateHierarchy( get_permalink( $attachment ), array(
			'image-jpeg.php',
			'jpeg.php',
			'image.php',
			'attachment.php',
			'single-attachment-attachment-name.php',
			'single-attachment.php',
			'single.php',
			'singular.php',
		) );
	}

	public function test_embed_template_hierarchy_for_post() {
		$this->assertTemplateHierarchy( get_post_embed_url( self::$post ), array(
			'embed-post-quote.php',
			'embed-post.php',
			'embed.php',
			'single-post-post-name.php',
			'single-post.php',
			'single.php',
			'singular.php',
		) );
	}

	public function test_embed_template_hierarchy_for_page() {
		$this->assertTemplateHierarchy( get_post_embed_url( self::$page ), array(
			'embed-page.php',
			'embed.php',
			'templates/page.php',
			'page-page-name.php',
			'page-' . self::$page->ID . '.php',
			'page.php',
			'singular.php',
		) );
	}


	public function assertTemplateHierarchy( $url, array $expected, $message = '' ) {
		$this->go_to( $url );
		$hierarchy = $this->get_template_hierarchy();

		$this->assertEquals( $expected, $hierarchy, $message );
	}

	protected static function get_query_template_conditions() {
		return array(
			'embed'             => 'is_embed',
			'404'               => 'is_404',
			'search'            => 'is_search',
			'front_page'        => 'is_front_page',
			'home'              => 'is_home',
			'post_type_archive' => 'is_post_type_archive',
			'taxonomy'          => 'is_tax',
			'attachment'        => 'is_attachment',
			'single'            => 'is_single',
			'page'              => 'is_page',
			'singular'          => 'is_singular',
			'category'          => 'is_category',
			'tag'               => 'is_tag',
			'author'            => 'is_author',
			'date'              => 'is_date',
			'archive'           => 'is_archive',
			'paged'             => 'is_paged',
		);
	}

	protected function get_template_hierarchy() {
		foreach ( self::get_query_template_conditions() as $type => $condition ) {

			if ( call_user_func( $condition ) ) {
				$filter = str_replace( '_', '', $type );
				add_filter( "{$filter}_template_hierarchy", array( $this, 'log_template_hierarchy' ) );
				call_user_func( "get_{$type}_template" );
				remove_filter( "{$filter}_template_hierarchy", array( $this, 'log_template_hierarchy' ) );
			}

		}
		$hierarchy = $this->hierarchy;
		$this->hierarchy = array();
		return $hierarchy;
	}

	public function log_template_hierarchy( array $hierarchy ) {
		$this->hierarchy = array_merge( $this->hierarchy, $hierarchy );
		return $hierarchy;
	}

}
