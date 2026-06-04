<?php
/**
 * Tests for Gutenberg_Content_Guidelines_Revisions_Controller initialization.
 *
 * @package gutenberg
 */
class Gutenberg_Content_Guidelines_Revisions_Controller_Test extends WP_UnitTestCase {

	/**
	 * Re-register the post type after each test, since some tests
	 * unregister it to simulate ordering edge cases.
	 */
	public function tear_down() {
		if ( ! post_type_exists( Gutenberg_Guidelines_Post_Type::POST_TYPE ) ) {
			Gutenberg_Guidelines_Post_Type::register();
		}
		parent::tear_down();
	}

	/**
	 * `rest_api_init` can fire before `init` priority 10 when something
	 * (e.g. an early `rest_get_server()` call from `plugins_loaded`)
	 * boots the REST server early. In that window the `wp_guideline`
	 * post type is not yet registered, so both controllers instantiated
	 * by the `rest_api_init` handler dereference a null post type object
	 * in their parent constructors and fatal — the singleton REST
	 * controller via WP_REST_Posts_Controller::__construct, the revisions
	 * controller via WP_REST_Revisions_Controller::__construct.
	 *
	 * The handler in lib/experimental/guidelines/index.php must defend
	 * against this ordering by ensuring the post type exists before
	 * instantiating the controllers.
	 */
	public function test_rest_api_init_does_not_fatal_when_post_type_not_yet_registered() {
		unregister_post_type( Gutenberg_Guidelines_Post_Type::POST_TYPE );
		$this->assertFalse(
			post_type_exists( Gutenberg_Guidelines_Post_Type::POST_TYPE ),
			'Pre-condition: post type must be unregistered to exercise the ordering bug.'
		);

		do_action( 'rest_api_init' );

		$this->assertTrue(
			post_type_exists( Gutenberg_Guidelines_Post_Type::POST_TYPE ),
			'The rest_api_init handler should defensively register the post type.'
		);
	}
}
