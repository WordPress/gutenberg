<?php
/**
 * Annotations API: WP_Annotation_Utils class
 *
 * @package gutenberg
 * @since [version]
 */

/**
 * Annotation utilities.
 *
 * @since [version]
 */
final class WP_Annotation_Utils {
	/**
	 * Translates/normalizes a comment's status.
	 *
	 * Matches normalized statuses returned by {@see wp_get_comment_status()}.
	 *
	 * @since [version]
	 *
	 * @param  string $status Comment status.
	 *
	 * @return string         'approved', 'unapproved', 'spam', 'trash', or a custom
	 *                        status. Returns an empty string on failure.
	 *
	 * @see wp_get_comment_status()
	 */
	public static function translate_comment_status( $status ) {
		$status = (string) $status;

		switch ( $status ) {
			case 'approved':
			case 'approve':
			case '1':
				return 'approved';

			case 'hold':
			case '0':
				return 'unapproved';
		}

		return $status;
	}

	/**
	 * Gets comment status (supports custom statuses).
	 *
	 * Unlike {@see wp_get_comment_status()}, this supports custom statuses. Otherwise,
	 * it closely resembles {@see wp_get_comment_status()}.
	 *
	 * @since [version]
	 *
	 * @param  WP_Comment|string|int $comment    Comment object or ID.
	 * @param  bool                  $check_meta Optional. Default is false. If true,
	 *                                           return would-be status if restored
	 *                                           from spam or trash.
	 *
	 * @return string|bool                       'approved', 'unapproved', 'spam',
	 *                                           'trash', or a custom status.
	 *                                           False on failure.
	 *
	 * @see wp_get_comment_status()
	 */
	public static function get_comment_status( $comment, $check_meta = false ) {
		if ( ! $comment ) {
			return false;
		}

		$comment = get_comment( $comment );

		if ( ! $comment ) {
			return false;
		}

		$status = $comment->comment_approved;
		$status = self::translate_comment_status( $status );

		if ( $check_meta && in_array( $status, array( 'spam', 'trash' ), true ) ) {
			$meta_status = get_comment_meta( $comment->comment_ID, '_wp_trash_meta_status', true );
			$status      = self::translate_comment_status( $meta_status ? $meta_status : '0' );
		}

		return $status ? $status : false;
	}

	/**
	 * Sets comment status (supports custom statuses).
	 *
	 * Unlike {@see wp_set_comment_status()}, this supports custom statuses. Otherwise,
	 * it closely resembles {@see wp_set_comment_status()}.
	 *
	 * @since [version]
	 *
	 * @param  WP_Comment|string|int $comment    Comment object or ID.
	 * @param  string                $new_status New status. Supports custom statuses.
	 *
	 * @return bool|WP_Error                     True on comment status success.
	 *                                           False (or a {@see WP_Error}) on failure.
	 *
	 * @see wp_set_comment_status()
	 */
	public static function set_comment_status( $comment, $new_status ) {
		global $wpdb;

		if ( ! $comment ) {
			return false;
		}

		$old_comment = get_comment( $comment );
		$old_comment = $old_comment ? clone $old_comment : null;

		if ( ! $old_comment ) {
			return false;
		}

		$new_status     = (string) $new_status;
		$new_raw_status = $new_status; // Before normalizing.
		$old_raw_status = $old_comment->comment_approved;

		switch ( $new_status ) {
			case 'approved':
			case 'approve':
			case '1':
				$new_status = '1';
				add_action( 'wp_set_comment_status', 'wp_new_comment_notify_postauthor' );
				break;

			case 'hold':
			case '0':
				$new_status = '0';
				break;
		}

		if ( ! $wpdb->update(
			$wpdb->comments,
			array( 'comment_approved' => $new_status ),
			array( 'comment_ID' => $old_comment->comment_ID )
		) ) {
			return false;
		}

		clean_comment_cache( $old_comment->comment_ID );
		$new_comment = get_comment( $old_comment->comment_ID );

		/** This filter is documented in wp-includes/comment.php */
		do_action( 'wp_set_comment_status', $new_comment->comment_ID, $new_raw_status );

		wp_transition_comment_status( $new_raw_status, $old_raw_status, $new_comment );
		wp_update_comment_count( $new_comment->comment_post_ID );

		return true;
	}

	/**
	 * Removes a comment from spam (supports custom restoration statuses).
	 *
	 * Unlike {@see wp_unspam_comment()}, this supports custom restoration statuses.
	 * Otherwise, it closely resembles {@see wp_unspam_comment()}.
	 *
	 * @since [version]
	 *
	 * @param  WP_Comment|string|int $comment Comment object or ID.
	 *
	 * @return bool                           True on success. False on failure.
	 *
	 * @see wp_unspam_comment()
	 */
	public static function unspam_comment( $comment ) {
		if ( ! $comment ) {
			return false;
		}

		$comment = get_comment( $comment );

		if ( ! $comment ) {
			return false;
		}

		/** This action is documented in wp-includes/comment.php */
		do_action( 'unspam_comment', $comment->comment_ID, $comment );

		$status = (string) get_comment_meta( $comment->comment_ID, '_wp_trash_meta_status', true );
		$status = $status ? $status : '0';

		if ( self::set_comment_status( $comment, $status ) ) {
			delete_comment_meta( $comment->comment_ID, '_wp_trash_meta_status' );
			delete_comment_meta( $comment->comment_ID, '_wp_trash_meta_time' );

			/** This action is documented in wp-includes/comment.php */
			do_action( 'unspammed_comment', $comment->comment_ID, $comment );

			return true;
		}

		return false;
	}

	/**
	 * Removes a comment from trash (supports custom restoration statuses).
	 *
	 * Unlike {@see wp_untrash_comment()}, this supports custom restoration statuses.
	 * Otherwise, it closely resembles {@see wp_untrash_comment()}.
	 *
	 * @since [version]
	 *
	 * @param  WP_Comment|string|int $comment Comment object or ID.
	 *
	 * @return bool                           True on success. False on failure.
	 *
	 * @see wp_untrash_comment()
	 */
	public static function untrash_comment( $comment ) {
		if ( ! $comment ) {
			return false;
		}

		$comment = get_comment( $comment );

		if ( ! $comment ) {
			return false;
		}

		/** This action is documented in wp-includes/comment.php */
		do_action( 'untrash_comment', $comment->comment_ID, $comment );

		$status = (string) get_comment_meta( $comment->comment_ID, '_wp_trash_meta_status', true );
		$status = $status ? $status : '0';

		if ( self::set_comment_status( $comment, $status ) ) {
			delete_comment_meta( $comment->comment_ID, '_wp_trash_meta_time' );
			delete_comment_meta( $comment->comment_ID, '_wp_trash_meta_status' );

			/** This action is documented in wp-includes/comment.php */
			do_action( 'untrashed_comment', $comment->comment_ID, $comment );

			return true;
		}

		return false;
	}

	/**
	 * Queries additional REST API collection parameters.
	 *
	 * @since [version]
	 *
	 * @param array           $query_vars {@see WP_Query} vars.
	 * @param WP_REST_Request $request    REST API request.
	 *
	 * @return array                      Filtered query args.
	 *
	 * @see WP_Annotation_Utils::on_comments_clauses()
	 * @see WP_REST_Comments_Controller::get_items()
	 */
	public static function on_rest_comment_query( $query_vars, $request ) {
		if ( ! preg_match( '/\/annotations$/', $request->get_route() ) ) {
			return $query_vars;
		}

		// This allows annotations in comment query.
		// see: WP_Annotation_Utils::on_comments_clauses().
		$query_vars['cache_domain'] = 'annotations';

		if ( isset( $request['hierarchical'] ) ) {
			$query_vars['hierarchical'] = $request['hierarchical'];
		}

		$meta_queries = array();

		$vias = $request['via'];
		$vias = $vias ? (array) $vias : array();
		$vias = array_map( 'strval', $vias );

		if ( $vias ) {
			$meta_queries[] = array(
				'key'     => '_via',
				'value'   => $vias,
				'compare' => 'IN',
			);
		}

		if ( $meta_queries ) {
			if ( ! empty( $query_vars['meta_query'] ) ) {
				$query_vars['meta_query'] = array(
					'relation' => 'AND',
					$query_vars['meta_query'],
					array(
						'relation' => 'AND',
						$meta_queries,
					),
				);
			} else {
				$query_vars['meta_query'] = array(
					'relation' => 'AND',
					$meta_queries,
				);
			}
		}

		return $query_vars;
	}

	/**
	 * Filters WP_Comment_Query clauses.
	 *
	 * @since [version]
	 *
	 * @param  array            $pieces Array of comment query clauses.
	 * @param  WP_Comment_Query $query  Current {@see WP_Comment_Query} instance.
	 *
	 * @return array                    Array of comment query clauses.
	 *
	 * @see WP_Annotation_Utils::on_rest_comment_query()
	 * @see WP_Comment_Query::get_comment_ids()
	 */
	public static function on_comments_clauses( $pieces, $query ) {
		global $wpdb;

		/*
		 * Annotations can only be returned when 'cache_domain=annotations'. This keeps
		 * annotations out of any normal comment query. If a plugin wants to query annotations,
		 * it can set 'cache_domain=annotations' also.
		 */
		if ( 'annotations' !== $query->query_vars['cache_domain'] ) {
			$annotation_types = get_annotation_types();

			foreach ( $annotation_types as $key => $type ) {
				$annotation_types[ $key ] = $wpdb->prepare( '%s', $type );
			}

			$pieces['where'] .= $pieces['where'] ? ' AND ' : '';
			$pieces['where'] .= 'comment_type NOT IN (' . implode( ', ', $annotation_types ) . ')';
		}

		/*
		 * Work around a bug in WP_Comment_Query. If 'hierarchical' is given, WP_Comment_Query
		 * forces 'parent' to '0', even if 'parent__in' is defined. That's a problem because
		 * the REST API uses 'parent__in'. See: <https://git.io/vNc8j>
		 */
		if ( 'annotations' === $query->query_vars['cache_domain'] && $query->query_vars['hierarchical'] ) {
			// If performing a hierarchical comment query, WP_Comment_Query will set the 'parent' query var
			// to a value of 0 by default; i.e., if it wasn't defined already. That conflicts with 'parent__in'.
			if ( $query->query_vars['parent__in'] && ! $query->query_vars['parent'] ) {

				// So 'parent__in' is not empty, and 'parent' is empty (e.g., 0 or otherwise).
				// Now, if the clause itself contains 'comment_parent IN' as a result of 'parent__in'.
				if ( preg_match( '/\bcomment_parent\s+IN\b/i', $pieces['where'] ) ) {
					// Then remove the conflicting 'comment_parent =' SQL that is brought about by 'parent'.
					// In other words, we want to do away with 'parent' and let 'parent__in' work as expected.
					$pieces['where'] = preg_replace( '/\s+AND\s+comment_parent\s*\=\s*[0-9]+/', '', $pieces['where'] );
				}
			}
		}

		return $pieces;
	}

	/**
	 * Checks an annotation comment type.
	 *
	 * @since [version]
	 *
	 * @param  string $type Comment type.
	 *
	 * @return bool         True if comment is valid.
	 */
	public static function is_valid_type( $type ) {
		return in_array( $type, get_annotation_types(), true );
	}

	/**
	 * Checks an annotation comment status (or status action).
	 *
	 * @since [version]
	 *
	 * @param  string $status Comment status.
	 *
	 * @return bool           True if status is valid.
	 */
	public static function is_valid_status_or_action( $status ) {
		return self::is_valid_status( $status, true );
	}

	/**
	 * Checks an annotation comment status.
	 *
	 * @since [version]
	 *
	 * @param  string $status        Comment status.
	 * @param  bool   $allow_actions Allow actions? Default false.
	 *
	 * @return bool                  True if status is valid.
	 */
	public static function is_valid_status( $status, $allow_actions = false ) {
		$allow = get_annotation_statuses();

		if ( $allow_actions ) {
			$allow = array_merge( $allow, array( 'unspam', 'untrash' ) );
		}

		return in_array( $status, $allow, true );
	}

	/**
	 * Validates a W3C annotation client identifier.
	 *
	 * @since [version]
	 *
	 * @param  string $client The annotation client to check.
	 *
	 * @return bool           True if client is valid.
	 *
	 * @link https://www.w3.org/TR/annotation-model/#rendering-software
	 */
	public static function is_valid_client( $client ) {
		if ( '' === $client ) {
			return true; // Empty is OK.
		}

		if ( ! is_string( $client ) ) {
			return false;
		}
		$raw_client = $client;
		$client     = preg_replace( '/[^a-z0-9:_\-]/i', '', $client );
		$client     = substr( trim( $client, ':_-' ), 0, 250 );

		if ( ! $client || $client !== $raw_client ) {
			return false;
		}

		return true;
	}

	/**
	 * Validates a selector deeply.
	 *
	 * @since [version]
	 *
	 * @param  array $selector Selector to check.
	 *
	 * @return bool            True if selector is valid.
	 */
	public static function is_valid_selector( $selector ) {
		if ( array() === $selector ) {
			return true; // Empty is OK.
		}

		return (bool) WP_Annotation_Selector::get_instance( $selector );
	}

	/**
	 * Checks if comment content is empty.
	 *
	 * @since [version]
	 *
	 * @param string $content Content to check.
	 *
	 * @return bool           True if empty, if it's not a string, or the blog's charset
	 *                        is UTF-8 and it's invalid UTF-8.
	 */
	public static function is_content_empty( $content ) {
		if ( ! is_string( $content ) ) {
			return true;
		}

		$content = wp_check_invalid_utf8( $content );

		if ( false !== strpos( $content, '<' ) ) {
			// If it contains anything audible or visual it's not empty.
			if ( preg_match( '/\<(img|svg|audio|video|embed|object)[^<>]*\>/i', $content ) ) {
				return false;
			}
			// Else remove tags and require text.
			$content = wp_strip_all_tags( $content );
		}

		if ( empty( $content ) ) {
			return true;
		}

		// Strip whitespace including `&nbsp;` and everything that trim() handles too.
		$content = preg_replace( '/(?:' . wp_spaces_regexp() . '|[\0\x0B])/', '', $content );

		return empty( $content );
	}
}
