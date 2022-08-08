<?php
/**
 * Test case for the WP Webfonts API tests.
 *
 * @package    WordPress
 * @subpackage Webfonts
 */

require_once __DIR__ . '/wp-webfonts-tests-dataset.php';

/**
 * Abstracts the common tasks for the API's tests.
 */
abstract class WP_Webfonts_TestCase extends WP_UnitTestCase {
	use WP_Webfonts_Tests_Datasets;

	/**
	 * Original WP_Webfonts instance, before the tests.
	 *
	 * @var WP_Webfonts
	 */
	private $old_wp_webfonts;

	public function set_up() {
		parent::set_up();

		$this->old_wp_webfonts  = $GLOBALS['wp_webfonts'];
		$GLOBALS['wp_webfonts'] = null;
	}

	public function tear_down() {
		$GLOBALS['wp_webfonts'] = $this->old_wp_webfonts;
		parent::tear_down();
	}

	protected function set_up_mock( $method ) {
		if ( is_string( $method ) ) {
			$method = array( $method );
		}
		$mock = $this->getMockBuilder( WP_Webfonts::class )->setMethods( $method )->getMock();

		// Set the global.
		$GLOBALS['wp_webfonts'] = $mock;

		return $mock;
	}

	protected function get_registered_handles() {
		return array_keys( $this->get_registered() );
	}

	protected function get_registered() {
		return wp_webfonts()->registered;
	}

	protected function get_variations( $font_family, $wp_webfonts = null ) {
		if ( ! $wp_webfonts ) {
			$wp_webfonts = wp_webfonts();
		}
		return $wp_webfonts->registered[ $font_family ]->deps;
	}

	protected function get_enqueued_handles() {
		return wp_webfonts()->queue;
	}

	protected function get_queued_before_register() {
		return $this->get_property_value( 'queued_before_register', WP_Dependencies::class );
	}

	protected function get_property_value( $property_name, $class, $wp_webfonts = null ) {
		$property = new ReflectionProperty( $class, $property_name );
		$property->setAccessible( true );

		if ( ! $wp_webfonts ) {
			$wp_webfonts = wp_webfonts();
		}
		return $property->getValue( $wp_webfonts );
	}
}
