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
		$template_files = $this->get_template_files();

		$template_query = new WP_Query(
			array(
				'post_type'      => 'wp_template',
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

		$fake_id = 0;
		foreach( $template_files as $template_file ) {
			$is_custom = array_search( $template_file['slug'], array_column( $query_result, 'post_name' ) );
			if ( false === $is_custom ) {
				$query_result[] = $this->get_fake_template_post( --$fake_id, $template_file );
			}
		}

		$templates = array();

		foreach( $query_result as $template ) {
			$data = $this->prepare_item_for_response( $template, $request );

			if ( $data->data['id'] < 0 ) {
				$data->data['title'] = $this->fix_fake_post_title( $data->data, $request );
			}

			$templates[] = $this->prepare_response_for_collection( $data );
		}

		$response = rest_ensure_response( $templates );
		return $response;
	}

	public function get_template_files() {
		$themes              = array(
			get_stylesheet() => get_stylesheet_directory(),
			get_template()   => get_template_directory(),
		);

		$template_files = array();
		foreach ( $themes as $theme_slug => $theme_dir ) {
			$theme_template_files = _gutenberg_get_template_paths( $theme_dir . '/block-templates' );
			foreach ( $theme_template_files as $template_file ) {
				$template_slug = substr(
					$template_file,
					// Starting position of slug.
					strpos( $template_file, 'block-templates' . DIRECTORY_SEPARATOR ) + 1 + strlen( 'block-templates' ),
					// Subtract ending '.html'.
					-5
				);
				$template_files[] = array(
					'slug'  => $template_slug,
					'path'  => $template_file,
					'theme' => $theme_slug,
				);
			}
		}

		return $template_files;
	}

	public function get_fake_template_post( $fake_id, $template_file ) {
		$default_template_types = gutenberg_get_default_template_types();

		$fake_post                = new stdClass();
		$fake_post->filter        = 'raw';
		$fake_post->ID            = $fake_id;
		$fake_post->post_author   = 0;
		$fake_post->post_content  = file_get_contents( $template_file['path'] );
		$fake_post->post_date     = current_time( 'mysql' );
		$fake_post->post_date_gmt = current_time( 'mysql', 1 );
		$fake_post->post_name     = $template_file['slug'];
		$fake_post->post_status   = 'draft';
		$fake_post->post_type     = 'wp_template';

		if ( isset( $default_template_types[ $template_file['slug'] ] ) ) {
			$fake_post->post_excerpt = $default_template_types[ $template_file['slug'] ]['description'];
			$fake_post->post_title   = $default_template_types[ $template_file['slug'] ]['title'];
		}

		$template_post = new WP_Post( $fake_post );

		return $template_post;
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
