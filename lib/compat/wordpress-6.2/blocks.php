<?php
/**
 * Updates the blocks.php file
 *
 * @package gutenberg
 */

if ( ! function_exists( '_removed_hooks_from_the_content' ) ) {
	/**
	 * Retrieve a list of hooks removed from the `the_content` filter at a specified priority,
	 * or remove an additional one.
	 *
	 * @since 6.2.0
	 * @access private
	 *
	 * @param int                         $priority The priority to check.
	 * @param callable|string|array|false $callback Optional. The callback to remove.
	 *
	 * @return array All hooks removed from the specified priority.
	 */
	function _removed_hooks_from_the_content( $priority, $callback = false ) {
		static $removed_hooks = array();

		if ( is_callable( $callback ) && is_int( $priority ) && 0 <= $priority ) {
			remove_filter( 'the_content', $callback, $priority );

			if ( ! isset( $removed_hooks[ $priority ] ) ) {
				$removed_hooks[ $priority ] = array();
			}

			if ( ! in_array( $callback, $removed_hooks[ $priority ], true ) ) {
				$removed_hooks[ $priority ][] = $callback;
			}
		}

		return isset( $removed_hooks[ $priority ] ) ? $removed_hooks[ $priority ] : array();
	}
}

if ( ! function_exists( '_restore_hooks_to_the_content' ) ) {
	/**
	 * If do_blocks() needs to remove a hook from the `the_content` filter, this re-adds it afterwards,
	 * for subsequent `the_content` usage.
	 *
	 * @since 6.2.0
	 * @access private
	 *
	 * @param string $content The post content running through this filter.
	 * @return string The unmodified content.
	 */
	function _restore_hooks_to_the_content( $content ) {
		$current_priority = has_filter( 'the_content', '_restore_hooks_to_the_content' );

		foreach ( _removed_hooks_from_the_content( $current_priority - 1 ) as $hook ) {
			add_filter( 'the_content', $hook, $current_priority - 1 );
			remove_filter( 'the_content', '_restore_hooks_to_the_content', $current_priority );
		}

		return $content;
	}
}
