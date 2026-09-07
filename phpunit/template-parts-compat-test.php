<?php
/**
 * Tests for the PHP template part APIs backed by pattern customizations.
 *
 * @package Gutenberg
 * @group blocks
 */
class Template_Parts_Compat_Test extends WP_UnitTestCase {

	/**
	 * Administrator user id.
	 *
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * The active theme's stylesheet.
	 *
	 * @var string
	 */
	protected $theme;

	/**
	 * Posts to delete after each test.
	 *
	 * @var int[]
	 */
	protected $posts = array();

	public static function wpSetUpBeforeClass( $factory ) {
		self::$admin_id = $factory->user->create( array( 'role' => 'administrator' ) );
	}

	public function set_up() {
		parent::set_up();
		$this->theme = get_stylesheet();
		delete_option( 'gutenberg_template_parts_migrated' );
		register_block_pattern(
			$this->theme . '/part/header',
			array(
				'title'   => 'Header',
				'synced'  => true,
				'area'    => 'header',
				'content' => '<!-- wp:paragraph --><p>Theme header</p><!-- /wp:paragraph -->',
			)
		);
	}

	public function tear_down() {
		unregister_block_pattern( $this->theme . '/part/header' );
		foreach ( $this->posts as $post_id ) {
			wp_delete_post( $post_id, true );
		}
		foreach ( get_posts(
			array(
				'post_type'      => 'wp_block',
				'post_status'    => 'any',
				'posts_per_page' => -1,
				'meta_key'       => 'wp_pattern_slug',
				'meta_value'     => $this->theme . '/part/',
				'meta_compare'   => 'LIKE',
			)
		) as $copy ) { // phpcs:ignore WordPress.DB.SlowDBQuery
			wp_delete_post( $copy->ID, true );
		}
		$this->posts = array();
		foreach ( get_posts(
			array(
				'post_type'      => 'wp_block',
				'post_status'    => 'any',
				'posts_per_page' => -1,
				'meta_key'       => 'wp_pattern_area',
			)
		) as $part ) { // phpcs:ignore WordPress.DB.SlowDBQuery
			wp_delete_post( $part->ID, true );
		}
		delete_option( 'gutenberg_template_parts_migrated' );
		parent::tear_down();
	}

	private function create_user_part( $slug, $content, $title, $area ) {
		$id            = self::factory()->post->create(
			array(
				'post_type'    => 'wp_block',
				'post_status'  => 'publish',
				'post_name'    => $slug,
				'post_title'   => $title,
				'post_content' => $content,
				'meta_input'   => array( 'wp_pattern_area' => $area ),
			)
		);
		$this->posts[] = $id;
		return $id;
	}

	private function create_customization( $slug, $content, $title = 'Customized', $area = 'header' ) {
		$id            = self::factory()->post->create(
			array(
				'post_type'    => 'wp_block',
				'post_status'  => 'publish',
				'post_title'   => $title,
				'post_content' => $content,
				'meta_input'   => array(
					'wp_pattern_slug' => $this->theme . '/part/' . $slug,
					'wp_pattern_area' => $area,
				),
			)
		);
		$this->posts[] = $id;
		return $id;
	}

	/**
	 * @covers ::gutenberg_resolve_template_part_from_pattern
	 * @covers ::gutenberg_build_template_part_from_customization
	 */
	public function test_get_block_template_and_block_template_part_use_the_customization() {
		$template = get_block_template( $this->theme . '//header', 'wp_template_part' );
		$this->assertInstanceOf( WP_Block_Template::class, $template );
		$this->assertSame( 'theme', $template->source );
		$this->assertSame( 'header', $template->area );
		$this->assertStringContainsString( 'Theme header', $template->content );

		$copy_id  = $this->create_customization( 'header', '<!-- wp:paragraph --><p>Edited header</p><!-- /wp:paragraph -->', 'My header' );
		$template = get_block_template( $this->theme . '//header', 'wp_template_part' );
		$this->assertSame( 'custom', $template->source );
		$this->assertSame( $copy_id, $template->wp_id );
		$this->assertSame( 'My header', $template->title );
		$this->assertSame( 'header', $template->area );
		$this->assertStringContainsString( 'Edited header', $template->content );

		ob_start();
		block_template_part( 'header' );
		$output = ob_get_clean();
		$this->assertStringContainsString( 'Edited header', $output );

		// Trashing the customization reverts to the registered version.
		wp_trash_post( $copy_id );
		$template = get_block_template( $this->theme . '//header', 'wp_template_part' );
		$this->assertSame( 'theme', $template->source );
		$this->assertStringContainsString( 'Theme header', $template->content );
	}

	/**
	 * @covers ::gutenberg_filter_template_parts_with_customizations
	 */
	public function test_get_block_templates_lists_customized_and_custom_parts() {
		$this->create_customization( 'header', '<!-- wp:paragraph --><p>Edited header</p><!-- /wp:paragraph -->' );
		// A custom part is a user pattern with an area.
		$sidebar_id = $this->create_user_part( 'my-sidebar', '<!-- wp:paragraph --><p>Sidebar</p><!-- /wp:paragraph -->', 'My sidebar', 'footer' );

		$parts = get_block_templates( array(), 'wp_template_part' );
		$slugs = wp_list_pluck( $parts, 'slug' );
		$this->assertContains( 'header', $slugs );
		$this->assertContains( 'my-sidebar', $slugs );
		$header = $parts[ array_search( 'header', $slugs, true ) ];
		$this->assertSame( 'custom', $header->source );
		$this->assertStringContainsString( 'Edited header', $header->content );

		$sidebars = get_block_templates( array( 'area' => 'footer' ), 'wp_template_part' );
		$this->assertSame( array( 'my-sidebar' ), wp_list_pluck( $sidebars, 'slug' ) );
		$this->assertSame( 'footer', $sidebars[0]->area );
		$this->assertSame( 'custom', $sidebars[0]->source );
		$this->assertFalse( $sidebars[0]->has_theme_file );
		$this->assertSame( $sidebar_id, $sidebars[0]->wp_id );
		$this->assertSame( $sidebar_id, get_block_template( $this->theme . '//my-sidebar', 'wp_template_part' )->wp_id );

		$by_slug = get_block_templates( array( 'slug__in' => array( 'header' ) ), 'wp_template_part' );
		$this->assertSame( array( 'header' ), wp_list_pluck( $by_slug, 'slug' ) );

		$by_id = get_block_templates( array( 'wp_id' => $sidebar_id ), 'wp_template_part' );
		$this->assertCount( 1, $by_id );
		$this->assertSame( $this->theme . '//my-sidebar', $by_id[0]->id );
	}

	/**
	 * @covers Gutenberg_REST_Template_Parts_Controller_7_2::update_item
	 * @covers Gutenberg_REST_Template_Parts_Controller_7_2::delete_item
	 */
	public function test_rest_update_and_delete_write_the_customization() {
		wp_set_current_user( self::$admin_id );
		$id = $this->theme . '//header';

		$request = new WP_REST_Request( 'PUT', '/wp/v2/template-parts/' . $id );
		$request->set_body_params( array( 'content' => '<!-- wp:paragraph --><p>REST edited</p><!-- /wp:paragraph -->' ) );
		$response = rest_do_request( $request );
		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertSame( 'custom', $data['source'] );
		$this->assertSame( 'header', $data['area'] );
		$this->assertStringContainsString( 'REST edited', $data['content']['raw'] );
		$this->assertSame( 'wp_block', get_post_type( $data['wp_id'] ) );
		$this->assertSame( $this->theme . '/part/header', get_post_meta( $data['wp_id'], 'wp_pattern_slug', true ) );
		$copy_id = $data['wp_id'];

		// A second update edits the same customization.
		$request = new WP_REST_Request( 'PUT', '/wp/v2/template-parts/' . $id );
		$request->set_body_params(
			array(
				'title' => 'Renamed',
				'area'  => 'footer',
			)
		);
		$data = rest_do_request( $request )->get_data();
		$this->assertSame( $copy_id, $data['wp_id'] );
		$this->assertSame( 'Renamed', $data['title']['raw'] );
		$this->assertSame( 'footer', $data['area'] );

		$response = rest_do_request( new WP_REST_Request( 'GET', '/wp/v2/template-parts/' . $id ) );
		$this->assertSame( 'Renamed', $response->get_data()['title']['raw'] );

		// Deleting trashes the customization and reverts to the theme version.
		$response = rest_do_request( new WP_REST_Request( 'DELETE', '/wp/v2/template-parts/' . $id ) );
		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'trash', get_post_status( $copy_id ) );
		$data = rest_do_request( new WP_REST_Request( 'GET', '/wp/v2/template-parts/' . $id ) )->get_data();
		$this->assertSame( 'theme', $data['source'] );
		$this->assertStringContainsString( 'Theme header', $data['content']['raw'] );
	}

	/**
	 * @covers Gutenberg_REST_Template_Parts_Controller_7_2::create_item
	 */
	public function test_rest_create_makes_a_user_pattern() {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'POST', '/wp/v2/template-parts' );
		$request->set_body_params(
			array(
				'slug'    => 'promo',
				'title'   => 'Promo',
				'area'    => 'footer',
				'content' => '<!-- wp:paragraph --><p>Promo</p><!-- /wp:paragraph -->',
			)
		);
		$response = rest_do_request( $request );
		$this->assertSame( 201, $response->get_status(), wp_json_encode( $response->get_data() ) );
		$data = $response->get_data();
		$this->assertSame( $this->theme . '//promo', $data['id'] );
		$this->assertSame( 'custom', $data['source'] );
		$this->assertSame( 'footer', $data['area'] );
		$this->assertSame( 'wp_block', get_post_type( $data['wp_id'] ) );
		$this->posts[] = $data['wp_id'];
		// A custom part is a user pattern, not the customization of a pattern.
		$this->assertSame( 'promo', get_post( $data['wp_id'] )->post_name );
		$this->assertSame( '', get_post_meta( $data['wp_id'], 'wp_pattern_slug', true ) );
		$this->assertSame( 'footer', get_post_meta( $data['wp_id'], 'wp_pattern_area', true ) );
		$this->assertContains( 'footer', wp_get_object_terms( $data['wp_id'], 'wp_pattern_category', array( 'fields' => 'slugs' ) ) );
		$this->assertInstanceOf( WP_Block_Template::class, get_block_template( $this->theme . '//promo', 'wp_template_part' ) );

		// Updating it through the route edits the user pattern.
		$request = new WP_REST_Request( 'PUT', '/wp/v2/template-parts/' . $data['id'] );
		$request->set_body_params( array( 'title' => 'Promo renamed' ) );
		$updated = rest_do_request( $request )->get_data();
		$this->assertSame( $data['wp_id'], $updated['wp_id'] );
		$this->assertSame( 'Promo renamed', get_post( $data['wp_id'] )->post_title );

		// A taken slug is suffixed, as before.
		$request = new WP_REST_Request( 'POST', '/wp/v2/template-parts' );
		$request->set_body_params(
			array(
				'slug'  => 'promo',
				'title' => 'Promo',
			)
		);
		$data          = rest_do_request( $request )->get_data();
		$this->posts[] = $data['wp_id'];
		$this->assertSame( $this->theme . '//promo-2', $data['id'] );
	}

	/**
	 * @covers ::gutenberg_close_template_part_post_type
	 */
	public function test_template_part_post_type_is_closed() {
		$type = get_post_type_object( 'wp_template_part' );
		$this->assertSame( 'do_not_allow', $type->cap->create_posts );
		$this->assertSame( 'do_not_allow', $type->cap->edit_posts );
		$this->assertSame( 'Gutenberg_REST_Template_Parts_Controller_7_2', $type->rest_controller_class );
	}

	/**
	 * @covers ::gutenberg_migrate_template_part_on_save
	 */
	public function test_template_part_post_saved_later_is_migrated() {
		$part_id       = self::factory()->post->create(
			array(
				'post_type'    => 'wp_template_part',
				'post_status'  => 'publish',
				'post_name'    => 'late-part',
				'post_title'   => 'Late part',
				'post_content' => '<!-- wp:paragraph --><p>Late</p><!-- /wp:paragraph -->',
			)
		);
		$this->posts[] = $part_id;
		// Without a theme it is not a template part yet.
		$this->assertSame( 'publish', get_post_status( $part_id ) );

		wp_set_post_terms( $part_id, array( $this->theme ), 'wp_theme' );
		wp_set_post_terms( $part_id, array( 'footer' ), 'wp_template_part_area' );
		wp_update_post(
			array(
				'ID'         => $part_id,
				'post_title' => 'Late part',
			)
		);

		$this->assertSame( 'trash', get_post_status( $part_id ) );
		// A custom part becomes a user pattern with the part's slug and area.
		$user_part = gutenberg_get_user_template_part( 'late-part' );
		$this->assertInstanceOf( WP_Post::class, $user_part );
		$this->posts[] = $user_part->ID;
		$this->assertSame( 'footer', get_post_meta( $user_part->ID, 'wp_pattern_area', true ) );
		$template = get_block_template( $this->theme . '//late-part', 'wp_template_part' );
		$this->assertSame( $user_part->ID, $template->wp_id );
		$this->assertStringContainsString( 'Late', $template->content );
	}

	/**
	 * @covers ::gutenberg_generate_block_templates_export_file
	 * @covers ::gutenberg_get_exported_pattern_files
	 * @covers ::gutenberg_build_pattern_file_contents
	 */
	public function test_export_ships_template_parts_as_pattern_files() {
		if ( ! class_exists( 'ZipArchive' ) ) {
			$this->markTestSkipped( 'ZipArchive is not available.' );
		}
		$this->create_customization( 'header', '<!-- wp:paragraph --><p>Exported header</p><!-- /wp:paragraph -->', 'Exported' );
		$promo_id = $this->create_user_part( 'promo', '<!-- wp:paragraph --><p>Promo</p><!-- /wp:paragraph -->', 'Promo', 'footer' );

		// Templates reference a custom part by the name its pattern file registers.
		$this->assertSame(
			'<!-- wp:block {"hasWrapper":true,"slug":"' . $this->theme . '/part/promo"} /-->',
			traverse_and_serialize_blocks(
				parse_blocks( '<!-- wp:block {"ref":' . $promo_id . ',"hasWrapper":true} /-->' ),
				'gutenberg_export_reference_custom_parts_by_slug'
			)
		);

		$filename = gutenberg_generate_block_templates_export_file();
		$this->assertIsString( $filename );
		$zip = new ZipArchive();
		$this->assertTrue( $zip->open( $filename ) );

		$entries = array();
		for ( $i = 0; $i < $zip->numFiles; $i++ ) { // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
			$entries[] = $zip->getNameIndex( $i );
		}
		$this->assertNotContains( 'parts/', $entries );
		$this->assertEmpty( preg_grep( '#^parts/#', $entries ) );
		$this->assertContains( 'patterns/part-header.php', $entries );
		$this->assertContains( 'patterns/part-promo.php', $entries );
		$promo_file = $zip->getFromName( 'patterns/part-promo.php' );
		$this->assertStringContainsString( ' * Slug: ' . $this->theme . '/part/promo', $promo_file );
		$this->assertStringContainsString( ' * Area: footer', $promo_file );
		$this->assertStringContainsString( '<p>Promo</p>', $promo_file );

		$file = $zip->getFromName( 'patterns/part-header.php' );
		$this->assertStringContainsString( ' * Title: Exported', $file );
		$this->assertStringContainsString( ' * Slug: ' . $this->theme . '/part/header', $file );
		$this->assertStringContainsString( ' * Synced: yes', $file );
		$this->assertStringContainsString( ' * Area: header', $file );
		$this->assertStringContainsString( 'Exported header', $file );
		$zip->close();
		unlink( $filename );
	}
}
