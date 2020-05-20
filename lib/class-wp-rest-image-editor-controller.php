<?php
/**
 * REST API: WP_REST_Menus_Controller class
 *
 * @package    WordPress
 * @subpackage REST_API
 */

/**
 * Image editor
 */
include_once __DIR__ . '/image-editor/class-image-editor.php';

/**
 * Controller which provides REST API endpoints for image editing.
 *
 * @since 7.x ?
 *
 * @see WP_REST_Controller
 */
class WP_REST_Image_Editor_Controller extends WP_REST_Controller {

	/**
	 * Constructs the controller.
	 *
	 * @since 7.x ?
	 * @access public
	 */
	public function __construct() {
		$this->namespace = '__experimental';
		$this->rest_base = '/richimage/(?P<mediaID>[\d]+)';
		$this->editor    = new Image_Editor();
	}

	/**
	 * Registers the necessary REST API routes.
	 *
	 * @since 7.x ?
	 * @access public
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			$this->rest_base . '/rotate',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'rotate_image' ),
					'permission_callback' => array( $this, 'permission_callback' ),
					'args'                => array(
						'angle' => array(
							'type'     => 'integer',
							'required' => true,
						),
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/flip',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'flip_image' ),
					'permission_callback' => array( $this, 'permission_callback' ),
					'args'                => array(
						'direction' => array(
							'type'     => 'enum',
							'enum'     => array( 'vertical', 'horizontal' ),
							'required' => true,
						),
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/crop',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'crop_image' ),
					'permission_callback' => array( $this, 'permission_callback' ),
					'args'                => array(
						'cropX'      => array(
							'type'     => 'float',
							'minimum'  => 0,
							'required' => true,
						),
						'cropY'      => array(
							'type'     => 'float',
							'minimum'  => 0,
							'required' => true,
						),
						'cropWidth'  => array(
							'type'     => 'float',
							'minimum'  => 1,
							'required' => true,
						),
						'cropHeight' => array(
							'type'     => 'float',
							'minimum'  => 1,
							'required' => true,
						),
					),
				),
			)
		);
	}

	/**
	 * Checks if the user has permissions to make the request.
	 *
	 * @since 7.x ?
	 * @access public
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function permission_callback( $request ) {
		$params = $request->get_params();

		if ( ! current_user_can( 'edit_post', $params['mediaID'] ) ) {
			return new WP_Error( 'rest_cannot_edit_image', __( 'Sorry, you are not allowed to edit images.', 'gutenberg' ), array( 'status' => rest_authorization_required_code() ) );
		}

		return true;
	}

	/**
	 * Rotates an image.
	 *
	 * @since 7.x ?
	 * @access public
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return array|WP_Error If successful image JSON for the modified image, otherwise a WP_Error.
	 */
	public function rotate_image( $request ) {
		$params = $request->get_params();

		$modifier = new Image_Editor_Rotate( $params['angle'] );

		return $this->editor->modify_image( $params['mediaID'], $modifier );
	}

	/**
	 * Flips/mirrors an image.
	 *
	 * @since 7.x ?
	 * @access public
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return array|WP_Error If successful image JSON for the modified image, otherwise a WP_Error.
	 */
	public function flip_image( $request ) {
		$params = $request->get_params();

		$modifier = new Image_Editor_Flip( $params['direction'] );

		return $this->editor->modify_image( $params['mediaID'], $modifier );
	}

	/**
	 * Crops an image.
	 *
	 * @since 7.x ?
	 * @access public
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return array|WP_Error If successful image JSON for the modified image, otherwise a WP_Error.
	 */
	public function crop_image( $request ) {
		$params = $request->get_params();

		$modifier = new Image_Editor_Crop( $params['cropX'], $params['cropY'], $params['cropWidth'], $params['cropHeight'] );

		return $this->editor->modify_image( $params['mediaID'], $modifier );
	}
}
