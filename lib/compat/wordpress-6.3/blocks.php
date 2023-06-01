<?php
/**
 * Temporary compatibility shims for block APIs present in Gutenberg.
 *
 * @package gutenberg
 */

/**
 * Ensure the selectors, set via block.json metadata, are included within the
 * block type's settings.
 *
 * Note: This should be removed when the minimum required WP version is >= 6.3.
 *
 * @see https://github.com/WordPress/gutenberg/pull/46496
 *
 * @param array $settings Current block type settings.
 * @param array $metadata Block metadata as read in via block.json.
 *
 * @return array Filtered block type settings.
 */
function gutenberg_add_selectors_property_to_block_type_settings( $settings, $metadata ) {
	if ( ! isset( $settings['selectors'] ) && isset( $metadata['selectors'] ) ) {
		$settings['selectors'] = $metadata['selectors'];
	}

	return $settings;
}
add_filter( 'block_type_metadata_settings', 'gutenberg_add_selectors_property_to_block_type_settings', 10, 2 );

/**
 * Adds custom fields support to the wp_block post type so a partial and unsynced option can be added.
 *
 * Note: This should be removed when the minimum required WP version is >= 6.3.
 *
 * @see https://github.com/WordPress/gutenberg/pull/51144
 *
 * @param array $args Register post type args.
 * @param string $post_type The post type string.
 *
 * @return array Register post type args.
 */
function gutenberg_add_custom_fields_to_wp_block( $args, $post_type ) {

    if ( 'wp_block' === $post_type ) {
        array_push( $args['supports'], 'custom-fields' );
    }

    return $args;
}
add_filter( 'register_post_type_args', 'gutenberg_add_custom_fields_to_wp_block', 10, 2 );

/**
 * Adds wp_block_sync_status meta field to the wp_block post type so a partial and unsynced option can be added.
 *
 * Note: This should be removed when the minimum required WP version is >= 6.3.
 *
 * @see https://github.com/WordPress/gutenberg/pull/51144
 *
 * @return void
 */
function gutenberg_wp_block_register_post_meta() {
    $post_type = 'wp_block';
    register_post_meta( $post_type, 'wp_block_sync_status', [
        'auth_callback'     => function() {
            return current_user_can( 'edit_posts' );
        },
        'sanitize_callback' => 'sanitize_text_field',
        'show_in_rest'      => true,
        'single'            => true,
        'type'              => 'string',
    ] );
}
add_action( 'init', 'gutenberg_wp_block_register_post_meta' );
