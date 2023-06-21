<?php
/**
 * REST API: Gutenberg_REST_Block_Patterns_Controller_6_3 class
 *
 * @package    Gutenberg
 * @subpackage REST_API
 */

/**
 * Core class used to access block patterns via the REST API.
 *
 * @since 6.0.0
 *
 * @see WP_REST_Controller
 */
class Gutenberg_REST_Block_Patterns_Controller_6_3 extends Gutenberg_REST_Block_Patterns_Controller_6_2 {
	/**
	 * Prepare a raw block pattern before it gets output in a REST API response.
	 *
	 * @since 6.0.0
	 * @since 6.3.0 Added `source` property.
	 *
	 * @param array           $item    Raw pattern as registered, before any changes.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function prepare_item_for_response( $item, $request ) {
		$fields = $this->get_fields_for_response( $request );
		$keys   = array(
			'name'          => 'name',
			'title'         => 'title',
			'description'   => 'description',
			'viewportWidth' => 'viewport_width',
			'blockTypes'    => 'block_types',
			'postTypes'     => 'post_types',
			'categories'    => 'categories',
			'keywords'      => 'keywords',
			'content'       => 'content',
			'inserter'      => 'inserter',
			'templateTypes' => 'template_types',
			'source'        => 'source',
		);
		$data   = array();
		foreach ( $keys as $item_key => $rest_key ) {
			if ( isset( $item[ $item_key ] ) && rest_is_field_included( $rest_key, $fields ) ) {
				$data[ $rest_key ] = $item[ $item_key ];
			}
		}
		$context = ! empty( $request['context'] ) ? $request['context'] : 'view';
		$data    = $this->add_additional_fields_to_object( $data, $request );
		$data    = $this->filter_response_by_context( $data, $context );
		return rest_ensure_response( $data );
	}

	/**
	 * Retrieves the block pattern schema, conforming to JSON Schema.
	 *
	 * @since 6.0.0
	 * @since 6.1.0 Added `post_types` property.
	 * @since 6.3.0 Added `source` property.
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		$schema = array(
			'$schema'    => 'http://json-schema.org/draft-04/schema#',
			'title'      => 'block-pattern',
			'type'       => 'object',
			'properties' => array(
				'name'           => array(
					'description' => __( 'The pattern name.', 'gutenberg' ),
					'type'        => 'string',
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'title'          => array(
					'description' => __( 'The pattern title, in human readable format.', 'gutenberg' ),
					'type'        => 'string',
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'description'    => array(
					'description' => __( 'The pattern detailed description.', 'gutenberg' ),
					'type'        => 'string',
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'viewport_width' => array(
					'description' => __( 'The pattern viewport width for inserter preview.', 'gutenberg' ),
					'type'        => 'number',
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'block_types'    => array(
					'description' => __( 'Block types that the pattern is intended to be used with.', 'gutenberg' ),
					'type'        => 'array',
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'post_types'     => array(
					'description' => __( 'An array of post types that the pattern is restricted to be used with.', 'gutenberg' ),
					'type'        => 'array',
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'categories'     => array(
					'description' => __( 'The pattern category slugs.', 'gutenberg' ),
					'type'        => 'array',
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'keywords'       => array(
					'description' => __( 'The pattern keywords.', 'gutenberg' ),
					'type'        => 'array',
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'template_types' => array(
					'description' => __( 'An array of template types where the pattern fits.', 'gutenberg' ),
					'type'        => 'array',
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'content'        => array(
					'description' => __( 'The pattern content.', 'gutenberg' ),
					'type'        => 'string',
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'inserter'       => array(
					'description' => __( 'Determines whether the pattern is visible in inserter.', 'gutenberg' ),
					'type'        => 'boolean',
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
				),
				'source'         => array(
					'description' => __( 'Where the pattern comes from e.g. core', 'gutenberg' ),
					'type'        => 'string',
					'readonly'    => true,
					'context'     => array( 'view', 'edit', 'embed' ),
					'enum'        => array(
						'core',
						'plugin',
						'theme',
						'pattern-directory/core',
						'pattern-directory/theme',
						'pattern-directory/featured',
					),
				),
			),
		);

		return $this->add_additional_fields_schema( $schema );
	}
}
