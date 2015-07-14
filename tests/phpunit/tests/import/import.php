<?php

require_once dirname( __FILE__ ) . '/base.php';

/**
 * @group import
 */
class Tests_Import_Import extends WP_Import_UnitTestCase {
	function setUp() {
		parent::setUp();

		if ( ! defined( 'WP_IMPORTING' ) )
			define( 'WP_IMPORTING', true );

		if ( ! defined( 'WP_LOAD_IMPORTERS' ) )
			define( 'WP_LOAD_IMPORTERS', true );

		add_filter( 'import_allow_create_users', '__return_true' );

		if ( ! file_exists( DIR_TESTDATA . '/plugins/wordpress-importer/wordpress-importer.php' ) ) {
			$this->markTestSkipped( 'WordPress Importer plugin is not installed.' );
		}

		require_once DIR_TESTDATA . '/plugins/wordpress-importer/wordpress-importer.php';

		global $wpdb;
		// crude but effective: make sure there's no residual data in the main tables
		foreach ( array('posts', 'postmeta', 'comments', 'terms', 'term_taxonomy', 'term_relationships', 'users', 'usermeta') as $table)
			$wpdb->query("DELETE FROM {$wpdb->$table}");
	}

	function tearDown() {
		remove_filter( 'import_allow_create_users', '__return_true' );

		parent::tearDown();
	}

	function test_small_import() {
		global $wpdb;

		$authors = array( 'admin' => false, 'editor' => false, 'author' => false );
		$this->_import_wp( DIR_TESTDATA . '/export/small-export.xml', $authors );

		// ensure that authors were imported correctly
		$user_count = count_users();
		$this->assertEquals( 3, $user_count['total_users'] );
		$admin = get_user_by( 'login', 'admin' );
		$this->assertEquals( 'admin', $admin->user_login );
		$this->assertEquals( 'local@host.null', $admin->user_email );
		$editor = get_user_by( 'login', 'editor' );
		$this->assertEquals( 'editor', $editor->user_login );
		$this->assertEquals( 'editor@example.org', $editor->user_email );
		$this->assertEquals( 'FirstName', $editor->user_firstname );
		$this->assertEquals( 'LastName', $editor->user_lastname );
		$author = get_user_by( 'login', 'author' );
		$this->assertEquals( 'author', $author->user_login );
		$this->assertEquals( 'author@example.org', $author->user_email );

		// check that terms were imported correctly
		$this->assertEquals( 30, wp_count_terms( 'category' ) );
		$this->assertEquals( 3, wp_count_terms( 'post_tag' ) );
		$foo = get_term_by( 'slug', 'foo', 'category' );
		$this->assertEquals( 0, $foo->parent );
		$bar = get_term_by( 'slug', 'bar', 'category' );
		$foo_bar = get_term_by( 'slug', 'foo-bar', 'category' );
		$this->assertEquals( $bar->term_id, $foo_bar->parent );

		// check that posts/pages were imported correctly
		$post_count = wp_count_posts( 'post' );
		$this->assertEquals( 5, $post_count->publish );
		$this->assertEquals( 1, $post_count->private );
		$page_count = wp_count_posts( 'page' );
		$this->assertEquals( 4, $page_count->publish );
		$this->assertEquals( 1, $page_count->draft );
		$comment_count = wp_count_comments();
		$this->assertEquals( 1, $comment_count->total_comments );

		$posts = get_posts( array( 'numberposts' => 20, 'post_type' => 'any', 'post_status' => 'any', 'orderby' => 'ID' ) );
		$this->assertEquals( 11, count($posts) );

		$post = $posts[0];
		$this->assertEquals( 'Many Categories', $post->post_title );
		$this->assertEquals( 'many-categories', $post->post_name );
		$this->assertEquals( $admin->ID, $post->post_author );
		$this->assertEquals( 'post', $post->post_type );
		$this->assertEquals( 'publish', $post->post_status );
		$this->assertEquals( 0, $post->post_parent );
		$cats = wp_get_post_categories( $post->ID );
		$this->assertEquals( 27, count($cats) );

		$post = $posts[1];
		$this->assertEquals( 'Non-standard post format', $post->post_title );
		$this->assertEquals( 'non-standard-post-format', $post->post_name );
		$this->assertEquals( $admin->ID, $post->post_author );
		$this->assertEquals( 'post', $post->post_type );
		$this->assertEquals( 'publish', $post->post_status );
		$this->assertEquals( 0, $post->post_parent );
		$cats = wp_get_post_categories( $post->ID );
		$this->assertEquals( 1, count($cats) );
		$this->assertTrue( has_post_format( 'aside', $post->ID ) );

		$post = $posts[2];
		$this->assertEquals( 'Top-level Foo', $post->post_title );
		$this->assertEquals( 'top-level-foo', $post->post_name );
		$this->assertEquals( $admin->ID, $post->post_author );
		$this->assertEquals( 'post', $post->post_type );
		$this->assertEquals( 'publish', $post->post_status );
		$this->assertEquals( 0, $post->post_parent );
		$cats = wp_get_post_categories( $post->ID, array( 'fields' => 'all' ) );
		$this->assertEquals( 1, count($cats) );
		$this->assertEquals( 'foo', $cats[0]->slug );

		$post = $posts[3];
		$this->assertEquals( 'Foo-child', $post->post_title );
		$this->assertEquals( 'foo-child', $post->post_name );
		$this->assertEquals( $editor->ID, $post->post_author );
		$this->assertEquals( 'post', $post->post_type );
		$this->assertEquals( 'publish', $post->post_status );
		$this->assertEquals( 0, $post->post_parent );
		$cats = wp_get_post_categories( $post->ID, array( 'fields' => 'all' ) );
		$this->assertEquals( 1, count($cats) );
		$this->assertEquals( 'foo-bar', $cats[0]->slug );

		$post = $posts[4];
		$this->assertEquals( 'Private Post', $post->post_title );
		$this->assertEquals( 'private-post', $post->post_name );
		$this->assertEquals( $admin->ID, $post->post_author );
		$this->assertEquals( 'post', $post->post_type );
		$this->assertEquals( 'private', $post->post_status );
		$this->assertEquals( 0, $post->post_parent );
		$cats = wp_get_post_categories( $post->ID );
		$this->assertEquals( 1, count($cats) );
		$tags = wp_get_post_tags( $post->ID );
		$this->assertEquals( 3, count($tags) );
		$this->assertEquals( 'tag1', $tags[0]->slug );
		$this->assertEquals( 'tag2', $tags[1]->slug );
		$this->assertEquals( 'tag3', $tags[2]->slug );

		$post = $posts[5];
		$this->assertEquals( '1-col page', $post->post_title );
		$this->assertEquals( '1-col-page', $post->post_name );
		$this->assertEquals( $admin->ID, $post->post_author );
		$this->assertEquals( 'page', $post->post_type );
		$this->assertEquals( 'publish', $post->post_status );
		$this->assertEquals( 0, $post->post_parent );
		$this->assertEquals( 'onecolumn-page.php', get_post_meta( $post->ID, '_wp_page_template', true ) );

		$post = $posts[6];
		$this->assertEquals( 'Draft Page', $post->post_title );
		$this->assertEquals( '', $post->post_name );
		$this->assertEquals( $admin->ID, $post->post_author );
		$this->assertEquals( 'page', $post->post_type );
		$this->assertEquals( 'draft', $post->post_status );
		$this->assertEquals( 0, $post->post_parent );
		$this->assertEquals( 'default', get_post_meta( $post->ID, '_wp_page_template', true ) );

		$post = $posts[7];
		$this->assertEquals( 'Parent Page', $post->post_title );
		$this->assertEquals( 'parent-page', $post->post_name );
		$this->assertEquals( $admin->ID, $post->post_author );
		$this->assertEquals( 'page', $post->post_type );
		$this->assertEquals( 'publish', $post->post_status );
		$this->assertEquals( 0, $post->post_parent );
		$this->assertEquals( 'default', get_post_meta( $post->ID, '_wp_page_template', true ) );

		$post = $posts[8];
		$this->assertEquals( 'Child Page', $post->post_title );
		$this->assertEquals( 'child-page', $post->post_name );
		$this->assertEquals( $admin->ID, $post->post_author );
		$this->assertEquals( 'page', $post->post_type );
		$this->assertEquals( 'publish', $post->post_status );
		$this->assertEquals( $posts[7]->ID, $post->post_parent );
		$this->assertEquals( 'default', get_post_meta( $post->ID, '_wp_page_template', true ) );

		$post = $posts[9];
		$this->assertEquals( 'Sample Page', $post->post_title );
		$this->assertEquals( 'sample-page', $post->post_name );
		$this->assertEquals( $admin->ID, $post->post_author );
		$this->assertEquals( 'page', $post->post_type );
		$this->assertEquals( 'publish', $post->post_status );
		$this->assertEquals( 0, $post->post_parent );
		$this->assertEquals( 'default', get_post_meta( $post->ID, '_wp_page_template', true ) );

		$post = $posts[10];
		$this->assertEquals( 'Hello world!', $post->post_title );
		$this->assertEquals( 'hello-world', $post->post_name );
		$this->assertEquals( $author->ID, $post->post_author );
		$this->assertEquals( 'post', $post->post_type );
		$this->assertEquals( 'publish', $post->post_status );
		$this->assertEquals( 0, $post->post_parent );
		$cats = wp_get_post_categories( $post->ID );
		$this->assertEquals( 1, count($cats) );
	}

	function test_double_import() {
		$authors = array( 'admin' => false, 'editor' => false, 'author' => false );
		$this->_import_wp( DIR_TESTDATA . '/export/small-export.xml', $authors );
		$this->_import_wp( DIR_TESTDATA . '/export/small-export.xml', $authors );

		$user_count = count_users();
		$this->assertEquals( 3, $user_count['total_users'] );
		$admin = get_user_by( 'login', 'admin' );
		$this->assertEquals( 'admin', $admin->user_login );
		$this->assertEquals( 'local@host.null', $admin->user_email );
		$editor = get_user_by( 'login', 'editor' );
		$this->assertEquals( 'editor', $editor->user_login );
		$this->assertEquals( 'editor@example.org', $editor->user_email );
		$this->assertEquals( 'FirstName', $editor->user_firstname );
		$this->assertEquals( 'LastName', $editor->user_lastname );
		$author = get_user_by( 'login', 'author' );
		$this->assertEquals( 'author', $author->user_login );
		$this->assertEquals( 'author@example.org', $author->user_email );

		$this->assertEquals( 30, wp_count_terms( 'category' ) );
		$this->assertEquals( 3, wp_count_terms( 'post_tag' ) );
		$foo = get_term_by( 'slug', 'foo', 'category' );
		$this->assertEquals( 0, $foo->parent );
		$bar = get_term_by( 'slug', 'bar', 'category' );
		$foo_bar = get_term_by( 'slug', 'foo-bar', 'category' );
		$this->assertEquals( $bar->term_id, $foo_bar->parent );

		$post_count = wp_count_posts( 'post' );
		$this->assertEquals( 5, $post_count->publish );
		$this->assertEquals( 1, $post_count->private );
		$page_count = wp_count_posts( 'page' );
		$this->assertEquals( 4, $page_count->publish );
		$this->assertEquals( 1, $page_count->draft );
		$comment_count = wp_count_comments();
		$this->assertEquals( 1, $comment_count->total_comments );
	}

	function test_ordering_of_importers() {
		global $wp_importers;
		$_wp_importers = $wp_importers; // Preserve global state
		$wp_importers = array(
			'xyz1' => array( 'xyz1' ),
			'XYZ2' => array( 'XYZ2' ),
			'abc2' => array( 'abc2' ),
			'ABC1' => array( 'ABC1' ),
			'def1' => array( 'def1' ),
		);
		$this->assertEquals( array(
			'ABC1' => array( 'ABC1' ),
			'abc2' => array( 'abc2' ),
			'def1' => array( 'def1' ),
			'xyz1' => array( 'xyz1' ),
			'XYZ2' => array( 'XYZ2' ),
		), get_importers() );
		$wp_importers = $_wp_importers; // Restore global state
	}

	// function test_menu_import
}
