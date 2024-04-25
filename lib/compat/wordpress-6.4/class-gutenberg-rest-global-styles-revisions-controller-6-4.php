<?php
/**
 * REST API: Gutenberg_REST_Global_Styles_Revisions_Controller class, inspired by WP_REST_Revisions_Controller.
 *
 * @package WordPress
 * @subpackage REST_API
 * @since 6.3.0
 */

/**
 * Core class used to access global styles revisions via the REST API.
 *
 * @since 6.3.0
 *
 * @see WP_REST_Controller
 */
class Gutenberg_REST_Global_Styles_Revisions_Controller_6_4 extends WP_REST_Global_Styles_Revisions_Controller {
	/**
	 * Prepares the revision for the REST response.
	 *
	 * @since 6.3.0
	 *
	 * @param WP_Post         $post    Post revision object.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response object.
	 */
	public function prepare_item_for_response( $post, $request ) {
		$parent               = $this->get_parent( $request['parent'] );
		$global_styles_config = $this->get_decoded_global_styles_json( $post->post_content );

		if ( is_wp_error( $global_styles_config ) ) {
			return $global_styles_config;
		}

		$fields = $this->get_fields_for_response( $request );
		$data   = array();

		if ( ! empty( $global_styles_config['styles'] ) || ! empty( $global_styles_config['settings'] ) ) {
			$global_styles_config = ( new WP_Theme_JSON_Gutenberg( $global_styles_config, 'custom' ) )->get_raw_data();
			if ( rest_is_field_included( 'settings', $fields ) ) {
				$data['settings'] = ! empty( $global_styles_config['settings'] ) ? $global_styles_config['settings'] : new stdClass();
			}
			if ( rest_is_field_included( 'styles', $fields ) ) {
				$data['styles'] = ! empty( $global_styles_config['styles'] ) ? $global_styles_config['styles'] : new stdClass();
			}
		}

		if ( rest_is_field_included( 'author', $fields ) ) {
			$data['author'] = (int) $post->post_author;
		}

		if ( rest_is_field_included( 'date', $fields ) ) {
			$data['date'] = $this->prepare_date_response( $post->post_date_gmt, $post->post_date );
		}

		if ( rest_is_field_included( 'date_gmt', $fields ) ) {
			$data['date_gmt'] = $this->prepare_date_response( $post->post_date_gmt );
		}

		if ( rest_is_field_included( 'id', $fields ) ) {
			$data['id'] = (int) $post->ID;
		}

		if ( rest_is_field_included( 'modified', $fields ) ) {
			$data['modified'] = $this->prepare_date_response( $post->post_modified_gmt, $post->post_modified );
		}

		if ( rest_is_field_included( 'modified_gmt', $fields ) ) {
			$data['modified_gmt'] = $this->prepare_date_response( $post->post_modified_gmt );
		}

		if ( rest_is_field_included( 'parent', $fields ) ) {
			$data['parent'] = (int) $parent->ID;
		}

		$context = ! empty( $request['context'] ) ? $request['context'] : 'view';
		$data    = $this->add_additional_fields_to_object( $data, $request );
		$data    = $this->filter_response_by_context( $data, $context );

		return rest_ensure_response( $data );
	}

	/**
	 * Retrieves the revision's schema, conforming to JSON Schema.
	 *
	 * @since 6.3.0
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		if ( $this->schema ) {
			return $this->add_additional_fields_schema( $this->schema );
		}

		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => "{$this->parent_post_type}-revision",
			'type'       => 'object',
			// Base properties for every Revision.
			'properties' => array(

				/*
				 * Adds settings and styles from the WP_REST_Revisions_Controller item fields.
				 * Leaves out GUID as global styles shouldn't be accessible via URL.
				 */
				'author'       => array(
					'description' => __( 'The ID for the author of the revision.', 'gutenberg' ),
					'type'        => 'integer',
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'date'         => array(
					'description' => __( "The date the revision was published, in the site's timezone.", 'gutenberg' ),
					'type'        => 'string',
					'format'      => 'date-time',
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'date_gmt'     => array(
					'description' => __( 'The date the revision was published, as GMT.', 'gutenberg' ),
					'type'        => 'string',
					'format'      => 'date-time',
					'context'     => array( 'view', 'edit' ),
				),
				'id'           => array(
					'description' => __( 'Unique identifier for the revision.', 'gutenberg' ),
					'type'        => 'integer',
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'modified'     => array(
					'description' => __( "The date the revision was last modified, in the site's timezone.", 'gutenberg' ),
					'type'        => 'string',
					'format'      => 'date-time',
					'context'     => array( 'view', 'edit' ),
				),
				'modified_gmt' => array(
					'description' => __( 'The date the revision was last modified, as GMT.', 'gutenberg' ),
					'type'        => 'string',
					'format'      => 'date-time',
					'context'     => array( 'view', 'edit' ),
				),
				'parent'       => array(
					'description' => __( 'The ID for the parent of the revision.', 'gutenberg' ),
					'type'        => 'integer',
					'context'     => array( 'view', 'edit', 'embed' ),
				),

				// Adds settings and styles from the WP_REST_Global_Styles_Controller parent schema.
				'styles'       => array(
					'description' => __( 'Global styles.', 'gutenberg' ),
					'type'        => array( 'object' ),
					'context'     => array( 'view', 'edit' ),
				),
				'settings'     => array(
					'description' => __( 'Global settings.', 'gutenberg' ),
					'type'        => array( 'object' ),
					'context'     => array( 'view', 'edit' ),
				),
			),
		);

		$this->schema = $schema;

		return $this->add_additional_fields_schema( $this->schema );
	}
}
