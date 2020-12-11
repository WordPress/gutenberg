<?php
/**
 * REST API: WP_REST_Template_Parts_Controller class
 *
 * @package gutenberg
 */

/**
 * Class used to access template part files via the REST API.
 *
 * @see   WP_REST_Controller
 */
class WP_REST_Template_Parts_Controller extends WP_REST_Posts_Controller {
	public function get_items( $request ) {
		$template_files = _gutenberg_get_template_files( 'wp_template_part' );

		$query = array(
			'post_type'      => 'wp_template_part',
			'post_status'    => 'publish',
			'posts_per_page' => -1,
			'no_found_rows'  => true,
			'tax_query'      => array(
				array(
					'taxonomy' => 'wp_theme',
					'field'    => 'slug',
					'terms'    => wp_get_theme()->get_stylesheet(),
				),
			),
		);
		if ( isset( $request['slug'] ) ) {
			$query['post_name__in'] = $request['slug'];
		}

		$template_query = new WP_Query( $query );
		$query_result   = $template_query->get_posts();

		foreach( $template_files as $template_file ) {
			if ( isset( $request['slug'] ) && ! in_array( $template_file['slug'], $request['slug'] ) ) {
				continue;
			}
			$is_custom = array_search( $template_file['slug'], array_column( $query_result, 'post_name' ) );
			if ( false === $is_custom ) {
				$query_result[] = _gutenberg_build_fake_template_post( $template_file, 'wp_template_part' );
			}
		}

		$templates = array();

		foreach( $query_result as $template ) {
			$data = $this->prepare_item_for_response( $template, $request );
			$templates[] = $this->prepare_response_for_collection( $data );
		}

		$response = rest_ensure_response( $templates );
		return $response;
	}
}
