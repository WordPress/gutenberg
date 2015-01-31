<?php

/**
 * Admin ajax functions to be tested
 */
require_once( ABSPATH . 'wp-admin/includes/ajax-actions.php' );

/**
 * Testing Quick Edit AJAX functionality.
 *
 * @group ajax
 */
class Tests_Ajax_QuickEdit extends WP_Ajax_UnitTestCase {

	/**
	 * @group 26948
	 */
	public function test_dont_process_terms_if_taxonomy_does_not_allow_show_on_quick_edit() {
		register_taxonomy( 'wptests_tax_1', 'post', array(
			'show_in_quick_edit' => false,
			'hierarchical' => true,
		) );
		register_taxonomy( 'wptests_tax_2', 'post', array(
			'show_in_quick_edit' => true,
			'hierarchical' => true,
		) );

		$t1 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax_1',
		) );
		$t2 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax_2',
		) );

		// Become an administrator.
		$this->_setRole( 'administrator' );

		$post = $this->factory->post->create_and_get( array(
			'post_author' => get_current_user_id(),
		) );

		// Set up a request.
		$_POST['_inline_edit'] = wp_create_nonce( 'inlineeditnonce' );
		$_POST['post_ID'] = $post->ID;
		$_POST['post_type'] = $post->post_type;
		$_POST['content'] = $post->post_content;
		$_POST['excerpt'] = $post->post_excerpt;
		$_POST['_status'] = $post->post_status;
		$_POST['post_status'] = $post->post_status;
		$_POST['screen'] = 'post';
		$_POST['tax_input'] = array(
			'wptests_tax_1' => array( $t1 ),
			'wptests_tax_2' => array( $t2 ),
		);

		// Make the request.
		try {
			$this->_handleAjax( 'inline-save' );
		} catch ( WPAjaxDieContinueException $e ) {
			unset( $e );
		}

		// wptests_tax_1 terms should have been refused.
		$post_terms_1 = wp_get_object_terms( $post->ID, 'wptests_tax_1' );
		$this->assertEmpty( $post_terms_1 );

		// wptests_tax_2 terms should have been added successfully.
		$post_terms_2 = wp_get_object_terms( $post->ID, 'wptests_tax_2' );
		$this->assertEqualSets( array( $t2 ), wp_list_pluck( $post_terms_2, 'term_id' ) );
	}
}
