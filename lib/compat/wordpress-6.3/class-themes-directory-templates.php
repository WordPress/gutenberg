<?php
/**
 * REST API: Gutenberg_REST_Pattern_Directory_Controller_6_3 class
 *
 * @package    Gutenberg
 * @subpackage REST_API
 */

function _inject_theme_attribute_in_block_template_content_override( $template_content ) {
	$has_updated_content = false;
	$new_content         = '';
	$template_blocks     = parse_blocks( $template_content );

	$blocks = _flatten_blocks( $template_blocks );
	foreach ( $blocks as &$block ) {
        // We don't support PHP patterns yet.
        if ( 'core/pattern' === $block['blockName'] ) {
            return;
        }

		if (
			'core/template-part' === $block['blockName']
		) {
			$block['attrs']['theme'] = get_stylesheet();
			$has_updated_content     = true;
		}
	}

	if ( $has_updated_content ) {
		foreach ( $template_blocks as &$block ) {
			$new_content .= serialize_block( $block );
		}

		return $new_content;
	}

	return $template_content;
}

/**
 * Controller which provides REST endpoint for block patterns from wordpress.org/patterns.
 */
class Themes_Directory_Templates extends WP_REST_Controller {


    /**
     * Constructs the controller.
     */
    public function __construct() {
        $this->namespace = 'wp-block-editor/v2';
        $this->rest_base = 'themes-directory-templates';
    }

	/**
	 * Registers the necessary REST API routes.
	 *
	 * @since 5.8.0
	 * @since 6.3.0 Added pattern directory categories endpoint.
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_pattern_categories' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
			)
		);
	}

	/**
	 * Retrieve block patterns categories.
	 *
	 * @since 6.3.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_pattern_categories( $request ) {
        $url = $request['area']
            ? 'https://raw.githubusercontent.com/ellatrix/block-themes-directory/main/parts/' . $request['area'] . '.json'
            : 'https://raw.githubusercontent.com/ellatrix/block-themes-directory/main/templates/' . $request['slug'] . '.json';
		$response = json_decode( wp_remote_retrieve_body( wp_remote_get( $url ) ) );
        $filtered = array();

        foreach ( $response as $item ) {
            $html = _inject_theme_attribute_in_block_template_content_override( $item->html );
            if ( ! $html ) {
                continue;
            }
            $filtered[] = array(
                'title' => $item->title,
                'html' => $html,
            );
        }

		return new WP_REST_Response( $filtered );
	}

	function get_items_permissions_check( $request ) {
        return true;
    }
}
