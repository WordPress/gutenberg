<?php
/**
 * Unit tests covering the data_wp_router_region_processor functionality of the
 * WP_Interactivity_API class.
 *
 * @package WordPress
 * @subpackage Interactivity API
 *
 * @group interactivity-api
 */
class Tests_WP_Interactivity_API_WP_Router_Region extends WP_UnitTestCase {
	/**
	 * Instance of WP_Interactivity_API.
	 *
	 * @var WP_Interactivity_API
	 */
	protected $interactivity;

	/**
	 * Original WP_Hook instance associated to `wp_footer`.
	 *
	 * @var WP_Hook
	 */
	protected $original_wp_footer;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		$this->interactivity = new WP_Interactivity_API();

		// Remove all hooks set for `wp_footer`.
		global $wp_filter;
		$this->original_wp_footer = $wp_filter['wp_footer'];
		$wp_filter['wp_footer']   = new WP_Hook();
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		// Restore all previous hooks set for `wp_footer`.
		global $wp_filter;
		$wp_filter['wp_footer'] = $this->original_wp_footer;

		parent::tear_down();
	}

	/**
	 * Helper to execute the hooks associated to `wp_footer`.
	 */
	protected function render_wp_footer() {
		ob_start();
		do_action( 'wp_footer' );
		return ob_get_clean();
	}

	/**
	 * Tests that no elements are added if the `data-wp-router-region` is
	 * missing.
	 */
	public function test_wp_router_region_missing() {
		$html     = '<div>Nothing here</div>';
		$new_html = $this->interactivity->process_directives( $html );
		$footer   = $this->render_wp_footer();
		$this->assertSame( $html, $new_html );
		$this->assertSame( '', $footer );
	}

	/**
	 * Tests that the `data-wp-router-region` adds a loading bar and a
	 * region for screen reader announcements in the footer.
	 */
	public function test_wp_router_region_adds_loading_bar_aria_live_region() {
		$html     = '<div data-wp-router-region="region A">Interactive region</div>';
		$new_html = $this->interactivity->process_directives( $html );
		$footer   = $this->render_wp_footer();

		$this->assertSame( $html, $new_html );

		$query = array( 'tag_name' => 'style' );

		$p = new WP_HTML_Tag_Processor( $footer );
		$this->assertTrue( $p->next_tag( $query ) );
		$this->assertSame( 'wp-interactivity-router_animations', $p->get_attribute( 'id' ) );
		$this->assertFalse( $p->next_tag( $query ) );

		$query = array(
			'tag_name'   => 'div',
			'class_name' => 'wp-interactivity-router_loading-bar',
		);

		$p = new WP_HTML_Tag_Processor( $footer );
		$this->assertTrue( $p->next_tag( $query ) );
		$this->assertFalse( $p->next_tag( $query ) );

		$query = array(
			'tag_name'   => 'div',
			'class_name' => 'screen-reader-text',
		);

		$p = new WP_HTML_Tag_Processor( $footer );
		$this->assertTrue( $p->next_tag( $query ) );
		$this->assertFalse( $p->next_tag( $query ) );
	}

	/**
	 * Tests that the `data-wp-router-region` only adds those elements once,
	 * independently of the number of directives processed.
	 */
	public function test_wp_router_region_adds_loading_bar_aria_live_region_only_once() {
		$html     = '
			<div data-wp-router-region="region A">Interactive region</div>
			<div data-wp-router-region="region B">Another interactive region</div>
		';
		$new_html = $this->interactivity->process_directives( $html );
		$footer   = $this->render_wp_footer();

		$this->assertSame( $html, $new_html );

		$query = array( 'tag_name' => 'style' );

		$p = new WP_HTML_Tag_Processor( $footer );
		$this->assertTrue( $p->next_tag( $query ) );
		$this->assertSame( 'wp-interactivity-router_animations', $p->get_attribute( 'id' ) );
		$this->assertFalse( $p->next_tag( $query ) );

		$query = array(
			'tag_name'   => 'div',
			'class_name' => 'wp-interactivity-router_loading-bar',
		);

		$p = new WP_HTML_Tag_Processor( $footer );
		$this->assertTrue( $p->next_tag( $query ) );
		$this->assertFalse( $p->next_tag( $query ) );

		$query = array(
			'tag_name'   => 'div',
			'class_name' => 'screen-reader-text',
		);

		$p = new WP_HTML_Tag_Processor( $footer );
		$this->assertTrue( $p->next_tag( $query ) );
		$this->assertFalse( $p->next_tag( $query ) );
	}
}
