<?php
/**
 * Unit tests covering WP_Widget_Media_Gallery functionality.
 *
 * @package    WordPress
 * @subpackage widgets
 */

/**
 * Test wp-includes/widgets/class-wp-widget-gallery.php
 *
 * @group widgets
 */
class Test_WP_Widget_Media_Gallery extends WP_UnitTestCase {

	/**
	 * Clean up global scope.
	 *
	 * @global WP_Scripts $wp_scripts
	 * @global WP_Styles $wp_styles
	 */
	public function clean_up_global_scope() {
		global $wp_scripts, $wp_styles;
		parent::clean_up_global_scope();
		$wp_scripts = null;
		$wp_styles = null;
	}

	/**
	 * Test get_instance_schema method.
	 *
	 * @covers WP_Widget_Media_Gallery::get_instance_schema()
	 */
	public function test_get_instance_schema() {
		$widget = new WP_Widget_Media_Gallery();
		$schema = $widget->get_instance_schema();

		$this->assertEqualSets(
			array(
				'title',
				'ids',
				'columns',
				'size',
				'link_type',
				'orderby_random',
			),
			array_keys( $schema )
		);
	}

	/**
	 * Test update() method.
	 *
	 * @covers WP_Widget_Media_Gallery::render_media()
	 */
	public function test_render_media() {
		$widget = new WP_Widget_Media_Gallery();

		$attachments = array();
		foreach ( array( 'canola.jpg', 'waffles.jpg' ) as $filename ) {
			$test_image = '/tmp/' . $filename;
			copy( DIR_TESTDATA . '/images/canola.jpg', $test_image );
			$attachment_id = self::factory()->attachment->create_object( array(
				'file' => $test_image,
				'post_parent' => 0,
				'post_mime_type' => 'image/jpeg',
				'post_title' => 'Canola',
			) );
			wp_update_attachment_metadata( $attachment_id, wp_generate_attachment_metadata( $attachment_id, $test_image ) );
			$attachments[ $filename ] = $attachment_id;
		}

		$instance = wp_list_pluck( $widget->get_instance_schema(), 'default' );
		$instance['size'] = 'thumbnail';
		$instance['columns'] = 3;
		$instance['ids'] = array_values( $attachments );
		ob_start();
		$widget->render_media( $instance );
		$output = ob_get_clean();

		$this->assertContains( 'gallery-columns-3', $output );
		$this->assertContains( 'gallery-size-thumbnail', $output );
		$this->assertContains( 'canola', $output );
		$this->assertContains( 'waffles', $output );
	}

	/**
	 * Test enqueue_admin_scripts() method.
	 *
	 * @covers WP_Widget_Media_Gallery::enqueue_admin_scripts()
	 */
	public function test_enqueue_admin_scripts() {
		set_current_screen( 'widgets.php' );
		$widget = new WP_Widget_Media_Gallery();

		$this->assertFalse( wp_script_is( 'media-gallery-widget' ) );

		$widget->enqueue_admin_scripts();

		$this->assertTrue( wp_script_is( 'media-gallery-widget' ) );

		$after = join( '', wp_scripts()->registered['media-gallery-widget']->extra['after'] );
		$this->assertContains( 'wp.mediaWidgets.modelConstructors[ "media_gallery" ].prototype', $after );
	}

	/**
	 * Test update() method.
	 *
	 * @covers WP_Widget_Media_Gallery::update()
	 */
	public function test_update() {
		$widget = new WP_Widget_Media_Gallery();
		$schema = $widget->get_instance_schema();
		$instance = wp_list_pluck( $schema, 'default' );

		// Field: title.
		$instance['title'] = 'Hello <b>World</b> ';
		$instance = $widget->update( $instance, array() );
		$this->assertEquals( 'Hello World', $instance['title'] );

		// Field: ids.
		$instance['ids'] = '1,2,3';
		$instance = $widget->update( $instance, array() );
		$this->assertSame( array( 1, 2, 3 ), $instance['ids'] );

		$instance['ids'] = array( 1, 2, '3' );
		$instance = $widget->update( $instance, array() );
		$this->assertSame( array( 1, 2, 3 ), $instance['ids'] );

		$instance['ids'] = array( 'too', 'bad' );
		$instance = $widget->update( $instance, array( 'ids' => array( 2, 3 ) ) );
		$this->assertSame( array( 2, 3 ), $instance['ids'] );

		// Field: columns.
		$instance['columns'] = 4;
		$instance = $widget->update( $instance, array() );
		$this->assertSame( 4, $instance['columns'] );

		$instance['columns'] = '2';
		$instance = $widget->update( $instance, array() );
		$this->assertSame( 2, $instance['columns'] );

		$instance['columns'] = -1; // Under min of 1.
		$instance = $widget->update( $instance, array( 'columns' => 3 ) );
		$this->assertSame( 3, $instance['columns'] );

		$instance['columns'] = 10; // Over max of 9.
		$instance = $widget->update( $instance, array( 'columns' => 3 ) );
		$this->assertSame( 3, $instance['columns'] );

		// Field: size.
		$instance['size'] = 'large';
		$instance = $widget->update( $instance, array() );
		$this->assertSame( 'large', $instance['size'] );

		$instance['size'] = 'bad';
		$instance = $widget->update( $instance, array( 'size' => 'thumbnail' ) );
		$this->assertSame( 'thumbnail', $instance['size'] );

		// Field: link_type.
		$instance['link_type'] = 'none';
		$instance = $widget->update( $instance, array() );
		$this->assertSame( 'none', $instance['link_type'] );

		$instance['link_type'] = 'unknown';
		$instance = $widget->update( $instance, array( 'link_type' => 'file' ) );
		$this->assertSame( 'file', $instance['link_type'] );

		// Field: orderby_random.
		$instance['orderby_random'] = '1';
		$instance = $widget->update( $instance, array() );
		$this->assertTrue( $instance['orderby_random'] );

		$instance['orderby_random'] = true;
		$instance = $widget->update( $instance, array() );
		$this->assertTrue( $instance['orderby_random'] );

		$instance['orderby_random'] = '';
		$instance = $widget->update( $instance, array() );
		$this->assertFalse( $instance['orderby_random'] );

		$instance['orderby_random'] = false;
		$instance = $widget->update( $instance, array() );
		$this->assertFalse( $instance['orderby_random'] );
	}

	/**
	 * Test render_control_template_scripts() method.
	 *
	 * @covers WP_Widget_Media_Gallery::render_control_template_scripts()
	 */
	public function test_render_control_template_scripts() {
		$widget = new WP_Widget_Media_Gallery();

		ob_start();
		$widget->render_control_template_scripts();
		$output = ob_get_clean();

		$this->assertContains( '<script type="text/html" id="tmpl-wp-media-widget-gallery-preview">', $output );
	}
}
