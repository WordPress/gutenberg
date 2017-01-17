<?php

/**
 * @group taxonomy
 */
class Tests_WP_Taxonomy extends WP_UnitTestCase {
	public function test_instances() {
		global $wp_taxonomies;

		foreach ( $wp_taxonomies as $taxonomy ) {
			$this->assertInstanceOf( 'WP_Taxonomy', $taxonomy );
		}
	}

	public function test_does_not_add_query_var_if_not_public() {
		$this->set_permalink_structure( '/%postname%' );

		/* @var WP $wp */
		global $wp;

		$taxonomy        = rand_str();
		$taxonomy_object = new WP_Taxonomy( $taxonomy, 'post' );

		$taxonomy_object->add_rewrite_rules();
		$this->assertFalse( in_array( 'foobar', $wp->public_query_vars ) );
	}

	public function test_adds_query_var_if_public() {
		$this->set_permalink_structure( '/%postname%' );

		/* @var WP $wp */
		global $wp;

		$taxonomy        = rand_str();
		$taxonomy_object = new WP_Taxonomy( $taxonomy, 'post', array(
			'public'    => true,
			'rewrite'   => false,
			'query_var' => 'foobar',
		) );

		$taxonomy_object->add_rewrite_rules();
		$in_array = in_array( 'foobar', $wp->public_query_vars );

		$taxonomy_object->remove_rewrite_rules();
		$in_array_after = in_array( 'foobar', $wp->public_query_vars );

		$this->assertTrue( $in_array );
		$this->assertFalse( $in_array_after );
	}

	public function test_adds_rewrite_rules() {
		$this->set_permalink_structure( '/%postname%' );

		/* @var WP_Rewrite $wp_rewrite */
		global $wp_rewrite;

		$taxonomy        = rand_str();
		$taxonomy_object = new WP_Taxonomy( $taxonomy, 'post', array(
			'public'  => true,
			'rewrite' => true,
		) );

		$taxonomy_object->add_rewrite_rules();
		$rewrite_tags = $wp_rewrite->rewritecode;

		$taxonomy_object->remove_rewrite_rules();
		$rewrite_tags_after = $wp_rewrite->rewritecode;

		$this->assertNotFalse( array_search( "%$taxonomy%", $rewrite_tags ) );
		$this->assertFalse( array_search( "%$taxonomy%", $rewrite_tags_after ) );
	}

	public function test_adds_ajax_callback() {
		$taxonomy        = rand_str();
		$taxonomy_object = new WP_Taxonomy( $taxonomy, 'post', array(
			'public'  => true,
			'rewrite' => true,
		) );

		$taxonomy_object->add_hooks();
		$has_action = has_action( "wp_ajax_add-$taxonomy", '_wp_ajax_add_hierarchical_term' );

		$taxonomy_object->remove_hooks();
		$has_action_after = has_action( "wp_ajax_add-$taxonomy", '_wp_ajax_add_hierarchical_term' );

		$this->assertSame( 10, $has_action );
		$this->assertFalse( $has_action_after );

	}
}
