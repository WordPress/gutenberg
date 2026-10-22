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
 * Returns the URL of each folder that holds themes.
 *
 * @param array[] $theme_folders The installed themes' folders, as returned by search_theme_directories().
 * @return string[] Theme root URLs, by theme root path.
 */
function gutenberg_get_theme_root_urls( $theme_folders ) {
	$urls = array();
	foreach ( (array) $theme_folders as $stylesheet => $theme_folder ) {
		$theme_root = $theme_folder['theme_root'];
		if ( ! isset( $urls[ $theme_root ] ) ) {
			$urls[ $theme_root ] = get_theme_root_uri( $stylesheet, $theme_root );
		}
	}
	return $urls;
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

	// This runs on every save and most content loads no theme files, so look
	// for the name of a folder that holds themes before looking for themes.
	$might_load_theme_files = false;
	foreach ( (array) $GLOBALS['wp_theme_directories'] as $theme_root ) {
		if ( str_contains( $content, '/' . wp_basename( $theme_root ) . '/' ) ) {
			$might_load_theme_files = true;
			break;
		}
	}
	if ( ! $might_load_theme_files ) {
		return $data;
	}

	$theme_folders = search_theme_directories();
	$active_themes = array( get_stylesheet(), get_template() );
	foreach ( gutenberg_get_theme_root_urls( $theme_folders ) as $theme_root_url ) {
		$theme_root_url = trailingslashit( $theme_root_url );
		if ( ! str_contains( $content, $theme_root_url ) ) {
			continue;
		}

		// A file URL ends where the markup or CSS around it does.
		$content = preg_replace_callback(
			'#' . preg_quote( $theme_root_url, '#' ) . '[^\s"\'()<>\\\\?\#]+#',
			static function ( $matches ) use ( $theme_root_url, $theme_folders, $active_themes ) {
				$url  = $matches[0];
				$path = rawurldecode( substr( $url, strlen( $theme_root_url ) ) );

				// A theme can be in a subfolder of the theme folder, like `pub/theme`.
				$parts      = explode( '/', $path );
				$stylesheet = null;
				for ( $length = 1; $length <= 2 && $length < count( $parts ); $length++ ) {
					$folder = implode( '/', array_slice( $parts, 0, $length ) );
					if ( isset( $theme_folders[ $folder ] ) ) {
						$stylesheet = $folder;
						break;
					}
				}
				if ( ! $stylesheet || in_array( $stylesheet, $active_themes, true ) ) {
					return $url;
				}

				$theme = wp_get_theme( $stylesheet );
				if ( ! $theme->exists() || $theme->errors() ) {
					return $url;
				}

				$theme_directory = realpath( $theme->get_stylesheet_directory() ) . DIRECTORY_SEPARATOR;
				$relative_path   = substr( $path, strlen( $stylesheet ) + 1 );
				$file_path       = realpath( $theme_directory . $relative_path );

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
					$stylesheet . '/' . $relative_path
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
