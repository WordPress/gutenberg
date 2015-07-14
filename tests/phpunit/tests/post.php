<?php

/**
 * test wp-includes/post.php
 *
 * @group post
 */
class Tests_Post extends WP_UnitTestCase {
	function setUp() {
		parent::setUp();
		$this->author_id = $this->factory->user->create( array( 'role' => 'editor' ) );
		$this->old_current_user = get_current_user_id();
		wp_set_current_user( $this->author_id );
		_set_cron_array(array());
		$this->post_ids = array();
	}

	function tearDown() {
		wp_set_current_user( $this->old_current_user );
		parent::tearDown();
	}

	// helper function: return the timestamp(s) of cron jobs for the specified hook and post
	function _next_schedule_for_post($hook, $id) {
		return wp_next_scheduled('publish_future_post', array(0=>intval($id)));
	}

	// helper function, unsets current user globally
	function _unset_current_user() {
		global $current_user, $user_ID;

		$current_user = $user_ID = null;
	}

	// test simple valid behavior: insert and get a post
	function test_vb_insert_get_delete() {
		register_post_type( 'cpt', array( 'taxonomies' => array( 'post_tag', 'ctax' ) ) );
		register_taxonomy( 'ctax', 'cpt' );
		$post_types = array( 'post', 'cpt' );

		foreach ( $post_types as $post_type ) {
			$post = array(
				'post_author' => $this->author_id,
				'post_status' => 'publish',
				'post_content' => rand_str(),
				'post_title' => rand_str(),
				'tax_input' => array( 'post_tag' => 'tag1,tag2', 'ctax' => 'cterm1,cterm2' ),
				'post_type' => $post_type
			);

			// insert a post and make sure the ID is ok
			$id = wp_insert_post($post);
			$this->assertTrue(is_numeric($id));
			$this->assertTrue($id > 0);

			// fetch the post and make sure it matches
			$out = get_post($id);

			$this->assertEquals($post['post_content'], $out->post_content);
			$this->assertEquals($post['post_title'], $out->post_title);
			$this->assertEquals($post['post_status'], $out->post_status);
			$this->assertEquals($post['post_author'], $out->post_author);

			// test cache state
			$pcache = wp_cache_get( $id, 'posts' );
			$this->assertInstanceOf( 'stdClass', $pcache );
			$this->assertEquals( $id, $pcache->ID );

			update_object_term_cache( $id, $post_type );
			$tcache = wp_cache_get( $id, "post_tag_relationships" );
			$this->assertInternalType( 'array', $tcache );
			$this->assertEquals( 2, count( $tcache ) );

			$tcache = wp_cache_get( $id, "ctax_relationships" );
			if ( 'cpt' == $post_type ) {
				$this->assertInternalType( 'array', $tcache );
				$this->assertEquals( 2, count( $tcache ) );
			} else {
				$this->assertFalse( $tcache );
			}

			wp_delete_post( $id, true );
			$this->assertFalse( wp_cache_get( $id, 'posts' ) );
			$this->assertFalse( wp_cache_get( $id, "post_tag_relationships" ) );
			$this->assertFalse( wp_cache_get( $id, "ctax_relationships" ) );
		}

		$GLOBALS['wp_taxonomies']['post_tag']->object_type = array( 'post' );
	}

	function test_vb_insert_future() {
		// insert a post with a future date, and make sure the status and cron schedule are correct

		$future_date = strtotime('+1 day');

		$post = array(
			'post_author' => $this->author_id,
			'post_status' => 'publish',
			'post_content' => rand_str(),
			'post_title' => rand_str(),
			'post_date'  => strftime("%Y-%m-%d %H:%M:%S", $future_date),
		);

		// insert a post and make sure the ID is ok
		$id = $this->post_ids[] = wp_insert_post($post);
		#dmp(_get_cron_array());
		$this->assertTrue(is_numeric($id));
		$this->assertTrue($id > 0);

		// fetch the post and make sure it matches
		$out = get_post($id);

		$this->assertEquals($post['post_content'], $out->post_content);
		$this->assertEquals($post['post_title'], $out->post_title);
		$this->assertEquals('future', $out->post_status);
		$this->assertEquals($post['post_author'], $out->post_author);
		$this->assertEquals($post['post_date'], $out->post_date);

		// there should be a publish_future_post hook scheduled on the future date
		$this->assertEquals($future_date, $this->_next_schedule_for_post('publish_future_post', $id));
	}

	function test_vb_insert_future_over_dst() {
		// insert a post with a future date, and make sure the status and cron schedule are correct

		// Some magic days - one dst one not
		$future_date_1 = strtotime('June 21st +1 year');
		$future_date_2 = strtotime('Jan 11th +1 year');


		$post = array(
			'post_author' => $this->author_id,
			'post_status' => 'publish',
			'post_content' => rand_str(),
			'post_title' => rand_str(),
			'post_date'  => strftime("%Y-%m-%d %H:%M:%S", $future_date_1),
		);

		// insert a post and make sure the ID is ok
		$id = $this->post_ids[] = wp_insert_post($post);

		// fetch the post and make sure has the correct date and status
		$out = get_post($id);
		$this->assertEquals('future', $out->post_status);
		$this->assertEquals($post['post_date'], $out->post_date);

		// check that there's a publish_future_post job scheduled at the right time
		$this->assertEquals($future_date_1, $this->_next_schedule_for_post('publish_future_post', $id));

		// now save it again with a date further in the future

		$post['ID'] = $id;
		$post['post_date'] = strftime("%Y-%m-%d %H:%M:%S", $future_date_2);
		$post['post_date_gmt'] = NULL;
		wp_update_post($post);

		// fetch the post again and make sure it has the new post_date
		$out = get_post($id);
		$this->assertEquals('future', $out->post_status);
		$this->assertEquals($post['post_date'], $out->post_date);

		// and the correct date on the cron job
		$this->assertEquals($future_date_2, $this->_next_schedule_for_post('publish_future_post', $id));
	}

	function test_vb_insert_future_edit_bug() {
		// future post bug: posts get published at the wrong time if you edit the timestamp
		// https://core.trac.wordpress.org/ticket/4710

		$future_date_1 = strtotime('+1 day');
		$future_date_2 = strtotime('+2 day');

		$post = array(
			'post_author' => $this->author_id,
			'post_status' => 'publish',
			'post_content' => rand_str(),
			'post_title' => rand_str(),
			'post_date'  => strftime("%Y-%m-%d %H:%M:%S", $future_date_1),
		);

		// insert a post and make sure the ID is ok
		$id = $this->post_ids[] = wp_insert_post($post);

		// fetch the post and make sure has the correct date and status
		$out = get_post($id);
		$this->assertEquals('future', $out->post_status);
		$this->assertEquals($post['post_date'], $out->post_date);

		// check that there's a publish_future_post job scheduled at the right time
		$this->assertEquals($future_date_1, $this->_next_schedule_for_post('publish_future_post', $id));

		// now save it again with a date further in the future

		$post['ID'] = $id;
		$post['post_date'] = strftime("%Y-%m-%d %H:%M:%S", $future_date_2);
		$post['post_date_gmt'] = NULL;
		wp_update_post($post);

		// fetch the post again and make sure it has the new post_date
		$out = get_post($id);
		$this->assertEquals('future', $out->post_status);
		$this->assertEquals($post['post_date'], $out->post_date);

		// and the correct date on the cron job
		$this->assertEquals($future_date_2, $this->_next_schedule_for_post('publish_future_post', $id));
	}

	function test_vb_insert_future_draft() {
		// insert a draft post with a future date, and make sure no cron schedule is set

		$future_date = strtotime('+1 day');

		$post = array(
			'post_author' => $this->author_id,
			'post_status' => 'draft',
			'post_content' => rand_str(),
			'post_title' => rand_str(),
			'post_date'  => strftime("%Y-%m-%d %H:%M:%S", $future_date),
		);

		// insert a post and make sure the ID is ok
		$id = $this->post_ids[] = wp_insert_post($post);
		#dmp(_get_cron_array());
		$this->assertTrue(is_numeric($id));
		$this->assertTrue($id > 0);

		// fetch the post and make sure it matches
		$out = get_post($id);

		$this->assertEquals($post['post_content'], $out->post_content);
		$this->assertEquals($post['post_title'], $out->post_title);
		$this->assertEquals('draft', $out->post_status);
		$this->assertEquals($post['post_author'], $out->post_author);
		$this->assertEquals($post['post_date'], $out->post_date);

		// there should be a publish_future_post hook scheduled on the future date
		$this->assertEquals(false, $this->_next_schedule_for_post('publish_future_post', $id));

	}

	function test_vb_insert_future_change_to_draft() {
		// insert a future post, then edit and change it to draft, and make sure cron gets it right
		$future_date_1 = strtotime('+1 day');

		$post = array(
			'post_author' => $this->author_id,
			'post_status' => 'publish',
			'post_content' => rand_str(),
			'post_title' => rand_str(),
			'post_date'  => strftime("%Y-%m-%d %H:%M:%S", $future_date_1),
		);

		// insert a post and make sure the ID is ok
		$id = $this->post_ids[] = wp_insert_post($post);

		// fetch the post and make sure has the correct date and status
		$out = get_post($id);
		$this->assertEquals('future', $out->post_status);
		$this->assertEquals($post['post_date'], $out->post_date);

		// check that there's a publish_future_post job scheduled at the right time
		$this->assertEquals($future_date_1, $this->_next_schedule_for_post('publish_future_post', $id));

		// now save it again with status set to draft

		$post['ID'] = $id;
		$post['post_status'] = 'draft';
		wp_update_post($post);

		// fetch the post again and make sure it has the new post_date
		$out = get_post($id);
		$this->assertEquals('draft', $out->post_status);
		$this->assertEquals($post['post_date'], $out->post_date);

		// and the correct date on the cron job
		$this->assertEquals(false, $this->_next_schedule_for_post('publish_future_post', $id));
	}

	function test_vb_insert_future_change_status() {
		// insert a future post, then edit and change the status, and make sure cron gets it right
		$future_date_1 = strtotime('+1 day');

		$statuses = array('draft', 'static', 'object', 'attachment', 'inherit', 'pending');

		foreach ($statuses as $status) {
			$post = array(
				'post_author' => $this->author_id,
				'post_status' => 'publish',
				'post_content' => rand_str(),
				'post_title' => rand_str(),
				'post_date'  => strftime("%Y-%m-%d %H:%M:%S", $future_date_1),
			);

			// insert a post and make sure the ID is ok
			$id = $this->post_ids[] = wp_insert_post($post);

			// fetch the post and make sure has the correct date and status
			$out = get_post($id);
			$this->assertEquals('future', $out->post_status);
			$this->assertEquals($post['post_date'], $out->post_date);

			// check that there's a publish_future_post job scheduled at the right time
			$this->assertEquals($future_date_1, $this->_next_schedule_for_post('publish_future_post', $id));

			// now save it again with status changed

			$post['ID'] = $id;
			$post['post_status'] = $status;
			wp_update_post($post);

			// fetch the post again and make sure it has the new post_date
			$out = get_post($id);
			$this->assertEquals($status, $out->post_status);
			$this->assertEquals($post['post_date'], $out->post_date);

			// and the correct date on the cron job
			$this->assertEquals(false, $this->_next_schedule_for_post('publish_future_post', $id));
		}
	}

	function test_vb_insert_future_private() {
		// insert a draft post with a future date, and make sure no cron schedule is set

		$future_date = strtotime('+1 day');

		$post = array(
			'post_author' => $this->author_id,
			'post_status' => 'private',
			'post_content' => rand_str(),
			'post_title' => rand_str(),
			'post_date'  => strftime("%Y-%m-%d %H:%M:%S", $future_date),
		);

		// insert a post and make sure the ID is ok
		$id = $this->post_ids[] = wp_insert_post($post);
		#dmp(_get_cron_array());
		$this->assertTrue(is_numeric($id));
		$this->assertTrue($id > 0);

		// fetch the post and make sure it matches
		$out = get_post($id);

		$this->assertEquals($post['post_content'], $out->post_content);
		$this->assertEquals($post['post_title'], $out->post_title);
		$this->assertEquals('private', $out->post_status);
		$this->assertEquals($post['post_author'], $out->post_author);
		$this->assertEquals($post['post_date'], $out->post_date);

		// there should be a publish_future_post hook scheduled on the future date
		$this->assertEquals(false, $this->_next_schedule_for_post('publish_future_post', $id));
	}

	/**
	 * @ticket 17180
	 */
	function test_vb_insert_invalid_date() {
		// insert a post with an invalid date, make sure it fails

		$post = array(
			'post_author' => $this->author_id,
			'post_status' => 'public',
			'post_content' => rand_str(),
			'post_title' => rand_str(),
			'post_date'  => '2012-02-30 00:00:00',
		);

		// Test both return paths with or without WP_Error
		$insert_post = wp_insert_post( $post, true );
		$this->assertTrue( is_wp_error( $insert_post ), 'Did not get a WP_Error back from wp_insert_post' );
		$this->assertEquals( 'invalid_date', $insert_post->get_error_code() );

		$insert_post = wp_insert_post( $post );
		$this->assertEquals( 0, $insert_post );
	}

	function test_vb_insert_future_change_to_private() {
		// insert a future post, then edit and change it to private, and make sure cron gets it right
		$future_date_1 = strtotime('+1 day');

		$post = array(
			'post_author' => $this->author_id,
			'post_status' => 'publish',
			'post_content' => rand_str(),
			'post_title' => rand_str(),
			'post_date'  => strftime("%Y-%m-%d %H:%M:%S", $future_date_1),
		);

		// insert a post and make sure the ID is ok
		$id = $this->post_ids[] = wp_insert_post($post);

		// fetch the post and make sure has the correct date and status
		$out = get_post($id);
		$this->assertEquals('future', $out->post_status);
		$this->assertEquals($post['post_date'], $out->post_date);

		// check that there's a publish_future_post job scheduled at the right time
		$this->assertEquals($future_date_1, $this->_next_schedule_for_post('publish_future_post', $id));

		// now save it again with status set to draft

		$post['ID'] = $id;
		$post['post_status'] = 'private';
		wp_update_post($post);

		// fetch the post again and make sure it has the new post_date
		$out = get_post($id);
		$this->assertEquals('private', $out->post_status);
		$this->assertEquals($post['post_date'], $out->post_date);

		// and the correct date on the cron job
		$this->assertEquals(false, $this->_next_schedule_for_post('publish_future_post', $id));
	}

	/**
	 * @ticket 5305
	 */
	public function test_wp_insert_post_should_not_allow_a_bare_numeric_slug_that_might_conflict_with_a_date_archive_when_generating_from_an_empty_post_title() {
		global $wp_rewrite;
		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure( '/%postname%/' );
		$wp_rewrite->flush_rules();

		$p = wp_insert_post( array(
			'post_title' => '',
			'post_content' => 'test',
			'post_status' => 'publish',
			'post_type' => 'post',
		) );

		$post = get_post( $p );

		$wp_rewrite->set_permalink_structure( '' );

		$this->assertEquals( "$p-2", $post->post_name );
	}

	/**
	 * @ticket 5364
	 */
	function test_delete_future_post_cron() {
		// "When I delete a future post using wp_delete_post($post->ID) it does not update the cron correctly."
		$future_date = strtotime('+1 day');

		$post = array(
			'post_author' => $this->author_id,
			'post_status' => 'publish',
			'post_content' => rand_str(),
			'post_title' => rand_str(),
			'post_date'  => strftime("%Y-%m-%d %H:%M:%S", $future_date),
		);

		// insert a post and make sure the ID is ok
		$id = $this->post_ids[] = wp_insert_post($post);

		// check that there's a publish_future_post job scheduled at the right time
		$this->assertEquals($future_date, $this->_next_schedule_for_post('publish_future_post', $id));

		// now delete the post and make sure the cron entry is removed
		wp_delete_post($id);

		$this->assertFalse($this->_next_schedule_for_post('publish_future_post', $id));
	}

	/**
	 * @ticket 5305
	 */
	function test_permalink_without_title() {
		// bug: permalink doesn't work if post title is empty
		// might only fail if the post ID is greater than four characters

		global $wp_rewrite;
		$wp_rewrite->init();
		$wp_rewrite->set_permalink_structure('/%year%/%monthnum%/%day%/%postname%/');
		$wp_rewrite->flush_rules();

		$post = array(
			'post_author' => $this->author_id,
			'post_status' => 'publish',
			'post_content' => rand_str(),
			'post_title' => '',
			'post_date' => '2007-10-31 06:15:00',
		);

		// insert a post and make sure the ID is ok
		$id = $this->post_ids[] = wp_insert_post($post);

		$plink = get_permalink($id);

		// permalink should include the post ID at the end
		$this->assertEquals(get_option('siteurl').'/2007/10/31/'.$id.'/', $plink);

		$wp_rewrite->set_permalink_structure('');
	}

	/**
	 * @ticket 15665
	 */
	function test_get_page_by_path_priority() {
		global $wpdb;

		$attachment = $this->factory->post->create_and_get( array( 'post_title' => 'some-page', 'post_type' => 'attachment' ) );
		$page       = $this->factory->post->create_and_get( array( 'post_title' => 'some-page', 'post_type' => 'page' ) );
		$other_att  = $this->factory->post->create_and_get( array( 'post_title' => 'some-other-page', 'post_type' => 'attachment' ) );

		$wpdb->update( $wpdb->posts, array( 'post_name' => 'some-page' ), array( 'ID' => $page->ID ) );
		clean_post_cache( $page->ID );

		$page = get_post( $page->ID );

		$this->assertEquals( 'some-page', $attachment->post_name );
		$this->assertEquals( 'some-page', $page->post_name );

		// get_page_by_path() should return a post of the requested type before returning an attachment.
		$this->assertEquals( $page, get_page_by_path( 'some-page' ) );

		// Make sure get_page_by_path() will still select an attachment when a post of the requested type doesn't exist.
		$this->assertEquals( $other_att, get_page_by_path( 'some-other-page' ) );
	}

	function test_wp_publish_post() {
		$draft_id = $this->factory->post->create( array( 'post_status' => 'draft' ) );

		$post = get_post( $draft_id );
		$this->assertEquals( 'draft', $post->post_status );

		wp_publish_post( $draft_id );
		$post = get_post( $draft_id );

		$this->assertEquals( 'publish', $post->post_status );
	}

	/**
	 * @ticket 22944
	 */
	function test_wp_insert_post_and_wp_publish_post_with_future_date() {
		$future_date = gmdate( 'Y-m-d H:i:s', time() + 10000000 );
		$post_id = $this->factory->post->create( array(
			'post_status' => 'publish',
			'post_date' => $future_date,
		) );

		$post = get_post( $post_id );
		$this->assertEquals( 'future', $post->post_status );
		$this->assertEquals( $future_date, $post->post_date );

		wp_publish_post( $post_id );
		$post = get_post( $post_id );

		$this->assertEquals( 'publish', $post->post_status );
		$this->assertEquals( $future_date, $post->post_date );
	}

	/**
	 * @ticket 22944
	 */
	function test_publish_post_with_content_filtering() {
		kses_remove_filters();

		$post_id = wp_insert_post( array( 'post_title' => '<script>Test</script>' ) );
		$post = get_post( $post_id );
		$this->assertEquals( '<script>Test</script>', $post->post_title );
		$this->assertEquals( 'draft', $post->post_status );

		kses_init_filters();

		wp_update_post( array( 'ID' => $post->ID, 'post_status' => 'publish' ) );
		$post = get_post( $post->ID );
		$this->assertEquals( 'Test', $post->post_title );

		kses_remove_filters();
	}

	/**
	 * @ticket 22944
	 */
	function test_wp_publish_post_and_avoid_content_filtering() {
		kses_remove_filters();

		$post_id = wp_insert_post( array( 'post_title' => '<script>Test</script>' ) );
		$post = get_post( $post_id );
		$this->assertEquals( '<script>Test</script>', $post->post_title );
		$this->assertEquals( 'draft', $post->post_status );

		kses_init_filters();

		wp_publish_post( $post->ID );
		$post = get_post( $post->ID );
		$this->assertEquals( '<script>Test</script>', $post->post_title );

		kses_remove_filters();
	}

	/**
	 * @ticket 22883
	 */
	function test_get_page_uri_with_stdclass_post_object() {
		$post_id    = $this->factory->post->create( array( 'post_name' => 'get-page-uri-post-name' ) );

		// Mimick an old stdClass post object, missing the ancestors field.
		$post_array = (object) get_post( $post_id, ARRAY_A );
		unset( $post_array->ancestors );

		// Dummy assertion. If this test fails, it will actually error out on an E_WARNING.
		$this->assertEquals( 'get-page-uri-post-name', get_page_uri( $post_array ) );
	}

	/**
	 * @ticket 24491
	 */
	function test_get_page_uri_with_nonexistent_post() {
		global $wpdb;
		$post_id = $wpdb->get_var( "SELECT MAX(ID) FROM $wpdb->posts" ) + 1;
		$this->assertFalse( get_page_uri( $post_id ) );
	}

	/**
	 * @ticket 23708
	 */
	function test_get_post_ancestors_within_loop() {
		global $post;
		$parent_id = $this->factory->post->create();
		$post = $this->factory->post->create_and_get( array( 'post_parent' => $parent_id ) );
		$this->assertEquals( array( $parent_id ), get_post_ancestors( 0 ) );
	}

	/**
	 * @ticket 23474
	 */
	function test_update_invalid_post_id() {
		$post_id = $this->factory->post->create( array( 'post_name' => 'get-page-uri-post-name' ) );
		$post = get_post( $post_id, ARRAY_A );

		$post['ID'] = 123456789;

		$this->assertEquals( 0, wp_insert_post( $post ) );
		$this->assertEquals( 0, wp_update_post( $post ) );

		$this->assertInstanceOf( 'WP_Error', wp_insert_post( $post, true ) );
		$this->assertInstanceOf( 'WP_Error', wp_update_post( $post, true ) );

	}

	function test_parse_post_content_single_page() {
		global $multipage, $pages, $numpages;
		$post_id = $this->factory->post->create( array( 'post_content' => 'Page 0' ) );
		$post = get_post( $post_id );
		setup_postdata( $post );
		$this->assertEquals( 0, $multipage );
		$this->assertCount(  1, $pages );
		$this->assertEquals( 1, $numpages );
		$this->assertEquals( array( 'Page 0' ), $pages );
	}

	function test_parse_post_content_multi_page() {
		global $multipage, $pages, $numpages;
		$post_id = $this->factory->post->create( array( 'post_content' => 'Page 0<!--nextpage-->Page 1<!--nextpage-->Page 2<!--nextpage-->Page 3' ) );
		$post = get_post( $post_id );
		setup_postdata( $post );
		$this->assertEquals( 1, $multipage );
		$this->assertCount(  4, $pages );
		$this->assertEquals( 4, $numpages );
		$this->assertEquals( array( 'Page 0', 'Page 1', 'Page 2', 'Page 3' ), $pages );
	}

	function test_parse_post_content_remaining_single_page() {
		global $multipage, $pages, $numpages;
		$post_id = $this->factory->post->create( array( 'post_content' => 'Page 0' ) );
		$post = get_post( $post_id );
		setup_postdata( $post );
		$this->assertEquals( 0, $multipage );
		$this->assertCount(  1, $pages );
		$this->assertEquals( 1, $numpages );
		$this->assertEquals( array( 'Page 0' ), $pages );
	}

	function test_parse_post_content_remaining_multi_page() {
		global $multipage, $pages, $numpages;
		$post_id = $this->factory->post->create( array( 'post_content' => 'Page 0<!--nextpage-->Page 1<!--nextpage-->Page 2<!--nextpage-->Page 3' ) );
		$post = get_post( $post_id );
		setup_postdata( $post );
		$this->assertEquals( 1, $multipage );
		$this->assertCount(  4, $pages );
		$this->assertEquals( 4, $numpages );
		$this->assertEquals( array( 'Page 0', 'Page 1', 'Page 2', 'Page 3' ), $pages );
	}

	/**
	 * @ticket 16746
	 */
	function test_parse_post_content_starting_with_nextpage() {
		global $multipage, $pages, $numpages;
		$post_id = $this->factory->post->create( array( 'post_content' => '<!--nextpage-->Page 0<!--nextpage-->Page 1<!--nextpage-->Page 2<!--nextpage-->Page 3' ) );
		$post = get_post( $post_id );
		setup_postdata( $post );
		$this->assertEquals( 1, $multipage );
		$this->assertCount(  4, $pages );
		$this->assertEquals( 4, $numpages );
		$this->assertEquals( array( 'Page 0', 'Page 1', 'Page 2', 'Page 3' ), $pages );
	}

	/**
	 * @ticket 16746
	 */
	function test_parse_post_content_starting_with_nextpage_multi() {
		global $multipage, $pages, $numpages;
		$post_id = $this->factory->post->create( array( 'post_content' => '<!--nextpage-->Page 0' ) );
		$post = get_post( $post_id );
		setup_postdata( $post );
		$this->assertEquals( 0, $multipage );
		$this->assertCount(  1, $pages );
		$this->assertEquals( 1, $numpages );
		$this->assertEquals( array( 'Page 0' ), $pages );
	}

	/**
	 * @ticket 19373
	 */
	function test_insert_programmatic_sanitized() {
		$this->_unset_current_user();

		register_taxonomy( 'test_tax', 'post' );

		$title = rand_str();
		$post_data = array(
			'post_author' => $this->author_id,
			'post_status' => 'public',
			'post_content' => rand_str(),
			'post_title' => $title,
			'tax_input' => array(
				'test_tax' => array( 'term', 'term2', 'term3' )
			)
		);
		$insert_post_id = wp_insert_post( $post_data, true, true );
		$this->assertTrue( ( is_int($insert_post_id) && $insert_post_id > 0 ) );

		$post = get_post( $insert_post_id );
		$this->assertEquals( $post->post_author, $this->author_id );
		$this->assertEquals( $post->post_title, $title );
	}

	/**
	 * @ticket 24803
	 */
	function test_wp_count_posts() {
		$post_type = rand_str(20);
		register_post_type( $post_type );
		$this->factory->post->create( array(
			'post_type' => $post_type,
			'post_author' => $this->author_id
		) );
		$count = wp_count_posts( $post_type, 'readable' );
		$this->assertEquals( 1, $count->publish );
		_unregister_post_type( $post_type );
		$this->assertEquals( new stdClass, wp_count_posts( $post_type, 'readable' ) );
	}

	function test_wp_count_posts_filtered() {
		$post_type = rand_str(20);
		register_post_type( $post_type );
		$this->factory->post->create_many( 10, array(
			'post_type' => $post_type,
			'post_author' => $this->author_id
		) );
		$count1 = wp_count_posts( $post_type, 'readable' );
		$this->assertEquals( 10, $count1->publish );
		add_filter( 'wp_count_posts', array( $this, 'filter_wp_count_posts' ) );

		$count2 = wp_count_posts( $post_type, 'readable' );
		$this->assertEquals( 7, $count2->publish );

		remove_filter( 'wp_count_posts', array( $this, 'filter_wp_count_posts' ) );
	}

	function filter_wp_count_posts( $counts ) {
		$counts->publish = 7;
		return $counts;
	}

	function test_wp_count_posts_insert_invalidation() {
		$post_ids = $this->factory->post->create_many( 10 );
		$initial_counts = wp_count_posts();

		$key = array_rand( $post_ids );
		$_post = get_post( $post_ids[$key], ARRAY_A );
		$_post['post_status'] = 'draft';
		wp_insert_post( $_post );
		$post = get_post( $post_ids[$key] );
		$this->assertEquals( 'draft', $post->post_status );
		$this->assertNotEquals( 'publish', $post->post_status );

		$after_draft_counts = wp_count_posts();
		$this->assertEquals( 1, $after_draft_counts->draft );
		$this->assertEquals( 9, $after_draft_counts->publish );
		$this->assertNotEquals( $initial_counts->publish, $after_draft_counts->publish );
	}

	function test_wp_count_posts_trash_invalidation() {
		$post_ids = $this->factory->post->create_many( 10 );
		$initial_counts = wp_count_posts();

		$key = array_rand( $post_ids );

		wp_trash_post( $post_ids[$key] );

		$post = get_post( $post_ids[$key] );
		$this->assertEquals( 'trash', $post->post_status );
		$this->assertNotEquals( 'publish', $post->post_status );

		$after_trash_counts = wp_count_posts();
		$this->assertEquals( 1, $after_trash_counts->trash );
		$this->assertEquals( 9, $after_trash_counts->publish );
		$this->assertNotEquals( $initial_counts->publish, $after_trash_counts->publish );
	}

	/**
	 * @ticket 13771
	 */
	function test_get_the_date_with_id_returns_correct_time() {
		$post_id = $this->factory->post->create( array( 'post_date' => '2014-03-01 16:35:00' ) );
		$this->assertEquals( 'March 1, 2014', get_the_date( 'F j, Y', $post_id ) );
	}

	/**
	 * @ticket 28310
	 */
	function test_get_the_date_returns_false_with_null_or_non_existing_post() {
		$this->assertFalse( get_the_date() );
		$this->assertFalse( get_the_date( 'F j, Y h:i:s' ) );
		$this->assertFalse( get_the_date( '', 9 ) );
		$this->assertFalse( get_the_date( 'F j, Y h:i:s', 9 ) );
	}

	/**
	 * @ticket 28310
	 */
	function test_get_the_time_with_id_returns_correct_time() {
		$post_id = $this->factory->post->create( array( 'post_date' => '2014-03-01 16:35:00' ) );
		$this->assertEquals( '16:35:00', get_the_time( 'H:i:s', $post_id ) );
	}

	/**
	 * @ticket 28310
	 */
	function test_get_the_time_returns_false_with_null_or_non_existing_post() {
		$this->assertFalse( get_the_time() );
		$this->assertFalse( get_the_time( 'h:i:s' ) );
		$this->assertFalse( get_the_time( '', 9 ) );
		$this->assertFalse( get_the_time( 'h:i:s', 9 ) );
	}

	/**
	 * @ticket 28310
	 */
	function test_get_post_time_with_id_returns_correct_time() {
		$post_id = $this->factory->post->create( array( 'post_date' => '2014-03-01 16:35:00' ) );
		$this->assertEquals( '16:35:00', get_post_time( 'H:i:s', false, $post_id ) );
	}

	/**
	 * @ticket 28310
	 */
	function test_get_post_time_returns_false_with_null_or_non_existing_post() {
		$this->assertFalse( get_post_time() );
		$this->assertFalse( get_post_time( 'h:i:s' ) );
		$this->assertFalse( get_post_time( '', false, 9 ) );
		$this->assertFalse( get_post_time( 'h:i:s', false, 9 ) );
	}

	/**
	 * @ticket 28310
	 */
	function test_get_post_modified_time_with_id_returns_correct_time() {
		$post_id = $this->factory->post->create( array( 'post_date' => '2014-03-01 16:35:00' ) );
		$this->assertEquals( '16:35:00', get_post_modified_time( 'H:i:s', false, $post_id ) );
	}

	/**
	 * @ticket 28310
	 */
	function test_get_post_modified_time_returns_false_with_null_or_non_existing_post() {
		$this->assertFalse( get_post_modified_time() );
		$this->assertFalse( get_post_modified_time( 'h:i:s' ) );
		$this->assertFalse( get_post_modified_time( '', false, 9 ) );
		$this->assertFalse( get_post_modified_time( 'h:i:s', false, 9 ) );
	}

	/**
	 * @ticket 28310
	 */
	function test_mysql2date_returns_false_with_no_date() {
		$this->assertFalse( mysql2date( 'F j, Y H:i:s', '' ) );
	}

	/**
	 * @ticket 28310
	 */
	function test_mysql2date_returns_gmt_or_unix_timestamp() {
		$this->assertEquals( '441013392', mysql2date( 'G', '1983-12-23 07:43:12' ) );
		$this->assertEquals( '441013392', mysql2date( 'U', '1983-12-23 07:43:12' ) );
	}

	/**
	 * @ticket 25566
	 */
	function test_wp_tag_cloud_link_with_post_type() {
		$post_type = 'new_post_type';
		$tax = 'new_tag';
		register_post_type( $post_type, array( 'taxonomies' => array( 'post_tag', $tax ) ) );
		register_taxonomy( $tax, $post_type );

		$post = $this->factory->post->create( array( 'post_type' => $post_type ) );
		wp_set_object_terms( $post, rand_str(), $tax );

		$wp_tag_cloud = wp_tag_cloud( array(
			'post_type' => $post_type,
			'taxonomy' => $tax,
			'echo' => false,
			'link' => 'edit'
		) );

		$terms = get_terms( $tax );
		$term = reset( $terms );
		$url = sprintf( '%s?action=edit&#038;taxonomy=%s&#038;tag_ID=%d&#038;post_type=%s',
			admin_url( 'edit-tags.php' ),
			$tax,
			$term->term_id,
			$post_type
		);
		$expected_wp_tag_cloud = sprintf( "<a href='%s' class='tag-link-%d' title='1 topic' style='font-size: 8pt;'>%s</a>",
			$url,
			$term->term_id,
			$term->name
		);
		$this->assertEquals( $expected_wp_tag_cloud, $wp_tag_cloud );

		_unregister_post_type( $post_type );
		_unregister_taxonomy( $tax );
	}

	/**
	 * @ticket 21212
	 */
	function test_utf8mb3_post_saves_with_emoji() {
		global $wpdb;
		$_wpdb = new wpdb_exposed_methods_for_testing();

		if ( 'utf8' !== $_wpdb->get_col_charset( $wpdb->posts, 'post_title' ) ) {
			$this->markTestSkipped( 'This test is only useful with the utf8 character set' );
		}

		require_once( ABSPATH . '/wp-admin/includes/post.php' );

		$post_id = $this->factory->post->create();

		$data = array(
			'post_ID'      => $post_id,
			'post_title'   => "foo\xf0\x9f\x98\x88bar",
			'post_content' => "foo\xf0\x9f\x98\x8ebaz",
			'post_excerpt' => "foo\xf0\x9f\x98\x90bat"
		);

		$expected = array(
			'post_title'   => "foo&#x1f608;bar",
			'post_content' => "foo&#x1f60e;baz",
			'post_excerpt' => "foo&#x1f610;bat"
		);

		edit_post( $data );

		$post = get_post( $post_id );

		foreach( $expected as $field => $value ) {
			$this->assertEquals( $value, $post->$field );
		}
	}

	/**
	 * @ticket 31168
	 */
	function test_wp_insert_post_default_comment_ping_status_open() {
		$post_id = $this->factory->post->create( array(
			'post_author' => $this->author_id,
			'post_status' => 'public',
			'post_content' => rand_str(),
			'post_title' => rand_str(),
		) );
		$post = get_post( $post_id );

		$this->assertEquals( 'open', $post->comment_status );
		$this->assertEquals( 'open', $post->ping_status );
	}

	/**
	 * @ticket 31168
	 */
	function test_wp_insert_post_page_default_comment_ping_status_closed() {
		$post_id = $this->factory->post->create( array(
			'post_author' => $this->author_id,
			'post_status' => 'public',
			'post_content' => rand_str(),
			'post_title' => rand_str(),
			'post_type' => 'page',
		) );
		$post = get_post( $post_id );

		$this->assertEquals( 'closed', $post->comment_status );
		$this->assertEquals( 'closed', $post->ping_status );
	}

	/**
	 * @ticket 31168
	 */
	function test_wp_insert_post_cpt_default_comment_ping_status_open() {
		$post_type = rand_str(20);
		register_post_type( $post_type, array( 'supports' => array( 'comments', 'trackbacks' ) ) );
		$post_id = $this->factory->post->create( array(
			'post_author' => $this->author_id,
			'post_status' => 'public',
			'post_content' => rand_str(),
			'post_title' => rand_str(),
			'post_type' => $post_type,
		) );
		$post = get_post( $post_id );

		$this->assertEquals( 'open', $post->comment_status );
		$this->assertEquals( 'open', $post->ping_status );
		_unregister_post_type( $post_type );
	}

	/**
	 * @ticket 31168
	 */
	function test_wp_insert_post_cpt_default_comment_ping_status_closed() {
		$post_type = rand_str(20);
		register_post_type( $post_type );
		$post_id = $this->factory->post->create( array(
			'post_author' => $this->author_id,
			'post_status' => 'public',
			'post_content' => rand_str(),
			'post_title' => rand_str(),
			'post_type' => $post_type,
		) );
		$post = get_post( $post_id );

		$this->assertEquals( 'closed', $post->comment_status );
		$this->assertEquals( 'closed', $post->ping_status );
		_unregister_post_type( $post_type );
	}

	/**
	 * If a post is sticky and is updated by a user that does not have the publish_post capability, it should _stay_
	 * sticky.
	 *
	 * @ticket 24153
	 */
	function test_user_without_publish_cannot_affect_sticky() {
		// Create a role with edit_others_posts.
		add_role( 'grammarian', 'Grammarian', array(
			'read'                 => true,
			'edit_posts'           => true,
			'edit_others_posts'    => true,
			'edit_published_posts' => true,
		) );
		$editor_user = $this->factory->user->create( array( 'role' => 'grammarian' ) );
		$old_uid = get_current_user_id();
		wp_set_current_user( $editor_user );

		// Sanity Check.
		$this->assertFalse( current_user_can( 'publish_posts' ) );
		$this->assertTrue( current_user_can( 'edit_others_posts' ) );
		$this->assertTrue( current_user_can( 'edit_published_posts' ) );

		// Create a sticky post.
		$post = $this->factory->post->create_and_get( array(
			'post_title'   => 'Will be changed',
			'post_content' => 'Will be changed',
		) );
		stick_post( $post->ID );

		// Sanity Check.
		$this->assertTrue( is_sticky( $post->ID ) );

		// Edit the post.
		$post->post_title = 'Updated';
		$post->post_content = 'Updated';
		wp_update_post( $post );

		// Make sure it's still sticky.
		$saved_post = get_post( $post->ID );
		$this->assertTrue( is_sticky( $saved_post->ID ) );
		$this->assertEquals( 'Updated', $saved_post->post_title );
		$this->assertEquals( 'Updated', $saved_post->post_content );

		// Teardown
		wp_set_current_user( $old_uid );
	}

	/**
	 * If the `edit_post()` method is invoked by a user without publish_posts permission, the sticky status of the post
	 * should not be changed.
	 *
	 * @ticket 24153
	 */
	function test_user_without_publish_cannot_affect_sticky_with_edit_post() {
		// Create a sticky post.
		$post = $this->factory->post->create_and_get( array(
			'post_title'   => 'Will be changed',
			'post_content' => 'Will be changed',
		) );
		stick_post( $post->ID );

		// Sanity Check.
		$this->assertTrue( is_sticky( $post->ID ) );

		// Create a role with edit_others_posts.
		add_role( 'grammarian', 'Grammarian', array(
			'read'                 => true,
			'edit_posts'           => true,
			'edit_others_posts'    => true,
			'edit_published_posts' => true,
		) );
		$editor_user = $this->factory->user->create( array( 'role' => 'grammarian' ) );
		$old_uid = get_current_user_id();
		wp_set_current_user( $editor_user );

		// Sanity Check.
		$this->assertFalse( current_user_can( 'publish_posts' ) );
		$this->assertTrue( current_user_can( 'edit_others_posts' ) );
		$this->assertTrue( current_user_can( 'edit_published_posts' ) );

		// Edit the post - The key 'sticky' is intentionally unset.
		$data = array(
			'post_ID'      => $post->ID,
			'post_title'   => 'Updated',
			'post_content' => 'Updated',
		);
		edit_post( $data );

		// Make sure it's still sticky
		$saved_post = get_post( $post->ID );
		$this->assertTrue( is_sticky( $saved_post->ID ) );
		$this->assertEquals( 'Updated', $saved_post->post_title );
		$this->assertEquals( 'Updated', $saved_post->post_content );

		// Teardown
		wp_set_current_user( $old_uid );
	}
}
