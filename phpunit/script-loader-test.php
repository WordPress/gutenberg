<?php
/**
 * Tests script and style loading.
 *
 * @package gutenberg
 */

class WP_Script_Loader_Test extends WP_UnitTestCase {
	/**
	 * Cleans up global scope.
	 *
	 * @global WP_Styles $wp_styles
	 */
	public function clean_up_global_scope() {
		global $wp_styles; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		parent::clean_up_global_scope();
		$wp_styles = null;
	}
	/**
	 * Tests that stored CSS is enqueued.
	 *
	 * @covers ::wp_enqueue_stored_styles
	 */
	public function test_should_enqueue_stored_styles() {
		$core_styles_to_enqueue = array(
			array(
				'selector'     => '.saruman',
				'declarations' => array(
					'color'        => 'white',
					'height'       => '100px',
					'border-style' => 'solid',
				),
			),
		);

		// Enqueues a block supports (core styles).
		gutenberg_style_engine_get_stylesheet_from_css_rules(
			$core_styles_to_enqueue,
			array(
				'context' => 'block-supports',
			)
		);

		$my_styles_to_enqueue = array(
			array(
				'selector'     => '.gandalf',
				'declarations' => array(
					'color'        => 'grey',
					'height'       => '90px',
					'border-style' => 'dotted',
				),
			),
		);

		// Enqueues some other styles.
		gutenberg_style_engine_get_stylesheet_from_css_rules(
			$my_styles_to_enqueue,
			array(
				'context' => 'my-styles',
			)
		);

		gutenberg_enqueue_stored_styles(
			array( 'prettify' => false )
		);

		$this->assertSame(
			array( '.saruman{color:white;height:100px;border-style:solid;}' ),
			wp_styles()->registered['core-block-supports']->extra['after'],
			'Registered styles with handle of "core-block-supports" do not match expected value from Style Engine store.'
		);

		$this->assertSame(
			array( '.gandalf{color:grey;height:90px;border-style:dotted;}' ),
			wp_styles()->registered['wp-style-engine-my-styles']->extra['after'],
			'Registered styles with handle of "wp-style-engine-my-styles" do not match expected value from the Style Engine store.'
		);
	}

	/**
	 * Tests that the Classic block is hidden from the inserter by default.
	 *
	 * @covers ::wp_declare_classic_block_necessary
	 */
	public function test_wp_declare_classic_block_necessary_does_nothing_by_default() {
		wp_register_script( 'wp-block-library', 'https://example.org/wp-block-library.js' );

		wp_declare_classic_block_necessary();

		$this->assertFalse(
			wp_scripts()->get_data( 'wp-block-library', 'before' ),
			'No inline script should be enqueued when the filter is not used.'
		);
	}

	/**
	 * Tests that the Classic block can be opted into the inserter via the filter.
	 *
	 * @covers ::wp_declare_classic_block_necessary
	 */
	public function test_wp_declare_classic_block_necessary_enqueues_flag_when_filter_enabled() {
		wp_register_script( 'wp-block-library', 'https://example.org/wp-block-library.js' );
		add_filter( 'wp_classic_block_supports_inserter', '__return_true' );

		wp_declare_classic_block_necessary();

		$before = wp_scripts()->get_data( 'wp-block-library', 'before' );
		$this->assertIsArray(
			$before,
			'An inline script should be enqueued when the filter opts in.'
		);
		$this->assertContains(
			'window.__needsClassicBlock = true;',
			$before,
			'The Classic block flag should be added to the wp-block-library inline scripts.'
		);
	}

	/**
	 * Tests that the current post is passed to the filter.
	 *
	 * @covers ::wp_declare_classic_block_necessary
	 */
	public function test_wp_declare_classic_block_necessary_passes_post_to_filter() {
		wp_register_script( 'wp-block-library', 'https://example.org/wp-block-library.js' );

		$post_id         = self::factory()->post->create();
		$GLOBALS['post'] = get_post( $post_id );

		$filter_post = false;
		add_filter(
			'wp_classic_block_supports_inserter',
			static function ( $supports_inserter, $post ) use ( &$filter_post ) {
				$filter_post = $post;
				return $supports_inserter;
			},
			10,
			2
		);

		wp_declare_classic_block_necessary();

		$this->assertInstanceOf( WP_Post::class, $filter_post, 'The post should be passed to the filter.' );
		$this->assertSame( $post_id, $filter_post->ID, 'The current post should be passed to the filter.' );
	}
}
