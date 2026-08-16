<?php
/**
 * Tests for the code-registered widget definitions registry and its
 * resolution into `WP_Widget_Type_Registry`.
 *
 * @package gutenberg
 *
 * @group widget-type-composer
 *
 * @covers ::gutenberg_register_widget_def
 * @covers ::gutenberg_get_registered_widget_defs
 */

require_once __DIR__ . '/trait-widget-type-composer-registry-reset.php';

class Gutenberg_Widget_Type_Composer_Widget_Definitions_Test extends WP_UnitTestCase {

	use Widget_Type_Composer_Registry_Reset;

	const SAMPLE_CONTENT = '<!-- wp:paragraph --><p>x</p><!-- /wp:paragraph -->';

	public function set_up() {
		parent::set_up();
		$this->reset_widget_def_registry();
		$this->reset_widget_type_registry();
	}

	public function tear_down() {
		$this->reset_widget_def_registry();
		$this->reset_widget_type_registry();
		parent::tear_down();
	}

	public function test_register_widget_def_stores_content_and_metadata() {
		$this->assertTrue(
			gutenberg_register_widget_def(
				'test/full',
				array(
					'title'       => 'Full',
					'description' => 'A full definition.',
					'icon'        => 'admin-plugins',
					'category'    => 'dashboard',
					'content'     => self::SAMPLE_CONTENT,
				)
			)
		);

		$registry = gutenberg_get_registered_widget_defs();
		$this->assertArrayHasKey( 'test/full', $registry );

		$definition = $registry['test/full'];
		$this->assertSame( 'test/full', $definition['name'] );
		$this->assertSame( 'Full', $definition['title'] );
		$this->assertSame( 'A full definition.', $definition['description'] );
		$this->assertSame( 'admin-plugins', $definition['icon'] );
		$this->assertSame( 'dashboard', $definition['category'] );
		$this->assertSame( self::SAMPLE_CONTENT, $definition['content'] );
	}

	public function test_register_widget_def_applies_defaults() {
		gutenberg_register_widget_def( 'test/minimal', array( 'content' => self::SAMPLE_CONTENT ) );

		$definition = gutenberg_get_registered_widget_defs()['test/minimal'];
		$this->assertSame( 'test/minimal', $definition['name'] );
		$this->assertSame( '', $definition['title'] );
		$this->assertSame( '', $definition['description'] );
		$this->assertSame( '', $definition['icon'] );
		$this->assertSame( '', $definition['category'] );
		$this->assertSame( self::SAMPLE_CONTENT, $definition['content'] );
	}

	public function test_register_widget_def_validates_inputs() {
		$this->setExpectedIncorrectUsage( 'gutenberg_register_widget_def' );

		// Empty name fails.
		$this->assertFalse(
			gutenberg_register_widget_def( '', array( 'content' => self::SAMPLE_CONTENT ) )
		);

		// Missing content fails.
		$this->assertFalse(
			gutenberg_register_widget_def( 'test/no-content', array( 'title' => 'No content' ) )
		);

		// Empty content fails.
		$this->assertFalse(
			gutenberg_register_widget_def( 'test/empty-content', array( 'content' => '' ) )
		);

		$registry = gutenberg_get_registered_widget_defs();
		$this->assertArrayNotHasKey( '', $registry );
		$this->assertArrayNotHasKey( 'test/no-content', $registry );
		$this->assertArrayNotHasKey( 'test/empty-content', $registry );
	}

	public function test_register_widget_def_silent_on_identical_args() {
		$args = array(
			'title'   => 'X',
			'content' => self::SAMPLE_CONTENT,
		);

		$this->assertTrue( gutenberg_register_widget_def( 'test/x', $args ) );

		// A second call with identical args must not emit `_doing_it_wrong`;
		// if it did, WP_UnitTestCase::tear_down() would flag the unexpected
		// usage and fail the test. That is the assertion.
		$this->assertTrue( gutenberg_register_widget_def( 'test/x', $args ) );

		$this->assertArrayHasKey( 'test/x', gutenberg_get_registered_widget_defs() );
	}

	public function test_register_widget_def_warns_and_overwrites_on_differing_args() {
		$this->setExpectedIncorrectUsage( 'gutenberg_register_widget_def' );

		gutenberg_register_widget_def(
			'test/x',
			array(
				'title'   => 'First',
				'content' => self::SAMPLE_CONTENT,
			)
		);
		gutenberg_register_widget_def(
			'test/x',
			array(
				'title'   => 'Second',
				'content' => self::SAMPLE_CONTENT,
			)
		);

		$this->assertSame( 'Second', gutenberg_get_registered_widget_defs()['test/x']['title'] );
	}

	public function test_code_registered_def_flows_through_resolver() {
		gutenberg_register_widget_def(
			'test/code-def',
			array(
				'title'       => 'Code def',
				'description' => 'Declared in PHP.',
				'icon'        => 'wordpress/plugins',
				'category'    => 'dashboard',
				'content'     => self::SAMPLE_CONTENT,
			)
		);

		gutenberg_register_widget_types();

		$entry = WP_Widget_Type_Registry::get_instance()->get_registered( 'test/code-def' );

		$this->assertNotNull( $entry );
		$this->assertSame( 'code-registered', $entry->origin );
		$this->assertSame( 'Code def', $entry->title );
		$this->assertSame( 'Declared in PHP.', $entry->description );
		$this->assertSame( 'wordpress/plugins', $entry->icon );
		$this->assertSame( 'dashboard', $entry->category );
		$this->assertSame( self::SAMPLE_CONTENT, $entry->content );

		// Server-defined widget types render through the admin block renderer,
		// not a build module.
		$this->assertNull( $entry->render_module );
		$this->assertNull( $entry->widget_module );
	}

	public function test_earlier_origin_wins_over_code_registered() {
		// Simulate an earlier source (e.g. built-in) already holding the name.
		WP_Widget_Type_Registry::get_instance()->register(
			'test/dup',
			array(
				'origin'        => 'built-in',
				'render_module' => 'wp/widgets/dup/render',
			)
		);

		gutenberg_register_widget_def(
			'test/dup',
			array(
				'title'   => 'Shadowed',
				'content' => self::SAMPLE_CONTENT,
			)
		);

		gutenberg_register_widget_types();

		// The code-registered entry is skipped: the earlier registration stands.
		$entry = WP_Widget_Type_Registry::get_instance()->get_registered( 'test/dup' );
		$this->assertSame( 'built-in', $entry->origin );
		$this->assertSame( 'wp/widgets/dup/render', $entry->render_module );
	}
}
