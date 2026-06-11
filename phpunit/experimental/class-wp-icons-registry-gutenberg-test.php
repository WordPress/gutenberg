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
	 * @param string $icon_name       Namespaced icon name (e.g. "test-collection/my-icon").
	 * @param array  $icon_properties Icon properties (label, content, file_path).
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
			'label'   => 'My Icon',
			'content' => '<svg></svg>',
		);

		$result = $this->register( 'test-collection/my-icon', $settings );
		$this->assertTrue( $result );
		$this->assertTrue( $this->registry->is_registered( 'test-collection/my-icon' ) );
	}

	/**
	 * Provides invalid namespaced icon names.
	 *
	 * @return array[]
	 */
	public function data_invalid_icon_names() {
		return array(
			'non-string name'      => array( 1 ),
			'empty name'           => array( 'test-collection/' ),
			'uppercase characters' => array( 'test-collection/Plus' ),
			'invalid characters'   => array( 'test-collection/_doing_it_wrong' ),
		);
	}

	/**
	 * Should fail to re-register the same icon.
	 *
	 * @expectedIncorrectUsage WP_Icons_Registry_Gutenberg::register
	 */
	public function test_register_icon_twice() {
		$settings = array(
			'label'   => 'Icon',
			'content' => '<svg></svg>',
		);

		$result = $this->register( 'test-collection/duplicate', $settings );
		$this->assertTrue( $result );
		$result2 = $this->register( 'test-collection/duplicate', $settings );
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
			'label'   => 'Icon',
			'content' => '<svg></svg>',
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
	 * Should reject `collection` passed as an icon property, since the collection
	 * is now derived from the namespaced icon name instead.
	 *
	 * @expectedIncorrectUsage WP_Icons_Registry_Gutenberg::register
	 */
	public function test_register_rejects_collection_property() {
		$result = $this->register(
			'test-collection/my-icon',
			array(
				'label'      => 'Icon',
				'content'    => '<svg></svg>',
				'collection' => 'test-collection',
			)
		);
		$this->assertFalse( $result );
	}

	/**
	 * Should fail when the name references a collection that is not registered.
	 *
	 * @expectedIncorrectUsage WP_Icons_Registry_Gutenberg::register
	 */
	public function test_register_rejects_unregistered_collection() {
		$result = $this->register(
			'unregistered-collection/my-icon',
			array(
				'label'   => 'Icon',
				'content' => '<svg></svg>',
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
			'label'   => 'Shared A',
			'content' => '<svg></svg>',
		);
		$settings_b = array(
			'label'   => 'Shared B',
			'content' => '<svg></svg>',
		);

		$this->assertTrue( $this->register( 'test-collection/shared', $settings_a ) );
		$this->assertTrue( $this->register( 'other-collection/shared', $settings_b ) );

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
			'test-collection/my-icon',
			array(
				'label'   => 'Icon',
				'content' => '<svg></svg>',
			)
		);

		$this->assertTrue( $this->registry->is_registered( 'test-collection/my-icon' ) );
		$this->assertTrue( $this->registry->unregister( 'test-collection/my-icon' ) );
		$this->assertFalse( $this->registry->is_registered( 'test-collection/my-icon' ) );
	}

	/**
	 * Should fail to unregister an icon that was never registered.
	 *
	 * @expectedIncorrectUsage WP_Icons_Registry_Gutenberg::unregister
	 */
	public function test_unregister_unknown_icon() {
		$this->assertFalse( $this->registry->unregister( 'test-collection/ghost' ) );
	}
}
