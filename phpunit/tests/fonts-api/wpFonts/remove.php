<?php
/**
 * WP_Fonts::remove() tests.
 *
 * @package    WordPress
 * @subpackage Fonts API
 */

require_once __DIR__ . '/../wp-fonts-testcase.php';

/**
 * @group  fontsapi
 * @group  remove_fonts
 * @covers WP_Fonts::remove
 */
class Tests_Fonts_WpFonts_Remove extends WP_Fonts_TestCase {

	public function test_should_not_remove_when_none_registered() {
		$wp_fonts = new WP_Fonts();

		$wp_fonts->remove( array( 'handle-1', 'handle2' ) );

		$this->assertEmpty( $wp_fonts->registered );
	}

	/**
	 * @dataProvider data_remove_when_registered
	 *
	 * @param array $handles  Handles to remove.
	 * @param array $expected Expected handles are running test.
	 */
	public function test_should_remove_when_registered( array $handles, array $expected ) {
		$wp_fonts             = new WP_Fonts();
		$wp_fonts->registered = $this->generate_registered_queue();

		$wp_fonts->remove( $handles );

		$this->assertSameSets( $expected, array_keys( $wp_fonts->registered ), 'Registered queue should match after removing handles' );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_remove_when_registered() {
		$all = array(
			'handle-1',
			'handle-2',
			'handle-3',
			'handle-4',
			'handle-5',
			'handle-6',
			'handle-7',
			'handle-8',
			'handle-9',
			'handle-10',
		);

		return array(
			'remove none'                 => array(
				'handles'  => array(),
				'expected' => $all,
			),
			'remove handle-5'             => array(
				'handles'  => array( 'handle-5' ),
				'expected' => array(
					'handle-1',
					'handle-2',
					'handle-3',
					'handle-4',
					'handle-6',
					'handle-7',
					'handle-8',
					'handle-9',
					'handle-10',
				),
			),
			'remove 2 from start and end' => array(
				'handles'  => array( 'handle-1', 'handle-2', 'handle-9', 'handle-10' ),
				'expected' => array(
					'handle-3',
					'handle-4',
					'handle-5',
					'handle-6',
					'handle-7',
					'handle-8',
				),
			),
			'remove all'                  => array(
				'handles'  => $all,
				'expected' => array(),
			),
			'remove only registered'      => array(
				'handles'  => array( 'handle-1', 'handle-10', 'handle-abc', 'handle-5' ),
				'expected' => array(
					'handle-2',
					'handle-3',
					'handle-4',
					'handle-6',
					'handle-7',
					'handle-8',
					'handle-9',
				),
			),
		);
	}

	private function generate_registered_queue() {
		$queue = array();
		for ( $num = 1; $num <= 10; $num++ ) {
			$handle           = "handle-{$num}";
			$queue[ $handle ] = $num;
		}

		return $queue;
	}
}
