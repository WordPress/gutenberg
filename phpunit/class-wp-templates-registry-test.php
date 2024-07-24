<?php
/**
 * Test WP_Templates_Registry class.
 *
 * @covers WP_Templates_Registry
 */
class WP_Templates_Registry_Test extends WP_UnitTestCase {

	/**
	 * @var WP_Templates_Registry
	 */
	protected static $registry;

	public static function set_up_before_class() {
		parent::set_up_before_class();

		self::$registry = WP_Templates_Registry::get_instance();
	}

	public function test_register_template() {
		// Register a valid template.
		$template_name = 'test-template';
		$args          = array(
			'plugin' => 'test-plugin',
		);
		$template      = self::$registry->register( $template_name, $args );

		$this->assertEquals( $template->slug, $template_name );

		self::$registry->unregister( 'test-plugin//' . $template_name );
	}

	public function test_register_template_invalid_name() {
		// Try to register a template with invalid name (non-string).
		$template_name = array( 'invalid-template-name' );
		$args          = array(
			'plugin' => 'test-plugin',
		);

		$this->setExpectedIncorrectUsage( 'WP_Templates_Registry::register' );
		$result = self::$registry->register( $template_name, $args );

		$this->assertWPError( $result );
		$this->assertEquals( 'template_name_no_string', $result->get_error_code() );
		$this->assertEquals( 'Template names must be a string.', $result->get_error_message() );
	}

	public function test_register_template_invalid_name_uppercase() {
		// Try to register a template with uppercase characters in the name.
		$template_name = 'Invalid-Template-Name';
		$args          = array(
			'plugin' => 'test-plugin',
		);

		$this->setExpectedIncorrectUsage( 'WP_Templates_Registry::register' );
		$result = self::$registry->register( $template_name, $args );

		$this->assertWPError( $result );
		$this->assertEquals( 'template_name_no_uppercase', $result->get_error_code() );
		$this->assertEquals( 'Template names must not contain uppercase characters.', $result->get_error_message() );
	}

	public function test_register_template_no_plugin_property() {
		// Try to register a template without a plugin property.
		$this->setExpectedIncorrectUsage( 'WP_Templates_Registry::register' );
		$result = self::$registry->register( 'template-no-plugin', array() );

		$this->assertWPError( $result );
		$this->assertEquals( 'template_no_plugin', $result->get_error_code() );
		$this->assertEquals( 'Registered templates must have a plugin property.', $result->get_error_message() );
	}

	public function test_register_template_already_exists() {
		// Register the template for the first time.
		$template_name = 'duplicate-template';
		$args          = array(
			'plugin' => 'test-plugin',
		);
		self::$registry->register( $template_name, $args );

		// Try to register the same template again.
		$this->setExpectedIncorrectUsage( 'WP_Templates_Registry::register' );
		$result = self::$registry->register( $template_name, $args );

		$this->assertWPError( $result );
		$this->assertEquals( 'template_already_registered', $result->get_error_code() );
		$this->assertStringContainsString( 'Template "test-plugin//duplicate-template" is already registered.', $result->get_error_message() );

		self::$registry->unregister( 'test-plugin//' . $template_name );
	}

	public function test_get_all_registered() {
		$template_name_1 = 'template-1';
		$template_name_2 = 'template-2';
		$args            = array(
			'plugin' => 'test-plugin',
		);
		self::$registry->register( $template_name_1, $args );
		self::$registry->register( $template_name_2, $args );

		$all_templates = self::$registry->get_all_registered();

		$this->assertIsArray( $all_templates );
		$this->assertCount( 2, $all_templates );
		$this->assertArrayHasKey( 'test-plugin//template-1', $all_templates );
		$this->assertArrayHasKey( 'test-plugin//template-2', $all_templates );

		self::$registry->unregister( 'test-plugin//' . $template_name_1 );
		self::$registry->unregister( 'test-plugin//' . $template_name_2 );
	}

	public function test_get_registered() {
		$template_name = 'registered-template';
		$args          = array(
			'plugin'      => 'test-plugin',
			'content'     => 'Template content',
			'title'       => 'Registered Template',
			'description' => 'Description of registered template',
			'post_types'  => array( 'post', 'page' ),
		);
		self::$registry->register( $template_name, $args );
		$template_id = $args['plugin'] . '//' . $template_name;

		$registered_template = self::$registry->get_registered( $template_id );

		$this->assertEquals( 'default', $registered_template->theme );
		$this->assertEquals( 'registered-template', $registered_template->slug );
		$this->assertEquals( 'default//registered-template', $registered_template->id );
		$this->assertEquals( 'Registered Template', $registered_template->title );
		$this->assertEquals( 'Template content', $registered_template->content );
		$this->assertEquals( 'Description of registered template', $registered_template->description );
		$this->assertEquals( 'plugin', $registered_template->source );
		$this->assertEquals( 'plugin', $registered_template->origin );
		$this->assertEquals( array( 'post', 'page' ), $registered_template->post_types );
		$this->assertEquals( 'test-plugin', $registered_template->plugin );

		self::$registry->unregister( $template_id );
	}

	public function test_get_by_slug() {
		$template_name = 'slug-template';
		$args          = array(
			'plugin'  => 'test-plugin',
			'content' => 'Template content',
			'title'   => 'Slug Template',
		);
		self::$registry->register( $template_name, $args );

		$registered_template = self::$registry->get_by_slug( $template_name );

		$this->assertNotNull( $registered_template );
		$this->assertEquals( $template_name, $registered_template->slug );

		self::$registry->unregister( 'test-plugin//' . $template_name );
	}

	public function test_get_by_query() {
		$template_name_1 = 'query-template-1';
		$template_name_2 = 'query-template-2';
		$args_1          = array(
			'plugin'  => 'test-plugin',
			'content' => 'Template content 1',
			'title'   => 'Query Template 1',
		);
		$args_2          = array(
			'plugin'  => 'test-plugin',
			'content' => 'Template content 2',
			'title'   => 'Query Template 2',
		);
		self::$registry->register( $template_name_1, $args_1 );
		self::$registry->register( $template_name_2, $args_2 );

		$query   = array(
			'slug__in' => array( 'query-template-1' ),
		);
		$results = self::$registry->get_by_query( $query );

		$this->assertCount( 1, $results );
		$this->assertArrayHasKey( 'test-plugin//query-template-1', $results );

		self::$registry->unregister( 'test-plugin//' . $template_name_1 );
		self::$registry->unregister( 'test-plugin//' . $template_name_2 );
	}

	public function test_is_registered() {
		$template_name = 'is-registered-template';
		$args          = array(
			'plugin'  => 'test-plugin',
			'content' => 'Template content',
			'title'   => 'Is Registered Template',
		);
		self::$registry->register( $template_name, $args );
		$template_id = $args['plugin'] . '//' . $template_name;

		$this->assertTrue( self::$registry->is_registered( $template_id ) );

		self::$registry->unregister( $template_id );
	}

	public function test_unregister() {
		$template_name = 'unregister-template';
		$args          = array(
			'plugin'  => 'test-plugin',
			'content' => 'Template content',
			'title'   => 'Unregister Template',
		);
		$template      = self::$registry->register( $template_name, $args );
		$template_id   = $args['plugin'] . '//' . $template_name;

		$unregistered_template = self::$registry->unregister( $template_id );

		$this->assertEquals( $template, $unregistered_template );
		$this->assertFalse( self::$registry->is_registered( $template_id ) );
	}
}
