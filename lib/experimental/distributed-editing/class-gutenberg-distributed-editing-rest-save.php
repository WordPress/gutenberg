<?php
/**
 * Gutenberg_Distributed_Editing_REST_Save class
 *
 * Hooks the distributed-editing engine into the native wp/v2 post save path.
 * When a save carries a `de_base_version` parameter, the engine evaluates it
 * before anything persists: stale bases bounce as 409s, and accepted content
 * (including any unapproved protected proposals sequestered into
 * pending-review blocks) replaces the submitted content.
 *
 * While a distributed-editing save persists, the global kses filters are
 * suspended: the engine's chunk-level enforcement replaces them (see the
 * engine's security invariant). They are restored as soon as the post is
 * updated, and defensively at the end of the REST request.
 *
 * @package gutenberg
 */

if ( ! class_exists( 'Gutenberg_Distributed_Editing_REST_Save' ) ) {

	/**
	 * Integrates distributed-editing evaluation into wp/v2 post saves.
	 *
	 * @access private
	 */
	class Gutenberg_Distributed_Editing_REST_Save {
		/**
		 * Post types wired into the integration.
		 *
		 * @var string[]
		 */
		const POST_TYPES = array( 'post', 'page' );

		/**
		 * Whether kses filters are currently suspended by this integration.
		 *
		 * @var bool
		 */
		private static $kses_suspended = false;

		/**
		 * Registers the hooks.
		 */
		public static function init() {
			foreach ( self::POST_TYPES as $post_type ) {
				add_filter( "rest_pre_insert_{$post_type}", array( __CLASS__, 'filter_pre_insert' ), 10, 2 );
				add_action( "rest_after_insert_{$post_type}", array( __CLASS__, 'after_insert' ), 10, 2 );
			}
			add_filter( 'rest_request_after_callbacks', array( __CLASS__, 'restore_kses' ), 100 );
		}

		/**
		 * Evaluates a distributed-editing save before the post persists.
		 *
		 * @param stdClass|WP_Error $prepared_post Post object about to be saved.
		 * @param WP_REST_Request   $request       The REST request.
		 * @return stdClass|WP_Error Possibly modified post object, or a bounce error.
		 */
		public static function filter_pre_insert( $prepared_post, $request ) {
			if ( is_wp_error( $prepared_post ) ) {
				return $prepared_post;
			}

			$base_version = $request['de_base_version'];
			if ( ! is_string( $base_version ) || '' === $base_version ) {
				return $prepared_post;
			}

			// Distributed editing only mediates content updates to existing posts.
			if ( empty( $prepared_post->ID ) || ! isset( $prepared_post->post_content ) ) {
				return $prepared_post;
			}

			$engine = new Gutenberg_Distributed_Editing_Engine();
			$result = $engine->evaluate(
				(int) $prepared_post->ID,
				(string) $prepared_post->post_content,
				$base_version,
				is_array( $request['de_approvals'] ) ? $request['de_approvals'] : array(),
				get_current_user_id()
			);

			if ( is_wp_error( $result ) ) {
				return $result;
			}

			$prepared_post->post_content = $result['content'];

			if ( ! self::$kses_suspended ) {
				kses_remove_filters();
				self::$kses_suspended = true;
			}

			return $prepared_post;
		}

		/**
		 * Restores kses as soon as the post has been saved.
		 *
		 * @param WP_Post         $post    The saved post.
		 * @param WP_REST_Request $request The REST request.
		 */
		public static function after_insert( $post, $request ) {
			self::restore_kses( null );
		}

		/**
		 * Restores the kses filters if this integration suspended them.
		 *
		 * Doubles as a `rest_request_after_callbacks` filter so an error between
		 * evaluation and persistence cannot leave kses suspended.
		 *
		 * @param mixed $response Response passed through when used as a filter.
		 * @return mixed Unchanged response.
		 */
		public static function restore_kses( $response = null ) {
			if ( self::$kses_suspended ) {
				kses_init();
				self::$kses_suspended = false;
			}
			return $response;
		}
	}
}
