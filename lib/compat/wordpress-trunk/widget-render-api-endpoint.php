<?php

/**
 * Polyfill API class to render widgets via the REST API.
 *
 * @see \WP_REST_Controller
 */
class WP_REST_Widget_Render_Endpoint_Polyfill extends \WP_REST_Controller {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = 'wp/v2';
		$this->rest_base = 'widget-types';
		$this->full_endpoint_instance = new WP_REST_Widget_Types_Controller();
	}

	/**
	 * Registers the widget type routes.
	 *
	 * @see register_rest_route()
	 */
	public function register_routes() {
		$route = '/' . $this->rest_base . '/(?P<id>[a-zA-Z0-9_-]+)/render';

		// Don't override if already registered
		if ( rest_get_server()->get_route_options( $route ) ) {
			return;
		}
		register_rest_route(
			$this->namespace,
			$route,
			array(
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'permission_callback' => array( $this->full_endpoint_instance, 'get_item_permissions_check' ),
					'callback'            => array( $this, 'render' ),
					'args'                => array(
						'id_base'  => array(
							'description' => __( 'The widget type id.' ),
							'type'        => 'string',
							'required'    => true,
						),
						'instance' => array(
							'description' => __( 'Current instance settings of the widget.' ),
							'type'        => 'object',
						),
					),
				),
			)
		);
	}

	/**
	 * Renders a single Legacy Widget and wraps it in a JSON-encodable array.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return array An array with rendered Legacy Widget HTML.
	 */
	public function render( $request ) {
		return array(
			'preview' => $this->render_legacy_widget_preview_iframe(
				$request['id_base'],
				isset( $request['instance'] ) ? $request['instance'] : null
			),
		);
	}

	/**
	 * Renders a page containing a preview of the requested Legacy Widget block.
	 *
	 * @param string $id_base The id base of the requested widget.
	 * @param array $instance The widget instance attributes.
	 *
	 * @return string Rendered Legacy Widget block preview.
	 */
	private function render_legacy_widget_preview_iframe( $id_base, $instance ) {
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

function setup_widget_render_api_endpoint() {
	$polyfill = new WP_REST_Widget_Render_Endpoint_Polyfill();
	$polyfill->register_routes();
}

// Priority should be larger than 99 which is the one used for registering the core routes.
add_action( 'rest_api_init', 'setup_widget_render_api_endpoint', 100 );
