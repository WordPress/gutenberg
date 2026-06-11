<?php
/**
 * Unit tests covering WP_Icons_Registry_Gutenberg::register functionality.
 *
 * @package Gutenberg
 */
class WP_Test_Icons_Registry_Gutenberg extends WP_UnitTestCase {

	/**
	 * Registry instance for testing.
	 *
	 * @var WP_Icons_Registry_Gutenberg
	 */
	private $registry;

	public function set_up() {
		parent::set_up();
		$this->registry = WP_Icons_Registry_Gutenberg::get_instance();
		$collections    = WP_Icon_Collections_Registry::get_instance();
		if ( ! $collections->is_registered( 'test-collection' ) ) {
			$collections->register( 'test-collection', array( 'label' => 'Test Plugin' ) );
		}
	}

	public function tear_down() {
		$instance_property = new ReflectionProperty( WP_Icons_Registry_Gutenberg::class, 'instance' );

		/*
		 * ReflectionProperty::setAccessible is:
		 * - redundant as of 8.1.0, which made all properties accessible
		 * - deprecated as of 8.5.0
		 * - needed until 8.1.0, as property `instance` is private
		 */
		if ( PHP_VERSION_ID < 80100 ) {
			$instance_property->setAccessible( true );
		}

		$instance_property->setValue( null, null );

		$collections = WP_Icon_Collections_Registry::get_instance();
		if ( $collections->is_registered( 'test-collection' ) ) {
			$collections->unregister( 'test-collection' );
		}

		$this->registry = null;
		parent::tear_down();
	}

	/**
	 * Invokes WP_Icons_Registry_Gutenberg::register despite it being private
	 *
	 * @param string $icon_name       Icon name (without namespace prefix).
	 * @param array  $icon_properties Icon properties (label, content, file_path, collection).
	 * @return bool True if the icon was registered successfully.
	 */
	private function register( $icon_name, $icon_properties ) {
		$method = new ReflectionMethod( $this->registry, 'register' );

		/*
		 * ReflectionMethod::setAccessible is:
		 * - redundant as of 8.1.0, which made all properties accessible
		 * - deprecated as of 8.5.0
		 * - needed until 8.1.0, as property `instance` is private
		 */
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		return $method->invoke( $this->registry, $icon_name, $icon_properties );
	}

	/**
	 * Should accept valid icon names.
	 */
	public function test_register_icon() {
		$settings = array(
			'label'      => 'My Icon',
			'content'    => '<svg></svg>',
			'collection' => 'test-collection',
		);

		$result = $this->register( 'my-icon', $settings );
		$this->assertTrue( $result );
		$this->assertTrue( $this->registry->is_registered( 'test-collection/my-icon' ) );
	}

	/**
	 * Provides invalid icon names.
	 *
	 * @return array[]
	 */
	public function data_invalid_icon_names() {
		return array(
			'non-string name'      => array( 1 ),
			'contains slash'       => array( 'test-collection/plus' ),
			'uppercase characters' => array( 'Plus' ),
			'invalid characters'   => array( '_doing_it_wrong' ),
		);
	}

	/**
	 * Should fail to re-register the same icon.
	 *
	 * @expectedIncorrectUsage WP_Icons_Registry_Gutenberg::register
	 */
	public function test_register_icon_twice() {
		$settings = array(
			'label'      => 'Icon',
			'content'    => '<svg></svg>',
			'collection' => 'test-collection',
		);

		$result = $this->register( 'duplicate', $settings );
		$this->assertTrue( $result );
		$result2 = $this->register( 'duplicate', $settings );
		$this->assertFalse( $result2 );
	}

	/**
	 * Should fail to register icon with invalid names.
	 *
	 * @dataProvider data_invalid_icon_names
	 * @expectedIncorrectUsage WP_Icons_Registry_Gutenberg::register
	 *
	 * @param mixed $name Invalid icon name candidate.
	 */
	public function test_register_invalid_name( $name ) {
		$settings = array(
			'label'      => 'Icon',
			'content'    => '<svg></svg>',
			'collection' => 'test-collection',
		);

		$result = $this->register( $name, $settings );
		$this->assertFalse( $result );
	}

	/**
	 * Should default `collection` to "core" when omitted.
	 */
	public function test_register_defaults_collection_to_core() {
		$result = $this->register(
			'defaulted-icon',
			array(
				'label'   => 'Icon',
				'content' => '<svg></svg>',
			)
		);
		$this->assertTrue( $result );
		$this->assertTrue( $this->registry->is_registered( 'core/defaulted-icon' ) );
	}

	/**
	 * Should fail when `collection` is not a string.
	 *
	 * @expectedIncorrectUsage WP_Icons_Registry_Gutenberg::register
	 */
	public function test_register_rejects_non_string_collection() {
		$result = $this->register(
			'my-icon',
			array(
				'label'      => 'Icon',
				'content'    => '<svg></svg>',
				'collection' => 123,
			)
		);
		$this->assertFalse( $result );
	}

	/**
	 * Should fail when `collection` is not a registered collection.
	 *
	 * @expectedIncorrectUsage WP_Icons_Registry_Gutenberg::register
	 */
	public function test_register_rejects_unregistered_collection() {
		$result = $this->register(
			'my-icon',
			array(
				'label'      => 'Icon',
				'content'    => '<svg></svg>',
				'collection' => 'unregistered-collection',
			)
		);
		$this->assertFalse( $result );
	}

	/**
	 * Should allow the same icon name across different collections.
	 */
	public function test_same_name_across_collections_does_not_collide() {
		$collections = WP_Icon_Collections_Registry::get_instance();
		$collections->register( 'other-collection', array( 'label' => 'Other' ) );

		$settings_a = array(
			'label'      => 'Shared A',
			'content'    => '<svg></svg>',
			'collection' => 'test-collection',
		);
		$settings_b = array(
			'label'      => 'Shared B',
			'content'    => '<svg></svg>',
			'collection' => 'other-collection',
		);

		$this->assertTrue( $this->register( 'shared', $settings_a ) );
		$this->assertTrue( $this->register( 'shared', $settings_b ) );

		$this->assertTrue( $this->registry->is_registered( 'test-collection/shared' ) );
		$this->assertTrue( $this->registry->is_registered( 'other-collection/shared' ) );

		$icon_a = $this->registry->get_registered_icon( 'test-collection/shared' );
		$icon_b = $this->registry->get_registered_icon( 'other-collection/shared' );
		$this->assertSame( 'Shared A', $icon_a['label'] );
		$this->assertSame( 'Shared B', $icon_b['label'] );

		$collections->unregister( 'other-collection' );
	}

	/**
	 * Should unregister a previously registered icon.
	 */
	public function test_unregister_icon() {
		$this->register(
			'my-icon',
			array(
				'label'      => 'Icon',
				'content'    => '<svg></svg>',
				'collection' => 'test-collection',
			)
		);

		$this->assertTrue( $this->registry->is_registered( 'test-collection/my-icon' ) );
		$this->assertTrue( $this->registry->unregister( 'my-icon', 'test-collection' ) );
		$this->assertFalse( $this->registry->is_registered( 'test-collection/my-icon' ) );
	}

	/**
	 * Should fail to unregister an icon that was never registered.
	 *
	 * @expectedIncorrectUsage WP_Icons_Registry_Gutenberg::unregister
	 */
	public function test_unregister_unknown_icon() {
		$this->assertFalse( $this->registry->unregister( 'ghost', 'test-collection' ) );
	}
}
