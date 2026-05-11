<?php
/**
 * Test WP_Block_Templates_Registry class.
 *
 * @covers WP_Block_Templates_Registry
 */
class WP_Block_Templates_Registry_Test extends WP_UnitTestCase {

	/**
	 * @var WP_Block_Templates_Registry
	 */
	protected static $registry;

	public static function set_up_before_class() {
		parent::set_up_before_class();

		self::$registry = WP_Block_Templates_Registry::get_instance();
	}

	public function test_register_template() {
		// Register a valid template.
		$template_name = 'test-plugin//test-template';
		$template      = self::$registry->register( $template_name );

		$this->assertSame( $template->slug, 'test-template' );

		self::$registry->unregister( $template_name );
	}

	public function test_register_template_invalid_name() {
		// Try to register a template with invalid name (non-string).
		$template_name = array( 'invalid-template-name' );

		$this->setExpectedIncorrectUsage( 'WP_Block_Templates_Registry::register' );
		$result = self::$registry->register( $template_name );

		$this->assertWPError( $result );
		$this->assertSame( 'template_name_no_string', $result->get_error_code(), 'Error code mismatch.' );
		$this->assertSame( 'Template names must be strings.', $result->get_error_message(), 'Error message mismatch.' );
	}

	public function test_register_template_invalid_name_uppercase() {
		// Try to register a template with uppercase characters in the name.
		$template_name = 'test-plugin//Invalid-Template-Name';

		$this->setExpectedIncorrectUsage( 'WP_Block_Templates_Registry::register' );
		$result = self::$registry->register( $template_name );

		$this->assertWPError( $result );
		$this->assertSame( 'template_name_no_uppercase', $result->get_error_code(), 'Error code mismatch.' );
		$this->assertSame( 'Template names must not contain uppercase characters.', $result->get_error_message(), 'Error message mismatch.' );
	}

	public function test_register_template_no_prefix() {
		// Try to register a template without a namespace.
		$this->setExpectedIncorrectUsage( 'WP_Block_Templates_Registry::register' );
		$result = self::$registry->register( 'template-no-plugin', array() );

		$this->assertWPError( $result );
		$this->assertSame( 'template_no_prefix', $result->get_error_code(), 'Error code mismatch.' );
		$this->assertSame( 'Template names must contain a namespace prefix. Example: my-plugin//my-custom-template', $result->get_error_message(), 'Error message mismatch.' );
	}

	public function test_register_template_already_exists() {
		// Register the template for the first time.
		$template_name = 'test-plugin//duplicate-template';
		self::$registry->register( $template_name );

		// Try to register the same template again.
		$this->setExpectedIncorrectUsage( 'WP_Block_Templates_Registry::register' );
		$result = self::$registry->register( $template_name );

		$this->assertWPError( $result );
		$this->assertSame( 'template_already_registered', $result->get_error_code(), 'Error code mismatch.' );
		$this->assertStringContainsString( 'Template "test-plugin//duplicate-template" is already registered.', $result->get_error_message(), 'Error message mismatch.' );

		self::$registry->unregister( $template_name );
	}

	public function test_get_all_registered() {
		$template_name_1 = 'test-plugin//template-1';
		$template_name_2 = 'test-plugin//template-2';
		self::$registry->register( $template_name_1 );
		self::$registry->register( $template_name_2 );

		$all_templates = self::$registry->get_all_registered();

		$this->assertIsArray( $all_templates, 'Registered templates should be an array.' );
		$this->assertCount( 2, $all_templates, 'Registered templates should contain 2 items.' );
		$this->assertArrayHasKey( 'test-plugin//template-1', $all_templates, 'Registered templates should contain "test-plugin//template-1".' );
		$this->assertArrayHasKey( 'test-plugin//template-2', $all_templates, 'Registered templates should contain "test-plugin//template-2".' );

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

		$this->assertSame( 'default', $registered_template->theme, 'Template theme mismatch.' );
		$this->assertSame( 'registered-template', $registered_template->slug, 'Template slug mismatch.' );
		$this->assertSame( 'default//registered-template', $registered_template->id, 'Template ID mismatch.' );
		$this->assertSame( 'Registered Template', $registered_template->title, 'Template title mismatch.' );
		$this->assertSame( 'Template content', $registered_template->content, 'Template content mismatch.' );
		$this->assertSame( 'Description of registered template', $registered_template->description, 'Template description mismatch.' );
		$this->assertSame( 'plugin', $registered_template->source, "Template source should be 'plugin'." );
		$this->assertSame( 'plugin', $registered_template->origin, "Template origin should be 'plugin'." );
		$this->assertEquals( array( 'post', 'page' ), $registered_template->post_types, 'Template post types mismatch.' );
		$this->assertSame( 'test-plugin', $registered_template->plugin, 'Plugin name mismatch.' );

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

		$this->assertNotNull( $registered_template, 'Registered template should not be null.' );
		$this->assertSame( $slug, $registered_template->slug, 'Template slug mismatch.' );

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

		$this->assertCount( 1, $results, 'Query result should contain 1 item.' );
		$this->assertArrayHasKey( $template_name_1, $results, 'Query result should contain "test-plugin//query-template-1".' );

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

		$this->assertEquals( $template, $unregistered_template, 'Unregistered template should be the same as the registered one.' );
		$this->assertFalse( self::$registry->is_registered( $template_name ), 'Template should not be registered after unregistering.' );
	}
}
