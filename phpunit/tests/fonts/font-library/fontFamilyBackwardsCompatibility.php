<?php
// @core-merge: Do not include these tests, they are for Gutenberg only.

/**
 * Test deleting converting legacy font family posts into font family and font faces.
 *
 * @package WordPress
 * @subpackage Font Library
 *
 * @group fonts
 * @group font-library
 */
class Tests_Font_Family_Backwards_Compatibility extends WP_UnitTestCase {
	private $post_ids_to_delete = array();

	public function set_up() {
		parent::set_up();

		$this->post_ids_to_delete = array();
		delete_option( 'gutenberg_font_family_format_converted' );
	}

	public function tear_down() {
		foreach ( $this->post_ids_to_delete as $post_id ) {
			wp_delete_post( $post_id, true );
		}

		delete_option( 'gutenberg_font_family_format_converted' );

		parent::tear_down();
	}

	public function test_font_faces_with_remote_src() {
		$legacy_content = '{"fontFace":[{"fontFamily":"Open Sans","fontStyle":"normal","fontWeight":"400","preview":"https://s.w.org/images/fonts/16.7/previews/open-sans/open-sans-400-normal.svg","src":"https://fonts.gstatic.com/s/opensans/v35/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0C4nY1M2xLER.ttf"},{"fontFamily":"Open Sans","fontStyle":"italic","fontWeight":"400","preview":"https://s.w.org/images/fonts/16.7/previews/open-sans/open-sans-400-italic.svg","src":"https://fonts.gstatic.com/s/opensans/v35/memQYaGs126MiZpBA-UFUIcVXSCEkx2cmqvXlWq8tWZ0Pw86hd0Rk8ZkaVcUwaERZjA.ttf"},{"fontFamily":"Open Sans","fontStyle":"normal","fontWeight":"700","preview":"https://s.w.org/images/fonts/16.7/previews/open-sans/open-sans-700-normal.svg","src":"https://fonts.gstatic.com/s/opensans/v35/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsg-1y4nY1M2xLER.ttf"}],"fontFamily":"\'Open Sans\', sans-serif","name":"Open Sans","preview":"https://s.w.org/images/fonts/16.7/previews/open-sans/open-sans.svg","slug":"open-sans"}';

		$font_family_id = $this->create_font_family( $legacy_content );

		gutenberg_convert_legacy_font_family_format();

		$font_family = $this->get_post( $font_family_id );
		$font_faces  = $this->get_font_faces( $font_family_id );

		list( $font_face1, $font_face2, $font_face3 ) = $font_faces;

		// Updated font family post.
		$this->assertSame( 'wp_font_family', $font_family->post_type, 'The font family post type should be wp_font_family.' );
		$this->assertSame( 'publish', $font_family->post_status, 'The font family post status should be publish.' );

		$font_family_title = 'Open Sans';
		$this->assertSame( $font_family_title, $font_family->post_title, 'The font family post title should be Open Sans.' );

		$font_family_slug = 'open-sans';
		$this->assertSame( $font_family_slug, $font_family->post_name, 'The font family post name should be open-sans.' );

		$font_family_content = wp_json_encode( json_decode( '{"fontFamily":"\'Open Sans\', sans-serif","preview":"https://s.w.org/images/fonts/16.7/previews/open-sans/open-sans.svg"}', true ) );
		$this->assertSame( $font_family_content, $font_family->post_content, 'The font family post content should match.' );

		$meta = get_post_meta( $font_family_id, '_gutenberg_legacy_font_family', true );
		$this->assertSame( $legacy_content, $meta, 'The _gutenberg_legacy_font_family post meta content should match.' );

		// First font face post.
		$this->assertSame( 'wp_font_face', $font_face1->post_type, 'The 1st font face post type should be wp_font_face.' );
		$this->assertSame( $font_family_id, $font_face1->post_parent, 'The 1st font face post parent should match.' );
		$this->assertSame( 'publish', $font_face1->post_status, 'The 1st font face post status should be publish.' );

		$font_face1_title = 'open sans;normal;400;100%;U+0-10FFFF';
		$this->assertSame( $font_face1_title, $font_face1->post_title, 'The 1st font face post title should match.' );
		$this->assertSame( sanitize_title( $font_face1_title ), $font_face1->post_name, 'The 1st font face post name should match.' );

		$font_face1_content = wp_json_encode( json_decode( '{"fontFamily":"Open Sans","fontStyle":"normal","fontWeight":"400","preview":"https://s.w.org/images/fonts/16.7/previews/open-sans/open-sans-400-normal.svg","src":"https://fonts.gstatic.com/s/opensans/v35/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0C4nY1M2xLER.ttf"}' ) );
		$this->assertSame( $font_face1_content, $font_face1->post_content, 'The 1st font face post content should match.' );

		// With a remote url, file post meta should not be set.
		$meta = get_post_meta( $font_face1->ID, '_wp_font_face_file', true );
		$this->assertSame( '', $meta, 'The _wp_font_face_file post meta for the 1st font face should be an empty string.' );

		// Second font face post.
		$this->assertSame( 'wp_font_face', $font_face2->post_type, 'The 2nd font face post type should be wp_font_face.' );
		$this->assertSame( $font_family_id, $font_face2->post_parent, 'The 2md font face post type should be wp_font_face.' );
		$this->assertSame( 'publish', $font_face2->post_status, 'The 2nd font face post status should be publish.' );

		$font_face2_title = 'open sans;italic;400;100%;U+0-10FFFF';
		$this->assertSame( $font_face2_title, $font_face2->post_title, 'The 2nd font face post title should match.' );
		$this->assertSame( sanitize_title( $font_face2_title ), $font_face2->post_name, 'The 2nd font face post name should match.' );

		$font_face2_content = wp_json_encode( json_decode( '{"fontFamily":"Open Sans","fontStyle":"italic","fontWeight":"400","preview":"https://s.w.org/images/fonts/16.7/previews/open-sans/open-sans-400-italic.svg","src":"https://fonts.gstatic.com/s/opensans/v35/memQYaGs126MiZpBA-UFUIcVXSCEkx2cmqvXlWq8tWZ0Pw86hd0Rk8ZkaVcUwaERZjA.ttf"}' ) );
		$this->assertSame( $font_face2_content, $font_face2->post_content, 'The 2nd font face post content should match.' );

		// With a remote url, file post meta should not be set.
		$meta = get_post_meta( $font_face2->ID, '_wp_font_face_file', true );
		$this->assertSame( '', $meta, 'The _wp_font_face_file post meta for the 2nd font face should be an empty string.' );

		// Third font face post.
		$this->assertSame( 'wp_font_face', $font_face3->post_type, 'The 3rd font face post type should be wp_font_face.' );
		$this->assertSame( $font_family_id, $font_face3->post_parent, 'The 3rd font face post type should be wp_font_face.' );
		$this->assertSame( 'publish', $font_face3->post_status, 'The 3rd font face post status should be publish.' );

		$font_face3_title = 'open sans;normal;700;100%;U+0-10FFFF';
		$this->assertSame( $font_face3_title, $font_face3->post_title, 'The 3rd font face post title should match.' );
		$this->assertSame( sanitize_title( $font_face3_title ), $font_face3->post_name, 'The 3rd font face post name should match.' );

		$font_face3_content = wp_json_encode( json_decode( '{"fontFamily":"Open Sans","fontStyle":"normal","fontWeight":"700","preview":"https://s.w.org/images/fonts/16.7/previews/open-sans/open-sans-700-normal.svg","src":"https://fonts.gstatic.com/s/opensans/v35/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsg-1y4nY1M2xLER.ttf"}' ) );
		$this->assertSame( $font_face3_content, $font_face3->post_content, 'The 3rd font face post content should match.' );

		// With a remote url, file post meta should not be set.
		$meta = get_post_meta( $font_face3->ID, '_wp_font_face_file', true );
		$this->assertSame( '', $meta, 'The _wp_font_face_file post meta for the 3rd font face should be an empty string.' );
	}

	public function test_font_faces_with_local_src() {
		$legacy_content = '{"fontFace":[{"fontFamily":"Open Sans","fontStyle":"normal","fontWeight":"400","preview":"https://s.w.org/images/fonts/16.7/previews/open-sans/open-sans-400-normal.svg","src":"' . site_url() . '/wp-content/fonts/open-sans_normal_400.ttf"}],"fontFamily":"\'Open Sans\', sans-serif","name":"Open Sans","preview":"https://s.w.org/images/fonts/16.7/previews/open-sans/open-sans.svg","slug":"open-sans"}';

		$font_family_id = $this->create_font_family( $legacy_content );

		gutenberg_convert_legacy_font_family_format();

		$font_faces = $this->get_font_faces( $font_family_id );

		$this->assertCount( 1, $font_faces, 'There should be 1 font face.' );
		$font_face = reset( $font_faces );

		// Check that file meta is present.
		$file_path = 'open-sans_normal_400.ttf';
		$meta      = get_post_meta( $font_face->ID, '_wp_font_face_file', true );
		$this->assertSame( $file_path, $meta, 'The _wp_font_face_file should match.' );
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
	}

	protected function create_font_family( $content ) {
		$post_id = wp_insert_post(
			array(
				'post_type'    => 'wp_font_family',
				'post_status'  => 'publish',
				'post_title'   => 'Open Sans',
				'post_name'    => 'open-sans',
				'post_content' => $content,
			)
		);

		$this->store_id_for_cleanup_in_teardown( $post_id );

		return $post_id;
	}

	private function get_post( $post_id ) {
		$post = get_post( $post_id );

		$this->store_id_for_cleanup_in_teardown( $post );

		return $post;
	}

	protected function get_font_faces( $font_family_id ) {
		$posts = get_posts(
			array(
				'post_parent' => $font_family_id,
				'post_type'   => 'wp_font_face',
				'order'       => 'ASC',
				'orderby'     => 'id',
			)
		);

		$this->store_id_for_cleanup_in_teardown( $posts );

		return $posts;
	}

	private function store_id_for_cleanup_in_teardown( $post ) {
		if ( null === $post ) {
			return;
		}

		$posts = is_array( $post ) ? $post : array( $post );

		foreach ( $posts as $post ) {
			if ( null === $post ) {
				continue;
			}
			$this->post_ids_to_delete[] = is_int( $post ) ? $post : $post->ID;
		}
	}
}
