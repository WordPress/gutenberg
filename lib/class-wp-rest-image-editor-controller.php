<?php
/**
 * Registers the Image Editing API endpoints
 *
 * @since 7.x ?
 */

include_once __DIR__ . '/image-editor/class-image-editor.php';

class WP_REST_Image_Editor_Controller extends WP_REST_Controller {
	private static $instance = null;

	const API_NAMESPACE = '__experimental';
	const API_BASE = '/richimage/(?P<mediaID>[\d]+)';

	public static function init() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new WP_REST_Image_Editor_API();
		}

		return self::$instance;
	}

	private function get_rest_params( $callback, $args ) {
		return [
			[
				'methods' => WP_REST_Server::EDITABLE,
				'callback' => $callback,
				'permission_callback' => [ $this, 'permission_callback' ],
				'args' => $args,
			],
		];
	}

	public function __construct() {
		register_rest_route(
			self::API_NAMESPACE,
			self::API_BASE . '/rotate',
			$this->get_rest_params(
				[ $this, 'rotate_image' ],
				[
					'angle' => [
						'type' => 'integer',
						'required' => true,
					],
				]
			)
		);

		register_rest_route(
			self::API_NAMESPACE,
			self::API_BASE . '/flip',
			$this->get_rest_params(
				[ $this, 'flip_image' ],
				[
					'direction' => [
						'type' => 'enum',
						'enum' => [ 'vertical', 'horizontal' ],
						'required' => true,
					],
				]
			)
		);

		register_rest_route(
			self::API_NAMESPACE,
			self::API_BASE . '/crop',
			$this->get_rest_params(
				[ $this, 'crop_image' ],
				[
					'cropX' => [
						'type' => 'float',
						'minimum' => 0,
						'required' => true,
					],
					'cropY' => [
						'type' => 'float',
						'minimum' => 0,
						'required' => true,
					],
					'cropWidth' => [
						'type' => 'float',
						'minimum' => 1,
						'required' => true,
					],
					'cropHeight' => [
						'type' => 'float',
						'minimum' => 1,
						'required' => true,
					],
				]
			)
		);
	}

	public function permission_callback( WP_REST_Request $request ) {
		$params = $request->get_params();

		return current_user_can( 'edit_post', $params['mediaID'] );
	}

	public function rotate_image( WP_REST_Request $request ) {
		$params = $request->get_params();

		$editor = new Image_Editor();
		$modifier = new Image_Editor_Rotate( $params['angle'] );

		return $editor->modify_image( $params['mediaID'], $modifier );
	}

	public function flip_image( WP_REST_Request $request ) {
		$params = $request->get_params();

		$editor = new Image_Editor();
		$modifier = new Image_Editor_Flip( $params['direction'] );

		return $editor->modify_image( $params['mediaID'], $modifier );
	}

	public function crop_image( WP_REST_Request $request ) {
		$params = $request->get_params();

		$editor = new Image_Editor();
		$modifier = new Image_Editor_Crop( $params['cropX'], $params['cropY'], $params['cropWidth'], $params['cropHeight'] );

		return $editor->modify_image( $params['mediaID'], $modifier );
	}
}
