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
	 * Invokes the WP_Icons_Registry_Gutenberg::sanitize_inline_svg method on the registry instance.
	 *
	 * @param string $html_containing_svg HTML fragment containing the SVG to sanitize.
	 * @return string The sanitized SVG content.
	 */
	private function sanitize_inline_svg( $html_containing_svg ) {
		$method = new ReflectionMethod( $this->registry, 'sanitize_inline_svg' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		return $method->invoke( $this->registry, $html_containing_svg );
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

	/**
	 * @dataProvider data_sanitize_inline_svg
	 * @covers WP_Icons_Registry_Gutenberg::sanitize_inline_svg
	 *
	 * @param string $input    The icon content to sanitize.
	 * @param string $expected The expected sanitized output.
	 */
	public function test_sanitize_inline_svg( $input, $expected ) {
		$sanitized = $this->sanitize_inline_svg( $input );
		$this->assertSame( $expected, $sanitized );
	}

	/**
	 * Data provider for test_sanitize_inline_svg.
	 *
	 * @return array[] Array of arrays with input and expected sanitized output.
	 */
	public function data_sanitize_inline_svg() {
		/*
		 * WordPress 7.1 preserves the `xmlns:xlink` namespace attribute when
		 * serializing inline SVG through WP_HTML_Processor; WordPress 7.0 strips
		 * it. Branch the expectation so the test passes on both the current and
		 * the previous WordPress version exercised in CI.
		 *
		 * @link https://core.trac.wordpress.org/changeset/62492
		 *
		 * TODO: Remove this conditional once WordPress 7.0 support is dropped.
		 */
		$xlink = is_wp_version_compatible( '7.1' )
			? ' xmlns:xlink="http://www.w3.org/1999/xlink"'
			: '';

		return array(
			// Root selection: exactly one SVG element in the SVG namespace.
			'rejects multiple top-level svg elements'     => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><path d="first"/></svg><svg xmlns="http://www.w3.org/2000/svg"><path d="second"/></svg>',
				'',
			),
			'allows nested svg'                           => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0" /></svg></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0" /></svg></svg>',
			),
			'rejects svg in a foreign namespace'          => array(
				'<math><svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg></math>',
				'',
			),

			// Content surrounding the SVG root is ignored.
			'ignores content preceding the svg'           => array(
				'<p>before</p><svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0" /></svg>',
			),
			'ignores content following the svg'           => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0" /></svg><p>after</p>',
				'<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0" /></svg>',
			),
			'ignores an xml declaration before the svg'   => array(
				'<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0" /></svg>',
			),
			'ignores a comment before the svg'            => array(
				'<!-- Generator: some editor --><svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0" /></svg>',
			),
			'ignores whitespace before the svg'           => array(
				"  \n\t<svg xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M0 0\" /></svg>",
				'<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0" /></svg>',
			),

			// Non-SVG or unparseable input returns an empty string.
			'returns empty for empty string'              => array(
				'',
				'',
			),
			'returns empty for whitespace only'           => array(
				"   \n\t  ",
				'',
			),
			'returns empty for plain text'                => array(
				'plain text without svg',
				'',
			),
			'returns empty for html without an svg'       => array(
				'<div>not svg</div><p>content</p>',
				'',
			),
			'returns empty for incomplete markup'         => array(
				'<svg><path d="M0 0"',
				'',
			),
			'returns empty for unsupported markup'        => array(
				'<svg><foreignObject><table>TEXT NOT SUPPORTED HERE!',
				'',
			),

			// Disallowed or dangerous content is stripped (wp_kses).
			'strips html-like tags inside svg'            => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><p>paragraph content</p><path d="M0 0h24v24H0z" /><div>div content</div></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"></svg>',
			),
			'strips foreignObject but keeps text content' => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><p>paragraph content</p><script>alert(1)</script></foreignObject><path d="M0 0h24v24H0z" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg">paragraph contentalert(1)<path d="M0 0h24v24H0z" /></svg>',
			),
			'strips script tags'                          => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><path d="M0 0h24v24H0z" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg">alert(1)<path d="M0 0h24v24H0z" /></svg>',
			),
			'strips event handler attributes'             => array(
				'<svg xmlns="http://www.w3.org/2000/svg" onclick="alert(1)"><path d="M0 0h24v24H0z" onload="evil()" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" /></svg>',
			),
			'strips javascript protocol in href'          => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><use href="javascript:alert(1)" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><use href="alert(1)" /></svg>',
			),
			'strips data protocol in href'                => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><use href="data:text/html,<script>alert(1)</script>" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><use href="text/html,&lt;script&gt;alert(1)&lt;/script&gt;" /></svg>',
			),
			'strips disallowed tags'                      => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/><iframe src="evil"></iframe><object data="x" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0" /></svg>',
			),

			// Allowed SVG elements and attributes are preserved.
			'preserves the root svg element'              => array(
				'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" width="24" height="24" class="icon" aria-hidden="true"><path d="M0 0" fill="currentColor" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"' . $xlink . ' viewbox="0 0 24 24" preserveaspectratio="xMidYMid meet" width="24" height="24" class="icon" aria-hidden="true"><path d="M0 0" fill="currentColor" /></svg>',
			),
			'preserves xmlns:xlink attribute'             => array(
				'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M0 0h24v24H0z" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"' . $xlink . '><path d="M0 0h24v24H0z" /></svg>',
			),
			'preserves basic shape elements'              => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" /><circle cx="12" cy="12" r="10" /><ellipse cx="12" cy="12" rx="10" ry="8" /><line x1="0" y1="0" x2="24" y2="24" /><polygon points="0,0 24,0 12,24" /><polyline points="0,0 12,12 24,0" /><rect x="2" y="2" width="20" height="20" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" /><circle cx="12" cy="12" r="10" /><ellipse cx="12" cy="12" rx="10" ry="8" /><line x1="0" y1="0" x2="24" y2="24" /><polygon points="0,0 24,0 12,24" /><polyline points="0,0 12,12 24,0" /><rect x="2" y="2" width="20" height="20" /></svg>',
			),
			'preserves grouping and structural elements'  => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><defs><symbol id="icon" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" /></symbol><clipPath id="clip"><circle cx="12" cy="12" r="10" /></clipPath><mask id="m"><rect fill="white" width="24" height="24" /></mask></defs><g><use href="#icon" /><use href="https://example.com/icon.svg#symbol" /><use href="#symbol" /></g></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><defs><symbol id="icon" viewbox="0 0 24 24"><path d="M0 0h24v24H0z" /></symbol><clipPath id="clip"><circle cx="12" cy="12" r="10" /></clipPath><mask id="m"><rect fill="white" width="24" height="24" /></mask></defs><g><use href="#icon" /><use href="https://example.com/icon.svg#symbol" /><use href="#symbol" /></g></svg>',
			),
			'preserves switch element'                    => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><switch><path d="M0 0h24v24H0z" /></switch></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><switch><path d="M0 0h24v24H0z" /></switch></svg>',
			),
			'preserves view element'                      => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><view id="v" viewBox="0 0 24 24" /><path d="M0 0h24v24H0z" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><view id="v" viewbox="0 0 24 24" /><path d="M0 0h24v24H0z" /></svg>',
			),
			'preserves linking element'                   => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><a href="https://example.com"><path d="M0 0h24v24H0z" /></a></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><a href="https://example.com"><path d="M0 0h24v24H0z" /></a></svg>',
			),
			'preserves gradient elements'                 => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><linearGradient id="lin"><stop offset="0%" stop-color="red" /><stop offset="100%" stop-color="blue" /></linearGradient><radialGradient id="rad"><stop offset="0%" stop-color="red" /><stop offset="100%" stop-color="blue" /></radialGradient><rect fill="url(#lin)" width="24" height="24" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><linearGradient id="lin"><stop offset="0%" stop-color="red" /><stop offset="100%" stop-color="blue" /></linearGradient><radialGradient id="rad"><stop offset="0%" stop-color="red" /><stop offset="100%" stop-color="blue" /></radialGradient><rect fill="url(#lin)" width="24" height="24" /></svg>',
			),
			'preserves pattern element'                   => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><pattern id="pat" width="4" height="4"><rect width="4" height="4" fill="currentColor" /></pattern><rect fill="url(#pat)" width="24" height="24" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><pattern id="pat" width="4" height="4"><rect width="4" height="4" fill="currentColor" /></pattern><rect fill="url(#pat)" width="24" height="24" /></svg>',
			),
			'preserves filter elements'                   => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><filter id="blur"><feGaussianBlur in="SourceGraphic" stdDeviation="1" /></filter><rect filter="url(#blur)" width="24" height="24" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><filter id="blur"><feGaussianBlur in="SourceGraphic" stddeviation="1" /></filter><rect filter="url(#blur)" width="24" height="24" /></svg>',
			),
			'preserves text elements'                     => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><path id="p" d="M0,20 Q12,0 24,20" /><text x="12" y="16" text-anchor="middle">A<tspan font-weight="bold">B</tspan></text><text><textPath href="#p">path</textPath></text></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><path id="p" d="M0,20 Q12,0 24,20" /><text x="12" y="16" text-anchor="middle">A<tspan font-weight="bold">B</tspan></text><text><textPath href="#p">path</textPath></text></svg>',
			),
			'preserves descriptive elements'              => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><title>Icon title</title><desc>Description</desc><metadata></metadata><path d="M0 0h24v24H0z" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><title>Icon title</title><desc>Description</desc><metadata></metadata><path d="M0 0h24v24H0z" /></svg>',
			),
			'preserves image element'                     => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><image href="https://example.com/icon.png" width="24" height="24" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><image href="https://example.com/icon.png" width="24" height="24" /></svg>',
			),
			'preserves marker element'                    => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><marker id="arrow" refX="10" refY="5"><path d="M0,0 L10,5 L0,10" /></marker><path d="M0,12 L24,12" marker-start="url(#arrow)" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><marker id="arrow" refx="10" refy="5"><path d="M0,0 L10,5 L0,10" /></marker><path d="M0,12 L24,12" marker-start="url(#arrow)" /></svg>',
			),
			'preserves animation elements'                => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><animate attributeName="opacity" from="1" to="0.5" dur="1s" /><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="2s" /><path d="M0,0 L10,10"><animateMotion path="M0,0 L24,24" dur="1s" /></path><path d="M0 0"><set attributeName="opacity" to="0.5" begin="1s" /></path></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><animate attributename="opacity" from="1" to="0.5" dur="1s" /><animateTransform attributename="transform" type="rotate" from="0 12 12" to="360 12 12" dur="2s" /><path d="M0,0 L10,10"><animateMotion path="M0,0 L24,24" dur="1s" /></path><path d="M0 0"><set attributename="opacity" to="0.5" begin="1s" /></path></svg>',
			),
		);
	}
}
