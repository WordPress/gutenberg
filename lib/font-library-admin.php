<?php

class Font_Library_Admin {

	public function __construct() {
		add_action( 'admin_menu', array( $this, 'create_admin_menu' ) );
	}

	function create_admin_menu() {

		$font_library_admin_page_slug     = 'font-library-admin';

		$manage_fonts_page_title = _x( 'Fonts', 'UI String', 'gutenberg' );
		$manage_fonts_menu_title = $manage_fonts_page_title;
		add_theme_page( $manage_fonts_page_title, $manage_fonts_menu_title, 'edit_theme_options', $font_library_admin_page_slug, array( 'Fonts_Page', 'manage_fonts_admin_page' ) );
	}

	public static function manage_fonts_admin_page() {
		React_App::bootstrap();

		$theme_name = wp_get_theme()->get( 'Name' );

		$theme_data          = WP_Theme_JSON_Resolver::get_theme_data();
		$theme_settings      = $theme_data->get_settings();
		$theme_font_families = isset( $theme_settings['typography']['fontFamilies']['theme'] ) ? $theme_settings['typography']['fontFamilies']['theme'] : array();

		// This is only run when Gutenberg is not active because WordPress core does not include WP_Webfonts class yet. So we can't use it to load the font asset styles.
		// See the comments here: https://github.com/WordPress/WordPress/blob/88cee0d359f743f94597c586febcc5e09830e780/wp-includes/script-loader.php#L3160-L3186
		// TODO: remove this when WordPress core includes WP_Webfonts class.
		if ( ! class_exists( 'WP_Webfonts' ) ) {
			$font_assets_stylesheet = render_font_styles( $theme_font_families );
			wp_register_style( 'theme-font-families', false );
			wp_add_inline_style( 'theme-font-families', $font_assets_stylesheet );
			wp_enqueue_style( 'theme-font-families' );
		}

		$fonts_json        = wp_json_encode( $theme_font_families );
		$fonts_json_string = preg_replace( '~(?:^|\G)\h{4}~m', "\t", $fonts_json );

		?>
		<p name="theme-fonts-json" id="theme-fonts-json" class="hidden"><?php echo $fonts_json_string; ?></p>
		<div id="create-block-theme-app"></div>
		<input type="hidden" name="nonce" id="nonce" value="<?php echo wp_create_nonce( 'create_block_theme' ); ?>" />
		<?php
	}

	public static function bootstrap() {
		// Load the required WordPress packages.
		// Automatically load imported dependencies and assets version.
		$asset_file = include plugin_dir_path( __DIR__ ) . 'build/index.asset.php';

		// Enqueue CSS dependencies of the scripts included in the build.
		foreach ( $asset_file['dependencies'] as $style ) {
			wp_enqueue_style( $style );
		}

		// Enqueue CSS of the app
		wp_enqueue_style( 'create-block-theme-app', plugins_url( 'build/index.css', __DIR__ ), array(), $asset_file['version'] );

		// Load our app.js.
		array_push( $asset_file['dependencies'], 'wp-i18n' );
		wp_enqueue_script( 'create-block-theme-app', plugins_url( 'build/index.js', __DIR__ ), $asset_file['dependencies'], $asset_file['version'] );

		// Enable localization in the app.
		wp_set_script_translations( 'create-block-theme-app', 'create-block-theme' );

		// Define the global variable that will be used to pass data from PHP to JS.
		$script_content = <<<EOT
		window.createBlockTheme = {
			googleFontsDataUrl: '%s',
			adminUrl: '%s',
			themeUrl: '%s',
		};
		EOT;

		// Pass the data to the JS.
		wp_add_inline_script(
			'create-block-theme-app',
			sprintf(
				$script_content,
				esc_url( plugins_url( 'assets/google-fonts/fallback-fonts-list.json', __DIR__ ) ),
				esc_url( admin_url() ),
				esc_url( get_template_directory_uri() )
			),
			'before'
		);
	}
}


new Font_Library_Admin();
