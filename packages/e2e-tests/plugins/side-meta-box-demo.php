<?php
/**
 * Plugin Name: Gutenberg Test Plugin, Side Meta Box Demo
 *
 * A variety of classic meta boxes in the side and normal locations, with
 * plain saving, for trying out how the editor renders and saves them.
 *
 * @package gutenberg-test-side-meta-box-demo
 */

add_action(
	'add_meta_boxes',
	function () {
		add_meta_box(
			'demo-details-meta-box',
			'Details',
			function ( $post ) {
				$venue = get_post_meta( $post->ID, 'demo_venue', true );
				$date  = get_post_meta( $post->ID, 'demo_date', true );
				?>
				<p>
					<label for="demo-venue">Venue</label><br />
					<input type="text" id="demo-venue" name="demo_venue" class="widefat" value="<?php echo esc_attr( $venue ); ?>" />
				</p>
				<p>
					<label for="demo-date">Date</label><br />
					<input type="date" id="demo-date" name="demo_date" value="<?php echo esc_attr( $date ); ?>" />
				</p>
				<?php
			},
			'post',
			'side'
		);
		add_meta_box(
			'demo-options-meta-box',
			'Display options',
			function ( $post ) {
				$featured = get_post_meta( $post->ID, 'demo_featured', true );
				$layout   = get_post_meta( $post->ID, 'demo_layout', true );
				?>
				<p>
					<label>
						<input type="checkbox" name="demo_featured" value="1" <?php checked( $featured, '1' ); ?> />
						Show on the front page
					</label>
				</p>
				<p>
					<label for="demo-layout">Layout</label><br />
					<select id="demo-layout" name="demo_layout">
						<option value="">Default</option>
						<option value="wide" <?php selected( $layout, 'wide' ); ?>>Wide</option>
						<option value="narrow" <?php selected( $layout, 'narrow' ); ?>>Narrow</option>
					</select>
				</p>
				<?php
			},
			'post',
			'side'
		);
		add_meta_box(
			'demo-notes-meta-box',
			'Notes',
			function ( $post ) {
				$notes = get_post_meta( $post->ID, 'demo_notes', true );
				?>
				<p>
					<label for="demo-notes">Internal notes, not shown to readers</label>
				</p>
				<textarea id="demo-notes" name="demo_notes" class="widefat" rows="4"><?php echo esc_textarea( $notes ); ?></textarea>
				<?php
			},
			'post',
			'normal'
		);
		add_meta_box(
			'demo-summary-meta-box',
			'Summary',
			function ( $post ) {
				$summary = get_post_meta( $post->ID, 'demo_summary', true );
				wp_editor(
					$summary,
					'demo_summary',
					array(
						'textarea_rows' => 6,
						'media_buttons' => false,
						'teeny'         => true,
					)
				);
			},
			'post',
			'normal'
		);
		add_meta_box(
			'demo-status-meta-box',
			'Review status',
			function ( $post ) {
				$status = get_post_meta( $post->ID, 'demo_status', true );
				foreach ( array( 'unreviewed', 'in-review', 'approved' ) as $value ) {
					printf(
						'<p><label><input type="radio" name="demo_status" value="%1$s" %2$s /> %3$s</label></p>',
						esc_attr( $value ),
						checked( $status, $value, false ),
						esc_html( ucwords( str_replace( '-', ' ', $value ) ) )
					);
				}
			},
			'post',
			'normal'
		);
	}
);

add_action(
	'save_post',
	function ( $post_id ) {
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}

		$fields = array(
			'demo_venue'    => 'sanitize_text_field',
			'demo_date'     => 'sanitize_text_field',
			'demo_layout'   => 'sanitize_text_field',
			'demo_notes'    => 'sanitize_textarea_field',
			'demo_summary'  => 'wp_kses_post',
			'demo_status'   => 'sanitize_text_field',
			'demo_featured' => 'sanitize_text_field',
		);

		foreach ( $fields as $field => $sanitize ) {
			if ( 'demo_featured' === $field ) {
				// Checkboxes are absent from the request when unchecked, so
				// only handle them when any demo field was submitted at all.
				if ( isset( $_POST['demo_venue'] ) ) {
					update_post_meta( $post_id, $field, isset( $_POST[ $field ] ) ? '1' : '' );
				}
				continue;
			}
			if ( isset( $_POST[ $field ] ) ) {
				update_post_meta( $post_id, $field, $sanitize( wp_unslash( $_POST[ $field ] ) ) );
			}
		}
	}
);
