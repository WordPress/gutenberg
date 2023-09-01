<?php
/**
 * Test Case for WP_Font_Family tests.
 *
 * @package WordPress
 * @subpackage Font Library
 */
abstract class WP_Font_Family_UnitTestCase extends WP_UnitTestCase {

	/**
	 * Fonts directory (in uploads).
	 *
	 * @var string
	 */
	protected static $fonts_dir;

	/**
	 * Merriweather test data shared by tests.
	 *
	 * @var array
	 */
	protected $merriweather = array(
		'font_data'     => array(),
		'files_data'    => array(),
		'font_filename' => '',
	);

	public static function set_up_before_class() {
		parent::set_up_before_class();

		$uploads_dir       = wp_upload_dir();
		static::$fonts_dir = $uploads_dir['basedir'] . '/fonts/';
		wp_mkdir_p( static::$fonts_dir );
	}

	public function set_up() {
		parent::set_up();

		$merriweather_tmp_name = wp_tempnam( 'Merriweather-' );
		file_put_contents( $merriweather_tmp_name, 'Mocking file content' );
		$this->merriweather = array(
			'font_data'     => array(
				'name'       => 'Merriweather',
				'slug'       => 'merriweather',
				'fontFamily' => 'Merriweather',
				'fontFace'   => array(
					array(
						'fontFamily'   => 'Merriweather',
						'fontStyle'    => 'normal',
						'fontWeight'   => '400',
						'uploadedFile' => 'files0',
					),
				),
			),
			'files_data'    => array(
				'files0' => array(
					'name'     => 'merriweather.ttf',
					'type'     => 'font/ttf',
					'tmp_name' => $merriweather_tmp_name,
					'error'    => 0,
					'size'     => 123,
				),
			),
			'font_filename' => static::$fonts_dir . 'merriweather_normal_400.ttf',
		);
	}

	public function tear_down() {
		// Clean up the /fonts directory.
		foreach ( $this->files_in_dir( static::$fonts_dir ) as $file ) {
			@unlink( $file );
		}

		parent::tear_down();
	}
}
