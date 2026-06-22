<?php
/**
 * Widget Type Composer: the `core/instance-attribute` block bindings source.
 *
 * Loaded only when the `gutenberg-widget-type-composer` experiment is on.
 *
 * Provides per-instance attribute values to a composition-based widget
 * definition at render time. A widget definition is a shared composition (block
 * markup) plus a typed attributes schema; an instance stores only values.
 * Because the composition is shared by every instance, the markup cannot carry
 * an instance's own text: a block declares a binding to this source to pull a
 * value out of the rendering instance's attributes.
 *
 * This is the declarative equivalent of reading `$attributes['name']` in a
 * built-in widget's render code. The binding
 * `{"source":"core/instance-attribute","args":{"field":"name"}}` resolves to the
 * value the instance stored under `name`.
 *
 * The value is read from the `widget/instanceAttributes` block context, which
 * the render endpoint seeds per request from the posted `attributes` (see
 * `gutenberg_render_widget_def_markup()` in `widget-definitions.php`). Declaring
 * the context in `uses_context` makes the Bindings API copy it onto each block
 * instance before the callback runs.
 *
 * @package gutenberg
 */

/**
 * Returns the value of an instance attribute for a bound block.
 *
 * Reads the field name from the binding `args` and looks it up in the
 * `widget/instanceAttributes` context seeded for the current render. A missing
 * field or value returns `null`, which makes the Bindings API leave the block's
 * default content in place.
 *
 * @access private
 *
 * @param array    $source_args    Arguments passed to the binding. Expects a
 *                                  `field` entry naming the instance attribute.
 * @param WP_Block $block_instance The block instance being rendered.
 * @return mixed The instance attribute value, or null when unavailable.
 */
function gutenberg_instance_attribute_binding_get_value( array $source_args, $block_instance ) {
	if ( empty( $source_args['field'] ) ) {
		return null;
	}

	$field      = $source_args['field'];
	$attributes = $block_instance->context['widget/instanceAttributes'] ?? array();

	return $attributes[ $field ] ?? null;
}

/**
 * Registers the `core/instance-attribute` source in the block bindings registry.
 *
 * @access private
 */
function gutenberg_register_block_bindings_instance_attribute_source() {
	if ( get_block_bindings_source( 'core/instance-attribute' ) ) {
		// The source is already registered.
		return;
	}

	register_block_bindings_source(
		'core/instance-attribute',
		array(
			'label'              => _x( 'Instance attribute', 'block bindings source', 'gutenberg' ),
			'get_value_callback' => 'gutenberg_instance_attribute_binding_get_value',
			'uses_context'       => array( 'widget/instanceAttributes' ),
		)
	);
}
add_action( 'init', 'gutenberg_register_block_bindings_instance_attribute_source' );
