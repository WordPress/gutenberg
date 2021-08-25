<?php
/**
 * REST API: WP_REST_Widget_Render_Endpoint_Polyfill class
 *
 * @package gutenberg
 */

/**
 * Polyfill API class to render widgets via the REST API.
 *
 * @see \WP_REST_Controller
 */
class WP_REST_Widget_Render_Endpoint_Polyfill extends \WP_REST_Widget_Types_Controller {

	/**
	 * Registers the widget render route if one is missing.
	 *
	 * @see register_rest_route()
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[a-zA-Z0-9_-]+)/encode',
			array(
				'args' => array(
					'id'        => array(
						'description' => __( 'The widget type id.', 'gutenberg' ),
						'type'        => 'string',
						'required'    => true,
					),
					'instance'  => array(
						'description' => __( 'Current instance settings of the widget.', 'gutenberg' ),
						'type'        => 'object',
					),
					'form_data' => array(
						'description'       => __( 'Serialized widget form data to encode into instance settings.', 'gutenberg' ),
						'type'              => 'string',
						'sanitize_callback' => function( $string ) {
							$array = array();
							wp_parse_str( $string, $array );
							return $array;
						},
					),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
					'callback'            => array( $this, 'encode_form_data' ),
				),
			),
			/* override: */ true
		);
	}

	/**
	 * An RPC-style endpoint which can be used by clients to turn user input in
	 * a widget admin form into an encoded instance object.
	 *
	 * Accepts:
	 *
	 * - id:        A widget type ID.
	 * - instance:  A widget's encoded instance object. Optional.
	 * - form_data: Form data from submitting a widget's admin form. Optional.
	 *
	 * Returns:
	 * - instance: The encoded instance object after updating the widget with
	 *             the given form data.
	 * - form:     The widget's admin form after updating the widget with the
	 *             given form data.
	 *
	 * @global WP_Widget_Factory $wp_widget_factory
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function encode_form_data( $request ) {
		global $wp_widget_factory;

		$id            = $request['id'];
		$widget_object = $wp_widget_factory->get_widget_object( $id );

		if ( ! $widget_object ) {
			return new WP_Error(
				'rest_invalid_widget',
				__( 'Cannot preview a widget that does not extend WP_Widget.', 'default' ),
				array( 'status' => 400 )
			);
		}

		// Set the widget's number so that the id attributes in the HTML that we
		// return are predictable.
		if ( isset( $request['number'] ) && is_numeric( $request['number'] ) ) {
			$widget_object->_set( (int) $request['number'] );
		} else {
			$widget_object->_set( -1 );
		}

		if ( isset( $request['instance']['encoded'], $request['instance']['hash'] ) ) {
			$serialized_instance = base64_decode( $request['instance']['encoded'] );
			if ( ! hash_equals( wp_hash( $serialized_instance ), $request['instance']['hash'] ) ) {
				return new WP_Error(
					'rest_invalid_widget',
					__( 'The provided instance is malformed.', 'default' ),
					array( 'status' => 400 )
				);
			}
			$instance = unserialize( $serialized_instance );
		} else {
			$instance = array();
		}

		if (
			isset( $request['form_data'][ "widget-$id" ] ) &&
			is_array( $request['form_data'][ "widget-$id" ] )
		) {
			$new_instance = array_values( $request['form_data'][ "widget-$id" ] )[0];
			$old_instance = $instance;

			$instance = $widget_object->update( $new_instance, $old_instance );

			/** This filter is documented in wp-includes/class-wp-widget.php */
			$instance = apply_filters(
				'widget_update_callback',
				$instance,
				$new_instance,
				$old_instance,
				$widget_object
			);
		}

		$serialized_instance = serialize( $instance );
		$widget_key          = $wp_widget_factory->get_widget_key( $id );

		$response = array(
			'form'     => trim(
				$this->get_widget_form(
					$widget_object,
					$instance
				)
			),
			'preview'  => trim(
				$this->get_widget_preview(
					$widget_key,
					$instance
				)
			),
			'instance' => array(
				'encoded' => base64_encode( $serialized_instance ),
				'hash'    => wp_hash( $serialized_instance ),
			),
		);

		if ( ! empty( $widget_object->widget_options['show_instance_in_rest'] ) ) {
			// Use new stdClass so that JSON result is {} and not [].
			$response['instance']['raw'] = empty( $instance ) ? new stdClass : $instance;
		}

		return rest_ensure_response( $response );
	}

	/**
	 * Returns the output of WP_Widget::form() when called with the provided
	 * instance. Used by encode_form_data() to preview a widget's form.
	 *
	 * @since 5.8.0
	 *
	 * @param WP_Widget $widget_object Widget object to call widget() on.
	 * @param array     $instance Widget instance settings.
	 * @return string
	 */
	public function get_widget_form( $widget_object, $instance ) {
		ob_start();

		/** This filter is documented in wp-includes/class-wp-widget.php */
		$instance = apply_filters(
			'widget_form_callback',
			$instance,
			$widget_object
		);

		if ( false !== $instance ) {
			$return = $widget_object->form( $instance );

			/** This filter is documented in wp-includes/class-wp-widget.php */
			do_action_ref_array(
				'in_widget_form',
				array( &$widget_object, &$return, $instance )
			);
		}

		return ob_get_clean();
	}

	/**
	 * Renders a page containing a preview of the requested Legacy Widget block.
	 *
	 * @param string $widget_class  The widget's PHP class name (see class-wp-widget.php).
	 * @param array  $instance      The widget instance attributes.
	 *
	 * @return string Rendered Legacy Widget block preview.
	 */
	public function get_widget_preview( $widget_class, $instance ) {
		if ( ! defined( 'IFRAME_REQUEST' ) ) {
			define( 'IFRAME_REQUEST', true );
		}

		ob_start();
		?>
		<!doctype html>
		<html <?php language_attributes(); ?>>
		<head>
			<meta charset="<?php bloginfo( 'charset' ); ?>" />
			<meta name="viewport" content="width=device-width, initial-scale=1" />
			<link rel="profile" href="https://gmpg.org/xfn/11" />
			<?php wp_head(); ?>
			<style>
				/* Reset theme styles */
				html, body, #page, #content {
					padding: 0 !important;
					margin: 0 !important;
				}
			</style>
		</head>
		<body <?php body_class(); ?>>
		<div id="page" class="site">
			<div id="content" class="site-content">
				<?php
				$registry = WP_Block_Type_Registry::get_instance();
				$block    = $registry->get_registered( 'core/legacy-widget' );
				$id_base  = ( new $widget_class )->id_base;
				echo $block->render(
					array(
						'idBase'   => $id_base,
						'instance' => $instance,
					)
				);
				?>
			</div><!-- #content -->
		</div><!-- #page -->
		<?php wp_footer(); ?>
		</body>
		</html>
		<?php
		return ob_get_clean();
	}

}
