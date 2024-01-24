<?php
// @core-merge: Do not include these tests, they are for Gutenberg only.

/**
 * Test deleting converting legacy font family posts into font family and font faces.
 *
 * @package WordPress
 * @subpackage Font Library
 */
class Tests_Font_Family_Backwards_Compatibility extends WP_UnitTestCase {
	public function set_up() {
		parent::set_up();

		delete_option( 'gutenberg_font_family_format_converted' );
	}

	public function tear_down() {
		parent::tear_down();

		delete_option( 'gutenberg_font_family_format_converted' );
	}

	public function test_font_faces_with_remote_src() {
		$legacy_content = '{"fontFace":[{"fontFamily":"Open Sans","fontStyle":"normal","fontWeight":"400","preview":"https://s.w.org/images/fonts/16.7/previews/open-sans/open-sans-400-normal.svg","src":"https://fonts.gstatic.com/s/opensans/v35/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0C4nY1M2xLER.ttf"},{"fontFamily":"Open Sans","fontStyle":"italic","fontWeight":"400","preview":"https://s.w.org/images/fonts/16.7/previews/open-sans/open-sans-400-italic.svg","src":"https://fonts.gstatic.com/s/opensans/v35/memQYaGs126MiZpBA-UFUIcVXSCEkx2cmqvXlWq8tWZ0Pw86hd0Rk8ZkaVcUwaERZjA.ttf"},{"fontFamily":"Open Sans","fontStyle":"normal","fontWeight":"700","preview":"https://s.w.org/images/fonts/16.7/previews/open-sans/open-sans-700-normal.svg","src":"https://fonts.gstatic.com/s/opensans/v35/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsg-1y4nY1M2xLER.ttf"}],"fontFamily":"\'Open Sans\', sans-serif","name":"Open Sans","preview":"https://s.w.org/images/fonts/16.7/previews/open-sans/open-sans.svg","slug":"open-sans"}';

		$font_family_id = $this->create_font_family( $legacy_content );

		gutenberg_convert_legacy_font_family_format();

		$font_family = get_post( $font_family_id );
		$font_faces  = $this->get_font_faces( $font_family_id );

		list( $font_face1, $font_face2, $font_face3 ) = $font_faces;

		// Updated font family post.
		$this->assertSame( 'wp_font_family', $font_family->post_type );
		$this->assertSame( 'publish', $font_family->post_status );

		$font_family_title = 'Open Sans';
		$this->assertSame( $font_family_title, $font_family->post_title );

		$font_family_slug = 'open-sans';
		$this->assertSame( $font_family_slug, $font_family->post_name );

		$font_family_content = wp_json_encode( json_decode( '{"fontFamily":"\'Open Sans\', sans-serif","preview":"https://s.w.org/images/fonts/16.7/previews/open-sans/open-sans.svg"}', true ) );
		$this->assertSame( $font_family_content, $font_family->post_content );

		$meta = get_post_meta( $font_family_id, '_gutenberg_legacy_font_family', true );
		$this->assertSame( $legacy_content, $meta );

		// First font face post.
		$this->assertSame( 'wp_font_face', $font_face1->post_type );
		$this->assertSame( $font_family_id, $font_face1->post_parent );
		$this->assertSame( 'publish', $font_face1->post_status );

		$font_face1_title = 'open sans;normal;400;100%;U+0-10FFFF';
		$this->assertSame( $font_face1_title, $font_face1->post_title );
		$this->assertSame( sanitize_title( $font_face1_title ), $font_face1->post_name );

		$font_face1_content = wp_json_encode( json_decode( '{"fontFamily":"Open Sans","fontStyle":"normal","fontWeight":"400","preview":"https://s.w.org/images/fonts/16.7/previews/open-sans/open-sans-400-normal.svg","src":"https://fonts.gstatic.com/s/opensans/v35/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0C4nY1M2xLER.ttf"}' ) );
		$this->assertSame( $font_face1_content, $font_face1->post_content );

		// With a remote url, file post meta should not be set.
		$meta = get_post_meta( $font_face1->ID, '_wp_font_face_file', true );
		$this->assertSame( '', $meta );

		// Second font face post.
		$this->assertSame( 'wp_font_face', $font_face2->post_type );
		$this->assertSame( $font_family_id, $font_face2->post_parent );
		$this->assertSame( 'publish', $font_face2->post_status );

		$font_face2_title = 'open sans;italic;400;100%;U+0-10FFFF';
		$this->assertSame( $font_face2_title, $font_face2->post_title );
		$this->assertSame( sanitize_title( $font_face2_title ), $font_face2->post_name );

		$font_face2_content = wp_json_encode( json_decode( '{"fontFamily":"Open Sans","fontStyle":"italic","fontWeight":"400","preview":"https://s.w.org/images/fonts/16.7/previews/open-sans/open-sans-400-italic.svg","src":"https://fonts.gstatic.com/s/opensans/v35/memQYaGs126MiZpBA-UFUIcVXSCEkx2cmqvXlWq8tWZ0Pw86hd0Rk8ZkaVcUwaERZjA.ttf"}' ) );
		$this->assertSame( $font_face2_content, $font_face2->post_content );

		// With a remote url, file post meta should not be set.
		$meta = get_post_meta( $font_face2->ID, '_wp_font_face_file', true );
		$this->assertSame( '', $meta );

		// Third font face post.
		$this->assertSame( 'wp_font_face', $font_face3->post_type );
		$this->assertSame( $font_family_id, $font_face3->post_parent );
		$this->assertSame( 'publish', $font_face3->post_status );

		$font_face3_title = 'open sans;normal;700;100%;U+0-10FFFF';
		$this->assertSame( $font_face3_title, $font_face3->post_title );
		$this->assertSame( sanitize_title( $font_face3_title ), $font_face3->post_name );

		$font_face3_content = wp_json_encode( json_decode( '{"fontFamily":"Open Sans","fontStyle":"normal","fontWeight":"700","preview":"https://s.w.org/images/fonts/16.7/previews/open-sans/open-sans-700-normal.svg","src":"https://fonts.gstatic.com/s/opensans/v35/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsg-1y4nY1M2xLER.ttf"}' ) );
		$this->assertSame( $font_face3_content, $font_face3->post_content );

		// With a remote url, file post meta should not be set.
		$meta = get_post_meta( $font_face3->ID, '_wp_font_face_file', true );
		$this->assertSame( '', $meta );

		wp_delete_post( $font_family_id, true );
		wp_delete_post( $font_face1->ID, true );
		wp_delete_post( $font_face2->ID, true );
		wp_delete_post( $font_face3->ID, true );
	}

	public function test_font_faces_with_local_src() {
		$legacy_content = '{"fontFace":[{"fontFamily":"Open Sans","fontStyle":"normal","fontWeight":"400","preview":"https://s.w.org/images/fonts/16.7/previews/open-sans/open-sans-400-normal.svg","src":"' . site_url() . '/wp-content/fonts/open-sans_normal_400.ttf"}],"fontFamily":"\'Open Sans\', sans-serif","name":"Open Sans","preview":"https://s.w.org/images/fonts/16.7/previews/open-sans/open-sans.svg","slug":"open-sans"}';

		$font_family_id = $this->create_font_family( $legacy_content );

		gutenberg_convert_legacy_font_family_format();

		$font_faces = $this->get_font_faces( $font_family_id );
		$this->assertCount( 1, $font_faces );
		$font_face = reset( $font_faces );

		// Check that file meta is present.
		$file_path = 'open-sans_normal_400.ttf';
		$meta      = get_post_meta( $font_face->ID, '_wp_font_face_file', true );
		$this->assertSame( $file_path, $meta );

		wp_delete_post( $font_family_id, true );
		wp_delete_post( $font_face->ID, true );
	}

	public function test_migration_only_runs_once() {
		$legacy_content = '{"fontFace":[],"fontFamily":"\'Open Sans\', sans-serif","name":"Open Sans","preview":"","slug":"open-sans"}';

		// Simulate that the migration has already run.
		update_option( 'gutenberg_font_family_format_converted', true );

		$font_family_id = $this->create_font_family( $legacy_content );

		gutenberg_convert_legacy_font_family_format();

		// Meta with backup content will not be present if migration isn't triggered.
		$meta = get_post_meta( $font_family_id, '_gutenberg_legacy_font_family', true );
		$this->assertSame( '', $meta );

		wp_delete_post( $font_family_id, true );
	}

	protected function create_font_family( $content ) {
		return wp_insert_post(
			array(
				'post_type'    => 'wp_font_family',
				'post_status'  => 'publish',
				'post_title'   => 'Open Sans',
				'post_name'    => 'open-sans',
				'post_content' => $content,
			)
		);
	}

	protected function get_font_faces( $font_family_id ) {
		return get_posts(
			array(
				'post_parent' => $font_family_id,
				'post_type'   => 'wp_font_face',
				'order'       => 'ASC',
				'orderby'     => 'id',
			)
		);
	}
}
