<?php
/**
 * REST API: WP_REST_Template_Parts_Controller class
 *
 * @subpackage REST_API
 * @package    WordPress
 */

/**
 * Creates a template part auto-draft if it doesn't exist yet.
 *
 * @access private
 *
 * @param string $slug    Template part slug.
 * @param string $theme   Template part theme.
 * @param string $content Template part content.
 */
function create_auto_draft_for_template_part_block( $slug, $theme, $content ) {
	// We check if an auto-draft was already created,
	// before running the REST API calls
	// because the site editor needs an existing auto-draft
	// for each theme template part to work properly.
	$template_part_query = new WP_Query(
		array(
			'post_type'      => 'wp_template_part',
			'post_status'    => array( 'auto-draft' ),
			'title'          => $slug,
			'meta_key'       => 'theme',
			'meta_value'     => $theme,
			'posts_per_page' => 1,
			'no_found_rows'  => true,
		)
	);
	$template_part_post  = $template_part_query->have_posts() ? $template_part_query->next_post() : null;
	if ( ! $template_part_post ) {
		wp_insert_post(
			array(
				'post_content' => $content,
				'post_title'   => $slug,
				'post_status'  => 'auto-draft',
				'post_type'    => 'wp_template_part',
				'post_name'    => $slug,
				'meta_input'   => array(
					'theme' => $theme,
				),
			)
		);
	} else {
		// Potentially we could decide to update the content if different.
	}
}

/**
 * Create the template parts auto-drafts for the current theme.
 *
 * @access private
 */
function synchronize_theme_template_parts() {
	/**
	 * Finds all nested template part file paths in a theme's directory.
	 *
	 * @param string $base_directory The theme's file path.
	 * @return array $path_list A list of paths to all template part files.
	 */
	function get_template_part_paths( $base_directory ) {
		$path_list = array();
		if ( file_exists( $base_directory . '/block-template-parts' ) ) {
			$nested_files      = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $base_directory . '/block-template-parts' ) );
			$nested_html_files = new RegexIterator( $nested_files, '/^.+\.html$/i', RecursiveRegexIterator::GET_MATCH );
			foreach ( $nested_html_files as $path => $file ) {
				$path_list[] = $path;
			}
		}
		return $path_list;
	}

	// Get file paths for all theme supplied template parts.
	$template_part_files = get_template_part_paths( get_stylesheet_directory() );
	if ( is_child_theme() ) {
		$template_part_files = array_merge( $template_part_files, get_template_part_paths( get_template_directory() ) );
	}
	// Build and save each template part.
	foreach ( $template_part_files as $template_part_file ) {
		$content = file_get_contents( $template_part_file );
		$slug    = substr(
			$template_part_file,
			// Starting position of slug.
			strpos( $template_part_file, 'block-template-parts/' ) + 21,
			// Subtract ending '.html'.
			-5
		);
		create_auto_draft_for_template_part_block( $slug, wp_get_theme()->get( 'TextDomain' ), $content );
	}
}

/**
 * Core class used to access menu templte parts via the REST API.
 *
 * @see   WP_REST_Controller
 */
class WP_REST_Template_Parts_Controller extends WP_REST_Posts_Controller {

	/**
	 * Retrieves a list of template parts.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		synchronize_theme_template_parts();

		return parent::get_items( $request );
	}

	/**
	 * Retrieves a single template parat.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_item( $request ) {
		synchronize_theme_template_parts();

		return parent::get_items( $request );
	}
}
