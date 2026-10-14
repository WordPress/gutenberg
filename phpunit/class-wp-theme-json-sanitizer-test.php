<?php

/**
 * Test WP_Theme_JSON_Sanitizer_Gutenberg class.
 *
 * @package gutenberg
 *
 * @since 7.2.0
 */
class WP_Theme_JSON_Sanitizer_Gutenberg_Test extends WP_UnitTestCase {

	/**
	 * Structures with exactly one value that sanitization drops or coerces, paired with the diagnostic it should produce.
	 *
	 * Each case keeps everything else valid, so the diagnostic list has a single, order-independent entry.
	 *
	 * @return array[]
	 */
	public function data_dropped_values_are_reported() {
		return array(
			'unknown top-level key'                    => array(
				array(
					'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
					'stylez'  => array(),
				),
				array( 'theme_json_unknown_key', array( 'stylez' ), 'dropped' ),
			),
			'unknown setting key'                      => array(
				array(
					'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
					'settings' => array(
						'color' => array(
							'palette'   => array(),
							'invention' => true,
						),
					),
				),
				array( 'theme_json_unknown_key', array( 'settings', 'color', 'invention' ), 'dropped' ),
			),
			'unknown style key'                        => array(
				array(
					'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
					'styles'  => array(
						'typography' => array(
							'fontSize'  => '1rem',
							'fontSizes' => array(),
						),
					),
				),
				array( 'theme_json_unknown_key', array( 'styles', 'typography', 'fontSizes' ), 'dropped' ),
			),
			'unregistered block in settings'           => array(
				array(
					'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
					'settings' => array(
						'blocks' => array(
							'core/not-a-block' => array( 'color' => array( 'text' => false ) ),
						),
					),
				),
				array( 'theme_json_unregistered_block', array( 'settings', 'blocks', 'core/not-a-block' ), 'dropped' ),
			),
			'unregistered block in styles'             => array(
				array(
					'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
					'styles'  => array(
						'blocks' => array(
							'core/not-a-block' => array( 'color' => array( 'text' => 'red' ) ),
						),
					),
				),
				array( 'theme_json_unregistered_block', array( 'styles', 'blocks', 'core/not-a-block' ), 'dropped' ),
			),
			'unregistered block style variation'       => array(
				array(
					'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
					'styles'  => array(
						'blocks' => array(
							'core/button' => array(
								'variations' => array(
									'not-a-variation' => array( 'color' => array( 'text' => 'red' ) ),
								),
							),
						),
					),
				),
				array( 'theme_json_unregistered_variation', array( 'styles', 'blocks', 'core/button', 'variations', 'not-a-variation' ), 'dropped' ),
			),
			'unregistered shared style variation'      => array(
				array(
					'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
					'styles'  => array(
						'variations' => array(
							'not-a-variation' => array( 'color' => array( 'text' => 'red' ) ),
						),
					),
				),
				array( 'theme_json_unregistered_variation', array( 'styles', 'variations', 'not-a-variation' ), 'dropped' ),
			),
			'scalar where an object is expected'       => array(
				array(
					'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
					'styles'  => array( 'color' => 'red' ),
				),
				array( 'theme_json_invalid_type', array( 'styles', 'color' ), 'dropped' ),
			),
			'non-boolean for a boolean setting'        => array(
				array(
					'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
					'settings' => array( 'lightbox' => array( 'enabled' => 'yes' ) ),
				),
				array( 'theme_json_invalid_type', array( 'settings', 'lightbox', 'enabled' ), 'dropped' ),
			),
			'styles subtree that is not an object'     => array(
				array(
					'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
					'styles'  => 'none',
				),
				array( 'theme_json_invalid_type', array( 'styles' ), 'dropped' ),
			),
			'viewport breakpoint replaced by defaults' => array(
				array(
					'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
					'settings' => array( 'viewport' => array( 'mobile' => '50%' ) ),
				),
				array( 'theme_json_invalid_viewport', array( 'settings', 'viewport' ), 'coerced' ),
			),
		);
	}

	/**
	 * @dataProvider data_dropped_values_are_reported
	 *
	 * @param array $theme_json Structure with one invalid value.
	 * @param array $expected   The expected code, path and severity.
	 */
	public function test_dropped_values_are_reported( $theme_json, $expected ) {
		$diagnostics = WP_Theme_JSON_Gutenberg::get_sanitization_diagnostics( $theme_json );

		$this->assertCount( 1, $diagnostics, 'Exactly one diagnostic is expected: ' . wp_json_encode( $diagnostics ) );
		$this->assertSame( $expected, array( $diagnostics[0]['code'], $diagnostics[0]['path'], $diagnostics[0]['severity'] ) );
		$this->assertSame( array( 'code', 'category', 'severity', 'path', 'message', 'data' ), array_keys( $diagnostics[0] ) );
		$this->assertNotSame( '', $diagnostics[0]['message'] );
	}

	/**
	 * @dataProvider data_dropped_values_are_reported
	 *
	 * @param array $theme_json Structure with one invalid value.
	 */
	public function test_collecting_diagnostics_does_not_change_the_sanitized_output( $theme_json ) {
		$valid_block_names   = array( 'core/button', 'core/paragraph' );
		$valid_element_names = array_keys( WP_Theme_JSON_Gutenberg::ELEMENTS );
		$valid_variations    = array( 'core/button' => array( 'outline' ) );
		$while_collecting    = null;

		$not_collecting = WP_Theme_JSON_Sanitizer_Gutenberg::sanitize( $theme_json, $valid_block_names, $valid_element_names, $valid_variations );
		WP_Theme_JSON_Sanitizer_Gutenberg::collect(
			static function () use ( &$while_collecting, $theme_json, $valid_block_names, $valid_element_names, $valid_variations ) {
				$while_collecting = WP_Theme_JSON_Sanitizer_Gutenberg::sanitize( $theme_json, $valid_block_names, $valid_element_names, $valid_variations );
			}
		);

		$this->assertSame( $not_collecting, $while_collecting );
	}

	public function test_nothing_is_collected_outside_collect() {
		$outside = WP_Theme_JSON_Sanitizer_Gutenberg::sanitize( array( 'invention' => true ), array(), array(), array() );
		$inside  = WP_Theme_JSON_Sanitizer_Gutenberg::collect( static function () {} );

		$this->assertSame( array(), $outside );
		$this->assertSame( array(), $inside, 'A drop before collect() must not leak into a later collection.' );
	}

	public function test_collect_restores_state_after_an_exception() {
		try {
			WP_Theme_JSON_Sanitizer_Gutenberg::collect(
				static function () {
					WP_Theme_JSON_Sanitizer_Gutenberg::add_diagnostic( 'theme_json_unknown_key', array( 'boom' ) );
					throw new RuntimeException( 'boom' );
				}
			);
		} catch ( RuntimeException $e ) {
			// Expected.
		}

		$this->assertSame( array(), WP_Theme_JSON_Sanitizer_Gutenberg::collect( static function () {} ) );
	}

	public function test_missing_version_is_reported_and_nothing_else() {
		$diagnostics = WP_Theme_JSON_Gutenberg::get_sanitization_diagnostics(
			array(
				'styles' => array( 'invention' => array() ),
			)
		);

		$this->assertCount( 1, $diagnostics );
		$this->assertSame( 'theme_json_missing_version', $diagnostics[0]['code'] );
		$this->assertSame( array(), $diagnostics[0]['path'] );
	}

	public function test_registered_values_produce_no_diagnostics() {
		$diagnostics = WP_Theme_JSON_Gutenberg::get_sanitization_diagnostics(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'lightbox' => array( 'enabled' => true ),
					'viewport' => array(
						'mobile' => '480px',
						'tablet' => '782px',
					),
					'blocks'   => array(
						'core/paragraph' => array( 'color' => array( 'text' => false ) ),
					),
				),
				'styles'   => array(
					'color'      => array( 'text' => 'var:preset|color|primary' ),
					'elements'   => array( 'link' => array( ':hover' => array( 'color' => array( 'text' => 'red' ) ) ) ),
					'blocks'     => array(
						'core/button' => array(
							'variations' => array(
								'outline' => array( 'color' => array( 'text' => 'red' ) ),
							),
						),
					),
					'variations' => array(
						'outline' => array( 'color' => array( 'background' => 'blue' ) ),
					),
				),
			)
		);

		$this->assertSame( array(), $diagnostics );
	}

	public function test_core_theme_json_produces_no_diagnostics() {
		$theme_json = json_decode( file_get_contents( dirname( __DIR__ ) . '/lib/theme.json' ), true );

		$this->assertIsArray( $theme_json, 'lib/theme.json must be valid JSON.' );
		$this->assertSame( array(), WP_Theme_JSON_Gutenberg::get_sanitization_diagnostics( $theme_json ) );
	}

	/**
	 * The test theme fixtures. Some reference blocks and block style variations that only
	 * specific tests register, so those two diagnostics are expected here.
	 *
	 * @return array[]
	 */
	public function data_fixture_theme_json_files() {
		$cases = array();
		foreach ( glob( __DIR__ . '/data/themedir1/block-theme*/theme.json' ) as $file ) {
			$cases[ basename( dirname( $file ) ) ] = array( $file );
		}

		return $cases;
	}

	/**
	 * @dataProvider data_fixture_theme_json_files
	 *
	 * @param string $file Path to a fixture theme.json file.
	 */
	public function test_fixture_theme_json_files_only_report_unregistered_names( $file ) {
		$theme_json = json_decode( file_get_contents( $file ), true );

		$this->assertIsArray( $theme_json, 'Fixture must be valid JSON.' );

		$codes = array_column( WP_Theme_JSON_Gutenberg::get_sanitization_diagnostics( $theme_json ), 'code' );

		$this->assertSame( array(), array_diff( $codes, array( 'theme_json_unregistered_block', 'theme_json_unregistered_variation' ) ) );
	}
}
