<?php

/**
 * @group oembed
 */
class Tests_Embed_Template extends WP_UnitTestCase {
	function test_oembed_output_post() {
		$user = self::factory()->user->create_and_get( array(
			'display_name' => 'John Doe',
		) );

		$post_id = self::factory()->post->create( array(
			'post_author'  => $user->ID,
			'post_title'   => 'Hello World',
			'post_content' => 'Foo Bar',
			'post_excerpt' => 'Bar Baz',
		) );
		$this->go_to( get_post_embed_url( $post_id ) );

		$this->assertQueryTrue( 'is_single', 'is_singular', 'is_embed' );

		ob_start();
		include( ABSPATH . WPINC . '/theme-compat/embed.php' );
		$actual = ob_get_clean();

		$doc = new DOMDocument();
		$this->assertTrue( $doc->loadHTML( $actual ) );
		$this->assertFalse( strpos( $actual, 'That embed can&#8217;t be found.' ) );
		$this->assertNotFalse( strpos( $actual, 'Hello World' ) );
	}

	function test_oembed_output_post_with_thumbnail() {
		$post_id       = self::factory()->post->create( array(
			'post_title'   => 'Hello World',
			'post_content' => 'Foo Bar',
			'post_excerpt' => 'Bar Baz',
		) );
		$file          = DIR_TESTDATA . '/images/canola.jpg';
		$attachment_id = self::factory()->attachment->create_object( $file, $post_id, array(
			'post_mime_type' => 'image/jpeg',
		) );
		set_post_thumbnail( $post_id, $attachment_id );

		$this->go_to( get_post_embed_url( $post_id ) );

		$this->assertQueryTrue( 'is_single', 'is_singular', 'is_embed' );

		ob_start();
		include( ABSPATH . WPINC . '/theme-compat/embed.php' );
		$actual = ob_get_clean();

		$doc = new DOMDocument();
		$this->assertTrue( $doc->loadHTML( $actual ) );
		$this->assertFalse( strpos( $actual, 'That embed can&#8217;t be found.' ) );
		$this->assertNotFalse( strpos( $actual, 'Hello World' ) );
		$this->assertNotFalse( strpos( $actual, 'canola.jpg' ) );
	}

	function test_oembed_output_404() {
		$this->go_to( home_url( '/?p=123&embed=true' ) );
		$GLOBALS['wp_query']->query_vars['embed'] = true;

		$this->assertQueryTrue( 'is_404', 'is_embed' );

		ob_start();
		include( ABSPATH . WPINC . '/theme-compat/embed.php' );
		$actual = ob_get_clean();

		$doc = new DOMDocument();
		$this->assertTrue( $doc->loadHTML( $actual ) );
		$this->assertNotFalse( strpos( $actual, 'That embed can&#8217;t be found.' ) );
	}

	function test_oembed_output_attachment() {
		$post          = self::factory()->post->create_and_get();
		$file          = DIR_TESTDATA . '/images/canola.jpg';
		$attachment_id = self::factory()->attachment->create_object( $file, $post->ID, array(
			'post_mime_type' => 'image/jpeg',
			'post_title'     => 'Hello World',
			'post_content'   => 'Foo Bar',
			'post_excerpt'   => 'Bar Baz',
		) );

		$this->go_to( get_post_embed_url( $attachment_id ) );

		$this->assertQueryTrue( 'is_single', 'is_singular', 'is_attachment', 'is_embed' );

		ob_start();
		include( ABSPATH . WPINC . '/theme-compat/embed.php' );
		$actual = ob_get_clean();

		$doc = new DOMDocument();
		$this->assertTrue( $doc->loadHTML( $actual ) );
		$this->assertFalse( strpos( $actual, 'That embed can&#8217;t be found.' ) );
		$this->assertNotFalse( strpos( $actual, 'Hello World' ) );
		$this->assertNotFalse( strpos( $actual, 'canola.jpg' ) );
	}

	function test_oembed_output_draft_post() {
		$post_id = self::factory()->post->create( array(
			'post_title'   => 'Hello World',
			'post_content' => 'Foo Bar',
			'post_excerpt' => 'Bar Baz',
			'post_status'  => 'draft',
		) );

		$this->go_to( get_post_embed_url( $post_id ) );

		$this->assertQueryTrue( 'is_404', 'is_embed' );

		ob_start();
		include( ABSPATH . WPINC . '/theme-compat/embed.php' );
		$actual = ob_get_clean();

		$doc = new DOMDocument();
		$this->assertTrue( $doc->loadHTML( $actual ) );
		$this->assertNotFalse( strpos( $actual, 'That embed can&#8217;t be found.' ) );
	}

	function test_oembed_output_scheduled_post() {
		$post_id = self::factory()->post->create( array(
			'post_title'   => 'Hello World',
			'post_content' => 'Foo Bar',
			'post_excerpt' => 'Bar Baz',
			'post_status'  => 'future',
			'post_date'    => strftime( '%Y-%m-%d %H:%M:%S', strtotime( '+1 day' ) ),
		) );

		$this->go_to( get_post_embed_url( $post_id ) );

		$this->assertQueryTrue( 'is_404', 'is_embed' );

		ob_start();
		include( ABSPATH . WPINC . '/theme-compat/embed.php' );
		$actual = ob_get_clean();

		$doc = new DOMDocument();
		$this->assertTrue( $doc->loadHTML( $actual ) );
		$this->assertNotFalse( strpos( $actual, 'That embed can&#8217;t be found.' ) );
	}

	function test_oembed_output_private_post() {
		$post_id = self::factory()->post->create( array(
			'post_title'   => 'Hello World',
			'post_content' => 'Foo Bar',
			'post_excerpt' => 'Bar Baz',
			'post_status'  => 'private',
		) );

		$this->go_to( get_post_embed_url( $post_id ) );

		$this->assertQueryTrue( 'is_404', 'is_embed' );

		ob_start();
		include( ABSPATH . WPINC . '/theme-compat/embed.php' );
		$actual = ob_get_clean();

		$doc = new DOMDocument();
		$this->assertTrue( $doc->loadHTML( $actual ) );
		$this->assertNotFalse( strpos( $actual, 'That embed can&#8217;t be found.' ) );
	}

	function test_oembed_output_private_post_with_permissions() {
		$user_id = self::factory()->user->create( array( 'role' => 'editor' ) );
		wp_set_current_user( $user_id );

		$post_id = self::factory()->post->create( array(
			'post_title'   => 'Hello World',
			'post_content' => 'Foo Bar',
			'post_excerpt' => 'Bar Baz',
			'post_status'  => 'private',
			'post_author'  => $user_id,
		) );

		$this->go_to( get_post_embed_url( $post_id ) );

		$this->assertQueryTrue( 'is_single', 'is_singular', 'is_embed' );

		ob_start();
		include( ABSPATH . WPINC . '/theme-compat/embed.php' );
		$actual = ob_get_clean();

		$doc = new DOMDocument();
		$this->assertTrue( $doc->loadHTML( $actual ) );
		$this->assertFalse( strpos( $actual, 'That embed can&#8217;t be found.' ) );
		$this->assertNotFalse( strpos( $actual, 'Hello World' ) );
	}

	function test_wp_embed_excerpt_more_no_embed() {
		$GLOBALS['wp_query'] = new WP_Query();

		$this->assertEquals( 'foo bar', wp_embed_excerpt_more( 'foo bar' ) );
	}

	function test_wp_embed_excerpt_more() {
		$post_id = self::factory()->post->create( array(
			'post_title'   => 'Foo Bar',
			'post_content' => 'Bar Baz',
		) );

		$this->assertEquals( '', wp_embed_excerpt_more( '' ) );

		$this->go_to( get_post_embed_url( $post_id ) );

		$actual = wp_embed_excerpt_more( '' );

		$expected = sprintf(
			' &hellip; <a href="%s" class="wp-embed-more" target="_top">Continue reading <span class="screen-reader-text">Foo Bar</span></a>',
			get_the_permalink()
		);

		$this->assertEquals( $expected, $actual );
	}

	function test_is_embed_post() {
		$this->assertFalse( is_embed() );

		$post_id = self::factory()->post->create();
		$this->go_to( get_post_embed_url( $post_id ) );
		$this->assertTrue( is_embed() );
	}

	function test_is_embed_attachment() {
		$post_id       = self::factory()->post->create();
		$file          = DIR_TESTDATA . '/images/canola.jpg';
		$attachment_id = self::factory()->attachment->create_object( $file, $post_id, array(
			'post_mime_type' => 'image/jpeg',
		) );
		$this->go_to( get_post_embed_url( $attachment_id ) );
		$this->assertTrue( is_embed() );
	}

	function test_is_embed_404() {
		$this->go_to( home_url( '/?p=12345&embed=true' ) );
		$this->assertTrue( is_embed() );
	}

	function test_get_post_embed_html_non_existent_post() {
		$this->assertFalse( get_post_embed_html( 200, 200, 0 ) );
		$this->assertFalse( get_post_embed_html( 200, 200 ) );
	}

	function test_get_post_embed_html() {
		$post_id = self::factory()->post->create();
		$title = esc_attr(
			sprintf(
				__( '&#8220;%1$s&#8221; &#8212; %2$s' ),
				get_the_title( $post_id ),
				get_bloginfo( 'name' )
			)
		);

		$expected = '<iframe sandbox="allow-scripts" security="restricted" src="' . esc_url( get_post_embed_url( $post_id ) ) . '" width="200" height="200" title="' . $title . '" frameborder="0" marginwidth="0" marginheight="0" scrolling="no" class="wp-embedded-content"></iframe>';

		$this->assertStringEndsWith( $expected, get_post_embed_html( 200, 200, $post_id ) );
	}

	function test_add_host_js() {
		wp_oembed_add_host_js();

		$this->assertTrue( wp_script_is( 'wp-embed' ) );
	}

	/**
	 * @ticket 34698
	 */
	function test_js_no_ampersands() {
		$this->assertNotContains( '&', file_get_contents( ABSPATH . WPINC . '/js/wp-embed.js' ) );
	}

	/**
	 * @ticket 34698
	 *
	 * @depends test_js_no_ampersands
	 *
	 * The previous test confirms that no ampersands exist in src/wp-includes/js/wp-embed.js.
	 * However, we must also confirm that UglifyJS does not add ampersands during its
	 * optimizations (which we tweak to avoid, but indirectly -- understandably, there's
	 * no "don't add ampersands to my JavaScript file" option).
	 *
	 * So this test checks for ampersands in build/wp-includes/js/wp-embed.min.js.
	 * In many cases, this file will not exist; in those cases, we simply skip the test.
	 *
	 * So when would it be run? We have Travis CI run `grunt test` which then runs, in order,
	 * `qunit:compiled` (which runs the build) and then `phpunit`. Thus, this test will at least be
	 * run during continuous integration.
	 *
	 * However, we need to verify that `qunit:compiled` runs before `phpunit`. So this test also
	 * does a cheap check for a registered Grunt task called `test` that contains both
	 * `qunit:compiled` and `phpunit`, in that order.
	 *
	 * One final failsafe: The Gruntfile.js assertion takes place before checking for the existence
	 * of wp-embed.min.js. If the Grunt tasks are significantly refactored later, it could indicate
	 * that wp-embed.min.js doesn't exist anymore. We wouldn't want the test to silently become one
	 * that is always skipped, and thus useless.
	 */
	function test_js_no_ampersands_in_compiled() {
		$gruntfile = file_get_contents( dirname( ABSPATH ) . '/Gruntfile.js' );

		// Confirm this file *should* exist, otherwise this test will always be skipped.
		$test = '/grunt.registerTask\(\s*\'test\',.*\'qunit:compiled\'.*\'phpunit\'/';
		$this->assertTrue( (bool) preg_match( $test, $gruntfile ) );

		$file = dirname( ABSPATH ) . '/build/' . WPINC . '/js/wp-embed.min.js';
		if ( ! file_exists( $file ) ) {
			return;
		}
		$this->assertNotContains( '&', file_get_contents( $file ) );
	}

}
