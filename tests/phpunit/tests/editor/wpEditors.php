<?php

if ( ! class_exists( '_WP_Editors', false ) ) {
	require_once ABSPATH . WPINC . '/class-wp-editor.php';
}

/**
 * @group editor
 */
class Tests_WP_Editors extends WP_UnitTestCase {
	public function wp_link_query_callback( $results ) {
		return array_merge( $results, array(
			array(
				'ID'        => 123,
				'title'     => 'foo',
				'permalink' => 'bar',
				'info'      => 'baz',
			),
		) );
	}

	public function test_wp_link_query_returns_false_when_nothing_found() {
		$actual = _WP_Editors::wp_link_query( array( 's' => 'foobarbaz' ) );

		$this->assertFalse( $actual );
	}

	public function test_wp_link_query_returns_search_results() {
		$post   = self::factory()->post->create_and_get( array( 'post_status' => 'publish' ) );
		$actual = _WP_Editors::wp_link_query( array( 's' => $post->post_title ) );

		$this->assertEqualSets( array(
			array(
				'ID'        => $post->ID,
				'title'     => $post->post_title,
				'permalink' => get_permalink( $post->ID ),
				'info'      => mysql2date( __( 'Y/m/d' ), $post->post_date ),
			),
		), $actual );
	}

	/**
	 * @ticket 41825
	 */
	public function test_wp_link_query_returns_filtered_result_when_nothing_found() {
		add_filter( 'wp_link_query', array( $this, 'wp_link_query_callback' ) );
		$actual = _WP_Editors::wp_link_query( array( 's' => 'foobarbaz' ) );
		remove_filter( 'wp_link_query', array( $this, 'wp_link_query_callback' ) );

		$this->assertEqualSets( array(
			array(
				'ID'        => 123,
				'title'     => 'foo',
				'permalink' => 'bar',
				'info'      => 'baz',
			),
		), $actual );
	}

	public function test_wp_link_query_returns_filtered_search_results() {
		$post = self::factory()->post->create_and_get( array( 'post_status' => 'publish' ) );

		add_filter( 'wp_link_query', array( $this, 'wp_link_query_callback' ) );
		$actual = _WP_Editors::wp_link_query( array( 's' => $post->post_title ) );
		remove_filter( 'wp_link_query', array( $this, 'wp_link_query_callback' ) );

		$this->assertEqualSets( array(
			array(
				'ID'        => $post->ID,
				'title'     => $post->post_title,
				'permalink' => get_permalink( $post->ID ),
				'info'      => mysql2date( __( 'Y/m/d' ), $post->post_date ),
			),
			array(
				'ID'        => 123,
				'title'     => 'foo',
				'permalink' => 'bar',
				'info'      => 'baz',
			),
		), $actual );
	}
}
