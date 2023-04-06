<?php
/**
 * User-created patterns REST API: Gutenberg_REST_Patterns_Controller class
 *
 * @package Gutenberg
 */

/**
 * Controller which provides a REST endpoint for the editor to read, create,
 * edit and delete patterns. Patterns are stored as posts with the wp_block_pattern
 * post type.
 *
 * @see WP_REST_Posts_Controller
 * @see WP_REST_Controller
 */
class Gutenberg_REST_Patterns_Controller extends WP_REST_Posts_Controller {

	/**
	 * Checks if a pattern can be read.
	 *
	 * @param WP_Post $post Post object that backs the pattern.
	 * @return bool Whether the pattern can be read.
	 */
	public function check_read_permission( $post ) {
		// By default the read_post capability is mapped to edit_posts.
		if ( ! current_user_can( 'read_post', $post->ID ) ) {
			return false;
		}

		return parent::check_read_permission( $post );
	}

	/**
	 * Filters a response based on the context defined in the schema.
	 *
	 * @param array  $data    Response data to filter.
	 * @param string $context Context defined in the schema.
	 * @return array Filtered response.
	 */
	public function filter_response_by_context( $data, $context ) {
		$data = parent::filter_response_by_context( $data, $context );

		/*
		 * Remove `title.rendered` and `content.rendered` from the response. It
		 * doesn't make sense for a pattern to have rendered content on its
		 * own, since rendering a pattern requires it to be inside a post or a page.
		 */
		unset( $data['title']['rendered'] );
		unset( $data['content']['rendered'] );

		return $data;
	}

	/**
	 * Retrieves the pattern's schema, conforming to JSON Schema.
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		// Do not cache this schema because all properties are derived from parent controller.
		$schema = parent::get_item_schema();

		/*
		 * Allow all contexts to access `title.raw` and `content.raw`. Clients always
		 * need the raw markup of a pattern to do anything useful, e.g. parse
		 * it or display it in an editor.
		 */
		$schema['properties']['title']['properties']['raw']['context']   = array( 'view', 'edit' );
		$schema['properties']['content']['properties']['raw']['context'] = array( 'view', 'edit' );

		/*
		 * Remove `title.rendered` and `content.rendered` from the schema. It doesn’t
		 * make sense for a pattern to have rendered content on its own, since
		 * rendering a pattern requires it to be inside a post or a page.
		 */
		unset( $schema['properties']['title']['properties']['rendered'] );
		unset( $schema['properties']['content']['properties']['rendered'] );

		return $schema;
	}

}
