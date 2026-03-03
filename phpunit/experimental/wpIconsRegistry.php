<?php
/**
 * Tests for WP_Icons_Registry.
 *
 * @package WordPress
 * @subpackage Icons
 * @since 7.0.0
 *
 * @group icons
 */
class Tests_Icons_WpIconsRegistry extends WP_UnitTestCase {

	/**
	 * Icons registry.
	 *
	 * @var WP_Icons_Registry
	 */
	private $registry = null;

	/**
	 * Set up each test method.
	 */
	public function set_up() {
		parent::set_up();
		$this->registry = WP_Icons_Registry::get_instance();
	}

	/**
	 * Tear down each test method.
	 */
	public function tear_down() {
		$this->registry = null;
		parent::tear_down();
	}

	/**
	 * Helper to call the protected register method.
	 *
	 * @param string $name Icon name.
	 * @param array  $args Icon settings.
	 * @return bool True on success, false on failure.
	 * @throws ReflectionException If the method does not exist.
	 *
	 * @expectedIncorrectUsage WP_Icons_Registry::register
	 */
	private function register_icon( $name, $args = array() ) {
		$method = new ReflectionMethod( $this->registry, 'register' );
		$method->setAccessible( true );
		return $method->invoke( $this->registry, $name, $args );
	}

	/**
	 * Should reject non-string names.
	 *
	 * @expectedIncorrectUsage WP_Icons_Registry::register
	 */
	public function test_invalid_non_string_names() {
		$result = $this->register_icon( 1, array() );
		$this->assertFalse( $result );
	}

	/**
	 * Should reject icons without a namespace.
	 *
	 * @expectedIncorrectUsage WP_Icons_Registry::register
	 */
	public function test_invalid_names_without_namespace() {
		$result = $this->register_icon( 'plus', array() );
		$this->assertFalse( $result );
	}

	/**
	 * Should reject icons with uppercase characters.
	 *
	 * @expectedIncorrectUsage WP_Icons_Registry::register
	 */
	public function test_uppercase_characters() {
		$result = $this->register_icon( 'Core/Plus', array() );
		$this->assertFalse( $result );
	}

	/**
	 * Should accept valid icon names.
	 */
	public function test_register_icon() {
		$name     = 'test-plugin/my-icon';
		$settings = array(
			'label'   => 'My Icon',
			'content' => '<svg></svg>',
		);

		$result = $this->register_icon( $name, $settings );
		$this->assertTrue( $result );
		$this->assertTrue( $this->registry->is_registered( $name ) );
	}

	/**
	 * Should fail to re-register the same icon.
	 */
	public function test_register_icon_twice() {
		$name     = 'test-plugin/duplicate';
		$settings = array(
			'label'   => 'Icon',
			'content' => '<svg></svg>',
		);

		$this->register_icon( $name, $settings );
		$this->assertTrue( $this->registry->is_registered( $name ) );

		$registered_icons = $this->registry->get_registered_icons();
		$this->register_icon( $name, $settings );

		$registered_icons_after = $this->registry->get_registered_icons();
		$this->assertEquals( count( $registered_icons ), count( $registered_icons_after ) );
	}
}
