<?php
/**
 * Registers the Image Editing API endpoints
 *
 * @since 7.x ?
 */

include_once __DIR__ . '/image-editor/class-image-editor.php';

class WP_REST_Image_Editor_Controller extends WP_REST_Controller {

	public function __construct() {
		$this->namespace = '__experimental';
		$this->rest_base = '/richimage/(?P<mediaID>[\d]+)';
		$this->editor    = new Image_Editor();
	}

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

	public function permission_callback( WP_REST_Request $request ) {
		$params = $request->get_params();

		if ( ! current_user_can( 'edit_post', $params['mediaID'] ) ) {
			return new WP_Error( 'rest_cannot_edit_image', __( 'Sorry, you are not allowed to edit images.', 'gutenberg' ), array( 'status' => rest_authorization_required_code() ) );
		}

		return true;
	}

	public function rotate_image( WP_REST_Request $request ) {
		$params = $request->get_params();

		$modifier = new Image_Editor_Rotate( $params['angle'] );

		return $this->editor->modify_image( $params['mediaID'], $modifier );
	}

	public function flip_image( WP_REST_Request $request ) {
		$params = $request->get_params();

		$modifier = new Image_Editor_Flip( $params['direction'] );

		return $this->editor->modify_image( $params['mediaID'], $modifier );
	}

	public function crop_image( WP_REST_Request $request ) {
		$params = $request->get_params();

		$modifier = new Image_Editor_Crop( $params['cropX'], $params['cropY'], $params['cropWidth'], $params['cropHeight'] );

		return $this->editor->modify_image( $params['mediaID'], $modifier );
	}
}
