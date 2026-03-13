<?php
/**
 * Unit tests covering Gutenberg_Icons_Registry_7_1::register functionality.
 *
 * @package Gutenberg
 */
class Gutenberg_Icons_Registry_7_1_Test extends WP_UnitTestCase {

	/**
	 * Registry instance for testing.
	 *
	 * @var Gutenberg_Icons_Registry_7_1
	 */
	private $registry;

	/**
	 * Sets up the test fixture.
	 */
	public function set_up() {
		parent::set_up();
		$this->registry = Gutenberg_Icons_Registry_7_1::get_instance();
	}

	/**
	 * Tear down each test method.
	 */
	public function tear_down() {
		$instance_property = new ReflectionProperty( Gutenberg_Icons_Registry_7_1::class, 'instance' );
		$instance_property->setAccessible( true );
		$instance_property->setValue( null, null );

		$this->registry = null;
		parent::tear_down();
	}

	/**
	 * Invokes the Gutenberg_Icons_Registry_7_1::register method on the registry instance.
	 *
	 * @param string $icon_name       Icon name including namespace.
	 * @param array  $icon_properties Icon properties (label, content, filePath).
	 * @return bool True if the icon was registered successfully.
	 */
	private function register( $icon_name, $icon_properties ) {
		$method = new ReflectionMethod( $this->registry, 'register' );
		$method->setAccessible( true );
		return $method->invoke( $this->registry, $icon_name, $icon_properties );
	}

	/**
	 * Should reject non-string names.
	 *
	 * @expectedIncorrectUsage Gutenberg_Icons_Registry_7_1::register
	 */
	public function test_invalid_non_string_names() {
		$result = $this->register( 1, array() );
		$this->assertFalse( $result );
	}

	/**
	 * Should reject icons without a namespace.
	 *
	 * @expectedIncorrectUsage Gutenberg_Icons_Registry_7_1::register
	 */
	public function test_invalid_names_without_namespace() {
		$result = $this->register( 'plus', array() );
		$this->assertFalse( $result );
	}

	/**
	 * Should reject icons with uppercase characters.
	 *
	 * @expectedIncorrectUsage Gutenberg_Icons_Registry_7_1::register
	 */
	public function test_uppercase_characters() {
		$result = $this->register( 'Core/Plus', array() );
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

		$result = $this->register( $name, $settings );
		$this->assertTrue( $result );
		$this->assertTrue( $this->registry->is_registered( $name ) );
	}

	/**
	 * Should fail to re-register the same icon.
	 *
	 * @expectedIncorrectUsage Gutenberg_Icons_Registry_7_1::register
	 */
	public function test_register_icon_twice() {
		$name     = 'test-plugin/duplicate';
		$settings = array(
			'label'   => 'Icon',
			'content' => '<svg></svg>',
		);

		$result = $this->register( $name, $settings );
		$this->assertTrue( $result );
		$result2 = $this->register( $name, $settings );
		$this->assertFalse( $result2 );
	}
}
