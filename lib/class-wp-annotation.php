<?php
/**
 * Annotations API: WP_Annotation class
 *
 * @package gutenberg
 * @since [version]
 */

/**
 * Annotation.
 *
 * @since [version]
 */
final class WP_Annotation {
	/**
	 * Comment object.
	 *
	 * @since [version]
	 *
	 * @var WP_Comment
	 */
	public $comment;

	/**
	 * Annotation status.
	 *
	 * @since [version]
	 *
	 * @var string
	 */
	public $status;

	/**
	 * Annotation meta-status.
	 *
	 * @since [version]
	 *
	 * @var string
	 */
	public $meta_status;

	/**
	 * Gets a {@see WP_Annotation} instance.
	 *
	 * @since [version]
	 *
	 * @param  WP_Comment|int|string $comment Comment object or ID.
	 *
	 * @return WP_Annotation|false            Annotation object. False on failure.
	 */
	public static function get_instance( $comment ) {
		try {
			return new WP_Annotation( $comment );
		} catch ( Exception $exception ) {
			return false;
		}
	}

	/**
	 * Contructor.
	 *
	 * @since [version]
	 *
	 * @param  WP_Comment|int|string $comment Comment object or ID.
	 *
	 * @throws Exception                      On invalid comment type.
	 */
	public function __construct( $comment ) {
		$this->comment = $comment ? get_comment( $comment ) : null;

		if ( ! ( $this->comment instanceof WP_Comment ) ) {
			throw new Exception( 'Missing annotation comment.' );
		} elseif ( ! in_array( $this->comment_type, get_annotation_types(), true ) ) {
			throw new Exception( 'Invalid annotation comment type.' );
		}

		$this->status      = WP_Annotation_Utils::get_comment_status( $this->comment );
		$this->meta_status = WP_Annotation_Utils::get_comment_status( $this->comment, true );
	}

	/**
	 * Checks for an ID.
	 *
	 * @since [version]
	 *
	 * @return bool True if exists.
	 */
	public function exists() {
		return ! empty( $this->comment_ID );
	}

	/**
	 * Magic isset.
	 *
	 * @since [version]
	 *
	 * @param  string $property Property name.
	 *
	 * @return bool             True if set.
	 */
	public function __isset( $property ) {
		return isset( $this->comment->{ $property } );
	}

	/**
	 * Magic getter.
	 *
	 * @since [version]
	 *
	 * @param  string $property Property name.
	 *
	 * @return mixed            Property value.
	 */
	public function __get( $property ) {
		return $this->comment->{ $property };
	}

	/**
	 * Magic caller.
	 *
	 * @since [version]
	 *
	 * @param  string $method Method name.
	 * @param  array  $args   Method arguments.
	 *
	 * @return mixed          Method return value.
	 */
	public function __call( $method, $args ) {
		return call_user_func_array( array( $this->comment, $method ), $args );
	}

	/**
	 * Converts object to array.
	 *
	 * @since [version]
	 *
	 * @return array Object as array.
	 */
	public function to_array() {
		$vars = get_object_vars( $this );
		unset( $vars['comment'] );

		return array_merge( $this->comment->to_array(), $vars );
	}

	/**
	 * Gets selector.
	 *
	 * @since [version]
	 *
	 * @return WP_Annotation_Selector|null Selector. Null on failure.
	 */
	public function get_selector() {
		$selector = $this->get_meta( '_selector' );

		if ( $selector ) {
			$selector = WP_Annotation_Selector::get_instance( $selector );
		}

		return $selector ? $selector : null;
	}

	/**
	 * Gets meta.
	 *
	 * @since [version]
	 *
	 * @param string $key    Meta key.
	 * @param bool   $single Whether to return a single value. Default is true.
	 *
	 * @return mixed         Array if `$single` is false. Value if `$single` is true.
	 */
	public function get_meta( $key, $single = true ) {
		return get_comment_meta( $this->comment_ID, $key, $single );
	}

	/**
	 * Updates meta.
	 *
	 * @since [version]
	 *
	 * @param string $key        Meta key.
	 * @param mixed  $value      Meta value.
	 * @param mixed  $prev_value Previous value to check. Default is `''`.
	 *
	 * @return int|bool          Meta ID if key didn't exist, true on success, false on failure.
	 */
	public function update_meta( $key, $value, $prev_value = '' ) {
		return update_comment_meta( $this->comment_ID, $key, $value, $prev_value );
	}

	/**
	 * Gets parent post.
	 *
	 * @since [version]
	 *
	 * @return WP_Post|null Post object. Null on failure.
	 */
	public function get_post() {
		if ( ! $this->comment_post_ID ) {
			return null;
		}

		return get_post( $this->comment_post_ID );
	}

	/**
	 * Gets parent post type object.
	 *
	 * @since [version]
	 *
	 * @return WP_Post_Type|null Post type object. Null on failure.
	 */
	public function get_post_type() {
		$post = $this->get_post();

		if ( ! $post ) {
			return null;
		}

		return get_post_type_object( $post->post_type );
	}

	/**
	 * Gets parent post status object.
	 *
	 * @since [version]
	 *
	 * @return object|null Post status object. Null on failure.
	 */
	public function get_post_status() {
		$post = $this->get_post();

		if ( ! $post ) {
			return null;
		}

		return get_post_status_object( get_post_status( $post ) );
	}
}
