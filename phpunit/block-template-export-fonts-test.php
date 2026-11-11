<?php
/**
 * Tests for including fonts in the theme export.
 *
 * @package gutenberg
 */

class Gutenberg_Export_Fonts_Test extends WP_UnitTestCase {

	const FONT_DIR_URL = 'https://example.org/wp-content/uploads/fonts';
	const THEME_URL    = 'https://example.org/wp-content/themes/test-theme';

	/**
	 * Temporary root directory for the test files.
	 *
	 * @var string
	 */
	private $root;

	/**
	 * Temporary font directory.
	 *
	 * @var string
	 */
	private $font_dir;

	/**
	 * Temporary theme directory.
	 *
	 * @var string
	 */
	private $theme_dir;

	/**
	 * Original theme directories, set when a fixture theme is used.
	 *
	 * @var array|null
	 */
	private $orig_theme_dir;

	public function set_up() {
		parent::set_up();

		$this->root      = untrailingslashit( get_temp_dir() ) . '/gutenberg-export-fonts-' . wp_generate_password( 6, false );
		$this->font_dir  = $this->root . '/uploads/fonts';
		$this->theme_dir = $this->root . '/themes/test-theme';
		wp_mkdir_p( $this->font_dir );
		wp_mkdir_p( $this->theme_dir );

		add_filter( 'font_dir', array( $this, 'filter_font_dir' ) );
		add_filter( 'stylesheet_directory', array( $this, 'filter_stylesheet_directory' ) );
		add_filter( 'stylesheet_directory_uri', array( $this, 'filter_stylesheet_directory_uri' ) );
	}

	public function tear_down() {
		remove_filter( 'font_dir', array( $this, 'filter_font_dir' ) );
		remove_filter( 'stylesheet_directory', array( $this, 'filter_stylesheet_directory' ) );
		remove_filter( 'stylesheet_directory_uri', array( $this, 'filter_stylesheet_directory_uri' ) );

		if ( null !== $this->orig_theme_dir ) {
			$GLOBALS['wp_theme_directories'] = $this->orig_theme_dir;
			remove_filter( 'theme_root', array( $this, 'filter_theme_root' ) );
			remove_filter( 'stylesheet_root', array( $this, 'filter_theme_root' ) );
			remove_filter( 'template_root', array( $this, 'filter_theme_root' ) );
			wp_clean_themes_cache();
			unset( $GLOBALS['wp_themes'] );
			_gutenberg_clean_theme_json_caches();
		}

		$this->remove_dir( $this->root );

		parent::tear_down();
	}

	public function filter_font_dir() {
		return array(
			'path'    => $this->font_dir,
			'url'     => self::FONT_DIR_URL,
			'subdir'  => '',
			'basedir' => $this->font_dir,
			'baseurl' => self::FONT_DIR_URL,
			'error'   => false,
		);
	}

	public function filter_stylesheet_directory() {
		return $this->theme_dir;
	}

	public function filter_stylesheet_directory_uri() {
		return self::THEME_URL;
	}

	/**
	 * Creates a file, and any missing parent directories.
	 *
	 * @param string $path     Absolute path.
	 * @param string $contents File contents.
	 * @return string Real path of the file.
	 */
	private function create_file( $path, $contents = 'font' ) {
		wp_mkdir_p( dirname( $path ) );
		file_put_contents( $path, $contents );
		return realpath( $path );
	}

	public function test_copies_font_library_file() {
		$path  = $this->create_file( $this->font_dir . '/inter.woff2' );
		$files = array();

		$src = gutenberg_get_font_face_src_for_export( self::FONT_DIR_URL . '/inter.woff2', $files );

		$this->assertSame( 'file:./assets/fonts/inter.woff2', $src );
		$this->assertSame( array( 'assets/fonts/inter.woff2' => $path ), $files );
	}

	public function test_maps_theme_url_to_relative_path() {
		$this->create_file( $this->theme_dir . '/assets/fonts/x.woff2' );
		$files = array();

		$src = gutenberg_get_font_face_src_for_export( self::THEME_URL . '/assets/fonts/x.woff2', $files, array( 'assets/fonts/x.woff2' ) );

		$this->assertSame( 'file:./assets/fonts/x.woff2', $src );
		$this->assertSame( array(), $files );
	}

	public function test_leaves_theme_url_for_file_not_in_export() {
		$this->create_file( $this->theme_dir . '/node_modules/fontsource/x.woff2' );
		$files = array();

		$src = gutenberg_get_font_face_src_for_export( self::THEME_URL . '/node_modules/fontsource/x.woff2', $files );

		$this->assertSame( self::THEME_URL . '/node_modules/fontsource/x.woff2', $src );
		$this->assertSame( array(), $files );
	}

	public function test_leaves_src_with_null_byte() {
		$this->create_file( $this->font_dir . '/inter.woff2' );
		$files = array();

		$src = gutenberg_get_font_face_src_for_export( self::FONT_DIR_URL . '/inter.woff2%00.php', $files );

		$this->assertSame( self::FONT_DIR_URL . '/inter.woff2%00.php', $src );
		$this->assertSame( array(), $files );
	}

	public function test_leaves_disallowed_extension() {
		$this->create_file( $this->font_dir . '/evil.php', '<?php' );
		$files = array();

		$src = gutenberg_get_font_face_src_for_export( self::FONT_DIR_URL . '/evil.php', $files );

		$this->assertSame( self::FONT_DIR_URL . '/evil.php', $src );
		$this->assertSame( array(), $files );
	}

	public function test_rejects_path_traversal() {
		$this->create_file( $this->root . '/secret.woff2' );
		$files = array();

		$plain   = self::FONT_DIR_URL . '/../../secret.woff2';
		$encoded = self::FONT_DIR_URL . '/%2e%2e/%2e%2e/secret.woff2';

		$this->assertSame( $plain, gutenberg_get_font_face_src_for_export( $plain, $files ) );
		$this->assertSame( $encoded, gutenberg_get_font_face_src_for_export( $encoded, $files ) );
		$this->assertSame( array(), $files );
	}

	public function test_strips_query_string() {
		$this->create_file( $this->font_dir . '/inter.woff2' );
		$files = array();

		$src = gutenberg_get_font_face_src_for_export( self::FONT_DIR_URL . '/inter.woff2?ver=1#x', $files );

		$this->assertSame( 'file:./assets/fonts/inter.woff2', $src );
	}

	public function test_matches_font_dir_url_with_different_scheme() {
		$this->create_file( $this->font_dir . '/inter.woff2' );
		$files = array();

		$src = gutenberg_get_font_face_src_for_export( 'http://example.org/wp-content/uploads/fonts/inter.woff2', $files );

		$this->assertSame( 'file:./assets/fonts/inter.woff2', $src );
	}

	public function test_reuses_path_for_same_file() {
		$this->create_file( $this->font_dir . '/inter.woff2' );
		$files = array();

		$first  = gutenberg_get_font_face_src_for_export( self::FONT_DIR_URL . '/inter.woff2', $files );
		$second = gutenberg_get_font_face_src_for_export( self::FONT_DIR_URL . '/inter.woff2', $files );

		$this->assertSame( $first, $second );
		$this->assertCount( 1, $files );
	}

	public function test_suffixes_clashing_filenames() {
		$this->create_file( $this->font_dir . '/inter.woff2' );
		$nested = $this->create_file( $this->font_dir . '/sub/inter.woff2' );
		$files  = array();

		gutenberg_get_font_face_src_for_export( self::FONT_DIR_URL . '/inter.woff2', $files );
		$src = gutenberg_get_font_face_src_for_export( self::FONT_DIR_URL . '/sub/inter.woff2', $files );

		$this->assertSame( 'file:./assets/fonts/inter-1.woff2', $src );
		$this->assertSame( $nested, $files['assets/fonts/inter-1.woff2'] );
	}

	public function test_avoids_reserved_paths() {
		$this->create_file( $this->font_dir . '/inter.woff2' );
		$files = array();

		$src = gutenberg_get_font_face_src_for_export( self::FONT_DIR_URL . '/inter.woff2', $files, array( 'assets/fonts/inter.woff2' ) );

		$this->assertSame( 'file:./assets/fonts/inter-1.woff2', $src );
	}

	/**
	 * Builds a font family with a single font face.
	 *
	 * @param mixed $src Font face src.
	 * @return array Font family.
	 */
	private function font_family( $src ) {
		return array(
			'name'       => 'Inter',
			'slug'       => 'inter',
			'fontFamily' => 'Inter, sans-serif',
			'fontFace'   => array(
				array(
					'fontFamily' => 'Inter',
					'fontWeight' => '400',
					'src'        => $src,
				),
			),
		);
	}

	public function test_rewrites_array_src() {
		$this->create_file( $this->font_dir . '/inter.woff2' );
		$theme_json = array(
			'settings' => array(
				'typography' => array(
					'fontFamilies' => array(
						$this->font_family( array( self::FONT_DIR_URL . '/inter.woff2', 'https://fonts.example.com/inter.woff' ) ),
					),
				),
			),
		);

		$result = gutenberg_prepare_theme_json_fonts_for_export( $theme_json );

		$this->assertSame(
			array( 'file:./assets/fonts/inter.woff2', 'https://fonts.example.com/inter.woff' ),
			$result['theme_json']['settings']['typography']['fontFamilies'][0]['fontFace'][0]['src']
		);
	}

	public function test_rewrites_block_level_font_families() {
		$this->create_file( $this->font_dir . '/inter.woff2' );
		$theme_json = array(
			'settings' => array(
				'blocks' => array(
					'core/heading' => array(
						'typography' => array(
							'fontFamilies' => array( $this->font_family( self::FONT_DIR_URL . '/inter.woff2' ) ),
						),
					),
				),
			),
		);

		$result = gutenberg_prepare_theme_json_fonts_for_export( $theme_json );

		$this->assertSame(
			'file:./assets/fonts/inter.woff2',
			$result['theme_json']['settings']['blocks']['core/heading']['typography']['fontFamilies'][0]['fontFace'][0]['src']
		);
		$this->assertCount( 1, $result['files'] );
	}

	public function test_ignores_unexpected_shapes() {
		$theme_json = array(
			'settings' => array(
				'typography' => array(
					'fontFamilies' => array(
						array( 'slug' => 'no-faces' ),
						array(
							'slug'     => 'no-src',
							'fontFace' => array( array( 'fontWeight' => '400' ) ),
						),
						array(
							'slug'     => 'string-faces',
							'fontFace' => 'not-an-array',
						),
						'not-a-family',
					),
				),
				'blocks'     => array(
					'core/heading' => array(
						'typography' => array( 'fontFamilies' => 'not-a-list' ),
					),
				),
			),
		);

		$result = gutenberg_prepare_theme_json_fonts_for_export( $theme_json );

		$this->assertSame( $theme_json, $result['theme_json'] );
		$this->assertSame( array(), $result['files'] );
	}

	/**
	 * Switches to a fixture theme from `phpunit/data/themedir1`, in place of the temporary theme.
	 *
	 * @param string $stylesheet Theme slug.
	 */
	private function use_fixture_theme( $stylesheet ) {
		remove_filter( 'stylesheet_directory', array( $this, 'filter_stylesheet_directory' ) );
		remove_filter( 'stylesheet_directory_uri', array( $this, 'filter_stylesheet_directory_uri' ) );

		$this->orig_theme_dir = $GLOBALS['wp_theme_directories'];
		// /themes is necessary as theme.php functions assume /themes is the root if there is only one root.
		$GLOBALS['wp_theme_directories'] = array( WP_CONTENT_DIR . '/themes', realpath( __DIR__ . '/data/themedir1' ) );
		add_filter( 'theme_root', array( $this, 'filter_theme_root' ) );
		add_filter( 'stylesheet_root', array( $this, 'filter_theme_root' ) );
		add_filter( 'template_root', array( $this, 'filter_theme_root' ) );
		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );

		switch_theme( $stylesheet );
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		_gutenberg_clean_theme_json_caches();
	}

	public function filter_theme_root() {
		return realpath( __DIR__ . '/data/themedir1' );
	}

	/**
	 * Saves a custom font family to the active theme's user global styles.
	 *
	 * @param array $font_family Font family.
	 */
	private function save_custom_font_family( $font_family ) {
		$post = WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( wp_get_theme(), true );
		wp_update_post(
			array(
				'ID'           => $post['ID'],
				'post_content' => wp_json_encode(
					array(
						'version'                     => 3,
						'isGlobalStylesUserThemeJSON' => true,
						'settings'                    => array(
							'typography' => array(
								'fontFamilies' => array( 'custom' => array( $font_family ) ),
							),
						),
					)
				),
			)
		);
		_gutenberg_clean_theme_json_caches();
	}

	/**
	 * Runs the export and reads the result.
	 *
	 * @return array {
	 *     @type array    $theme_json Decoded theme.json from the archive.
	 *     @type string[] $names      Paths of all files in the archive.
	 *     @type string[] $contents   Contents of files under assets/fonts/, keyed by path.
	 * }
	 */
	private function export() {
		$filename = gutenberg_generate_block_templates_export_file();
		$this->assertIsString( $filename );

		$zip = new ZipArchive();
		$zip->open( $filename );
		$names    = array();
		$contents = array();
		for ( $i = 0; $i < count( $zip ); $i++ ) {
			$name    = $zip->getNameIndex( $i );
			$names[] = $name;
			if ( str_starts_with( $name, 'assets/fonts/' ) ) {
				$contents[ $name ] = $zip->getFromName( $name );
			}
		}
		$theme_json = json_decode( $zip->getFromName( 'theme.json' ), true );
		$zip->close();
		unlink( $filename );

		return array(
			'theme_json' => $theme_json,
			'names'      => $names,
			'contents'   => $contents,
		);
	}

	/**
	 * Finds the src of the first font face of a font family in exported theme.json data.
	 *
	 * @param array  $theme_json Theme.json data.
	 * @param string $slug       Font family slug.
	 * @return mixed The src, or null when the family isn't found.
	 */
	private function get_exported_src( $theme_json, $slug ) {
		foreach ( $theme_json['settings']['typography']['fontFamilies'] ?? array() as $font_family ) {
			if ( $slug === $font_family['slug'] ) {
				return $font_family['fontFace'][0]['src'];
			}
		}
		return null;
	}

	public function test_export_includes_font_library_file() {
		$this->use_fixture_theme( 'block-theme' );
		$this->create_file( $this->font_dir . '/inter.woff2', 'inter-font-bytes' );
		$this->save_custom_font_family( $this->font_family( self::FONT_DIR_URL . '/inter.woff2' ) );

		$export = $this->export();

		$this->assertSame( array( 'assets/fonts/inter.woff2' => 'inter-font-bytes' ), $export['contents'] );
		$this->assertSame( 'file:./assets/fonts/inter.woff2', $this->get_exported_src( $export['theme_json'], 'inter' ) );
	}

	public function test_export_keeps_remote_font_url() {
		$this->use_fixture_theme( 'block-theme' );
		$this->save_custom_font_family( $this->font_family( 'https://fonts.example.com/inter.woff2' ) );

		$export = $this->export();

		$this->assertSame( array(), $export['contents'] );
		$this->assertSame( 'https://fonts.example.com/inter.woff2', $this->get_exported_src( $export['theme_json'], 'inter' ) );
	}

	public function test_export_succeeds_with_missing_font_file() {
		$this->use_fixture_theme( 'block-theme' );
		$this->save_custom_font_family( $this->font_family( self::FONT_DIR_URL . '/missing.woff2' ) );

		$export = $this->export();

		$this->assertSame( self::FONT_DIR_URL . '/missing.woff2', $this->get_exported_src( $export['theme_json'], 'inter' ) );
	}

	public function test_child_theme_export_keeps_parent_font_src() {
		$this->use_fixture_theme( 'block-theme-child' );
		add_filter( 'wp_theme_json_data_theme', array( $this, 'filter_add_parent_font' ) );
		_gutenberg_clean_theme_json_caches();

		$export = $this->export();

		remove_filter( 'wp_theme_json_data_theme', array( $this, 'filter_add_parent_font' ) );
		$this->assertSame( 'file:./assets/fonts/parent.woff2', $this->get_exported_src( $export['theme_json'], 'inter' ) );
		$this->assertNotContains( 'assets/fonts/parent.woff2', $export['names'] );
	}

	public function filter_add_parent_font( $theme_json ) {
		return $theme_json->update_with(
			array(
				'version'  => 3,
				'settings' => array(
					'typography' => array(
						'fontFamilies' => array( $this->font_family( 'file:./assets/fonts/parent.woff2' ) ),
					),
				),
			)
		);
	}

	/**
	 * Removes a directory and its contents.
	 *
	 * @param string $dir Directory path.
	 */
	private function remove_dir( $dir ) {
		if ( ! is_dir( $dir ) ) {
			return;
		}

		$items = new RecursiveIteratorIterator(
			new RecursiveDirectoryIterator( $dir, FilesystemIterator::SKIP_DOTS ),
			RecursiveIteratorIterator::CHILD_FIRST
		);

		foreach ( $items as $item ) {
			$item->isDir() ? rmdir( $item->getPathname() ) : unlink( $item->getPathname() );
		}

		rmdir( $dir );
	}
}
