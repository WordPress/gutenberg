<?php
/**
 * Synced Styles source for the block bindings API.
 *
 * A generic bindings source that resolves style attribute values from a named
 * block context key. The context key and the attribute name to read are both
 * passed via `args` in the binding definition, making this source reusable for
 * any block family that stores canonical styles on a parent block and shares
 * them via `providesContext`.
 *
 * Example binding in a block's metadata:
 * {
 *   "bindings": {
 *     "__default": {
 *       "source": "core/synced-styles",
 *       "args": { "context": "core/synced-styles/accordion-heading" }
 *     }
 *   }
 * }
 *
 * @package gutenberg
 * @subpackage Block Bindings
 */

/**
 * Gets the value for the Synced Styles source.
 *
 * Reads the requested attribute from the context object stored under the key
 * specified in `$source_args['context']`.
 *
 * @param array    $source_args    {
 *     Source arguments from the binding definition.
 *     @type string $context   The block context key holding the synced style object.
 * }
 * @param WP_Block $block_instance The block instance.
 * @param string   $attribute_name The block attribute being resolved.
 * @return mixed The resolved attribute value, or null if unavailable.
 */
function gutenberg_block_bindings_synced_styles_get_value( array $source_args, $block_instance, $attribute_name ) {
	if ( empty( $source_args['context'] ) ) {
		return null;
	}

	$context_key  = $source_args['context'];
	$synced_styles = $block_instance->context[ $context_key ] ?? null;

	if ( ! is_array( $synced_styles ) || empty( $synced_styles ) ) {
		return null;
	}

	return $synced_styles[ $attribute_name ] ?? null;
}

/**
 * Registers the Synced Styles block bindings source.
 */
function gutenberg_register_block_bindings_synced_styles_source() {
	if ( get_block_bindings_source( 'core/synced-styles' ) ) {
		return;
	}

	register_block_bindings_source(
		'core/synced-styles',
		array(
			'label'              => _x( 'Synced Styles', 'block bindings source', 'gutenberg' ),
			'get_value_callback' => 'gutenberg_block_bindings_synced_styles_get_value',
		)
	);
}

add_action( 'init', 'gutenberg_register_block_bindings_synced_styles_source' );

/**
 * Adds style attributes to the list of bindable attributes for blocks that
 * declare `core/synced-styles` bindings.
 *
 * The standard bindings supported-attributes list only covers content
 * attributes (content, url, alt, etc.). Style-related attributes need to be
 * opted in explicitly per block type.
 *
 * To opt a block type in, add a filter on
 * `block_bindings_supported_attributes_{block_type}` returning the merged list.
 * The list below covers the full set of block-support style attributes.
 */
// NOTE: Keep in sync with STYLE_ATTRIBUTES in
// packages/block-library/src/accordion-heading/edit.js.
$gutenberg_synced_styles_bindable_attributes = array(
	'style',
	'textColor',
	'backgroundColor',
	'gradient',
	'fontSize',
	'fontFamily',
	'borderColor',
);

add_filter(
	'block_bindings_supported_attributes_core/accordion-heading',
	function ( $attributes ) use ( $gutenberg_synced_styles_bindable_attributes ) {
		return array_unique( array_merge( $attributes, $gutenberg_synced_styles_bindable_attributes ) );
	}
);
