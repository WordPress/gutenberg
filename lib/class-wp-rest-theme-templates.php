<?php
/**
 * Templates API: WP_REST_Theme_Templates class
 *
 * @package Gutenberg
 */

/**
 * REST endpoints for templates resolution.
 */
class WP_REST_Theme_Templates {

	/**
	 * The namespace.
	 *
	 * @var string
	 */
	public $namespace;

	/**
	 * The REST base.
	 *
	 * @var string
	 */
	public $rest_base;

	/**
	 * Constructs the controller.
	 */
	public function __construct() {
		$this->namespace = 'wp/v2';
		$this->rest_base = 'theme-templates';
	}

	/**
	 * Registers the REST API route.
	 *
	 * @since 9.2.0
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				'callback'            => array( $this, 'get_templates' ),
				'permission_callback' => '__return_true',
				'methods'             => 'GET',
			)
		);
	}

	/**
	 * Return all templates.
	 *
	 * @since 9.2.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 *
	 * @return WP_REST_Response
	 */
	public function get_templates( WP_REST_Request $request ) {
		$from_posts = $this->get_from_posts(
			$request->get_param( 'type' ),
			$request->get_param( 'slugs' )
		);
		$from_files = $this->get_from_files(
			$request->get_param( 'type' ),
			$request->get_param( 'slugs' )
		);
		return wp_parse_args( $from_posts, $from_files );
	}

	/**
	 * Get all templates & template-parts from posts, matching a slug.
	 *
	 * @param string $post_type The post-type. Can be `wp_template` or `wp_template_part`.
	 * @param array  $slugs     The slugs we're looking for.
	 *
	 * @return array
	 */
	public function get_from_posts( $post_type, $slugs ) {
		$result = array();

		// Find all potential templates 'wp_template' post matching the hierarchy.
		$template_query = new WP_Query(
			array(
				'post_type'      => (array) $post_type,
				'post_status'    => array( 'publish', 'auto-draft' ),
				'post_name__in'  => (array) $slugs,
				'orderby'        => 'post_name__in',
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

		// Get the posts.
		$templates = $template_query->get_posts();

		// Build the array.
		foreach ( $templates as $template ) {
			$result[ $template->post_name ] = array(
				'id'      => $template->ID,
				'content' => $template->post_content,
				'slug'    => $template->post_name,
				'type'    => 'post',
			);
		}

		return $result;
	}

	/**
	 * Get all templates & template-parts from posts, matching a slug.
	 *
	 * @param string $post_type The post-type. Can be `wp_template` or `wp_template_part`.
	 * @param array  $slugs     The slugs we're looking for.
	 *
	 * @return array
	 */
	public function get_from_files( $post_type, $slugs ) {
		$slugs = (array) $slugs;
		$paths = 'wp_template_part' === $post_type
			? gutenberg_get_template_part_paths()
			: gutenberg_get_template_paths();
		$files = array();
		foreach ( $paths as $path ) {
			$files[ basename( $path, '.html' ) ] = $path;
		}

		$return_all = empty( $slugs );
		$result     = array();
		foreach ( $files as $slug => $path ) {
			if ( $return_all || in_array( $slug, $slugs, true ) ) {

				// Get the content.
				ob_start();
				include $path;
				$template_content = ob_get_clean();

				$result[ $slug ] = array(
					'id'      => 0,
					'content' => $template_content,
					'slug'    => $slug,
					'type'    => 'file',
				);
			}
		}

		return $result;
	}

}
