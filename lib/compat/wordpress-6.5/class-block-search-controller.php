<?php
/**
 * Block search controller.
 *
 * @package Block_Search_Controller
 */

if ( ! class_exists( 'Block_Search_Controller' ) ) {
	/**
	 * Class Block_Search_Controller.
	 */
	class Block_Search_Controller extends WP_REST_Controller {

		/**
		 * Constructor.
		 */
		public function __construct() {
			$this->namespace = 'wp/v2';
			$this->rest_base = 'block_search';
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
						'methods'             => WP_REST_Server::READABLE,
						'callback'            => array(
							$this,
							'find_posts_by_block_attribute',
						),
						'args'                => array(
							'post_type'       => array(
								'required' => true,
							),
							'block_name'      => array(
								'required' => true,
							),
							'attribute_name'  => array(
								'required' => true,
							),
							'attribute_value' => array(
								'required' => true,
							),
							'posts_per_page'  => array(
								'required' => false,
							),
						),
						'permission_callback' => array( $this, 'permissions_check' ),
					),
				)
			);
		}

		/**
		 * Permission callback to check if the user can use this endpoint.
		 */
		public function permissions_check() {
			// Check user permissions.
			return true;
		}

		/**
		 * The callback for the find_posts_by_block route.
		 *
		 * @param WP_REST_Request $request The request object.
		 */
		public function find_posts_by_block_attribute( $request ) {
			$post_type       = $request['post_type'];
			$block_name      = $request['block_name'];
			$attribute_name  = $request['attribute_name'];
			$attribute_value = $request['attribute_value'];

			$posts_per_page = apply_filters(
				'block_search_posts_per_page',
				$request['posts_per_page'] ?? get_option( 'posts_per_page' ),
				$request
			);

			$paged            = 1; // Start on the first page.
			$posts_with_block = array();

			do {
				$posts = get_posts(
					array(
						'post_type'      => $post_type,
						'posts_per_page' => $posts_per_page,
						'paged'          => $paged,
						'post_status'    => 'publish',
					)
				);

				if ( empty( $posts ) ) {
					break;
				}

				foreach ( $posts as $post ) {
					if ( count( $posts_with_block ) >= $posts_per_page ) {
						break 2;
					}

					$blocks       = parse_blocks( $post->post_content );
					$found_blocks = $this->recursively_find_block_by_attribute(
						$blocks,
						$block_name,
						$attribute_name,
						$attribute_value
					);

					if ( ! empty( $found_blocks ) ) {
						$posts_with_block[] = $post->ID;
					}
				}

				++$paged;

			} while ( count( $posts_with_block ) < $posts_per_page );

			return new WP_REST_Response( $posts_with_block, 200 );
		}


		/**
		 * Helper method to recursively find blocks by an attribute.
		 *
		 * @param array  $blocks The blocks to search.
		 * @param string $block_name The block name to search for.
		 * @param string $attribute_name The attribute name to search for.
		 * @param string $attribute_value The attribute value to search for.
		 * @param array  $found_blocks The found blocks.
		 *
		 * @return array The found blocks.
		 */
		private function recursively_find_block_by_attribute( $blocks, $block_name, $attribute_name, $attribute_value, $found_blocks = array() ) {
			foreach ( $blocks as $block ) {
				if (
					$block['blockName'] === $block_name &&
					isset( $block['attrs'][ $attribute_name ] ) &&
					$block['attrs'][ $attribute_name ] === $attribute_value
				) {
					$found_blocks[] = $block;
				}
				if ( ! empty( $block['innerBlocks'] ) ) {
					$found_blocks = array_merge(
						$found_blocks,
						$this->recursively_find_block_by_attribute(
							$block['innerBlocks'],
							$block_name,
							$attribute_name,
							$attribute_value,
							$found_blocks
						)
					);
				}
			}
			return $found_blocks;
		}
	}
}

add_action(
	'rest_api_init',
	function () {
		$controller = new Block_Search_Controller();
		$controller->register_routes();
	}
);
