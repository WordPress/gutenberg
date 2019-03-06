<?php

class WP_REST_Sidebars_Controller extends WP_REST_Controller {
	public function __construct() {
		$this->namespace = 'wp/v2';
		$this->rest_base = 'sidebars';
	}

	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>.+)',
			array(
				'args' => array(
					'id' => array(
						'description' => __( 'The sidebar’s ID.', 'gutenberg' ),
						'type'        => 'string',
					),
				),
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_item' ),
					'permission_callback' => array( $this, 'get_item_permissions_check' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( $this, 'update_item' ),
					'permission_callback' => array( $this, 'update_item_permissions_check' ),
					'args'                => $this->get_endpoint_args_for_item_schema( WP_REST_Server::EDITABLE ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	public function get_items_permissions_check( $request ) {
		if ( ! current_user_can( 'edit_theme_options' ) ) {
			return new WP_Error(
				'rest_user_cannot_edit',
				__( 'Sorry, you are not allowed to edit sidebars.', 'gutenberg' )
			);
		}

		return true;
	}

	public function get_items( $request ) {
		global $wp_registered_sidebars;

		$data = array();

		foreach ( array_keys( $wp_registered_sidebars ) as $sidebar_id ) {
			$data[ $sidebar_id ] = $this->get_sidebar_data( $sidebar_id );
		}

		return rest_ensure_response( $data );
	}

	public function get_item_permissions_check( $request ) {
		if ( ! current_user_can( 'edit_theme_options' ) ) {
			return new WP_Error(
				'rest_user_cannot_edit',
				__( 'Sorry, you are not allowed to edit sidebars.', 'gutenberg' )
			);
		}

		return true;
	}

	public function get_item( $request ) {
		$data = $this->get_sidebar_data( $request['id'] );
		return rest_ensure_response( $data );
	}

	public function update_item_permissions_check( $request ) {
		if ( ! current_user_can( 'edit_theme_options' ) ) {
			return new WP_Error(
				'rest_user_cannot_edit',
				__( 'Sorry, you are not allowed to edit sidebars.', 'gutenberg' )
			);
		}

		return true;
	}

	public function update_item( $request ) {
		$result = $this->update_sidebar_blocks( $request['id'], $request );
		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$data = $this->get_sidebar_data( $request['id'] );
		return rest_ensure_response( $data );
	}

	// TODO: Add schema

	protected function get_sidebar_data( $sidebar_id ) {
		global $wp_registered_sidebars;

		if ( ! isset( $wp_registered_sidebars[ $sidebar_id ] ) ) {
			return new WP_Error(
				'rest_sidebar_invalid_id',
				__( 'Invalid sidebar ID.', 'gutenberg' ),
				array( 'status' => 404 )
			);
		}

		// TODO: How should we format blocks in the REST API? Or should we send down
		// HTML so that we're consistent with the /posts and /blocks endpoints?
		$blocks = array();

		$sidebars_items = gutenberg_get_sidebars_items();
		if ( ! empty( $sidebars_items[ $sidebar_id ] ) ) {
			foreach ( $sidebars_items[ $sidebar_id ] as $item ) {
				if ( is_array( $item ) && isset( $item['blockName'] ) ) {
					$blocks[] = array(
						'name'         => $item['blockName'],
						'attributes'   => $item['attrs'],
						'innerBlocks'  => $item['innerBlocks'],
						'innerHTML'    => $item['innerHTML'],
						'innerContent' => $item['innerContent'],
					);
				} else {
					$blocks[] = array(
						'name'         => 'core/legacy-widget',
						'attributes'   => array( 'identifier' => $item ),
						'innerBlocks'  => array(),
						'innerHTML'    => '',
						'innerContent' => array(),
					);
				}
			}
		}

		return array_merge(
			$wp_registered_sidebars[ $sidebar_id ],
			array( 'blocks' => $blocks )
		);
	}

	protected function update_sidebar_blocks( $sidebar_id, $request ) {
		global $wp_registered_sidebars;

		if ( ! isset( $wp_registered_sidebars[ $sidebar_id ] ) ) {
			return new WP_Error(
				'rest_sidebar_invalid_id',
				__( 'Invalid sidebar ID.', 'gutenberg' ),
				array( 'status' => 404 )
			);
		}

		$items = array();

		if ( isset( $request['blocks'] ) && is_array( $request['blocks'] ) ) {
			foreach ( $request['blocks'] as $block ) {
				if (
					! isset( $block['name'] ) || ! is_string( $block['name'] ) ||
					! isset( $block['attributes'] ) || ! is_array( $block['attributes'] ) ||
					! isset( $block['innerBlocks'] ) || ! is_array( $block['innerBlocks'] ) ||
					! isset( $block['innerHTML'] ) || ! is_string( $block['innerHTML'] ) ||
					! isset( $block['innerContent'] ) || ! is_array( $block['innerContent'] )
				) {
					continue;
				}

				if ( 'core/legacy-widget' === $block['name'] ) {
					$items[] = $block['attributes']['identifier'];
				} else {
					$items[] = array(
						'blockName'    => $block['name'],
						'attrs'        => $block['attributes'],
						'innerBlocks'  => $block['innerBlocks'],
						'innerHTML'    => $block['innerHTML'],
						'innerContent' => $block['innerContent'],
					);
				}
			}
		}

		if ( ! empty( $items ) ) {
			gutenberg_set_sidebars_items( array_merge(
				gutenberg_get_sidebars_items(),
				array( $sidebar_id => $items )
			) );
		}
	}
}
