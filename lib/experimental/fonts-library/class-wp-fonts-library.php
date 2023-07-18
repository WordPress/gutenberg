<?php

class WP_Fonts_Library {

	/**
	 * Returns the absolute path to the fonts directory.
	 *
	 * @return string Path to the fonts directory.
	 */
	static public function get_fonts_directory() {
		return path_join( WP_CONTENT_DIR, 'fonts' );
	}

    /**
     * Returns the relative path to the fonts directory.
     * 
     * @return string Relative path to the fonts directory.
     */
    static public function get_relative_fonts_path() {
        return content_url( '/fonts/' );
    }

	/**
	 * Define WP_FONTS_DIR constant to make it available to the rest of the code.
	 */
	static public function define_fonts_directory() {
		define( 'WP_FONTS_DIR', self::get_fonts_directory() );
	}

}

add_action( 'init', array( 'WP_Fonts_Library', 'define_fonts_directory' ) );
