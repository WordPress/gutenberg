<?php

/**
 * @group post
 */
class Tests_WP_Post_Type extends WP_UnitTestCase {
	public function test_instances() {
		global $wp_post_types;

		foreach ( $wp_post_types as $post_type ) {
			$this->assertInstanceOf( 'WP_Post_Type', $post_type );
		}
	}

	public function test_add_supports_defaults() {
		$post_type        = rand_str();
		$post_type_object = new WP_Post_Type( $post_type );

		$post_type_object->add_supports();
		$post_type_supports = get_all_post_type_supports( $post_type );

		$post_type_object->remove_supports();
		$post_type_supports_after = get_all_post_type_supports( $post_type );

		$this->assertEqualSets( array( 'title' => true, 'editor' => true ), $post_type_supports );
		$this->assertEqualSets( array(), $post_type_supports_after );
	}

	public function test_add_supports_custom() {
		$post_type        = rand_str();
		$post_type_object = new WP_Post_Type( $post_type, array(
			'supports' => array(
				'editor',
				'comments',
				'revisions',
			),
		) );

		$post_type_object->add_supports();
		$post_type_supports = get_all_post_type_supports( $post_type );

		$post_type_object->remove_supports();
		$post_type_supports_after = get_all_post_type_supports( $post_type );

		$this->assertEqualSets( array(
			'editor'    => true,
			'comments'  => true,
			'revisions' => true,
		), $post_type_supports );
		$this->assertEqualSets( array(), $post_type_supports_after );
	}

	public function test_does_not_add_query_var_if_not_public() {
		$this->set_permalink_structure( '/%postname%' );

		/* @var WP $wp */
		global $wp;

		$post_type        = rand_str();
		$post_type_object = new WP_Post_Type( $post_type, array( 'rewrite' => false, 'query_var' => 'foobar' ) );
		$post_type_object->add_rewrite_rules();

		$this->assertFalse( in_array( 'foobar', $wp->public_query_vars ) );
	}

	public function test_adds_query_var_if_public() {
		$this->set_permalink_structure( '/%postname%' );

		/* @var WP $wp */
		global $wp;

		$post_type        = rand_str();
		$post_type_object = new WP_Post_Type( $post_type, array(
			'public'    => true,
			'rewrite'   => false,
			'query_var' => 'foobar',
		) );

		$post_type_object->add_rewrite_rules();
		$in_array = in_array( 'foobar', $wp->public_query_vars );

		$post_type_object->remove_rewrite_rules();
		$in_array_after = in_array( 'foobar', $wp->public_query_vars );

		$this->assertTrue( $in_array );
		$this->assertFalse( $in_array_after );
	}

	public function test_adds_rewrite_rules() {
		$this->set_permalink_structure( '/%postname%' );

		/* @var WP_Rewrite $wp_rewrite */
		global $wp_rewrite;

		$post_type        = rand_str();
		$post_type_object = new WP_Post_Type( $post_type, array( 'public' => true, 'rewrite' => true ) );

		$post_type_object->add_rewrite_rules();
		$rewrite_tags = $wp_rewrite->rewritecode;

		$post_type_object->remove_rewrite_rules();
		$rewrite_tags_after = $wp_rewrite->rewritecode;

		$this->assertTrue( false !== array_search( "%$post_type%", $rewrite_tags ) );
		$this->assertFalse( array_search( "%$post_type%", $rewrite_tags_after ) );
	}

	public function test_register_meta_boxes() {
		$post_type        = rand_str();
		$post_type_object = new WP_Post_Type( $post_type, array( 'register_meta_box_cb' => '__return_false' ) );

		$post_type_object->register_meta_boxes();
		$has_action = has_action( "add_meta_boxes_$post_type", '__return_false' );
		$post_type_object->unregister_meta_boxes();
		$has_action_after = has_action( "add_meta_boxes_$post_type", '__return_false' );

		$this->assertSame( 10, $has_action );
		$this->assertFalse( $has_action_after );
	}

	public function test_adds_future_post_hook() {
		$post_type        = rand_str();
		$post_type_object = new WP_Post_Type( $post_type );
		$post_type_object->add_hooks();
		$has_action = has_action( "future_$post_type", '_future_post_hook' );
		$post_type_object->remove_hooks();
		$has_action_after = has_action( "future_$post_type", '_future_post_hook' );

		$this->assertSame( 5, $has_action );
		$this->assertFalse( $has_action_after );
	}

	public function test_register_taxonomies() {
		global $wp_post_types;

		$post_type        = rand_str();
		$post_type_object = new WP_Post_Type( $post_type, array( 'taxonomies' => array( 'post_tag' ) ) );

		$wp_post_types[ $post_type ] = $post_type_object;

		$post_type_object->register_taxonomies();
		$taxonomies = get_object_taxonomies( $post_type );
		$post_type_object->unregister_taxonomies();
		$taxonomies_after = get_object_taxonomies( $post_type );

		unset( $wp_post_types[ $post_type ] );

		$this->assertEqualSets( array( 'post_tag' ), $taxonomies );
		$this->assertEqualSets( array(), $taxonomies_after );
	}
}
