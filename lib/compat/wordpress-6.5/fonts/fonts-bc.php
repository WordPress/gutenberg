<?php
/**
 * Font Library Backward Compatibility.
 *
 * Do not merge this file to WordPress Core. It is for supporting Gutenberg only.
 *
 * @package    Gutenberg
 * @subpackage Font Library
 * @since      6.5.0
 */

/**
 * Convert legacy font family posts to the new format.
 */
function gutenberg_convert_legacy_font_family_format() {
	if ( get_option( 'gutenberg_font_family_format_converted' ) ) {
		return;
	}

	$font_families = new WP_Query(
		array(
			'post_type'              => 'wp_font_family',
			// Set a maximum, but in reality there will be far less than this.
			'posts_per_page'         => 999,
			'update_post_term_cache' => false,
		)
	);

	foreach ( $font_families->get_posts() as $font_family ) {
		$already_converted = get_post_meta( $font_family->ID, '_gutenberg_legacy_font_family', true );
		if ( $already_converted ) {
			continue;
		}

		// Stash the old font family content in a meta field just in case we need it.
		update_post_meta( $font_family->ID, '_gutenberg_legacy_font_family', $font_family->post_content );

		$font_family_json = json_decode( $font_family->post_content, true );
		if ( ! $font_family_json ) {
			continue;
		}

		$font_faces = isset( $font_family_json['fontFace'] ) ? $font_family_json['fontFace'] : array();
		unset( $font_family_json['fontFace'] );

		// Save wp_font_face posts within the family.
		foreach ( $font_faces as $font_face ) {
			$args                 = array();
			$args['post_type']    = 'wp_font_face';
			$args['post_title']   = WP_Font_Utils::get_font_face_slug( $font_face );
			$args['post_name']    = sanitize_title( $args['post_title'] );
			$args['post_status']  = 'publish';
			$args['post_parent']  = $font_family->ID;
			$args['post_content'] = wp_json_encode( $font_face );

			$font_face_id = wp_insert_post( wp_slash( $args ) );

			$file_urls = (array) ( isset( $font_face['src'] ) ? $font_face['src'] : array() );

			foreach ( $file_urls as $file_url ) {
				// continue if the file is not local.
				if ( false === strpos( $file_url, site_url() ) ) {
					continue;
				}

				$relative_path = basename( $file_url );
				update_post_meta( $font_face_id, '_wp_font_face_file', $relative_path );
			}
		}

		// Update the font family post to remove the font face data.
		$args               = array();
		$args['ID']         = $font_family->ID;
		$args['post_title'] = isset( $font_family_json['name'] ) ? $font_family_json['name'] : '';
		$args['post_name']  = sanitize_title( $font_family_json['slug'] );

		unset( $font_family_json['name'] );
		unset( $font_family_json['slug'] );

		$args['post_content'] = wp_json_encode( $font_family_json );

		wp_update_post( wp_slash( $args ) );
	}

	update_option( 'gutenberg_font_family_format_converted', true );
}
add_action( 'init', 'gutenberg_convert_legacy_font_family_format' );
