<?php
/**
 * Test case for the Fonts API's BC Layer tests.
 *
 * @package    Gutenberg
 * @subpackage Fonts API
 */

require_once dirname( __DIR__ ) . '/base.php';
require_once __DIR__ . '/bc-layer-tests-dataset.php';

/**
 * Abstracts the common tasks for the Font API's BC Layer tests.
 */
abstract class Fonts_BcLayer_TestCase extends WP_Fonts_TestCase {
	use BC_Layer_Tests_Datasets;

	/**
	 * Original WP_Webfonts instance, before the tests.
	 *
	 * @var WP_Fonts
	 */
	private $old_wp_webfonts;

	public function set_up() {
		parent::set_up();

		$this->old_wp_webfonts  = isset( $GLOBALS['wp_webfonts'] ) ? $GLOBALS['wp_webfonts'] : null;
		$GLOBALS['wp_webfonts'] = null;
	}

	public function tear_down() {
		$GLOBALS['wp_webfonts'] = $this->old_wp_webfonts;

		parent::tear_down();
	}

	protected function set_up_webfonts_mock( $method ) {
		$mock = $this->setup_object_mock( $method, WP_Webfonts::class );

		// Set the global.
		$GLOBALS['wp_webfonts'] = $mock;

		return $mock;
	}
}
