<?php
/**
 * Widget Types API: WP_Widget_Type class.
 *
 * @package gutenberg
 */

if ( ! class_exists( 'WP_Widget_Type' ) ) {

	/**
	 * Internal class representing a widget type.
	 *
	 * Holds the metadata for a widget discovered by the build pipeline. Stored
	 * inside `WP_Widget_Type_Registry` once registered, and consumed by host
	 * code that needs to enumerate or look up widget types.
	 *
	 * The shape is intentionally minimal: identity (`name`) plus the
	 * script-module handles the build pipeline produced for the widget.
	 * Placement and host concerns (which page or sidebar uses the widget)
	 * live with the consumer, not on the type definition.
	 */
	#[AllowDynamicProperties]
	class WP_Widget_Type {

		/**
		 * Allowed values for the `presentation` field. Treated as the
		 * single source of truth across the registry, REST schema, and
		 * any consumer that needs to validate or enumerate the set.
		 */
		const PRESENTATION_VALUES = array( 'framed', 'content-bleed', 'full-bleed' );

		/**
		 * Widget type key. Namespaced identifier, e.g. `core/hello-world`.
		 *
		 * @var string
		 */
		public $name;

		/**
		 * Script-module handle for the widget render module.
		 *
		 * Null when the widget folder did not ship a render entry point at
		 * build time.
		 *
		 * @var string|null
		 */
		public $render_module = null;

		/**
		 * Script-module handle for the widget metadata module.
		 *
		 * Null when the widget folder did not ship a widget entry point at
		 * build time.
		 *
		 * @var string|null
		 */
		public $widget_module = null;

		/**
		 * Authoring intent about how the widget wants to render. Static
		 * and declarative; not a user-editable attribute.
		 *
		 * One of {@see self::PRESENTATION_VALUES} (first entry is the
		 * default). Null when the widget did not declare the field.
		 *
		 * @var string|null
		 */
		public $presentation = null;

		/**
		 * Constructor.
		 *
		 * @param string $name Widget type name including namespace.
		 * @param array  $args Optional. Widget type arguments. Each key is
		 *                     copied onto the corresponding object property.
		 *                     Default empty array.
		 */
		public function __construct( $name, $args = array() ) {
			$this->name = $name;
			$this->set_props( $args );
		}

		/**
		 * Returns whether this widget type ships a renderable script module.
		 *
		 * @return bool
		 */
		public function is_renderable() {
			return ! empty( $this->render_module );
		}

		/**
		 * Hydrates the widget type properties from the args array.
		 *
		 * @param array $args Widget type arguments.
		 */
		public function set_props( $args ) {
			if ( ! is_array( $args ) ) {
				return;
			}

			unset( $args['name'] );

			foreach ( $args as $property_name => $property_value ) {
				$this->$property_name = $property_value;
			}
		}
	}
}
