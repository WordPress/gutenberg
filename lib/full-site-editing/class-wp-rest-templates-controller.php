<?php
/**
 * REST API: WP_REST_Templates_Controller class
 *
 * @package gutenberg
 */

/**
 * Class used to access template files via the REST API.
 *
 * @see   WP_REST_Controller
 */
class WP_REST_Templates_Controller extends WP_REST_Posts_Controller {
	public function get_items( $request ) {
		$template_files = _gutenberg_get_template_files( 'wp_template' );

		$template_query = new WP_Query(
			array(
				'post_type'      => 'wp_template',
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
			)
		);
		$query_result   = $template_query->get_posts();

		foreach( $template_files as $template_file ) {
			$is_custom = array_search( $template_file['slug'], array_column( $query_result, 'post_name' ) );
			if ( false === $is_custom ) {
				$query_result[] = _gutenberg_build_fake_template_post( $template_file, 'wp_template' );
			}
		}

		$templates = array();

		foreach( $query_result as $template ) {
			$data = $this->prepare_item_for_response( $template, $request );

			if ( 0 === strpos( $data->data['id'], 'file-template-' ) ) {
				$data->data['title'] = $this->fix_fake_post_title( $data->data, $request );
			}

			$templates[] = $this->prepare_response_for_collection( $data );
		}

		$response = rest_ensure_response( $templates );
		return $response;
	}

	public function fix_fake_post_title( $fake_post, $request ) {
		$default_template_types = gutenberg_get_default_template_types();
		$fields                 = $this->get_fields_for_response( $request );

		if ( ! isset( $default_template_types[ $fake_post['slug'] ] ) || ! rest_is_field_included( 'title', $fields ) ) {
			return $fake_post['title'];
		}

		$title = array();
		if ( rest_is_field_included( 'title.raw', $fields ) ) {
			$title['raw'] = $default_template_types[ $fake_post['slug'] ]['title'];
		}
		if ( rest_is_field_included( 'title.rendered', $fields ) ) {
			$title['rendered'] = apply_filters( 'the_content', $default_template_types[ $fake_post['slug'] ]['title'] );
		}

		return $title;
	}
}
