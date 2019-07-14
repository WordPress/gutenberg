<?php
/**
 * Start: Include for phase 2
 * Block Areas REST API: WP_REST_Blocks_Controller class
 *
 * @package gutenberg
 * @since 5.7.0
 */

/**
 * Controller which provides REST endpoint for the blocks.
 *
 * @since 5.2.0
 *
 * @see WP_REST_Controller
 */
class WP_REST_Blocks_Search_Controller extends WP_REST_Controller {

	/**
	 * Constructs the controller.
	 *
	 * @access public
	 */
	public function __construct() {
		$this->namespace = '__experimental';
		$this->rest_base = 'blocks';
	}

	/**
	 * Registers the necessary REST API routes.
	 *
	 * @access public
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			)
		);
	}

	/**
	 * Checks whether a given request has permission to read blocks.
	 *
	 * @since 5.7.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_Error|bool True if the request has read access, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) {
		// if ( ! current_user_can( 'edit_theme_options' ) ) {
		// 	return new WP_Error(
		// 		'rest_user_cannot_view',
		// 		__( 'Sorry, you are not allowed to read blocks.', 'gutenberg' )
		// 	);
		// }

		return true;
	}

	/**
	 * Retrieves all blocks.
	 *
	 * @since 5.7.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_Error|WP_REST_Response Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {

		if (!isset($_GET['search'])) {
			return rest_ensure_response( array() );
		}

		$data = json_decode(
			'[ {
				"id": "boxer/boxer",
				"name": "boxer/boxer",
				"title": "Boxer",
				"icon": "archive",
				"description": "Boxer puts your WordPress posts into boxes.",
				"category": "discover",
				"keywords": ["posts", "helloworld"],
				"assets": {
					"editor_script": {
						"src": "http://plugins.svn.wordpress.org/boxer-block/trunk/build/index.js"
					},
					"view_script": {
						"src": "http://plugins.svn.wordpress.org/boxer-block/trunk/build/view.js"
					},
					"style": {
						"src": "http://plugins.svn.wordpress.org/boxer-block/trunk/style.css"
					},
					"editor_style": {
						"src": "http://plugins.svn.wordpress.org/boxer-block/trunk/editor.css"
					}
				}
			}, {
				"id": "lez-library/listicles",
				"name": "lez-library/listicles",
				"title": "Listicle",
				"icon": "excerpt-view",
				"description": "A block for listicles. You can add items, remove them, and flip them in reverse.",
				"category": "discover",
				"assets": {
					"editor_script": {
						"src": "http://plugins.svn.wordpress.org/listicles/trunk/dist/blocks.build.js"
					},
					"style": {
						"src": "http://plugins.svn.wordpress.org/listicles/trunk/dist/blocks.style.build.css"
					},
					"editor_style": {
						"src": "http://plugins.svn.wordpress.org/listicles/trunk/dist/blocks.editor.build.css"
					}
				}
			} ]'
		);

		function block_search( $item )
		{
			if(preg_match("/{$_GET['search']}/i", $item->title)) {
				return true;
			}
			if(preg_match("/{$_GET['search']}/i", $item->description)) {
				return true;
			}
			return false;
		}

		$filtered = array_filter( $data, "block_search" );

		return rest_ensure_response( $filtered	 );
	}
}
