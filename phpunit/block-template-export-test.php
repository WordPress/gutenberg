<?php
/**
 * Unit tests covering block template export routines.
 *
 * @package gutenberg
 *
 * @covers ::gutenberg_generate_block_templates_export_file
 * @covers ::gutenberg_get_template_export_directory
 * @covers ::gutenberg_add_templates_to_export_zip
 * @covers ::gutenberg_get_custom_export_readme
 */
class Tests_Block_Template_Export extends WP_UnitTestCase {

	const README          = 'CUSTOM-TEMPLATES-README.txt';
	const PLUGIN_TEMPLATE = 'test-plugin//plugin-template';

	/**
	 * Paths of zip files.
	 *
	 * @var string[]
	 */
	private $export_files = array();

	/**
	 * Zip archives opened.
	 *
	 * @var ZipArchive[]
	 */
	private $export_zips = array();

	public function set_up() {
		parent::set_up();

		if ( ! class_exists( 'ZipArchive' ) ) {
			$this->markTestSkipped( 'ZipArchive is not available.' );
		}

		switch_theme( 'block-theme' );
	}

	public function tear_down() {
		foreach ( $this->export_zips as $zip ) {
			$zip->close();
		}
		foreach ( $this->export_files as $file ) {
			if ( file_exists( $file ) ) {
				unlink( $file );
			}
		}
		$this->export_zips  = array();
		$this->export_files = array();

		if ( WP_Block_Templates_Registry::get_instance()->is_registered( self::PLUGIN_TEMPLATE ) ) {
			unregister_block_template( self::PLUGIN_TEMPLATE );
		}

		parent::tear_down();
	}

	/*
	 * Helpers.
	 */

	/**
	 * Creates a block template post in the database.
	 *
	 * @param string $slug    Template slug.
	 * @param string $title   Template title.
	 * @param string $content Block markup.
	 * @return int Post ID.
	 */
	private function create_template( $slug, $title, $content ) {
		$id = self::factory()->post->create(
			array(
				'post_type'    => 'wp_template',
				'post_name'    => $slug,
				'post_title'   => $title,
				'post_content' => $content,
				'post_status'  => 'publish',
			)
		);
		wp_set_post_terms( $id, get_stylesheet(), 'wp_theme' );

		return $id;
	}

	/**
	 * Creates a block template part post in the database.
	 *
	 * @param string $slug    Part slug.
	 * @param string $title   Part title.
	 * @param string $content Block markup.
	 * @param string $area    Template part area.
	 * @return int Post ID.
	 */
	private function create_part( $slug, $title, $content, $area = 'uncategorized' ) {
		$id = self::factory()->post->create(
			array(
				'post_type'    => 'wp_template_part',
				'post_name'    => $slug,
				'post_title'   => $title,
				'post_content' => $content,
				'post_status'  => 'publish',
			)
		);
		wp_set_post_terms( $id, get_stylesheet(), 'wp_theme' );
		wp_set_post_terms( $id, $area, 'wp_template_part_area' );

		return $id;
	}

	/**
	 * Returns the slug of a template part shipped by the test theme.
	 *
	 * @return string
	 */
	private function get_theme_part_slug() {
		foreach ( get_block_templates( array(), 'wp_template_part' ) as $part ) {
			if ( 'theme' === $part->source ) {
				return $part->slug;
			}
		}

		$this->markTestSkipped( 'The block-theme test theme ships no template parts.' );
	}

	/**
	 * Generates the export and returns the opened archive.
	 *
	 * @return ZipArchive
	 */
	private function export() {
		$file = gutenberg_generate_block_templates_export_file();
		$this->assertNotWPError( $file, 'The export should be generated.' );
		$this->export_files[] = $file;

		$zip = new ZipArchive();
		$this->assertTrue( true === $zip->open( $file ), 'The export should be a readable zip.' );
		$this->export_zips[] = $zip;

		return $zip;
	}

	private function zip_names( ZipArchive $zip ) {
		$names = array();
		// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		for ( $i = 0; $i < $zip->numFiles; $i++ ) {
			$names[] = $zip->getNameIndex( $i );
		}
		return $names;
	}

	private function assert_in_zip( ZipArchive $zip, $path ) {
		$this->assertNotFalse( $zip->locateName( $path ), "Expected $path in the export." );
	}

	private function assert_not_in_zip( ZipArchive $zip, $path ) {
		$this->assertFalse( $zip->locateName( $path ), "Did not expect $path in the export." );
	}

	/*
	 * User created items.
	 */

	public function test_user_created_template_goes_to_custom_templates_and_is_listed_in_readme() {
		$this->create_template( 'landing-page', 'Landing Page', '<!-- wp:paragraph --><p>Landing marker</p><!-- /wp:paragraph -->' );

		$zip = $this->export();

		$this->assert_in_zip( $zip, 'custom-templates/landing-page.html' );
		$this->assert_not_in_zip( $zip, 'templates/landing-page.html' );
		$this->assertStringContainsString( 'Landing marker', $zip->getFromName( 'custom-templates/landing-page.html' ) );

		$readme = $zip->getFromName( self::README );
		$this->assertIsString( $readme, 'A README should be included when custom items exist.' );
		$this->assertStringContainsString( 'custom-templates/landing-page.html', $readme );
		$this->assertStringContainsString( 'needs a customTemplates entry (name: "landing-page")', $readme );
	}

	public function test_user_created_template_with_default_slug_does_not_need_registration() {
		if ( get_block_file_template( get_stylesheet() . '//404', 'wp_template' ) ) {
			$this->markTestSkipped( 'The test theme already ships a 404 template.' );
		}

		$this->create_template( '404', 'Not Found', '<!-- wp:paragraph --><p>404 marker</p><!-- /wp:paragraph -->' );

		$zip = $this->export();

		$this->assert_in_zip( $zip, 'custom-templates/404.html' );

		$readme = $zip->getFromName( self::README );
		$this->assertStringContainsString( 'custom-templates/404.html', $readme );
		$this->assertStringNotContainsString( 'name: "404"', $readme, 'Default template types are matched by the template hierarchy and need no customTemplates entry.' );
	}

	public function test_user_created_part_goes_to_custom_parts_and_readme_shows_area() {
		$this->create_part( 'promo-banner', 'Promo Banner', '<!-- wp:paragraph --><p>Promo marker</p><!-- /wp:paragraph -->', 'header' );

		$zip = $this->export();

		$this->assert_in_zip( $zip, 'custom-parts/promo-banner.html' );
		$this->assert_not_in_zip( $zip, 'parts/promo-banner.html' );

		$readme = $zip->getFromName( self::README );
		$this->assertStringContainsString( 'custom-parts/promo-banner.html', $readme );
		$this->assertStringContainsString( 'area: header', $readme );
	}

	public function test_readme_with_only_custom_parts_has_no_template_registration_notes() {
		$this->create_part( 'promo-banner', 'Promo Banner', '<!-- wp:paragraph --><p>x</p><!-- /wp:paragraph -->', 'footer' );

		$zip = $this->export();

		$readme = $zip->getFromName( self::README );
		$this->assertIsString( $readme );
		$this->assertStringContainsString( 'custom-parts/promo-banner.html', $readme );
		$this->assertStringNotContainsString( 'needs a customTemplates entry (name: "promo-banner")', $readme );
	}

	/*
	 * Edited theme items.
	 */

	public function test_edited_theme_template_stays_in_templates_with_edited_content() {
		$this->create_template( 'page-home', 'Homepage template', '<!-- wp:paragraph --><p>Edited home marker</p><!-- /wp:paragraph -->' );

		$zip = $this->export();

		$this->assert_in_zip( $zip, 'templates/page-home.html' );
		$this->assert_not_in_zip( $zip, 'custom-templates/page-home.html' );
		$this->assertStringContainsString(
			'Edited home marker',
			$zip->getFromName( 'templates/page-home.html' ),
			'The edited content should replace the theme file in the export.'
		);
	}

	public function test_edited_theme_part_stays_in_parts_with_edited_content() {
		$slug = $this->get_theme_part_slug();
		$this->create_part( $slug, 'Edited part', '<!-- wp:paragraph --><p>Edited part marker</p><!-- /wp:paragraph -->' );

		$zip = $this->export();

		$this->assert_in_zip( $zip, "parts/$slug.html" );
		$this->assert_not_in_zip( $zip, "custom-parts/$slug.html" );
		$this->assertStringContainsString( 'Edited part marker', $zip->getFromName( "parts/$slug.html" ) );
	}

	/*
	 * Plugin registered templates.
	 */

	public function test_unmodified_plugin_template_is_skipped() {
		register_block_template(
			self::PLUGIN_TEMPLATE,
			array(
				'title'   => 'Plugin Template',
				'content' => '<!-- wp:paragraph --><p>Plugin marker</p><!-- /wp:paragraph -->',
			)
		);

		$zip = $this->export();

		$this->assert_not_in_zip( $zip, 'templates/plugin-template.html' );
		$this->assert_not_in_zip( $zip, 'custom-templates/plugin-template.html' );
		$this->assertFalse( $zip->locateName( self::README ), 'Skipping a plugin template should not produce a README.' );
	}

	/**
	 * Tests that a user modified plugin template is routed to custom-templates/.
	 */
	public function test_modified_plugin_template_goes_to_custom_templates() {
		register_block_template(
			self::PLUGIN_TEMPLATE,
			array(
				'title'   => 'Plugin Template',
				'content' => '<!-- wp:paragraph --><p>Plugin marker</p><!-- /wp:paragraph -->',
			)
		);
		$this->create_template( 'plugin-template', 'Plugin Template', '<!-- wp:paragraph --><p>User edit marker</p><!-- /wp:paragraph -->' );

		$zip = $this->export();

		$this->assert_in_zip( $zip, 'custom-templates/plugin-template.html' );
		$this->assert_not_in_zip( $zip, 'templates/plugin-template.html' );
		$this->assertStringContainsString( 'User edit marker', $zip->getFromName( 'custom-templates/plugin-template.html' ) );
	}

	/*
	 * No custom items.
	 */

	public function test_no_readme_or_custom_directories_without_custom_items() {
		// An edited theme template and an unmodified plugin template are not "custom items".
		$this->create_template( 'page-home', 'Homepage template', '<!-- wp:paragraph --><p>Edited</p><!-- /wp:paragraph -->' );
		register_block_template( self::PLUGIN_TEMPLATE, array( 'title' => 'Plugin Template' ) );

		$zip = $this->export();

		$this->assertFalse( $zip->locateName( self::README ), 'No README should be included.' );
		foreach ( $this->zip_names( $zip ) as $name ) {
			$this->assertStringStartsNotWith( 'custom-templates/', $name );
			$this->assertStringStartsNotWith( 'custom-parts/', $name );
		}
	}

	/*
	 * Template part cleanup.
	 */

	public function test_exported_custom_part_has_theme_attribute_removed_from_nested_template_parts() {
		$theme   = get_stylesheet();
		$content = '<!-- wp:template-part {"slug":"nested","theme":"' . $theme . '"} /-->';
		$this->create_part( 'wrapper-part', 'Wrapper', $content );

		$zip = $this->export();

		$exported = $zip->getFromName( 'custom-parts/wrapper-part.html' );
		$this->assertIsString( $exported );
		$this->assertStringContainsString( 'wp:template-part', $exported );
		$this->assertStringNotContainsString( '"theme"', $exported, 'The theme attribute should be stripped so the part is portable.' );
	}
}
