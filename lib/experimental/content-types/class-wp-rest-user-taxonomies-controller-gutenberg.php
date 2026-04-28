<?php
/**
 * REST API: WP_REST_User_Taxonomies_Controller_Gutenberg class
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( class_exists( 'WP_REST_User_Taxonomies_Controller_Gutenberg' ) ) {
	return;
}

/**
 * Base User Taxonomies REST API Controller.
 */
class WP_REST_User_Taxonomies_Controller_Gutenberg extends WP_REST_Posts_Controller {

	/**
	 * Returns the JSON schema for a single record. Removes the raw `content`
	 * field from the standard posts schema and replaces it with the typed
	 * `config` object plus the top-level `object_type` array.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$schema = parent::get_item_schema();
		unset( $schema['properties']['content'] );

		$schema['properties']['object_type'] = array(
			'description' => __( 'Post types attached to this taxonomy.', 'gutenberg' ),
			'type'        => 'array',
			'items'       => array(
				'type'    => 'string',
				// Matches the wp_posts.post_type column width.
				'pattern' => '^[a-z0-9_-]{1,20}$',
			),
			'maxItems'    => 50,
			'context'     => array( 'view', 'edit' ),
			'default'     => array(),
		);

		$label_schema = array(
			'type'                 => 'object',
			'additionalProperties' => false,
			'properties'           => array(),
		);
		foreach ( gutenberg_user_taxonomy_allowed_label_keys() as $label_key ) {
			$label_schema['properties'][ $label_key ] = array(
				'type'      => 'string',
				'maxLength' => 200,
			);
		}

		$schema['properties']['config'] = array(
			'description'          => __( 'Typed taxonomy configuration.', 'gutenberg' ),
			'type'                 => 'object',
			'context'              => array( 'view', 'edit' ),
			'additionalProperties' => false,
			'default'              => array(),
			'properties'           => array(
				'public'       => array( 'type' => 'boolean' ),
				'hierarchical' => array( 'type' => 'boolean' ),
				'description'  => array(
					'type'      => 'string',
					'maxLength' => 1000,
				),
				'labels'       => $label_schema,
			),
		);

		$this->schema = $schema;
		return $this->add_additional_fields_schema( $this->schema );
	}

	/**
	 * Adds a typed `config` object and `object_type` array to the response,
	 * and removes the raw `content` field that the parent controller would
	 * otherwise expose.
	 *
	 * @param WP_Post         $item    Stored record.
	 * @param WP_REST_Request $request REST request.
	 * @return WP_REST_Response
	 */
	public function prepare_item_for_response( $item, $request ) {
		$response = parent::prepare_item_for_response( $item, $request );
		$data     = $response->get_data();

		unset( $data['content'] );

		$fields = $this->get_fields_for_response( $request );

		if ( rest_is_field_included( 'config', $fields ) ) {
			$decoded = json_decode( (string) $item->post_content, true );
			$config  = ( JSON_ERROR_NONE === json_last_error() && is_array( $decoded ) )
				? $decoded
				: array();
			// Empty config must serialize as `{}` to match the schema's
			// `type: 'object'`. PHP encodes empty arrays as `[]`, so cast
			// to stdClass for the empty case.
			$data['config'] = empty( $config ) ? new stdClass() : $config;
		}

		if ( rest_is_field_included( 'object_type', $fields ) ) {
			$data['object_type'] = gutenberg_user_taxonomy_read_object_type( $item->ID );
		}

		$response->set_data( $data );
		return $response;
	}

	/**
	 * Translates the typed `config` field on the request into the JSON blob
	 * that lives in `post_content`. Encodes the request body as-is — the
	 * sanitizer hooked to `wp_insert_post_data` does the structural sanitize
	 * in flight before the row is written.
	 *
	 * @param WP_REST_Request $request REST request.
	 * @return stdClass|WP_Error
	 */
	protected function prepare_item_for_database( $request ) {
		$prepared = parent::prepare_item_for_database( $request );
		if ( is_wp_error( $prepared ) ) {
			return $prepared;
		}

		if ( $request->has_param( 'config' ) || empty( $request['id'] ) ) {
			$config                 = is_array( $request['config'] ?? null ) ? $request['config'] : array();
			$prepared->post_content = wp_json_encode(
				$config,
				JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
			);
		}

		return $prepared;
	}

	/**
	 * Adds the `object_type` collection parameter so listings can be filtered
	 * down to taxonomies attached to one or more post types.
	 */
	public function get_collection_params() {
		$params = parent::get_collection_params();

		$params['object_type'] = array(
			'description' => __( 'Limit results to taxonomies attached to one or more of the given post types.', 'gutenberg' ),
			'type'        => 'array',
			'items'       => array(
				'type'    => 'string',
				'pattern' => '^[a-z0-9_-]{1,20}$',
			),
			'default'     => array(),
		);

		return $params;
	}

	/**
	 * Translates the `object_type` collection param into a `meta_query`
	 * IN clause against the underlying post meta key.
	 *
	 * @param array           $prepared_args Optional. Prepared WP_Query args.
	 * @param WP_REST_Request $request       Optional. REST request.
	 * @return array
	 */
	protected function prepare_items_query( $prepared_args = array(), $request = null ) {
		$query_args = parent::prepare_items_query( $prepared_args, $request );

		if ( $request instanceof WP_REST_Request && ! empty( $request['object_type'] ) ) {
			$values = array();
			foreach ( (array) $request['object_type'] as $slug ) {
				if ( is_string( $slug ) && '' !== $slug ) {
					$values[] = sanitize_key( $slug );
				}
			}
			$values = array_values( array_filter( array_unique( $values ) ) );

			if ( ! empty( $values ) ) {
				$meta_query   = isset( $query_args['meta_query'] ) && is_array( $query_args['meta_query'] )
					? $query_args['meta_query']
					: array();
				$meta_query[] = array(
					'key'     => GUTENBERG_USER_TAXONOMY_OBJECT_TYPE_META_KEY,
					'value'   => $values,
					'compare' => 'IN',
				);

				$query_args['meta_query'] = $meta_query;
			}
		}

		return $query_args;
	}
}
