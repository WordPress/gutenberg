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

	/**
	 * Path to a temporary icon file created during a test, removed in tear_down.
	 *
	 * @var string|null
	 */
	private $temp_file = null;

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

		if ( $this->temp_file && file_exists( $this->temp_file ) ) {
			unlink( $this->temp_file );
		}
		$this->temp_file = null;

		$this->registry = null;
		parent::tear_down();
	}

	/**
	 * Builds a unique temporary icon file path with the given extension.
	 *
	 * @param string|null $contents  File contents, or null to leave the file uncreated.
	 * @param string      $extension File extension, without the leading dot.
	 * @return string Absolute path to the temporary file.
	 */
	private function create_temp_icon_file( $contents, $extension = 'svg' ) {
		$dir             = get_temp_dir();
		$this->temp_file = trailingslashit( $dir ) . wp_unique_filename( $dir, uniqid() . '.' . $extension );
		if ( null !== $contents ) {
			file_put_contents( $this->temp_file, $contents );
		}
		return $this->temp_file;
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
	 * Provides valid namespaced icon names.
	 *
	 * @return array<string, array{0: string}>
	 */
	public function data_valid_icon_names() {
		return array(
			'simple name'            => array( 'test-collection/myicon' ),
			'digit at the start'     => array( 'test-collection/1-icon' ),
			'digit in the name'      => array( 'test-collection/my-1-icon' ),
			'digit at the end'       => array( 'test-collection/icon1' ),
			'underscore in the name' => array( 'test-collection/my_icon' ),
			'hyphen in the name'     => array( 'test-collection/my-icon' ),
		);
	}

	/**
	 * Should accept valid icon names.
	 *
	 * @dataProvider data_valid_icon_names
	 *
	 * @param string $name Valid icon name candidate.
	 */
	public function test_register_icon( $name ) {
		$settings = array(
			'label'   => 'My Icon',
			'content' => '<svg></svg>',
		);

		$result = $this->register( $name, $settings );
		$this->assertTrue( $result );
		$this->assertTrue( $this->registry->is_registered( $name ) );
	}

	/**
	 * Provides invalid namespaced icon names.
	 *
	 * @return array<string, array{0: mixed}>
	 */
	public function data_invalid_icon_names() {
		return array(
			'integer name'            => array( 1 ),
			'null name'               => array( null ),
			'boolean name'            => array( true ),
			'array name'              => array( array() ),
			'empty name'              => array( 'test-collection/' ),
			'uppercase at the start'  => array( 'test-collection/Icon' ),
			'uppercase in the name'   => array( 'test-collection/my-Icon' ),
			'uppercase at the end'    => array( 'test-collection/my-iconX' ),
			'underscore at the start' => array( 'test-collection/_my-icon' ),
			'underscore at the end'   => array( 'test-collection/my-icon_' ),
			'hyphen at the start'     => array( 'test-collection/-my-icon' ),
			'hyphen at the end'       => array( 'test-collection/my-icon-' ),
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
	 * Should reject a non-namespaced icon name.
	 *
	 * @expectedIncorrectUsage WP_Icons_Registry_Gutenberg::register
	 */
	public function test_register_rejects_non_namespaced_name() {
		$result = $this->register(
			'non-namespaced-icon',
			array(
				'label'   => 'Icon',
				'content' => '<svg></svg>',
			)
		);
		$this->assertFalse( $result );
		$this->assertFalse( $this->registry->is_registered( 'core/non-namespaced-icon' ) );
		$this->assertFalse( $this->registry->is_registered( 'non-namespaced-icon' ) );
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

	/**
	 * Should load the icon content from a readable SVG file referenced by `file_path`.
	 */
	public function test_get_content_reads_from_valid_file_path() {
		$path = $this->create_temp_icon_file( '<svg><path d="M0 0"/></svg>' );

		$this->register(
			'test-collection/from-file',
			array(
				'label'     => 'From File',
				'file_path' => $path,
			)
		);

		$icon = $this->registry->get_registered_icon( 'test-collection/from-file' );
		$this->assertStringContainsString( '<path', $icon['content'] );
	}

	/**
	 * Provides icon files that cannot yield valid content.
	 *
	 * @return array<string, array{0: string|null, 1: string}> Data sets of [ $contents, $extension ].
	 */
	public function data_invalid_icon_files() {
		return array(
			'missing file'        => array( null, 'svg' ),
			'non-svg extension'   => array( '<svg><path d="M0 0"/></svg>', 'txt' ),
			'invalid svg content' => array( '', 'svg' ),
		);
	}

	/**
	 * Should return `null` content when the `file_path` is invalid.
	 *
	 * @dataProvider data_invalid_icon_files
	 *
	 * @param string|null $contents  File contents, or null to leave the file uncreated.
	 * @param string      $extension File extension, without the leading dot.
	 */
	public function test_get_content_returns_null_for_invalid_file( $contents, $extension ) {
		$path = $this->create_temp_icon_file( $contents, $extension );

		$this->register(
			'test-collection/invalid-file',
			array(
				'label'     => 'Invalid File',
				'file_path' => $path,
			)
		);

		// Suppress the `wp_trigger_error()` notice. A local error handler is used
		// instead of the `wp_trigger_error_trigger_error` filter, which is WP 7.0+.
		// TODO: Replace with `add_filter( 'wp_trigger_error_trigger_error', '__return_false' )`
		// once the minimum supported WordPress version is 7.0 or later.
		set_error_handler( '__return_true' );
		$icon = $this->registry->get_registered_icon( 'test-collection/invalid-file' );
		restore_error_handler();

		$this->assertNull( $icon['content'] );
	}

	/**
	 * Should register an icon that provides its content through `file_path`.
	 */
	public function test_register_icon_with_file_path() {
		$file_path = $this->create_temp_icon_file( '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"></svg>' );

		$name     = 'test-collection/file-path-icon';
		$settings = array(
			'label'     => 'Icon',
			'file_path' => $file_path,
		);

		$result = $this->register( $name, $settings );
		$this->assertTrue( $result );
		$this->assertTrue( $this->registry->is_registered( $name ) );

		$registered_icons = $this->registry->get_registered_icons( $name );
		$this->assertCount( 1, $registered_icons );
		$this->assertStringContainsString( '<svg', $registered_icons[0]['content'] );
	}

	/**
	 * Should fail to register an icon that provides both `content` and `file_path`.
	 *
	 * @expectedIncorrectUsage WP_Icons_Registry_Gutenberg::register
	 */
	public function test_register_icon_with_content_and_file_path() {
		$name     = 'test-collection/content-and-file-path';
		$settings = array(
			'label'     => 'Icon',
			'content'   => '<svg></svg>',
			'file_path' => '/path/to/icon.svg',
		);

		$result = $this->register( $name, $settings );
		$this->assertFalse( $result );
		$this->assertFalse( $this->registry->is_registered( $name ) );
	}

	/**
	 * Should fail to register an icon that provides neither `content` nor `file_path`.
	 *
	 * @expectedIncorrectUsage WP_Icons_Registry_Gutenberg::register
	 */
	public function test_register_icon_without_content_or_file_path() {
		$name     = 'test-collection/no-content';
		$settings = array(
			'label' => 'Icon',
		);

		$result = $this->register( $name, $settings );
		$this->assertFalse( $result );
		$this->assertFalse( $this->registry->is_registered( $name ) );
	}
}
