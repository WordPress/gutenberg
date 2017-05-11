<?php

if ( is_multisite() ) :

/**
 * Tests specific to users in multisite.
 *
 * @group user
 * @group ms-user
 * @group multisite
 */
class Tests_Multisite_User extends WP_UnitTestCase {
	protected $suppress = false;

	function setUp() {
		global $wpdb;
		parent::setUp();
		$this->suppress = $wpdb->suppress_errors();
	}

	function tearDown() {
		global $wpdb;
		$wpdb->suppress_errors( $this->suppress );
		parent::tearDown();
	}

	function test_remove_user_from_blog() {
		$user1 = self::factory()->user->create_and_get();
		$user2 = self::factory()->user->create_and_get();

		$post_id = self::factory()->post->create( array( 'post_author' => $user1->ID ) );

		remove_user_from_blog( $user1->ID, 1, $user2->ID );

		$post = get_post( $post_id );

		$this->assertNotEquals( $user1->ID, $post->post_author );
		$this->assertEquals( $user2->ID, $post->post_author );
	}

	/**
	 * Test the returned data from get_blogs_of_user()
	 */
	function test_get_blogs_of_user() {
		$user1_id = self::factory()->user->create( array( 'role' => 'administrator' ) );

		// Maintain a list of 6 total sites and include the primary network site.
		$blog_ids = self::factory()->blog->create_many( 5, array( 'user_id' => $user1_id ) );
		$blog_ids = array_merge( array( 1 ), $blog_ids );

		// All sites are new and not marked as spam, archived, or deleted.
		$blog_ids_of_user = array_keys( get_blogs_of_user( $user1_id ) );

		// User should be a member of the created sites and the network's initial site.
		$this->assertEquals( $blog_ids, $blog_ids_of_user );

		$this->assertTrue( remove_user_from_blog( $user1_id, $blog_ids[0] ) );
		$this->assertTrue( remove_user_from_blog( $user1_id, $blog_ids[2] ) );
		$this->assertTrue( remove_user_from_blog( $user1_id, $blog_ids[4] ) );

		unset( $blog_ids[0] );
		unset( $blog_ids[2] );
		unset( $blog_ids[4] );
		sort( $blog_ids );

		$blogs_of_user = get_blogs_of_user( $user1_id, false );

		// The user should still be a member of all remaining sites.
		$blog_ids_of_user = array_keys( $blogs_of_user );
		$this->assertEquals( $blog_ids, $blog_ids_of_user );

		// Each site retrieved should match the expected structure.
		foreach ( $blogs_of_user as $blog_id => $blog ) {
			$this->assertEquals( $blog_id, $blog->userblog_id );
			$this->assertTrue( isset( $blog->userblog_id ) );
			$this->assertTrue( isset( $blog->blogname ) );
			$this->assertTrue( isset( $blog->domain ) );
			$this->assertTrue( isset( $blog->path ) );
			$this->assertTrue( isset( $blog->site_id ) );
			$this->assertTrue( isset( $blog->siteurl ) );
			$this->assertTrue( isset( $blog->archived ) );
			$this->assertTrue( isset( $blog->spam ) );
			$this->assertTrue( isset( $blog->deleted ) );
		}

		// Mark each remaining site as spam, archived, and deleted.
		update_blog_details( $blog_ids[0], array( 'spam' => 1 ) );
		update_blog_details( $blog_ids[1], array( 'archived' => 1 ) );
		update_blog_details( $blog_ids[2], array( 'deleted' => 1 ) );

		// Passing true as the second parameter should retrieve ALL sites, even if marked.
		$blogs_of_user = get_blogs_of_user( $user1_id, true );
		$blog_ids_of_user = array_keys( $blogs_of_user );
		$this->assertEquals( $blog_ids, $blog_ids_of_user );

		// Check if sites are flagged as expected.
		$this->assertEquals( 1, $blogs_of_user[ $blog_ids[0] ]->spam );
		$this->assertEquals( 1, $blogs_of_user[ $blog_ids[1] ]->archived );
		$this->assertEquals( 1, $blogs_of_user[ $blog_ids[2] ]->deleted );

		unset( $blog_ids[0] );
		unset( $blog_ids[1] );
		unset( $blog_ids[2] );
		sort( $blog_ids );

		// Passing false (the default) as the second parameter should retrieve only good sites.
		$blog_ids_of_user = array_keys( get_blogs_of_user( $user1_id, false ) );
		$this->assertEquals( $blog_ids, $blog_ids_of_user );
	}

	/**
	 * @expectedDeprecated is_blog_user
	 */
	function test_is_blog_user() {
		global $wpdb;

		$user1_id = self::factory()->user->create( array( 'role' => 'administrator' ) );

		$old_current = get_current_user_id();
		wp_set_current_user( $user1_id );

		$this->assertTrue( is_blog_user() );
		$this->assertTrue( is_blog_user( $wpdb->blogid ) );

		$blog_ids = array();

		$blog_ids = self::factory()->blog->create_many( 1 );
		foreach ( $blog_ids as $blog_id ) {
			$this->assertInternalType( 'int', $blog_id );
			$this->assertTrue( is_blog_user( $blog_id ) );
			$this->assertTrue( remove_user_from_blog( $user1_id, $blog_id ) );
			$this->assertFalse( is_blog_user( $blog_id ) );
		}

		wp_set_current_user( $old_current );
	}

	function test_is_user_member_of_blog() {
		global $wpdb;

		$user1_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		$user2_id = self::factory()->user->create( array( 'role' => 'administrator' ) );

		$old_current = get_current_user_id();

		$this->assertSame( 0, $old_current );

		// test for "get current user" when not logged in
		$this->assertFalse( is_user_member_of_blog() );

		wp_set_current_user( $user1_id );

		$this->assertTrue( is_user_member_of_blog() );
		$this->assertTrue( is_user_member_of_blog( 0, 0 ) );
		$this->assertTrue( is_user_member_of_blog( 0, $wpdb->blogid ) );
		$this->assertTrue( is_user_member_of_blog( $user1_id ) );
		$this->assertTrue( is_user_member_of_blog( $user1_id, $wpdb->blogid ) );

		$blog_ids = self::factory()->blog->create_many( 1 );
		foreach ( $blog_ids as $blog_id ) {
			$this->assertInternalType( 'int', $blog_id );

			// Current user gets added to new blogs
			$this->assertTrue( is_user_member_of_blog( $user1_id, $blog_id ) );
			// Other users should not
			$this->assertFalse( is_user_member_of_blog( $user2_id, $blog_id ) );

			switch_to_blog( $blog_id );

			$this->assertTrue( is_user_member_of_blog( $user1_id ) );
			$this->assertFalse( is_user_member_of_blog( $user2_id ) );

			// Remove user 1 from blog
			$this->assertTrue( remove_user_from_blog( $user1_id, $blog_id ) );

			// Add user 2 to blog
			$this->assertTrue( add_user_to_blog( $blog_id, $user2_id, 'subscriber' ) );

			$this->assertFalse( is_user_member_of_blog( $user1_id ) );
			$this->assertTrue( is_user_member_of_blog( $user2_id ) );

			restore_current_blog();

			$this->assertFalse( is_user_member_of_blog( $user1_id, $blog_id ) );
			$this->assertTrue( is_user_member_of_blog( $user2_id, $blog_id ) );
		}

		wpmu_delete_user( $user1_id );
		$user = new WP_User( $user1_id );
		$this->assertFalse( $user->exists() );
		$this->assertFalse( is_user_member_of_blog( $user1_id ) );

		wp_set_current_user( $old_current );
	}

	/**
	 * @ticket 23192
	 */
	function test_is_user_spammy() {
		$user_id = self::factory()->user->create( array(
			'role' => 'author',
			'user_login' => 'testuser1',
		) );

		$spam_username = (string) $user_id;
		$spam_user_id = self::factory()->user->create( array(
			'role' => 'author',
			'user_login' => $spam_username,
		) );
		update_user_status( $spam_user_id, 'spam', '1' );

		$this->assertTrue( is_user_spammy( $spam_username ) );
		$this->assertFalse( is_user_spammy( 'testuser1' ) );
	}

	/**
	 * @ticket 20601
	 */
	function test_user_member_of_blog() {
		global $wp_rewrite;

		self::factory()->blog->create();
		$user_id = self::factory()->user->create();
		self::factory()->blog->create( array( 'user_id' => $user_id ) );

		$blogs = get_blogs_of_user( $user_id );
		$this->assertCount( 2, $blogs );
		$first = reset( $blogs )->userblog_id;
		remove_user_from_blog( $user_id, $first );

		$blogs = get_blogs_of_user( $user_id );
		$second = reset( $blogs )->userblog_id;
		$this->assertCount( 1, $blogs );

		switch_to_blog( $first );
		$wp_rewrite->init();

		$this->go_to( get_author_posts_url( $user_id ) );
		$this->assertQueryTrue( 'is_404' );

		switch_to_blog( $second );
		$wp_rewrite->init();

		$this->go_to( get_author_posts_url( $user_id ) );
		$this->assertQueryTrue( 'is_author', 'is_archive' );

		add_user_to_blog( $first, $user_id, 'administrator' );
		$blogs = get_blogs_of_user( $user_id );
		$this->assertCount( 2, $blogs );

		switch_to_blog( $first );
		$wp_rewrite->init();

		$this->go_to( get_author_posts_url( $user_id ) );
		$this->assertQueryTrue( 'is_author', 'is_archive' );
	}

	function test_revoked_super_admin_can_be_deleted() {
		if ( isset( $GLOBALS['super_admins'] ) ) {
			$old_global = $GLOBALS['super_admins'];
			unset( $GLOBALS['super_admins'] );
		}

		$user_id = self::factory()->user->create();
		grant_super_admin( $user_id );
		revoke_super_admin( $user_id );

		$this->assertTrue( wpmu_delete_user( $user_id ) );

		if ( isset( $old_global ) ) {
			$GLOBALS['super_admins'] = $old_global;
		}
	}

	function test_revoked_super_admin_is_deleted() {
		if ( isset( $GLOBALS['super_admins'] ) ) {
			$old_global = $GLOBALS['super_admins'];
			unset( $GLOBALS['super_admins'] );
		}

		$user_id = self::factory()->user->create();
		grant_super_admin( $user_id );
		revoke_super_admin( $user_id );
		wpmu_delete_user( $user_id );
		$user = new WP_User( $user_id );

		$this->assertFalse( $user->exists(), 'WP_User->exists' );

		if ( isset( $old_global ) ) {
			$GLOBALS['super_admins'] = $old_global;
		}
	}

	function test_super_admin_cannot_be_deleted() {
		if ( isset( $GLOBALS['super_admins'] ) ) {
			$old_global = $GLOBALS['super_admins'];
			unset( $GLOBALS['super_admins'] );
		}

		$user_id = self::factory()->user->create();
		grant_super_admin( $user_id );

		$this->assertFalse( wpmu_delete_user( $user_id ) );

		if ( isset( $old_global ) ) {
			$GLOBALS['super_admins'] = $old_global;
		}
	}

	/**
	 * @ticket 27205
	 */
	function test_granting_super_admins() {
		if ( isset( $GLOBALS['super_admins'] ) ) {
			$old_global = $GLOBALS['super_admins'];
			unset( $GLOBALS['super_admins'] );
		}

		$user_id = self::factory()->user->create();

		$this->assertFalse( is_super_admin( $user_id ) );
		$this->assertFalse( revoke_super_admin( $user_id ) );
		$this->assertTrue( grant_super_admin( $user_id ) );
		$this->assertTrue( is_super_admin( $user_id ) );
		$this->assertFalse( grant_super_admin( $user_id ) );
		$this->assertTrue( revoke_super_admin( $user_id ) );

		// None of these operations should set the $super_admins global.
		$this->assertFalse( isset( $GLOBALS['super_admins'] ) );

		// Try with two users.
		$second_user = self::factory()->user->create();
		$this->assertTrue( grant_super_admin( $user_id ) );
		$this->assertTrue( grant_super_admin( $second_user ) );
		$this->assertTrue( is_super_admin( $second_user ) );
		$this->assertTrue( is_super_admin( $user_id ) );
		$this->assertTrue( revoke_super_admin( $user_id ) );
		$this->assertTrue( revoke_super_admin( $second_user ) );

		if ( isset( $old_global ) ) {
			$GLOBALS['super_admins'] = $old_global;
		}
	}

	public function test_numeric_string_user_id() {
		$u = self::factory()->user->create();

		$u_string = (string) $u;
		$this->assertTrue( wpmu_delete_user( $u_string ) );
		$this->assertFalse( get_user_by( 'id', $u ) );
	}

	/**
	 * @ticket 33800
	 */
	public function test_should_return_false_for_non_numeric_string_user_id() {
		$this->assertFalse( wpmu_delete_user( 'abcde' ) );
	}

	/**
	 * @ticket 33800
	 */
	public function test_should_return_false_for_object_user_id() {
		$u_obj = self::factory()->user->create_and_get();
		$this->assertFalse( wpmu_delete_user( $u_obj ) );
		$this->assertEquals( $u_obj->ID, username_exists( $u_obj->user_login ) );
	}

	/**
	 * @ticket 38356
	 */
	public function test_add_user_to_blog_subscriber() {
		$site_id = self::factory()->blog->create();
		$user_id = self::factory()->user->create();

		add_user_to_blog( $site_id, $user_id, 'subscriber' );

		switch_to_blog( $site_id );
		$user = get_user_by( 'id', $user_id );
		restore_current_blog();

		wpmu_delete_blog( $site_id );
		wpmu_delete_user( $user_id );

		$this->assertContains( 'subscriber', $user->roles );
	}

	/**
	 * @ticket 38356
	 */
	public function test_add_user_to_blog_invalid_user() {
		$site_id = self::factory()->blog->create();

		$result = add_user_to_blog( 73622, $site_id, 'subscriber' );
		wpmu_delete_blog( $site_id );

		$this->assertWPError( $result );
	}

	/**
	 * @ticket 23016
	 */
	public function test_wp_roles_global_is_reset() {
		global $wp_roles;
		$role = 'test_global_is_reset';
		$role_name = 'Test Global Is Reset';
		$blog_id = self::factory()->blog->create();

		$wp_roles->add_role( $role, $role_name, array() );

		$this->assertNotEmpty( $wp_roles->get_role( $role ) );

		switch_to_blog( $blog_id );

		$this->assertEmpty( $wp_roles->get_role( $role ) );

		$wp_roles->add_role( $role, $role_name, array() );

		$this->assertNotEmpty( $wp_roles->get_role( $role ) );

		restore_current_blog();

		$this->assertNotEmpty( $wp_roles->get_role( $role ) );

		$wp_roles->remove_role( $role );
	}


	/**
	 * Ensure blog's admin e-mail change notification emails do not contain encoded HTML entities
	 * @ticket 40015
	 */
	function test_ms_new_admin_email_notification_html_entities_decoded() {
		reset_phpmailer_instance();

		$existing_email = get_option( 'admin_email' );
		$new_email = 'new-admin-email@test.dev';

		// Give the site and blog a name containing HTML entities
		update_site_option( 'site_name', '&#039;Test&#039; site&#039;s &quot;name&quot; has &lt;html entities&gt; &amp;' );
		update_option( 'blogname', '&#039;Test&#039; blog&#039;s &quot;name&quot; has &lt;html entities&gt; &amp;' );

		update_option_new_admin_email( $existing_email, $new_email );

		$mailer = tests_retrieve_phpmailer_instance();

		$recipient = $mailer->get_recipient( 'to' );
		$email = $mailer->get_sent();

		// Assert reciepient is correct
		$this->assertSame( $new_email, $recipient->address, 'Admin email change notification recipient not as expected' );

		// Assert that HTML entites have been decode in body and subject
		$this->assertContains( '\'Test\' site\'s "name" has <html entities> &', $email->body, 'Email body does not contain the decoded HTML entities' );
		$this->assertNotContains( '&#039;Test&#039; site&#039;s &quot;name&quot; has &lt;html entities&gt; &amp;', 'Email body does contains HTML entities' );
		$this->assertContains( '\'Test\' blog\'s "name" has <html entities> &', $email->subject, 'Email body does not contain the decoded HTML entities' );
		$this->assertNotContains( '&#039;Test&#039; blog&#039;s &quot;name&quot; has &lt;html entities&gt; &amp;', $email->subject, $email->subject, 'Email subject does contains HTML entities' );
	}

	/**
	 * A notification e-mail should not be sent if the new admin e-mail:
	 * - Matches thee existing admin email, or
	 * - is not a valid e-mail, or
	 *
	 * @dataProvider data_user_admin_email_notification_emails
	 */
	function test_ms_new_admin_email_notification_not_sent_when_email_invalid( $email, $message ) {
		reset_phpmailer_instance();

		update_option( 'admin_email', 'existing-email@test.dev' );
		update_option_new_admin_email( 'existing-email@test.dev', $email );

		$mailer = tests_retrieve_phpmailer_instance();

		$this->assertFalse( $mailer->get_sent(), $message );
	}

	/**
	 * Data provider for test_ms_new_admin_email_notification_not_sent_when_email_invalid().
	 *
	 * @return array {
	 *     @type array {
	 *         @type string $email   The new e-mail for admin_email
	 *         @type string $message An error message to display if the test fails
	 *     }
	 * }
	 */
	function data_user_admin_email_notification_emails() {
		return array(
			array(
				'existing-email@test.dev',
				'A notification e-mail should not be sent if the current admin e-mail matches the new e-mail',
			),
			array(
				'not an email',
				'A notification e-mail should not be sent if it is not a valid e-mail',
			)
		);
	}

	/**
	 * Ensure email change confirmation emails do not contain encoded HTML entities
	 * @ticket 40015
	 */
	function test_ms_send_confirmation_on_profile_email_html_entities_decoded() {

		$old_current = get_current_user_id();
		$user_id = self::factory()->user->create( array(
			'role'       => 'subscriber',
			'user_email' => 'old-email@test.dev',
		) );
		wp_set_current_user( $user_id );

		reset_phpmailer_instance();

		// Give the site and blog a name containing HTML entities
		update_site_option( 'site_name', '&#039;Test&#039; site&#039;s &quot;name&quot; has &lt;html entities&gt; &amp;' );
		update_option( 'blogname', '&#039;Test&#039; blog&#039;s &quot;name&quot; has &lt;html entities&gt; &amp;' );

		// Set $_POST['email'] with new e-mail and $_POST['id'] with user's ID.
		$_POST['user_id'] = $user_id;
		$_POST['email'] = 'new-email@test.dev';
		send_confirmation_on_profile_email( );

		$mailer = tests_retrieve_phpmailer_instance();

		$recipient = $mailer->get_recipient( 'to' );
		$email = $mailer->get_sent();

		// Assert reciepient is correct
		$this->assertSame( 'new-email@test.dev', $recipient->address, 'Admin email change notification recipient not as expected' );

		// Assert that HTML entites have been decode in body and subject
		$this->assertContains( '\'Test\' site\'s "name" has <html entities> &', $email->body, 'Email body does not contain the decoded HTML entities' );
		$this->assertNotContains( '&#039;Test&#039; site&#039;s &quot;name&quot; has &lt;html entities&gt; &amp;', $email->body, 'Email body does contains HTML entities' );
		$this->assertContains( '\'Test\' blog\'s "name" has <html entities> &', $email->subject, 'Email body does not contain the decoded HTML entities' );
		$this->assertNotContains( '&#039;Test&#039; blog&#039;s &quot;name&quot; has &lt;html entities&gt; &amp;', $email->subject, 'Email subject does contains HTML entities' );

		wp_set_current_user( $old_current );
	}

	/**
	 * A confirmation e-mail should not be sent if user's new e-mail:
	 * - Matches their existing email, or
	 * - is not a valid e-mail, or
	 * - Matches another user's email
	 *
	 * @dataProvider data_user_change_email_confirmation_emails
	 */
	function test_ms_profile_email_confirmation_not_sent_invalid_email( $email, $message ) {

		$old_current = get_current_user_id();

		$user_id = self::factory()->user->create( array(
			'role'       => 'subscriber',
			'user_email' => 'email@test.dev',
		) );
		wp_set_current_user( $user_id );

		self::factory()->user->create( array(
			'role'       => 'subscriber',
			'user_email' => 'another-user@test.dev',
		) );

		reset_phpmailer_instance();

		// Set $_POST['email'] with new e-mail and $_POST['id'] with user's ID.
		$_POST['user_id'] = $user_id;
		$_POST['email'] = $email;
		send_confirmation_on_profile_email();

		$mailer = tests_retrieve_phpmailer_instance();

		$this->assertFalse( $mailer->get_sent(), $message );

		wp_set_current_user( $old_current );
	}

	/**
	 * Data provider for test_ms_profile_email_confirmation_not_sent_invalid_email().
	 *
	 * @return array {
	 *     @type array {
	 *         @type string $email   The user's new e-amil.
	 *         @type string $message An error message to display if the test fails
	 *     }
	 * }
	 */
	function data_user_change_email_confirmation_emails() {
		return array(
			array(
				'email@test.dev',
				'Confirmation e-mail should not be sent if it matches the user\'s existing e-mail',
			),
			array(
				'not an email',
				'Confirmation e-mail should not be sent if it is not a valid e-mail',
			),
			array(
				'another-user@test.dev',
				'Confirmation e-mail should not be sent if it matches another user\'s e-mail',
			),
		);
	}

}

endif ;
