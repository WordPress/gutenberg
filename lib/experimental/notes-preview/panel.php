<?php
/**
 * The review rail rendered on an active preview.
 *
 * Threads are rendered server-side, so the reviewer gets the discussion with
 * the first paint and the front-end module stays small: it handles selection,
 * keeps cards aligned with the content, and posts replies.
 *
 * @package gutenberg
 */

/**
 * Avatar colours, in the same order as AVATAR_BORDER_COLORS in
 * packages/editor/src/components/collab-sidebar/utils.js, so a person is the
 * same colour in the editor and on the preview.
 *
 * @var string[]
 */
const GUTENBERG_NOTES_PREVIEW_AUTHOR_COLORS = array(
	'#6F42C1', // Purple.
	'#D94145', // Red.
	'#FBBF24', // Orange.
	'#FF35EE', // Magenta.
	'#879F11', // Olive.
	'#0F766E', // Teal.
	'#00CFFF', // Cyan.
);

/**
 * Returns the colour assigned to a note author.
 *
 * @param int $user_id User ID.
 * @return string A `#RRGGBB` hex colour.
 */
function gutenberg_notes_preview_author_color( $user_id ) {
	$colors = GUTENBERG_NOTES_PREVIEW_AUTHOR_COLORS;

	return $colors[ absint( $user_id ) % count( $colors ) ];
}

/**
 * Collects the note threads on a post.
 *
 * Mirrors the tree building in useNoteThreads(): top-level notes are threads,
 * their children are replies, and a child carrying `_wp_note_status` is a
 * resolution record rather than something somebody said.
 *
 * @param int $post_id Post ID.
 * @return array[] Threads, in the order the conversations started.
 */
function gutenberg_notes_preview_get_threads( $post_id ) {
	static $cache = array();

	$post_id = (int) $post_id;

	// Both the enqueue pass and the render pass want the threads; one query is
	// enough for either.
	if ( isset( $cache[ $post_id ] ) ) {
		return $cache[ $post_id ];
	}

	$comments = get_comments(
		array(
			'post_id'                   => $post_id,
			'type'                      => 'note',
			'status'                    => 'all',
			'orderby'                   => 'comment_date_gmt',
			'order'                     => 'ASC',
			'update_comment_meta_cache' => true,
		)
	);

	$threads  = array();
	$children = array();

	foreach ( $comments as $comment ) {
		$parent_id = (int) $comment->comment_parent;

		if ( 0 === $parent_id ) {
			$threads[ (int) $comment->comment_ID ] = array(
				'comment'    => $comment,
				'replies'    => array(),
				'resolution' => null,
				'resolved'   => 1 === (int) $comment->comment_approved,
			);
			continue;
		}

		$children[ $parent_id ][] = $comment;
	}

	foreach ( $children as $parent_id => $replies ) {
		if ( ! isset( $threads[ $parent_id ] ) ) {
			continue;
		}

		foreach ( $replies as $reply ) {
			$status = get_comment_meta( $reply->comment_ID, '_wp_note_status', true );

			if ( $status ) {
				$threads[ $parent_id ]['resolution'] = array(
					'status'  => $status,
					'comment' => $reply,
				);
				continue;
			}

			$threads[ $parent_id ]['replies'][] = $reply;
		}
	}

	$cache[ $post_id ] = $threads;

	return $threads;
}

/**
 * Renders a note's body.
 *
 * The content was filtered through the comment allowlist on the way in, but it
 * is filtered again here: a row written by an `unfiltered_html` user, or
 * straight into the database, has not been through that allowlist.
 *
 * @param WP_Comment $comment Comment object.
 */
function gutenberg_notes_preview_render_content( $comment ) {
	$content = wp_kses(
		$comment->comment_content,
		wp_kses_allowed_html( 'pre_comment_content' )
	);

	echo '<div class="wp-notes-preview__content">' . wpautop( $content ) . '</div>';
}

/**
 * Renders the avatar, name and age of a note.
 *
 * @param WP_Comment $comment Comment object.
 */
function gutenberg_notes_preview_render_byline( $comment ) {
	$avatar = get_avatar_url( $comment, array( 'size' => 48 ) );
	$posted = strtotime( $comment->comment_date_gmt . ' GMT' );

	?>
	<div class="wp-notes-preview__byline">
		<img
			class="wp-notes-preview__avatar"
			src="<?php echo esc_url( $avatar ); ?>"
			alt=""
			width="24"
			height="24"
			loading="lazy"
			decoding="async"
		/>
		<span class="wp-notes-preview__author"><?php echo esc_html( get_comment_author( $comment ) ); ?></span>
		<time
			class="wp-notes-preview__time"
			datetime="<?php echo esc_attr( gmdate( 'c', $posted ) ); ?>"
		>
			<?php
			printf(
				/* translators: %s: Human-readable time difference, e.g. "2 hours". */
				esc_html__( '%s ago', 'gutenberg' ),
				esc_html( human_time_diff( $posted ) )
			);
			?>
		</time>
	</div>
	<?php
}

/**
 * Renders one thread card.
 *
 * @param int   $note_id  Top-level note ID.
 * @param array $thread   Thread data from gutenberg_notes_preview_get_threads().
 * @param bool  $can_reply Whether the viewer may reply.
 */
function gutenberg_notes_preview_render_thread( $note_id, $thread, $can_reply ) {
	$comment = $thread['comment'];
	$color   = gutenberg_notes_preview_author_color( $comment->user_id );
	$context = array(
		'noteId'       => (string) $note_id,
		'replyText'    => '',
		'isSubmitting' => false,
		'replyError'   => '',
	);

	?>
	<article
		class="wp-notes-preview__thread"
		data-note-id="<?php echo esc_attr( (string) $note_id ); ?>"
		data-author-color="<?php echo esc_attr( $color ); ?>"
		data-author-avatar="<?php echo esc_url( get_avatar_url( $comment, array( 'size' => 48 ) ) ); ?>"
		style="--wp-notes-preview-author-color:<?php echo esc_attr( $color ); ?>"
		tabindex="0"
		<?php echo wp_interactivity_data_wp_context( $context ); ?>
		data-wp-class--is-selected="state.isSelected"
		data-wp-on--click="actions.selectThread"
	>
		<?php
		gutenberg_notes_preview_render_byline( $comment );
		gutenberg_notes_preview_render_content( $comment );

		if ( ! empty( $thread['replies'] ) ) {
			echo '<ol class="wp-notes-preview__replies">';
			foreach ( $thread['replies'] as $reply ) {
				echo '<li>';
				gutenberg_notes_preview_render_byline( $reply );
				gutenberg_notes_preview_render_content( $reply );
				echo '</li>';
			}
			echo '</ol>';
		}

		if ( $thread['resolved'] && isset( $thread['resolution']['comment'] ) ) {
			printf(
				'<p class="wp-notes-preview__resolution">%s</p>',
				esc_html(
					sprintf(
						/* translators: %s: Name of the person who resolved the note. */
						__( 'Resolved by %s', 'gutenberg' ),
						get_comment_author( $thread['resolution']['comment'] )
					)
				)
			);
		}

		if ( $can_reply && ! $thread['resolved'] ) {
			?>
			<form class="wp-notes-preview__reply-form" data-wp-on--submit="actions.submitReply">
				<label class="screen-reader-text" for="wp-notes-preview-reply-<?php echo esc_attr( (string) $note_id ); ?>">
					<?php esc_html_e( 'Reply to this note', 'gutenberg' ); ?>
				</label>
				<textarea
					id="wp-notes-preview-reply-<?php echo esc_attr( (string) $note_id ); ?>"
					class="wp-notes-preview__textarea"
					rows="3"
					placeholder="<?php esc_attr_e( 'Reply…', 'gutenberg' ); ?>"
					data-wp-on--input="actions.updateReply"
				></textarea>
				<div class="wp-notes-preview__actions">
					<button
						type="submit"
						class="wp-notes-preview__button"
						data-wp-bind--disabled="!state.canSubmitReply"
					>
						<?php esc_html_e( 'Reply', 'gutenberg' ); ?>
					</button>
				</div>
				<p
					class="wp-notes-preview__error"
					role="alert"
					data-wp-text="context.replyError"
					data-wp-bind--hidden="!context.replyError"
				></p>
			</form>
			<?php
		}
		?>
	</article>
	<?php
}

/**
 * Prints the review rail.
 *
 * Hooked late on `wp_footer` so the rail sits at the end of the document and
 * the theme's own markup is left exactly as it was.
 */
function gutenberg_notes_preview_render_panel() {
	if ( ! gutenberg_notes_preview_is_active() ) {
		return;
	}

	$post_id = get_queried_object_id();
	$threads = gutenberg_notes_preview_get_threads( $post_id );

	$open     = array();
	$resolved = array();

	foreach ( $threads as $note_id => $thread ) {
		if ( $thread['resolved'] ) {
			$resolved[ $note_id ] = $thread;
		} else {
			$open[ $note_id ] = $thread;
		}
	}

	$can_reply = current_user_can( 'create_post_notes', $post_id );

	$root_context = array(
		'selectedId'   => '',
		'showResolved' => false,
		'isRailOpen'   => false,
	);

	?>
	<div
		class="wp-notes-preview-root"
		data-wp-interactive="gutenberg/notes-preview"
		<?php echo wp_interactivity_data_wp_context( $root_context ); ?>
		data-wp-init--board="callbacks.initBoard"
	>
		<div
			class="wp-notes-preview__indicators"
			aria-hidden="true"
			data-label-single="<?php esc_attr_e( 'Show the note on this block', 'gutenberg' ); ?>"
			<?php /* translators: %d: Number of notes on the block. */ ?>
			data-label-plural="<?php esc_attr_e( 'Show the %d notes on this block', 'gutenberg' ); ?>"
		></div>

		<button
			type="button"
			class="wp-notes-preview-toggle"
			data-wp-on--click="actions.toggleRail"
		>
			<?php
			printf(
				/* translators: %d: Number of unresolved notes. */
				esc_html( _n( '%d note', '%d notes', count( $open ), 'gutenberg' ) ),
				count( $open )
			);
			?>
		</button>

		<aside
			class="wp-notes-preview"
			aria-label="<?php esc_attr_e( 'Notes on this post', 'gutenberg' ); ?>"
			data-wp-class--show-resolved="context.showResolved"
			data-wp-class--is-open="context.isRailOpen"
		>
			<div class="wp-notes-preview__header">
				<h2 class="wp-notes-preview__title"><?php esc_html_e( 'Notes', 'gutenberg' ); ?></h2>
				<span class="wp-notes-preview__count">
					<?php
					printf(
						/* translators: %d: Number of unresolved notes. */
						esc_html( _n( '%d open', '%d open', count( $open ), 'gutenberg' ) ),
						count( $open )
					);
					?>
				</span>
				<?php if ( $resolved ) : ?>
					<button
						type="button"
						class="wp-notes-preview__button is-tertiary"
						style="margin-inline-start:auto"
						data-wp-on--click="actions.toggleResolved"
						data-wp-bind--aria-expanded="context.showResolved"
					>
						<?php
						printf(
							/* translators: %d: Number of resolved notes. */
							esc_html__( 'Resolved (%d)', 'gutenberg' ),
							count( $resolved )
						);
						?>
					</button>
				<?php endif; ?>
			</div>

			<p class="wp-notes-preview__notice">
				<?php esc_html_e( 'You are viewing the last saved version of this draft.', 'gutenberg' ); ?>
			</p>

			<div class="wp-notes-preview__scroller">
				<div class="wp-notes-preview__board">
					<?php
					if ( ! $open ) {
						printf(
							'<p class="wp-notes-preview__empty">%s</p>',
							esc_html__( 'No open notes on this post.', 'gutenberg' )
						);
					}

					foreach ( $open as $note_id => $thread ) {
						gutenberg_notes_preview_render_thread( $note_id, $thread, $can_reply );
					}
					?>
				</div>

				<?php if ( $resolved ) : ?>
					<div class="wp-notes-preview__resolved">
						<?php
						foreach ( $resolved as $note_id => $thread ) {
							gutenberg_notes_preview_render_thread( $note_id, $thread, false );
						}
						?>
					</div>
				<?php endif; ?>
			</div>
		</aside>
	</div>
	<?php
}

add_action( 'wp_footer', 'gutenberg_notes_preview_render_panel', 100 );

/**
 * Builds the per-note highlight rules.
 *
 * Each inline marker is tinted with its author's colour, matching
 * buildHighlightCss() in the editor: a soft tint at rest, stronger on hover.
 *
 * @param array $threads Threads from gutenberg_notes_preview_get_threads().
 * @return string CSS.
 */
function gutenberg_notes_preview_highlight_css( $threads ) {
	$rules = array();

	foreach ( $threads as $note_id => $thread ) {
		if ( $thread['resolved'] ) {
			continue;
		}

		$color    = gutenberg_notes_preview_author_color( $thread['comment']->user_id );
		$selector = sprintf( 'mark.wp-note[data-id="%d"]', (int) $note_id );

		$rules[] = sprintf( '%s{background-color:%s40;}', $selector, $color );
		$rules[] = sprintf(
			'%1$s:hover,%1$s:focus-within{background-color:%2$s80;}',
			$selector,
			$color
		);
	}

	return implode( '', $rules );
}

/**
 * Loads the rail's assets on an active preview.
 */
function gutenberg_notes_preview_enqueue_assets() {
	if ( ! gutenberg_notes_preview_is_active() ) {
		return;
	}

	$post_id = get_queried_object_id();

	wp_enqueue_script_module( '@wordpress/notes-preview' );
	wp_enqueue_style( 'wp-notes-preview' );

	/*
	 * Set here rather than alongside the markup: WP_Script_Modules serialises
	 * the interactivity state on `wp_footer` at priority 10, and the rail
	 * renders at 100. State added after that point never reaches the page, and
	 * the reply form would post to nowhere.
	 */
	wp_interactivity_state(
		'gutenberg/notes-preview',
		array(
			'postId'       => $post_id,
			'restUrl'      => rest_url( 'wp/v2/comments' ),
			'restNonce'    => wp_create_nonce( 'wp_rest' ),
			'canReply'     => current_user_can( 'create_post_notes', $post_id ),
			'genericError' => __( 'The reply could not be saved. Please try again.', 'gutenberg' ),
		)
	);

	$css = gutenberg_notes_preview_highlight_css(
		gutenberg_notes_preview_get_threads( $post_id )
	);

	if ( $css ) {
		wp_add_inline_style( 'wp-notes-preview', $css );
	}
}

add_action( 'wp_enqueue_scripts', 'gutenberg_notes_preview_enqueue_assets' );

/**
 * Flags the document so the page can make room for the rail.
 *
 * Printed in the head rather than set from the module, so the content is laid
 * out at its final width on the first paint.
 */
function gutenberg_notes_preview_print_html_class() {
	if ( ! gutenberg_notes_preview_is_active() ) {
		return;
	}

	wp_print_inline_script_tag(
		'document.documentElement.classList.add("wp-notes-preview-active");',
		array( 'id' => 'wp-notes-preview-html-class' )
	);
}

add_action( 'wp_head', 'gutenberg_notes_preview_print_html_class', 1 );
