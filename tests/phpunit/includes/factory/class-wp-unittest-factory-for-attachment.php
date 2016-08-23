<?php

class WP_UnitTest_Factory_For_Attachment extends WP_UnitTest_Factory_For_Post {

	/**
	 * Create an attachment fixture.
	 *
	 * @param array $args {
	 *     Array of arguments. Accepts all arguments that can be passed to
	 *     wp_insert_attachment(), in addition to the following:
	 *     @type int    $post_parent ID of the post to which the attachment belongs.
	 *     @type string $file        Path of the attached file.
	 * }
	 * @param int   $legacy_parent Deprecated.
	 * @param array $legacy_args   Deprecated
	 */
	function create_object( $args, $legacy_parent = 0, $legacy_args = array() ) {
		// Backward compatibility for legacy argument format.
		if ( is_string( $args ) ) {
			$file = $args;
			$args = $legacy_args;
			$args['post_parent'] = $legacy_parent;
			$args['file'] = $file;
		}

		$r = array_merge( array(
			'file' => '',
			'post_parent' => 0,
		), $args );

		return wp_insert_attachment( $r, $r['file'], $r['post_parent'] );
	}

	function create_upload_object( $file, $parent = 0 ) {
		$contents = file_get_contents($file);
		$upload = wp_upload_bits(basename($file), null, $contents);

		$type = '';
		if ( ! empty($upload['type']) ) {
			$type = $upload['type'];
		} else {
			$mime = wp_check_filetype( $upload['file'] );
			if ($mime)
				$type = $mime['type'];
		}

		$attachment = array(
			'post_title' => basename( $upload['file'] ),
			'post_content' => '',
			'post_type' => 'attachment',
			'post_parent' => $parent,
			'post_mime_type' => $type,
			'guid' => $upload[ 'url' ],
		);

		// Save the data
		$id = wp_insert_attachment( $attachment, $upload[ 'file' ], $parent );
		wp_update_attachment_metadata( $id, wp_generate_attachment_metadata( $id, $upload['file'] ) );

		return $id;
	}
}
