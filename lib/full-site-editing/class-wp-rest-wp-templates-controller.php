<?php
/**
 * REST API: WP_REST_WP_Templates_Controller class
 *
 * @package gutenberg
 */

/**
 * Class used to access template files via the REST API.
 *
 * @see   WP_REST_Controller
 */
class WP_REST_WP_Templates_Controller extends WP_REST_Controller {

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->namespace = '__experimental';
		$this->rest_base = 'wp-templates';
	}

	/**
	 * Registers the routes for the objects of the controller.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'  => WP_REST_Server::READABLE,
					'callback' => array( $this, 'get_items' ),
					'args'     => $this->get_collection_params(),
				),
			)
		);

		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/(?P<id>[\d]+)',
			array(
				'args' => array(
					'id' => array(
						'description' => __( 'Unique identifier for the template object.' ),
						'type'        => 'integer',
					),
				),
				array(
					'methods'  => WP_REST_Server::READABLE,
					'callback' => array( $this, 'get_item' ),
					'args'     => $this->get_item_params(),
				),
			)
		);
	}

	public function get_collection_params() {
		$query_params = array(
			'context' => $this->get_context_param(),
		);

		return $query_params;
	}

	public function get_item_params() {
		$query_params = array(
			'context' => $this->get_context_param( array( 'default' => 'view' ) ),
		);

		return $query_params;
	}

	public function get_items( $request ) {
		$template_files = $this->get_template_files();

		$template_query = new WP_Query(
			array(
				'post_type'      => 'wp_template',
				'posts_per_page' => 2,
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
		$templates      = $template_query->get_posts();

		$fake_id = 0;
		foreach( $template_files as $template_file ) {
			$is_custom = array_search( $template_file['slug'], array_column( $templates, 'post_name' ) );
			if ( false === $is_custom ) {
				$templates[] = $this->get_fake_template_post( --$fake_id, $template_file );
			}
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
		$fake_post->post_excerpt  = $default_template_types[ $template_file['slug'] ]['description'];
		$fake_post->post_name     = $template_file['slug'];
		$fake_post->post_status   = 'auto-draft';
		$fake_post->post_title    = $default_template_types[ $template_file['slug'] ]['title'];
		$fake_post->post_type     = 'wp_template';

		$template_post = new WP_Post( $fake_post );

		return $template_post;
	}
}
