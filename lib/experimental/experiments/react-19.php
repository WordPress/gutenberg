<?php
/**
 * Decides whether the React 19 experiment is on for a site that has not made a
 * choice on the Experiments screen.
 *
 * The experiment is on by default, so that React 19 reaches as many sites as
 * possible ahead of the switch in WordPress Core. A site running a theme or
 * plugin that is known to break under React 19 defaults to off instead, and
 * keeps running React 18 until the extension ships a fix.
 *
 * @package gutenberg
 */

/**
 * Themes known to break under React 19, keyed by template slug.
 *
 * Each value is the release that fixed the breakage, or null when the theme has
 * not fixed it yet.
 *
 * @since 24.2.0
 *
 * @return array<string, string|null> Fixed release, keyed by template slug.
 */
function gutenberg_get_react_19_incompatible_themes() {
	return array(
		'divi'     => null,
		'woodmart' => '8.6.1',
	);
}

/**
 * Plugins known to break under React 19, keyed by plugin basename.
 *
 * Each value is the release that fixed the breakage, or null when the plugin
 * has not fixed it yet.
 *
 * @since 24.2.0
 *
 * @return array<string, string|null> Fixed release, keyed by plugin basename.
 */
function gutenberg_get_react_19_incompatible_plugins() {
	return array(
		'adminify/adminify.php'                          => null,
		'advanced-coupons-for-woocommerce-free/advanced-coupons-for-woocommerce-free.php' => null,
		'advanced-coupons-for-woocommerce/advanced-coupons-for-woocommerce.php' => null,
		'astra-sites/astra-sites.php'                    => null,
		'beehive-analytics/beehive-analytics.php'        => null,
		'brave-popup-builder/index.php'                  => null,
		'bravepopup-pro/index.php'                       => null,
		'classified-listing/classified-listing.php'      => null,
		'llms-full-txt-generator/llms-txt-generator.php' => null,
		'mail-mint/mail-mint.php'                        => null,
		'meetinghub/meetinghub.php'                      => null,
		'sb-analytics/sb-analytics-pro.php'              => null,
		'ultimate-blocks/ultimate-blocks.php'            => '3.6.0',
		'wp-letsencrypt-ssl-pro/wp-letsencrypt.php'      => null,
		'wp-post-author/aft-wp-post-author.php'          => null,
		'wp-table-builder/wp-table-builder.php'          => null,
		'xspeed/xspeed.php'                              => null,
	);
}

/**
 * Whether the site runs a theme or plugin that is known to break under React 19.
 *
 * @since 24.2.0
 *
 * @return bool True when an incompatible extension is active.
 */
function gutenberg_has_react_19_incompatible_extension() {
	$themes   = gutenberg_get_react_19_incompatible_themes();
	$template = strtolower( (string) get_template() );

	if ( array_key_exists( $template, $themes ) ) {
		$version = (string) wp_get_theme( get_template() )->get( 'Version' );

		if ( gutenberg_is_react_19_incompatible_version( $version, $themes[ $template ] ) ) {
			return true;
		}
	}

	/*
	 * Scripts are registered on the front end too, where `is_plugin_active()`
	 * and `get_plugin_data()` are not loaded, so read the option and the plugin
	 * header directly.
	 */
	$active_plugins = (array) get_option( 'active_plugins', array() );

	if ( is_multisite() ) {
		$network_plugins = (array) get_site_option( 'active_sitewide_plugins', array() );
		$active_plugins  = array_merge( $active_plugins, array_keys( $network_plugins ) );
	}

	$plugins = gutenberg_get_react_19_incompatible_plugins();

	foreach ( $active_plugins as $plugin_file ) {
		if ( ! is_string( $plugin_file ) || ! array_key_exists( $plugin_file, $plugins ) ) {
			continue;
		}

		$path = WP_PLUGIN_DIR . '/' . $plugin_file;

		// A plugin listed as active but missing from disk never loads, so it
		// cannot break anything.
		if ( ! is_readable( $path ) ) {
			continue;
		}

		$data = get_file_data( $path, array( 'Version' => 'Version' ) );

		if ( gutenberg_is_react_19_incompatible_version( (string) $data['Version'], $plugins[ $plugin_file ] ) ) {
			return true;
		}
	}

	return false;
}

/**
 * Whether an installed version predates the release that fixed its React 19
 * breakage.
 *
 * A version that cannot be read counts as incompatible, so that a missing
 * header cannot opt a site in.
 *
 * @since 24.2.0
 *
 * @param string      $version  The installed version.
 * @param string|null $fixed_in The release that fixed the breakage, or null when there is none.
 *
 * @return bool True when the installed version is incompatible.
 */
function gutenberg_is_react_19_incompatible_version( $version, $fixed_in ) {
	if ( null === $fixed_in || '' === $version ) {
		return true;
	}

	return version_compare( $version, $fixed_in, '<' );
}
