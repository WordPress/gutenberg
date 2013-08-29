<?php

/**
 * Test WP_Export_Query class
 *
 * @group export
 * @ticket 22435
 */
class Test_WP_Export_Query extends WP_UnitTestCase {
	function test_WP_Export_Query_should_be_initialized_with_an_array() {
		$export = new WP_Export_Query( array( 'author' => 'all' ) );
		$this->assertTrue( (bool) $export );
	}

	function test_WP_Export_Query_should_use_post_ids_if_passed() {
		$export = new WP_Export_Query( array( 'post_ids' => array( 1, 2, 3 ) ) );
		$this->assertEquals( array( 1, 2, 3 ), $export->post_ids() );
	}

	function test_WP_Export_Query_should_filter_all_posts_if_all_arg_is_true() {
		$post_id = $this->factory->post->create();
		$export = new WP_Export_Query();
		$this->assertEquals( array( $post_id ), $export->post_ids() );
	}

	function test_WP_Export_Query_should_filter_all_posts_if_no_args_passed() {
		$post_id = $this->factory->post->create();
		$export = new WP_Export_Query();
		$this->assertEquals( array( $post_id ), $export->post_ids() );
	}

	function test_WP_Export_Query_should_not_export_anything_if_post_type_arg_is_set_to_non_existing_post_type() {
		$post_id = $this->factory->post->create();
		$export = new WP_Export_Query( array( 'post_type' => 'baba' ) );
		$this->assertEquals( array(), $export->post_ids() );
	}

	function test_WP_Export_Query_should_filter_only_posts_with_a_certain_post_type_if_the_post_type_arg_is_set() {
		register_post_type( 'baba' );
		$post_id = $this->factory->post->create( array( 'post_type' => 'baba' ) );
		$_       = $this->factory->post->create( array( 'post_type' => 'dyado' ) );
		$export = new WP_Export_Query( array( 'post_type' => 'baba' ) );
		$this->assertEquals( array( $post_id ), $export->post_ids() );
		_unregister_post_type( 'baba' );
	}

	function test_WP_Export_Query_should_not_export_post_types_with_can_export_set_to_false() {
		register_post_type( 'non-exportable', array( 'can_export' => false ) );
		register_post_type( 'exportable', array( 'can_export' => true ) );
		$non_exportable_post_id = $this->factory->post->create( array( 'post_type' => 'non-exportable' ) );
		$exportable_post_id = $this->factory->post->create( array( 'post_type' => 'exportable' ) );
		$export = new WP_Export_Query();
		$this->assertEquals( array( $exportable_post_id ), $export->post_ids() );
		_unregister_post_type( 'non-exportable' );
		_unregister_post_type( 'exportable' );
	}

	function test_WP_Export_Query_should_not_export_auto_drafts_by_default() {
		$post_id = $this->factory->post->create( array( 'post_status' => 'auto-draft' ) );
		$export = new WP_Export_Query();
		$this->assertEquals( array(), $export->post_ids() );
	}

	function test_WP_Export_Query_should_filter_only_posts_with_certain_status_if_status_arg_is_set() {
		$post_id_baba = $this->factory->post->create( array( 'post_status' => 'baba' ) );
		$post_id_dudu = $this->factory->post->create( array( 'post_status' => 'dudu' ) );
		$export = new WP_Export_Query( array( 'status' => 'baba' ) );
		$this->assertEquals( array( $post_id_baba ), $export->post_ids() );
	}

	function test_WP_Export_Query_should_filter_only_posts_with_certain_author_id_if_status_arg_is_a_number() {
		$user_id = $this->factory->user->create();
		$post_by_user = $this->factory->post->create( array( 'post_author' => $user_id ) );
		$other_post = $this->factory->post->create( array( 'post_author' => $user_id + 1 ) );
		$export = new WP_Export_Query( array( 'author' => $user_id ) );
		$this->assertEquals( array( $post_by_user ), $export->post_ids() );
	}

	function test_WP_Export_Query_should_filter_only_posts_with_certain_author_name_if_status_arg_is_a_username() {
		$user = $this->factory->user->create_and_get( array( 'user_login' => 'baba' ) );
		$post_by_user = $this->factory->post->create( array( 'post_author' => $user->ID ) );
		$other_post = $this->factory->post->create( array( 'post_author' => $user->ID + 1 ) );
		$export = new WP_Export_Query( array( 'author' => 'baba' ) );
		$this->assertEquals( array( $post_by_user ), $export->post_ids() );
	}

	function test_WP_Export_Query_should_filter_only_posts_with_certain_author_object_if_author_is_an_object_with_ID_member_variable() {
		$user = $this->factory->user->create_and_get();
		$post_by_user = $this->factory->post->create( array( 'post_author' => $user->ID ) );
		$other_post = $this->factory->post->create( array( 'post_author' => $user->ID + 1 ) );
		$export = new WP_Export_Query( array( 'author' => $user ) );
		$this->assertEquals( array( $post_by_user ), $export->post_ids() );
	}

	function test_WP_Export_Query_should_filter_only_posts_after_certain_start_date_if_start_date_arg_is_passed() {
		$post_before = $this->factory->post->create( array( 'post_date' => '2012-11-10 23:59:59' ) );
		$post_after = $this->factory->post->create( array( 'post_date' => '2012-11-11 00:00:00' ) );
		$export = new WP_Export_Query( array( 'start_date' => '2012-11-11' ) );
		$this->assertEquals( array( $post_after ), $export->post_ids() );
	}

	function test_WP_Export_Query_should_filter_only_posts_after_certain_end_date_if_end_date_arg_is_passed() {
		$post_before = $this->factory->post->create( array( 'post_date' => '2012-11-10 23:59:59' ) );
		$post_after = $this->factory->post->create( array( 'post_date' => '2012-11-11 00:00:00' ) );
		$export = new WP_Export_Query( array( 'end_date' => '2012-11-10' ) );
		$this->assertEquals( array( $post_before ), $export->post_ids() );
	}

	function test_WP_Export_Query_should_filter_only_posts_with_certain_category_if_category_arg_is_passed() {
		$category_id = $this->factory->category->create( array( 'name' => 'baba' ) );
		$post_with_category = $this->factory->post->create( array( 'post_category' => array( $category_id ) ) );
		$post_without = $this->factory->post->create();
		$export = new WP_Export_Query( array( 'post_type' => 'post', 'category' => 'baba' ) );
		$this->assertEquals( array( $post_with_category ), $export->post_ids() );
	}

	function test_WP_Export_Query_should_filter_only_posts_with_certain_category_id_if_category_arg_is_passed() {
		$category_id = $this->factory->category->create( array( 'name' => 'baba' ) );
		$post_with_category = $this->factory->post->create( array( 'post_category' => array( $category_id ) ) );
		$post_without = $this->factory->post->create();
		$export = new WP_Export_Query( array( 'post_type' => 'post', 'category' => $category_id ) );
		$this->assertEquals( array( $post_with_category ), $export->post_ids() );
	}

	function test_WP_Export_Query_should_filter_posts_by_category_only_for_post_post_type() {
		$category_id = $this->factory->category->create( array( 'name' => 'baba' ) );
		$post_with_category = $this->factory->post->create( array( 'post_category' => array( $category_id ) ) );
		$post_without = $this->factory->post->create();
		$different_post_type = $this->factory->post->create( array( 'post_type' => 'page' ) );
		$export = new WP_Export_Query( array( 'category' => $category_id ) );
		$this->assertEqualSets( array( $post_with_category, $post_without, $different_post_type ), $export->post_ids() );
	}

	function test_WP_Export_Query_should_include_attachments_of_posts_if_we_are_filtering_only_some_post_types() {
		register_post_type( 'baba' );
		$post_id = $this->factory->post->create( array( 'post_type' => 'baba' ) );
		$attachment_post_id = $this->factory->post->create( array( 'post_type' => 'attachment', 'post_parent' => $post_id ) );
		$export = new WP_Export_Query( array( 'post_type' => 'baba' ) );
		$this->assertEquals( array( $post_id, $attachment_post_id ), $export->post_ids() );
		_unregister_post_type( 'baba' );
	}

	function test_authors_should_return_list_of_users_for_each_post_author() {
		$user_id = $this->factory->user->create();
		$this->factory->post->create( array( 'post_author' => $user_id ) );
		$export = new WP_Export_Query();
		$authors = $export->authors();
		$this->assertEquals( 1, count( $authors ) );
		$this->assertEquals( $user_id, $authors[0]->ID );
	}

	function test_authors_should_skip_non_existing_authors() {
		$this->factory->post->create( array( 'post_author' => 11 ) );
		$export = new WP_Export_Query();
		$this->assertEquals( array(), $export->authors() );
	}

	function test_authors_should_skip_auto_draft_authors() {
		$user_id = $this->factory->user->create();
		$this->factory->post->create( array( 'post_author' => $user_id, 'post_status' => 'auto-draft' ) );
		$export = new WP_Export_Query();
		$this->assertEquals( array(), $export->authors() );
	}

	function test_categories_should_return_only_the_category_we_are_filtering_on() {
		$category_id = $this->factory->category->create( array( 'name' => 'baba' ) );
		$other_category_id = $this->factory->category->create( array( 'name' => 'dyado' ) );
		$export = new WP_Export_Query( array( 'post_type' => 'post', 'category' => $category_id ) );
		$this->assertEquals( 1, count( $export->categories() ) );
	}

	function test_categories_should_return_no_categories_if_we_are_requesting_only_one_post_type() {
		$category_id = $this->factory->category->create();
		$export = new WP_Export_Query( array( 'post_type' => 'post' ) );
		$this->assertEquals( array(), $export->categories() );
	}

	function test_categories_should_return_all_categories_if_we_are_requesting_all_post_types() {
		$category_id = $this->factory->category->create();
		$another_category_id = $this->factory->category->create();
		$export = new WP_Export_Query();
		$this->assertEqualSets( array( 1, $category_id, $another_category_id ), self::get_term_ids( $export->categories() ) );
	}

	function test_categories_should_not_return_a_child_before_its_parent_category() {
		$child_category_id = $this->factory->category->create();
		$top_category_id = $this->factory->category->create();
		wp_update_term( $child_category_id, 'category', array( 'parent' => $top_category_id ) );
		$export = new WP_Export_Query();
		$this->assertNoChildBeforeParent( $export->categories() );
	}

	function test_tags_should_return_all_tags() {
		$tag_id = $this->factory->tag->create();
		$export = new WP_Export_Query();
		$this->assertEquals( array( $tag_id ), self::get_term_ids( $export->tags() ) );
	}

	function test_tags_should_return_no_tags_if_we_are_requesting_only_one_post_type() {
		$category_id = $this->factory->tag->create();
		$export = new WP_Export_Query( array( 'post_type' => 'post' ) );
		$this->assertEquals( array(), $export->tags() );
	}

	function test_custom_taxonomies_terms_should_return_all_terms() {
		register_taxonomy( 'taxonomy_all', 'post' );
		$term_id = $this->factory->term->create( array( 'taxonomy' => 'taxonomy_all' ) );
		$export = new WP_Export_Query();
		$this->assertEquals( array( $term_id ), self::get_term_ids( $export->custom_taxonomies_terms() ) );
		_unregister_taxonomy( 'taxonomy_all' );
	}

	function test_custom_taxonomes_terms_should_return_no_terms_if_we_are_requesting_only_one_post_type() {
		register_taxonomy( 'taxonomy_one_post_type', 'post' );
		$term_id = $this->factory->term->create( array( 'taxonomy' => 'taxonomy_one_post_type' ) );
		$export = new WP_Export_Query( array( 'post_type' => 'post' ) );
		$this->assertEquals( array(), $export->custom_taxonomies_terms() );
		_unregister_taxonomy( 'taxonomy_one_post_type' );
	}

	function test_custom_taxonomies_terms_should_not_return_a_child_before_its_parent_term() {
		register_taxonomy( 'heir', 'post', array( 'hierarchical' => true ) );
		$child_term_id = $this->factory->term->create( array( 'taxonomy' => 'heir' ) );
		$top_term_id = $this->factory->term->create( array( 'taxonomy' => 'heir' ) );
		wp_update_term( $child_term_id, 'heir', array( 'parent' => $top_term_id ) );
		$export = new WP_Export_Query();
		$this->assertNoChildBeforeParent( $export->custom_taxonomies_terms() );
		_unregister_taxonomy( 'heir' );
	}

	private function assertNoChildBeforeParent( $terms ) {
		$visited = array();
		foreach( $terms as $term ) {
			$this->assertTrue( isset( $visited[$term->parent] ) || !$term->parent );
			$visited[$term->term_id] = true;
		}
	}

	private static function get_term_ids( $terms ) {
		return array_values( array_map( array( __CLASS__, '_get_term_ids_cb' ), $terms ) );
	}

	private static function _get_term_ids_cb( $c ) {
		return intval( $c->term_id );
	}

}

