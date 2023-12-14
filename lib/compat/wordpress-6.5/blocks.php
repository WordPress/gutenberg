<?php
/**
 * Block functions specific for the Gutenberg editor plugin.
 *
 * @package gutenberg
 */

/**
 * Registers a new block style for one or more block types.
 *
 * @since 6.5.0
 *
 * @param string|array $block_name       Block type name including namespace or array of namespaced block type names.
 * @param array        $style_properties Array containing the properties of the style name, label,
 *                                 style_handle (name of the stylesheet to be enqueued),
 *                                 inline_style (string containing the CSS to be added),
 *                                 style_data (theme.json-like object to generate CSS from).
 * @return bool True if all block styles were registered with success and false otherwise.
 */
function gutenberg_register_block_style( $block_name, $style_properties ) {
	if ( ! is_string( $block_name ) && ! is_array( $block_name ) ) {
		_doing_it_wrong(
			__METHOD__,
			__( 'Block name must be a string or array.', 'gutenberg' ),
			'5.3.0'
		);

		return false;
	}

	$block_names = is_string( $block_name ) ? array( $block_name ) : $block_name;
	$result      = true;

	foreach ( $block_names as $name ) {
		if ( ! WP_Block_Styles_Registry::get_instance()->register( $name, $style_properties ) ) {
			$result = false;
		}
	}

	return $result;
}
