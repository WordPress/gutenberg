<?php
/**
 * Start: Include for phase 2
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
		$this->rest_base = '/richimage/(?P<media_id>[\d]+)';
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
							'description' => __( 'Rotation angle', 'gutenberg' ),
							'type'        => 'integer',
							'required'    => true,
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
							'description' => __( 'Flip direction', 'gutenberg' ),
							'type'        => 'string',
							'enum'        => array( 'vertical', 'horizontal' ),
							'required'    => true,
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
						'crop_x'      => array(
							'description' => __( 'Crop offset percentage from left', 'gutenberg' ),
							'type'        => 'number',
							'minimum'     => 0,
							'required'    => true,
						),
						'crop_y'      => array(
							'description' => __( 'Crop offset percentage from top', 'gutenberg' ),
							'type'        => 'number',
							'minimum'     => 0,
							'required'    => true,
						),
						'crop_width'  => array(
							'description' => __( 'Crop width percentage', 'gutenberg' ),
							'type'        => 'number',
							'minimum'     => 1,
							'required'    => true,
						),
						'crop_height' => array(
							'description' => __( 'Crop height percentage', 'gutenberg' ),
							'type'        => 'number',
							'minimum'     => 1,
							'required'    => true,
						),
					),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			$this->rest_base . '/apply',
			array(
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'apply_edits' ),
					'permission_callback' => array( $this, 'permission_callback' ),
					'args'                => array(
						array(
							'crop'   => array(
								'type'       => 'object',
								'properties' => array(
									'x' => array(
										'type'     => 'integer',
										'minimum'  => 0,
										'required' => true,
									),
									'y' => array(
										'type'     => 'integer',
										'minimum'  => 0,
										'required' => true,
									),
									'w' => array(
										'type'     => 'integer',
										'minimum'  => 1,
										'required' => true,
									),
									'h' => array(
										'type'     => 'integer',
										'minimum'  => 1,
										'required' => true,
									),
								),
							),
							'rotate' => array(
								'type'       => 'object',
								'properties' => array(
									'angle' => array(
										'type'     => 'integer',
										'required' => true,
									),
								),
							),
							'flip'   => array(
								'type'       => 'object',
								'properties' => array(
									'horizontal' => array(
										'type'     => 'boolean',
										'required' => true,
									),
									'vertical'   => array(
										'type'     => 'boolean',
										'required' => true,
									),
								),
							),
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
		if ( ! current_user_can( 'edit_post', $request['media_id'] ) ) {
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
		$modifier = new Image_Editor_Rotate( $request['angle'] );

		return $this->editor->modify_image( $request['media_id'], array( $modifier ) );
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
		$modifier = new Image_Editor_Flip( $request['direction'] );

		return $this->editor->modify_image( $request['media_id'], array( $modifier ) );
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
		$modifier = new Image_Editor_Crop( $request['crop_x'], $request['crop_y'], $request['crop_width'], $request['crop_height'] );

		return $this->editor->modify_image( $request['media_id'], array( $modifier ) );
	}

	/**
	 * Applies all edits in one go.
	 *
	 * @since 7.x ?
	 * @access public
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return array|WP_Error If successful image JSON for the modified image, otherwise a WP_Error.
	 */
	public function apply_edits( $request ) {
		$modifiers = array();
		if ( $request['rotate'] ) {
			$modifiers[] = new Image_Editor_Rotate( $request['rotate']['angle'] );
		}
		if ( $request['flip'] ) {
			$modifiers[] = new Image_Editor_Flip( $request['flip']['direction'] );
		}
		if ( $request['crop'] ) {
			$modifiers[] = new Image_Editor_Crop( $request['crop']['x'], $request['crop']['y'], $request['crop']['width'], $request['crop']['height'] );
		}
		return $this->editor->modify_image( $request['media_id'], $modifiers );
	}
}
