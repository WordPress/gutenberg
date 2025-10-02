<?php
/**
 * Class to manage discussion indicators on post list screens.
 *
 * @package gutenberg
 */

/**
 * Class Gutenberg_Discussion_Indicator_Manager
 */
class Gutenberg_Discussion_Indicator_Manager {
	/**
	 * @var array Post IDs that have unresolved comments.
	 */
	private $post_screen_labels = array();

	/**
	 * @var array Avatar URLs for unresolved comments, keyed by post ID.
	 */
	private $post_screen_avatar_indicators = array();

	/**
	 * @var Gutenberg_Discussion_Indicator_Manager Singleton instance.
	 */
	private static $instance = null;

	/**
	 * Get the singleton instance.
	 *
	 * @return Gutenberg_Discussion_Indicator_Manager
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor. Registers hooks.
	 */
	private function __construct() {
		add_filter( 'the_title', array( $this, 'add_open_discussion_indicator_to_post_title' ), 10, 2 );
		add_action( 'admin_footer', array( $this, 'insert_open_discussion_label_scripts' ) );
	}

	/**
	 * Add avatars next to posts titles where the posts has unresolved discussions.
	 *
	 * @param string $title   The post title.
	 * @param int    $post_id The post ID.
	 * @return string The modified post title.
	 */
	public function add_open_discussion_indicator_to_post_title( $title, $post_id ) {
		if ( ! $post_id || ! function_exists( 'get_current_screen' ) ) {
			return $title;
		}

		$screen = get_current_screen();
		if ( 'edit-post' === $screen->id || 'edit-page' === $screen->id ) {
			$post = get_post( $post_id );

			if ( $post && gutenberg_check_post_type_supports_block_comments( $post->post_type ) ) {
				$unresolved_comments = get_comments(
					array(
						'post_id'  => $post_id,
						'type'     => 'block_comment',
						'status'   => 'hold',
						'per_page' => 100,
					)
				);
				if ( count( $unresolved_comments ) > 0 ) {
					// Note: we can't use a <span> here because of how WordPress sanitizes titles.
					// Instead, we will insert a JavaScript snippet to add the label later.
					// For the core backport we will not need this approach - we can use a <span> directly.
					if ( ! in_array( $post_id, $this->post_screen_labels, true ) ) {
						array_push( $this->post_screen_labels, $post_id );

						// Gather the Avatar urls for authors of the most recent unresolved comments.
						$avatar_urls = array();
						foreach ( $unresolved_comments as $comment ) {
							$gravatar_params = array(
								'size' => 24,
								'',
							);
							$avatar_urls[]   = get_avatar_url( $comment->user_id, $gravatar_params );
						}
						$this->post_screen_avatar_indicators[ $post_id ] = $avatar_urls;
					}
				}
			}
		}
		return $title;
	}

	/**
	 * Insert JavaScript to add discussion labels to post titles.
	 */
	public function insert_open_discussion_label_scripts() {
		if ( count( $this->post_screen_labels ) === 0 ) {
			return;
		}
		$script = '';

		foreach ( $this->post_screen_labels as $post_id ) {
			$script = '<script>
			document.addEventListener( "DOMContentLoaded", function() {
				const titleElement = document.querySelector( "a.row-title[href=\'' . get_edit_post_link( $post_id, '' ) . '\']").parentElement;
				if ( titleElement ) {
					// Add avatar indicators.
					const avatarUrls = ' . wp_json_encode( $this->post_screen_avatar_indicators[ $post_id ] ) . ';
					const maxAvatars = 3;
					let zIndex = maxAvatars;
					if ( avatarUrls && avatarUrls.length > 0 ) {
						const avatarContainer = document.createElement( "div" );
						avatarContainer.style.marginLeft = "8px";
						avatarContainer.classList.add( "comment-avatar-stack" );
						urlTracker = [];
						avatarUrls.forEach( url => {
							if ( zIndex <= 0 ) {
								return;
							}
							if ( urlTracker.includes( url ) ) {
								return;
							}
							urlTracker.push( url );
							const img = document.createElement( "img" );
							img.src = url;
							img.classList.add( "comment-avatar" );
							img.style.zIndex = zIndex--;
							img.alt = "' . __( 'Discussion author avatar', 'gutenberg' ) . '";
							avatarContainer.appendChild( img );
						} );

						// If there are over maxAvatars unresolved comments, add a +N indicator.
						// If there are over 100 comments show 100+.
						if ( avatarUrls.length > maxAvatars ) {
							const moreIndicator = document.createElement( "span" );
							if ( 100 === avatarUrls.length ) {
								moreIndicator.textContent = "+100";
							} else {
								moreIndicator.textContent = "+" + ( avatarUrls.length - maxAvatars );
							}
							moreIndicator.style.fontSize = "12px";
							moreIndicator.style.verticalAlign = "middle";
							avatarContainer.appendChild( moreIndicator );
						}

						titleElement.appendChild( avatarContainer );
					}
				}
			} );
		</script>';
			echo $script;
		}
		// Ensure insert only ever happens once.
		remove_action( 'admin_footer', array( $this, 'insert_open_discussion_label_scripts' ) );
	}
}
