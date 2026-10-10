<?php
/**
 * Copies the files that saved content loads from installed themes, other than
 * the active theme and its parent, into the Media Library. These files come
 * from patterns inserted from other themes, and copying them keeps the content
 * working if those themes are removed.
 *
 * The copying follows how theme starter content copies a theme's images into
 * the Media Library.
 *
 * @package gutenberg
 */

/**
 * Copies a theme file into the Media Library, reusing an earlier copy whose
 * file still exists.
 *
 * @param string $file_path Absolute path of the theme file.
 * @param string $source    Theme stylesheet and the file's path in the theme,
 *                          which identify earlier copies.
 * @return int|WP_Error Attachment ID, or an error if the file couldn't be copied.
 */
function gutenberg_copy_theme_file_to_media_library( $file_path, $source ) {
	$existing = get_posts(
		array(
			'post_type'      => 'attachment',
			'post_status'    => 'any',
			'meta_key'       => '_gutenberg_theme_file', // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
			'meta_value'     => $source, // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_value
			'fields'         => 'ids',
			'posts_per_page' => 1,
		)
	);
	if ( $existing ) {
		$attached_file = get_attached_file( $existing[0] );
		if ( $attached_file && file_exists( $attached_file ) ) {
			return $existing[0];
		}
	}

	require_once ABSPATH . 'wp-admin/includes/file.php';
	require_once ABSPATH . 'wp-admin/includes/media.php';
	require_once ABSPATH . 'wp-admin/includes/image.php';

	// Sideloading moves the file it's given, so copy the theme's file first.
	$temp_file = wp_tempnam( wp_basename( $file_path ) );
	if ( ! $temp_file || ! copy( $file_path, $temp_file ) ) {
		return new WP_Error( 'gutenberg_theme_file_copy_failed', __( 'The theme file could not be copied.', 'gutenberg' ) );
	}

	$attachment_id = media_handle_sideload(
		array(
			'name'     => wp_basename( $file_path ),
			'tmp_name' => $temp_file,
		)
	);
	if ( is_wp_error( $attachment_id ) ) {
		// media_handle_sideload() only removes the temporary file on success.
		if ( file_exists( $temp_file ) ) {
			wp_delete_file( $temp_file );
		}
		return $attachment_id;
	}

	update_post_meta( $attachment_id, '_gutenberg_theme_file', $source );
	return $attachment_id;
}

/**
 * Before content is saved, copies the files it loads from installed themes
 * other than the active one into the Media Library, and points the content to
 * the copies. Files that can't be copied keep their theme URL.
 *
 * @param array $data Slashed post data about to be saved.
 * @return array Post data pointing to the copied files.
 */
function gutenberg_copy_installed_theme_files( $data ) {
	if (
		empty( $data['post_content'] ) ||
		'attachment' === $data['post_type'] ||
		! current_user_can( 'upload_files' )
	) {
		return $data;
	}

	$content = wp_unslash( $data['post_content'] );
	foreach ( wp_get_themes() as $theme ) {
		if ( in_array( $theme->get_stylesheet(), array( get_stylesheet(), get_template() ), true ) ) {
			continue;
		}
		$theme_uri = $theme->get_stylesheet_directory_uri() . '/';
		if ( ! str_contains( $content, $theme_uri ) ) {
			continue;
		}
		$theme_directory = realpath( $theme->get_stylesheet_directory() ) . DIRECTORY_SEPARATOR;

		// A file URL ends where the markup or CSS around it does.
		$content = preg_replace_callback(
			'#' . preg_quote( $theme_uri, '#' ) . '[^\s"\'()<>\\\\?\#]+#',
			static function ( $matches ) use ( $theme, $theme_uri, $theme_directory ) {
				$url           = $matches[0];
				$relative_path = rawurldecode( substr( $url, strlen( $theme_uri ) ) );
				$file_path     = realpath( $theme_directory . $relative_path );

				// Only copy files inside the theme folder that WordPress accepts as uploads.
				if (
					! $file_path ||
					! str_starts_with( $file_path, $theme_directory ) ||
					! wp_check_filetype( $file_path )['type']
				) {
					return $url;
				}

				$attachment_id = gutenberg_copy_theme_file_to_media_library(
					$file_path,
					$theme->get_stylesheet() . '/' . $relative_path
				);
				return is_wp_error( $attachment_id ) ? $url : wp_get_attachment_url( $attachment_id );
			},
			$content
		);
	}

	$data['post_content'] = wp_slash( $content );
	return $data;
}
add_filter( 'wp_insert_post_data', 'gutenberg_copy_installed_theme_files' );
