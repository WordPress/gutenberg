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
		if ( PHP_VERSION_ID < 80100 ) {
			$instance_property->setAccessible( true );
		}
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
		if ( PHP_VERSION_ID < 80100 ) {
			$instance_property->setAccessible( true );
		}
		return $method->invoke( $this->registry, $icon_name, $icon_properties );
	}

	/**
	 * Should reject invalid icon names.
	 *
	 * @dataProvider data_invalid_icon_names
	 * @expectedIncorrectUsage Gutenberg_Icons_Registry_7_1::register
	 *
	 * @param mixed $icon_name Icon name to test.
	 */
	public function test_invalid_icon_names( $icon_name ) {
		$settings = array(
			'label'   => 'Icon',
			'content' => '<svg></svg>',
		);

		$result = $this->register( $icon_name, $settings );
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
	 * Provides invalid icon names.
	 *
	 * @return array[]
	 */
	public function data_invalid_icon_names() {
		return array(
			'non-string name'      => array( 1 ),
			'no namespace'         => array( 'plus' ),
			'uppercase characters' => array( 'Core/Plus' ),
			'invalid characters'   => array( 'test/_doing_it_wrong' ),
		);
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
