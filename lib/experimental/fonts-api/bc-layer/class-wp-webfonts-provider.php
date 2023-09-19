<?php
/**
 * Fonts API: Provider abstract class.
 *
 * Part of the backwards-compatibility (BC) layer for all
 * deprecated publicly exposed methods and functionality.
 *
 * This class/file will NOT be backported to Core. Rather for sites
 * using the previous API, it exists to prevent breakages, giving
 * developers time to upgrade their code.
 *
 * @package    WordPress
 * @subpackage Fonts API
 * @since      X.X.X
 */

if ( class_exists( 'WP_Webfonts_Provider' ) ) {
	return;
}

/**
 * Deprecated abstract class for Fonts API providers.
 *
 * BACKPORT NOTE: Do not backport this file to Core.
 *
 * @since X.X.X
 * @deprecated GB 15.1 Use `WP_Fonts_Provider` instead.
 */
abstract class WP_Webfonts_Provider extends WP_Fonts_Provider {

	/**
	 * Fonts to be processed.
	 *
	 * @since X.X.X
	 * @deprecated GB 15.1 Use WP_Fonts_Provider::$fonts property instead.
	 *
	 * @var array[]
	 */
	protected $webfonts = array();

	/**
	 * Sets this provider's fonts property.
	 *
	 * @since X.X.X
	 * @deprecated GB 15.1 Use WP_Fonts_Provider::set_fonts() instead.
	 *
	 * @param array[] $fonts Fonts to be processed.
	 */
	public function set_webfonts( array $fonts ) {
		_deprecated_function( __METHOD__, 'X.X.X', 'WP_Fonts_Provider::set_fonts()' );

		parent::set_fonts( $fonts );
		$this->webfonts = $this->fonts;
	}

	/**
	 * This method is here to wire WP_Fonts_Provider::do_item() to this
	 * deprecated class to ensure the fonts get set.
	 *
	 * @param array[] $fonts Fonts to be processed.
	 */
	public function set_fonts( array $fonts ) {
		parent::set_fonts( $fonts );
		$this->webfonts = $this->fonts;
	}
}
