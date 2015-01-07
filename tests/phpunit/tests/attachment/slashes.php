<?php

/**
 * @group attachment
 * @group slashes
 * @ticket 21767
 */
class Tests_Attachment_Slashes extends WP_UnitTestCase {
	function setUp() {
		parent::setUp();
		$this->author_id = $this->factory->user->create( array( 'role' => 'editor' ) );
		$this->old_current_user = get_current_user_id();
		wp_set_current_user( $this->author_id );

		// it is important to test with both even and odd numbered slashes as
		// kses does a strip-then-add slashes in some of its function calls
		$this->slash_1 = 'String with 1 slash \\';
		$this->slash_2 = 'String with 2 slashes \\\\';
		$this->slash_3 = 'String with 3 slashes \\\\\\';
		$this->slash_4 = 'String with 4 slashes \\\\\\\\';
		$this->slash_5 = 'String with 5 slashes \\\\\\\\\\';
		$this->slash_6 = 'String with 6 slashes \\\\\\\\\\\\';
		$this->slash_7 = 'String with 7 slashes \\\\\\\\\\\\\\';
	}

	function tearDown() {
		wp_set_current_user( $this->old_current_user );
		parent::tearDown();
	}

	/**
	 * Tests the model function that expects slashed data
	 *
	 */
	function test_wp_insert_attachment() {
		$id = wp_insert_attachment(array(
			'post_status' => 'publish',
			'post_title' => $this->slash_1,
			'post_content_filtered' => $this->slash_3,
			'post_excerpt' => $this->slash_5,
			'post_type' => 'post'
		));
		$post = get_post( $id );

		$this->assertEquals( wp_unslash( $this->slash_1 ), $post->post_title );
		$this->assertEquals( wp_unslash( $this->slash_3 ), $post->post_content_filtered );
		$this->assertEquals( wp_unslash( $this->slash_5 ), $post->post_excerpt );

		$id = wp_insert_attachment(array(
			'post_status' => 'publish',
			'post_title' => $this->slash_2,
			'post_content_filtered' => $this->slash_4,
			'post_excerpt' => $this->slash_6,
			'post_type' => 'post'
		));
		$post = get_post( $id );

		$this->assertEquals( wp_unslash( $this->slash_2 ), $post->post_title );
		$this->assertEquals( wp_unslash( $this->slash_4 ), $post->post_content_filtered );
		$this->assertEquals( wp_unslash( $this->slash_6 ), $post->post_excerpt );
	}

}
