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
