<?php
/**
 * Test case for the Fonts API tests.
 *
 * @package    WordPress
 * @subpackage Fonts API
 */

require_once __DIR__ . '/wp-fonts-tests-dataset.php';

/**
 * Abstracts the common tasks for the API's tests.
 */
abstract class WP_Fonts_TestCase extends WP_UnitTestCase {
	use WP_Fonts_Tests_Datasets;

	/**
	 * Original WP_Fonts instance, before the tests.
	 *
	 * @var WP_Fonts
	 */
	private $old_wp_fonts;

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

	public function set_up() {
		parent::set_up();

		$this->old_wp_fonts  = $GLOBALS['wp_fonts'];
		$GLOBALS['wp_fonts'] = null;
	}

	public function tear_down() {
		$this->property      = array();
		$GLOBALS['wp_fonts'] = $this->old_wp_fonts;

		// Reset the error reporting when modified within a test.
		if ( is_int( $this->error_reporting_level ) ) {
			error_reporting( $this->error_reporting_level );
			$this->error_reporting_level = null;
		}

		parent::tear_down();
	}

	protected function set_up_mock( $method ) {
		$mock = $this->setup_object_mock( $method, WP_Fonts::class );

		// Set the global.
		$GLOBALS['wp_fonts'] = $mock;

		return $mock;
	}

	protected function setup_object_mock( $method, $class ) {
		if ( is_string( $method ) ) {
			$method = array( $method );
		}

		return $this->getMockBuilder( $class )->setMethods( $method )->getMock();
	}

	protected function get_registered_handles() {
		return array_keys( $this->get_registered() );
	}

	protected function get_registered() {
		return wp_fonts()->registered;
	}

	protected function get_variations( $font_family, $wp_fonts = null ) {
		if ( ! ( $wp_fonts instanceof WP_Fonts ) ) {
			$wp_fonts = wp_fonts();
		}

		return $wp_fonts->registered[ $font_family ]->deps;
	}

	protected function get_enqueued_handles() {
		return wp_fonts()->queue;
	}

	protected function get_queued_before_register( $wp_fonts = null ) {
		return $this->get_property_value( 'queued_before_register', WP_Dependencies::class, $wp_fonts );
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

	/**
	 * Sets up multiple font family and variation mocks.
	 *
	 * @param array    $inputs   Array of array( font-family => variations ) to setup.
	 * @param WP_Fonts $wp_fonts Instance of WP_Fonts.
	 * @return stdClass[] Array of registered mocks.
	 */
	protected function setup_registration_mocks( array $inputs, WP_Fonts $wp_fonts ) {
		$mocks = array();

		$build_mock = function ( $font_family, $is_font_family = false ) use ( &$mocks, $wp_fonts ) {
			$mock        = new stdClass();
			$mock->deps  = array();
			$mock->extra = array( 'is_font_family' => $is_font_family );
			if ( $is_font_family ) {
				$mock->extra['font-family'] = $font_family;
			}

			$handle = $is_font_family ? WP_Fonts_Utils::convert_font_family_into_handle( $font_family ) : $font_family;

			// Add to each queue.
			$mocks[ $handle ]                = $mock;
			$wp_fonts->registered[ $handle ] = $mock;

			return $mock;
		};

		foreach ( $inputs as $font_family => $variations ) {
			$font_mock = $build_mock( $font_family, true );

			foreach ( $variations as $variation_handle => $variation ) {
				if ( ! is_string( $variation_handle ) ) {
					$variation_handle = $variation;
				}
				$variation_mock                           = $build_mock( $variation_handle );
				$variation_mock->extra['font-properties'] = $variation;
				$font_mock->deps[]                        = $variation_handle;
			}
		}

		return $mocks;
	}

	/**
	 * Register one or more font-family and its variations to set up a test.
	 *
	 * @param string        $font_family Font family to test.
	 * @param array         $variations  Variations.
	 * @param WP_Fonts|null $wp_fonts    Optional. Instance of the WP_Fonts.
	 */
	protected function setup_register( $font_family, $variations, $wp_fonts = null ) {
		if ( ! ( $wp_fonts instanceof WP_Fonts ) ) {
			$wp_fonts = wp_fonts();
		}

		$font_family_handle = $wp_fonts->add_font_family( $font_family );

		foreach ( $variations as $variation_handle => $variation ) {
			if ( ! is_string( $variation_handle ) ) {
				$variation_handle = '';
			}
			$wp_fonts->add_variation( $font_family_handle, $variation, $variation_handle );
		}
	}

	/**
	 * Sets up the WP_Fonts::$provider property.
	 *
	 * @param WP_Fonts     $wp_fonts     Instance of WP_Fonts.
	 * @param string|array $provider     Provider ID when string. Else provider definition with 'id' and 'class' keys.
	 * @param array        $font_handles Optional. Font handles for this provider.
	 */
	protected function setup_provider_property_mock( WP_Fonts $wp_fonts, $provider, array $font_handles = array() ) {
		if ( is_string( $provider ) ) {
			$provider = $this->get_provider_definitions( $provider );
		}

		$property  = $this->setup_property( WP_Fonts::class, 'providers' );
		$providers = $property->getValue( $wp_fonts );

		if ( ! isset( $providers[ $provider['id'] ] ) ) {
			$providers[ $provider['id'] ] = array(
				'class' => $provider['class'],
				'fonts' => $font_handles,
			);
		} else {
			$providers[ $provider['id'] ] = array_merge( $font_handles, $providers[ $provider['id'] ]['fonts'] );
		}

		$property->setValue( $wp_fonts, $providers );
	}

	/**
	 * Gets the variation handles for the provider from the given fonts.
	 *
	 * @since X.X.X
	 *
	 * @param array  $fonts       Fonts definitions keyed by font family.
	 * @param string $provider_id Provider ID.
	 * @return array|string[] Array of handles on success. Else empty array.
	 */
	protected function get_handles_for_provider( array $fonts, $provider_id ) {
		$handles = array();

		foreach ( $fonts as $variations ) {
			foreach ( $variations as $variation_handle => $variation ) {
				if ( $provider_id !== $variation['provider'] ) {
					continue;
				}
				$handles[] = $variation_handle;
			}
		}

		return $handles;
	}
}
