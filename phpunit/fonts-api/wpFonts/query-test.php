<?php
/**
 * WP_Fonts::query() tests.
 *
 * @package    WordPress
 * @subpackage Fonts API
 */

require_once __DIR__ . '/../wp-fonts-testcase.php';

/**
 * @group  fontsapi
 * @covers WP_Fonts::query
 */
class Tests_Fonts_WpFonts_Query extends WP_Fonts_TestCase {
	private $wp_fonts;

	public function set_up() {
		parent::set_up();

		$this->wp_fonts = new WP_Fonts();
	}

	/**
	 * @dataProvider data_invalid_query
	 * @dataProvider data_valid_query
	 *
	 * @param string $query_handle Handle to test.
	 */
	public function test_should_fail_when_handles_not_registered( $query_handle ) {
		$this->assertFalse( $this->wp_fonts->query( $query_handle, 'registered' ) );
	}

	/**
	 * @dataProvider data_invalid_query
	 * @dataProvider data_valid_query
	 *
	 * @param string $query_handle Handle to test.
	 */
	public function test_should_fail_when_handles_not_registered_or_enqueued( $query_handle ) {
		$this->assertFalse( $this->wp_fonts->query( $query_handle, 'queue' ) );
	}

	/**
	 * @dataProvider data_valid_query
	 *
	 * @param string $query_handle Handle to test.
	 */
	public function test_registered_query_should_succeed_when_registered( $query_handle ) {
		$this->setup_registry();

		$actual = $this->wp_fonts->query( $query_handle, 'registered' );
		$this->assertInstanceOf( '_WP_Dependency', $actual, 'Query should return an instance of _WP_Dependency' );
		$this->assertSame( $query_handle, $actual->handle, 'Query object handle should match the given handle to query' );
	}

	/**
	 * @dataProvider data_valid_query
	 *
	 * @param string $query_handle Handle to test.
	 */
	public function test_enqueued_query_should_succeed_when_registered_and_enqueued( $query_handle ) {
		$this->setup_registry();
		$this->wp_fonts->enqueue( $query_handle );

		$this->assertTrue( $this->wp_fonts->query( $query_handle, 'enqueued' ) );
	}

	/**
	 * @dataProvider data_valid_query
	 *
	 * @param string $query_handle Handle to test.
	 */
	public function test_enqueued_query_should_fail_when_not_registered_but_enqueued( $query_handle ) {
		$this->wp_fonts->enqueue( $query_handle );

		$this->assertFalse( $this->wp_fonts->query( $query_handle, 'enqueued' ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_invalid_query() {
		return array(
			'DM Sans' => array( 'DM Sans' ),
			'roboto'  => array( 'roboto' ),
			'my-font' => array( 'my-font' ),
		);
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_valid_query() {
		return array(
			'lato'             => array( 'lato' ),
			'merriweather'     => array( 'merriweather' ),
			'Source Serif Pro' => array( 'source-serif-pro' ),
		);
	}

	public function test_done_query_should_fail_when_no_variations() {
		$this->wp_fonts->register_provider( 'local', WP_Fonts_Provider_Local::class );
		$this->setup_registry();
		$this->wp_fonts->enqueue( 'lato' );

		$this->wp_fonts->do_items( 'lato' );

		$this->assertFalse( $this->wp_fonts->query( 'lato', 'done' ) );
	}

	/**
	 * @dataProvider data_done_query
	 *
	 * @param string $query_handle Handle to test.
	 */
	public function test_done_query_should_succeed_when_registered_and_enqueued( $query_handle ) {
		$this->wp_fonts->register_provider( 'local', WP_Fonts_Provider_Local::class );
		$this->setup_registry();
		$this->wp_fonts->enqueue( $query_handle );

		// Process the fonts while ignoring all the printed output.
		$this->expectOutputRegex( '`.`' );
		$this->wp_fonts->do_items( $query_handle );
		$this->getActualOutput();

		$this->assertTrue( $this->wp_fonts->query( $query_handle, 'done' ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_done_query() {
		return array(
			'merriweather'     => array( 'merriweather' ),
			'Source Serif Pro' => array( 'source-serif-pro' ),
		);
	}

	private function setup_registry() {
		foreach ( $this->get_registered_local_fonts() as $handle => $variations ) {
			$this->setup_register( $handle, $variations, $this->wp_fonts );
		}
	}
}
