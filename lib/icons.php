<?php
/**
 * Icons API: registration of the core icon collection and its icons from the
 * plugin's own `packages/icons` manifest, replacing the core registration.
 *
 * @package gutenberg
 */

/**
 * Registers the default icon collections for Gutenberg.
 */
function gutenberg_register_default_icon_collections() {
	wp_register_icon_collection(
		'core',
		array(
			'label'       => __( 'WordPress', 'gutenberg' ),
			'description' => __( 'Core icon collection.', 'gutenberg' ),
		)
	);
}

$default_icon_collections_priority = has_action( 'init', '_wp_register_default_icon_collections' );
if ( false !== $default_icon_collections_priority ) {
	remove_action( 'init', '_wp_register_default_icon_collections', $default_icon_collections_priority );
}
add_action( 'init', 'gutenberg_register_default_icon_collections', 0 );

/**
 * Registers the default core icons from the Gutenberg manifest.
 */
function gutenberg_register_default_icons() {
	$icons_directory = gutenberg_dir_path() . 'packages/icons/src';
	$icons_directory = trailingslashit( $icons_directory );
	$manifest_path   = $icons_directory . 'manifest.php';

	if ( ! is_readable( $manifest_path ) ) {
		wp_trigger_error(
			__FUNCTION__,
			__( 'Core icon collection manifest is missing or unreadable.', 'gutenberg' )
		);
		return;
	}

	$collection = include $manifest_path;

	if ( empty( $collection ) ) {
		wp_trigger_error(
			__FUNCTION__,
			__( 'Core icon collection manifest is empty or invalid.', 'gutenberg' )
		);
		return;
	}

	/*
	 * Make sure the Gutenberg registry is the active one before registering, since
	 * only it accepts Gutenberg-only icon properties such as `keywords`; the base
	 * registry rejects them as invalid and would register no icon at all.
	 * `gutenberg_override_wp_icons_registry()` normally takes care of this earlier
	 * on `init`, but the singleton can be reset, for instance between test suites.
	 *
	 * The class is only loaded alongside the REST controllers, so fall back to
	 * registering without keywords when it is unavailable.
	 */
	$supports_keywords = class_exists( 'WP_Icons_Registry_Gutenberg' );
	if ( $supports_keywords ) {
		WP_Icons_Registry_Gutenberg::get_instance();
	}

	foreach ( $collection as $icon_name => $icon_data ) {
		if (
			empty( $icon_data['filePath'] )
			|| ! is_string( $icon_data['filePath'] )
		) {
			_doing_it_wrong(
				__FUNCTION__,
				__( 'Core icon collection manifest must provide a valid "filePath" for each icon.', 'gutenberg' ),
				'7.1.0'
			);
			return;
		}

		$icon_args = array(
			'label'     => $icon_data['label'],
			'file_path' => $icons_directory . $icon_data['filePath'],
		);

		if ( isset( $icon_data['public'] ) ) {
			$icon_args['public'] = $icon_data['public'];
		}

		// Keywords are optional, so only pass them through when present.
		if ( $supports_keywords && ! empty( $icon_data['keywords'] ) && is_array( $icon_data['keywords'] ) ) {
			$icon_args['keywords'] = $icon_data['keywords'];
		}

		wp_register_icon( 'core/' . $icon_name, $icon_args );
	}
}

$default_icons_priority = has_action( 'init', '_wp_register_default_icons' );
if ( false !== $default_icons_priority ) {
	remove_action( 'init', '_wp_register_default_icons', $default_icons_priority );
}
add_action( 'init', 'gutenberg_register_default_icons' );
