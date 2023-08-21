<?php
/**
 * Test case for the Fonts tests.
 *
 * @package    WordPress
 * @subpackage Fonts
 */

require_once __DIR__ . '/wp-font-face-tests-dataset.php';
/**
 * Abstracts the common tasks for the Font Face tests.
 */
abstract class WP_Font_Face_TestCase extends WP_UnitTestCase {
	use WP_Font_Face_Tests_Datasets;

	/**
	 * Current error reporting level (before a test changes it).
	 *
	 * @var null|int
	 */
	protected $error_reporting_level = null;

	/**
	 * Reflection data store for non-public property access.
	 *
	 * @var ReflectionProperty[]
	 */
	protected $property = array();

	/**
	 * Indicates the test class uses `switch_theme()` and requires
	 * set_up and tear_down fixtures to set and reset hooks and memory.
	 *
	 * If a test class switches themes, set this property to `true`.
	 *
	 * @var bool
	 */
	protected static $requires_switch_theme_fixtures = false;

	/**
	 * Theme root directory.
	 *
	 * @var string
	 */
	protected static $theme_root;

	/**
	 * Original theme directory.
	 *
	 * @var string
	 */
	protected $orig_theme_dir;

	/**
	 * Administrator ID.
	 *
	 * @var int
	 */
	protected static $administrator_id = 0;

	public static function set_up_before_class() {
		parent::set_up_before_class();

		if ( self::$requires_switch_theme_fixtures ) {
			self::$theme_root = realpath( GUTENBERG_DIR_TESTDATA . '/themedir1' );
		}
	}

	public static function tear_down_after_class() {
		// Reset static flags.
		self::$requires_switch_theme_fixtures = false;

		parent::tear_down_after_class();
	}

	public function set_up() {
		parent::set_up();

		if ( self::$requires_switch_theme_fixtures ) {
			$this->orig_theme_dir = $GLOBALS['wp_theme_directories'];

			// /themes is necessary as theme.php functions assume /themes is the root if there is only one root.
			$GLOBALS['wp_theme_directories'] = array( WP_CONTENT_DIR . '/themes', self::$theme_root );

			// Set up the new root.
			add_filter( 'theme_root', array( $this, 'filter_set_theme_root' ) );
			add_filter( 'stylesheet_root', array( $this, 'filter_set_theme_root' ) );
			add_filter( 'template_root', array( $this, 'filter_set_theme_root' ) );

			// Clear caches.
			wp_clean_themes_cache();
			unset( $GLOBALS['wp_themes'] );
		}
	}

	public function tear_down() {
		$this->property = array();

		// Reset the error reporting when modified within a test.
		if ( is_int( $this->error_reporting_level ) ) {
			error_reporting( $this->error_reporting_level );
			$this->error_reporting_level = null;
		}

		if ( self::$requires_switch_theme_fixtures ) {
			// Clean up the filters to modify the theme root.
			remove_filter( 'theme_root', array( $this, 'filter_set_theme_root' ) );
			remove_filter( 'stylesheet_root', array( $this, 'filter_set_theme_root' ) );
			remove_filter( 'template_root', array( $this, 'filter_set_theme_root' ) );

			WP_Theme_JSON_Resolver::clean_cached_data();
			if ( class_exists( 'WP_Theme_JSON_Resolver_Gutenberg' ) ) {
				WP_Theme_JSON_Resolver_Gutenberg::clean_cached_data();
			}
		}

		parent::tear_down();
	}

	public function clean_up_global_scope() {
		parent::clean_up_global_scope();

		if ( self::$requires_switch_theme_fixtures ) {
			$GLOBALS['wp_theme_directories'] = $this->orig_theme_dir;
			wp_clean_themes_cache();

			if ( function_exists( 'wp_clean_theme_json_cache' ) ) {
				wp_clean_theme_json_cache();
			}

			if ( function_exists( '_gutenberg_clean_theme_json_caches' ) ) {
				_gutenberg_clean_theme_json_caches();
			}

			unset( $GLOBALS['wp_themes'] );
		}
	}

	public function filter_set_theme_root() {
		return self::$theme_root;
	}

	protected function get_reflection_property( $property_name, $class = 'WP_Fonts' ) {
		$property = new ReflectionProperty( $class, $property_name );
		$property->setAccessible( true );

		return $property;
	}

	protected function get_property_value( $property_name, $class, $wp_fonts = null ) {
		$property = $this->get_reflection_property( $property_name, $class );

		if ( ! $wp_fonts ) {
			$wp_fonts = wp_fonts();
		}

		return $property->getValue( $wp_fonts );
	}

	protected function setup_property( $class, $property_name ) {
		$key = $this->get_property_key( $class, $property_name );

		if ( ! isset( $this->property[ $key ] ) ) {
			$this->property[ $key ] = new ReflectionProperty( $class, 'providers' );
			$this->property[ $key ]->setAccessible( true );
		}

		return $this->property[ $key ];
	}

	protected function get_property_key( $class, $property_name ) {
		return $class . '::$' . $property_name;
	}

	/**
	 * Opens the accessibility to access the given private or protected method.
	 *
	 * @param string $method_name Name of the method to open.
	 * @return ReflectionMethod Instance of the method, ie to invoke it in the test.
	 */
	protected function get_reflection_method( $method_name ) {
		$method = new ReflectionMethod( WP_Fonts::class, $method_name );
		$method->setAccessible( true );

		return $method;
	}
}
