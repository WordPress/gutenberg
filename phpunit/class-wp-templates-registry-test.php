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
		$template_name = 'test-plugin//test-template';
		$template      = self::$registry->register( $template_name );

		$this->assertEquals( $template->slug, 'test-template' );

		self::$registry->unregister( $template_name );
	}

	public function test_register_template_invalid_name() {
		// Try to register a template with invalid name (non-string).
		$template_name = array( 'invalid-template-name' );

		$this->setExpectedIncorrectUsage( 'WP_Templates_Registry::register' );
		$result = self::$registry->register( $template_name );

		$this->assertWPError( $result );
		$this->assertEquals( 'template_name_no_string', $result->get_error_code() );
		$this->assertEquals( 'Template names must be a string.', $result->get_error_message() );
	}

	public function test_register_template_invalid_name_uppercase() {
		// Try to register a template with uppercase characters in the name.
		$template_name = 'test-plugin//Invalid-Template-Name';

		$this->setExpectedIncorrectUsage( 'WP_Templates_Registry::register' );
		$result = self::$registry->register( $template_name );

		$this->assertWPError( $result );
		$this->assertEquals( 'template_name_no_uppercase', $result->get_error_code() );
		$this->assertEquals( 'Template names must not contain uppercase characters.', $result->get_error_message() );
	}

	public function test_register_template_no_prefix() {
		// Try to register a template without a namespace.
		$this->setExpectedIncorrectUsage( 'WP_Templates_Registry::register' );
		$result = self::$registry->register( 'template-no-plugin', array() );

		$this->assertWPError( $result );
		$this->assertEquals( 'template_no_prefix', $result->get_error_code() );
		$this->assertEquals( 'Template names must contain a namespace prefix. Example: my-plugin//my-custom-template', $result->get_error_message() );
	}

	public function test_register_template_already_exists() {
		// Register the template for the first time.
		$template_name = 'test-plugin//duplicate-template';
		self::$registry->register( $template_name );

		// Try to register the same template again.
		$this->setExpectedIncorrectUsage( 'WP_Templates_Registry::register' );
		$result = self::$registry->register( $template_name );

		$this->assertWPError( $result );
		$this->assertEquals( 'template_already_registered', $result->get_error_code() );
		$this->assertStringContainsString( 'Template "test-plugin//duplicate-template" is already registered.', $result->get_error_message() );

		self::$registry->unregister( $template_name );
	}

	public function test_get_all_registered() {
		$template_name_1 = 'test-plugin//template-1';
		$template_name_2 = 'test-plugin//template-2';
		self::$registry->register( $template_name_1 );
		self::$registry->register( $template_name_2 );

		$all_templates = self::$registry->get_all_registered();

		$this->assertIsArray( $all_templates );
		$this->assertCount( 2, $all_templates );
		$this->assertArrayHasKey( 'test-plugin//template-1', $all_templates );
		$this->assertArrayHasKey( 'test-plugin//template-2', $all_templates );

		self::$registry->unregister( $template_name_1 );
		self::$registry->unregister( $template_name_2 );
	}

	public function test_get_registered() {
		$template_name = 'test-plugin//registered-template';
		$args          = array(
			'content'     => 'Template content',
			'title'       => 'Registered Template',
			'description' => 'Description of registered template',
			'post_types'  => array( 'post', 'page' ),
		);
		self::$registry->register( $template_name, $args );

		$registered_template = self::$registry->get_registered( $template_name );

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

		self::$registry->unregister( $template_name );
	}

	public function test_get_by_slug() {
		$slug          = 'slug-template';
		$template_name = 'test-plugin//' . $slug;
		$args          = array(
			'content' => 'Template content',
			'title'   => 'Slug Template',
		);
		self::$registry->register( $template_name, $args );

		$registered_template = self::$registry->get_by_slug( $slug );

		$this->assertNotNull( $registered_template );
		$this->assertEquals( $slug, $registered_template->slug );

		self::$registry->unregister( $template_name );
	}

	public function test_get_by_query() {
		$template_name_1 = 'test-plugin//query-template-1';
		$template_name_2 = 'test-plugin//query-template-2';
		$args_1          = array(
			'content' => 'Template content 1',
			'title'   => 'Query Template 1',
		);
		$args_2          = array(
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
		$this->assertArrayHasKey( $template_name_1, $results );

		self::$registry->unregister( $template_name_1 );
		self::$registry->unregister( $template_name_2 );
	}

	public function test_is_registered() {
		$template_name = 'test-plugin//is-registered-template';
		$args          = array(
			'content' => 'Template content',
			'title'   => 'Is Registered Template',
		);
		self::$registry->register( $template_name, $args );

		$this->assertTrue( self::$registry->is_registered( $template_name ) );

		self::$registry->unregister( $template_name );
	}

	public function test_unregister() {
		$template_name = 'test-plugin//unregister-template';
		$args          = array(
			'content' => 'Template content',
			'title'   => 'Unregister Template',
		);
		$template      = self::$registry->register( $template_name, $args );

		$unregistered_template = self::$registry->unregister( $template_name );

		$this->assertEquals( $template, $unregistered_template );
		$this->assertFalse( self::$registry->is_registered( $template_name ) );
	}
}
