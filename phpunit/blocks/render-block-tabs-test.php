<?php
/**
 * Tabs block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Tabs block.
 *
 * @group blocks
 */
class Tests_Blocks_Render_Tabs extends WP_UnitTestCase {

	/**
	 * @covers ::block_core_tabs_render_callback
	 * @covers ::block_core_tab_list_render_callback
	 */
	public function test_should_add_tab_list_aria_label_from_attribute(): void {
		$tabs_block = <<<'BLOCK_CONTENT'
			<!-- wp:tabs -->
			<div class="wp-block-tabs"><!-- wp:tab-list {"ariaLabel":"Product details"} -->
			<div role="tablist" class="wp-block-tab-list"><button type="button" role="tab">Description</button><button type="button" role="tab">Reviews</button></div>
			<!-- /wp:tab-list -->

			<!-- wp:tab-panels -->
			<div class="wp-block-tab-panels"><!-- wp:tab-panel {"label":"Description"} -->
			<section role="tabpanel" tabindex="0" class="wp-block-tab-panel"></section>
			<!-- /wp:tab-panel -->

			<!-- wp:tab-panel {"label":"Reviews"} -->
			<section role="tabpanel" tabindex="0" class="wp-block-tab-panel"></section>
			<!-- /wp:tab-panel --></div>
			<!-- /wp:tab-panels --></div>
			<!-- /wp:tabs -->
		BLOCK_CONTENT;

		$rendered_block = do_blocks( $tabs_block );

		$processor = new WP_HTML_Tag_Processor( $rendered_block );
		$this->assertTrue( $processor->next_tag( array( 'class_name' => 'wp-block-tab-list' ) ) );
		$this->assertSame( 'Product details', $processor->get_attribute( 'aria-label' ) );
	}

	/**
	 * @covers ::block_core_tabs_render_callback
	 * @covers ::block_core_tab_list_render_callback
	 */
	public function test_should_add_default_tab_list_aria_label(): void {
		$tabs_block = <<<'BLOCK_CONTENT'
			<!-- wp:tabs -->
			<div class="wp-block-tabs"><!-- wp:tab-list -->
			<div role="tablist" class="wp-block-tab-list"><button type="button" role="tab">Description</button><button type="button" role="tab">Reviews</button></div>
			<!-- /wp:tab-list -->

			<!-- wp:tab-panels -->
			<div class="wp-block-tab-panels"><!-- wp:tab-panel {"label":"Description"} -->
			<section role="tabpanel" tabindex="0" class="wp-block-tab-panel"></section>
			<!-- /wp:tab-panel -->

			<!-- wp:tab-panel {"label":"Reviews"} -->
			<section role="tabpanel" tabindex="0" class="wp-block-tab-panel"></section>
			<!-- /wp:tab-panel --></div>
			<!-- /wp:tab-panels --></div>
			<!-- /wp:tabs -->
		BLOCK_CONTENT;

		$rendered_block = do_blocks( $tabs_block );

		$processor = new WP_HTML_Tag_Processor( $rendered_block );
		$this->assertTrue( $processor->next_tag( array( 'class_name' => 'wp-block-tab-list' ) ) );
		$this->assertSame( 'Tabbed content', $processor->get_attribute( 'aria-label' ) );
	}

	/**
	 * @covers ::block_core_tabs_provide_context
	 * @covers ::block_core_tab_list_render_callback
	 * @covers ::block_core_tab_panel_render
	 */
	public function test_should_number_tabs_and_tab_ids_from_one(): void {
		$tabs_block = <<<'BLOCK_CONTENT'
			<!-- wp:tabs -->
			<div class="wp-block-tabs"><!-- wp:tab-list -->
			<div role="tablist" class="wp-block-tab-list"><button type="button" role="tab">Description</button><button type="button" role="tab">Reviews</button></div>
			<!-- /wp:tab-list -->

			<!-- wp:tab-panels -->
			<div class="wp-block-tab-panels"><!-- wp:tab-panel {"label":"Description"} -->
			<section role="tabpanel" tabindex="0" class="wp-block-tab-panel"></section>
			<!-- /wp:tab-panel -->

			<!-- wp:tab-panel {"label":"Reviews"} -->
			<section role="tabpanel" tabindex="0" class="wp-block-tab-panel"></section>
			<!-- /wp:tab-panel --></div>
			<!-- /wp:tab-panels --></div>
			<!-- /wp:tabs -->
		BLOCK_CONTENT;

		$first_block  = do_blocks( $tabs_block );
		$second_block = do_blocks( $tabs_block );

		// Another block on the page consumes the shared `wp_unique_id()` counter.
		wp_unique_id( 'unrelated-' );

		$third_block = do_blocks( $tabs_block );

		$first_number  = $this->get_tabs_number( $first_block );
		$second_number = $this->get_tabs_number( $second_block );
		$third_number  = $this->get_tabs_number( $third_block );

		/*
		 * Rendering a tabs block advances the `tabs_` counter by a fixed amount,
		 * so the unrelated ID must leave the gap between two blocks unchanged.
		 */
		$this->assertSame(
			$second_number - $first_number,
			$third_number - $second_number,
			'The unrelated ID should not have advanced the tabs counter.'
		);

		$processor = new WP_HTML_Tag_Processor( $first_block . $second_block . $third_block );

		foreach ( array( $first_number, $second_number, $third_number ) as $number ) {
			foreach ( array( 1, 2 ) as $tab_number ) {
				$tab_id = "tabs_{$number}-tab-{$tab_number}";

				$processor->next_tag( array( 'tag_name' => 'button' ) );
				$this->assertSame( "tab__{$tab_id}", $processor->get_attribute( 'id' ) );
				$this->assertSame( $tab_id, $processor->get_attribute( 'aria-controls' ) );
			}

			foreach ( array( 1, 2 ) as $tab_number ) {
				$tab_id = "tabs_{$number}-tab-{$tab_number}";

				$processor->next_tag( array( 'class_name' => 'wp-block-tab-panel' ) );
				$this->assertSame( $tab_id, $processor->get_attribute( 'id' ) );
				$this->assertSame( "tab__{$tab_id}", $processor->get_attribute( 'aria-labelledby' ) );
			}
		}
	}

	/**
	 * Reads the instance number out of the `tabsId` a rendered tabs block was given.
	 *
	 * @param string $rendered_block Rendered tabs block.
	 *
	 * @return int Tabs instance number.
	 */
	private function get_tabs_number( string $rendered_block ): int {
		$processor = new WP_HTML_Tag_Processor( $rendered_block );
		$processor->next_tag( array( 'class_name' => 'wp-block-tabs' ) );

		$context = json_decode( (string) $processor->get_attribute( 'data-wp-context' ), true );
		$tabs_id = $context['tabsId'] ?? '';
		$this->assertStringStartsWith( 'tabs_', $tabs_id );

		return (int) substr( $tabs_id, strlen( 'tabs_' ) );
	}

	/**
	 * An inactive panel is hidden with `until-found` rather than outright, so
	 * that the browser's find-in-page can still reach its content. Which panel
	 * is hidden is left to the client, so a visitor without JavaScript is given
	 * the content of every panel rather than none of it.
	 *
	 * @covers ::block_core_tab_panel_render
	 */
	public function test_should_leave_hiding_tab_panels_to_the_client(): void {
		$tabs_block = <<<'BLOCK_CONTENT'
			<!-- wp:tabs -->
			<div class="wp-block-tabs"><!-- wp:tab-list -->
			<div role="tablist" class="wp-block-tab-list"><button type="button" role="tab">Description</button><button type="button" role="tab">Reviews</button></div>
			<!-- /wp:tab-list -->

			<!-- wp:tab-panels -->
			<div class="wp-block-tab-panels"><!-- wp:tab-panel {"label":"Description"} -->
			<section role="tabpanel" tabindex="0" class="wp-block-tab-panel"></section>
			<!-- /wp:tab-panel -->

			<!-- wp:tab-panel {"label":"Reviews"} -->
			<section role="tabpanel" tabindex="0" class="wp-block-tab-panel"></section>
			<!-- /wp:tab-panel --></div>
			<!-- /wp:tab-panels --></div>
			<!-- /wp:tabs -->
		BLOCK_CONTENT;

		$processor = new WP_HTML_Tag_Processor( do_blocks( $tabs_block ) );
		$panels    = array();

		while ( $processor->next_tag( array( 'class_name' => 'wp-block-tab-panel' ) ) ) {
			$panels[] = array(
				'hidden'           => $processor->get_attribute( 'hidden' ),
				'hidden_binding'   => $processor->get_attribute( 'data-wp-bind--hidden' ),
				'tabindex_binding' => $processor->get_attribute( 'data-wp-bind--tabindex' ),
				'beforematch'      => $processor->get_attribute( 'data-wp-on--beforematch' ),
			);
		}

		$this->assertCount( 2, $panels, 'Both tab panels should be rendered.' );

		foreach ( $panels as $index => $panel ) {
			$this->assertNull(
				$panel['hidden'],
				"Panel $index should not be hidden before the block hydrates."
			);
			$this->assertSame(
				'state.isHidden',
				$panel['hidden_binding'],
				"Panel $index should be hidden by the client when its tab is inactive."
			);
			$this->assertSame(
				'state.tabIndexAttribute',
				$panel['tabindex_binding'],
				"Panel $index should leave the tab sequence while it is hidden."
			);
			$this->assertSame(
				'actions.handleBeforeMatch',
				$panel['beforematch'],
				"Panel $index should activate its tab when the browser reveals it."
			);
		}
	}

	/**
	 * A default tab index past the last tab, for example one left behind when
	 * the default tab was removed, falls back to the first tab so that a panel
	 * is still shown.
	 *
	 * @covers ::block_core_tabs_render_block_callback
	 *
	 * @dataProvider data_default_tab_index
	 *
	 * @param int $saved_index    Default tab index saved in the block.
	 * @param int $expected_index Default tab index passed to the front end.
	 */
	public function test_should_fall_back_to_first_tab_when_default_tab_index_is_out_of_range( int $saved_index, int $expected_index ): void {
		$tabs_block = <<<'BLOCK_CONTENT'
			<!-- wp:tabs {"activeTabIndex":%d} -->
			<div class="wp-block-tabs"><!-- wp:tab-list -->
			<div role="tablist" class="wp-block-tab-list"><button type="button" role="tab">Description</button><button type="button" role="tab">Reviews</button></div>
			<!-- /wp:tab-list -->

			<!-- wp:tab-panels -->
			<div class="wp-block-tab-panels"><!-- wp:tab-panel {"label":"Description"} -->
			<section role="tabpanel" tabindex="0" class="wp-block-tab-panel"></section>
			<!-- /wp:tab-panel -->

			<!-- wp:tab-panel {"label":"Reviews"} -->
			<section role="tabpanel" tabindex="0" class="wp-block-tab-panel"></section>
			<!-- /wp:tab-panel --></div>
			<!-- /wp:tab-panels --></div>
			<!-- /wp:tabs -->
		BLOCK_CONTENT;

		$processor = new WP_HTML_Tag_Processor( do_blocks( sprintf( $tabs_block, $saved_index ) ) );
		$processor->next_tag( array( 'class_name' => 'wp-block-tabs' ) );

		$context = json_decode( (string) $processor->get_attribute( 'data-wp-context' ), true );
		$this->assertSame( $expected_index, $context['activeTabIndex'] ?? null );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_default_tab_index(): array {
		return array(
			'existing default tab'          => array(
				'saved_index'    => 1,
				'expected_index' => 1,
			),
			'default tab past the last tab' => array(
				'saved_index'    => 2,
				'expected_index' => 0,
			),
		);
	}

	/**
	 * A browser fetches the images of every panel while it parses the page, so
	 * the images in the panels that are not shown first are lazy-loaded, and
	 * marked for the view script to load when the block nears the viewport.
	 *
	 * @covers ::block_core_tabs_provide_context
	 * @covers ::block_core_tab_panel_render
	 *
	 * @dataProvider data_lazy_loaded_panels
	 *
	 * @param int      $saved_index  Default tab index saved in the block.
	 * @param string   $eager_image  Image in the panel that is shown first.
	 * @param string[] $lazy_images  Images in the other panels.
	 */
	public function test_should_lazy_load_images_in_panels_other_than_the_default_tab( int $saved_index, string $eager_image, array $lazy_images ): void {
		$images = $this->get_image_attributes(
			do_blocks(
				$this->get_tabs_block(
					array(
						'<img src="one.jpg" alt=""/>',
						'<img src="two.jpg" alt=""/>',
						'<img src="three.jpg" alt=""/>',
					),
					$saved_index
				)
			)
		);

		$this->assertCount( 3, $images, 'Every image should be rendered.' );
		$this->assertSame(
			array(
				'loading' => null,
				'marked'  => false,
			),
			$images[ $eager_image ],
			'The image in the default tab panel should be left as it is.'
		);

		foreach ( $lazy_images as $lazy_image ) {
			$this->assertSame(
				array(
					'loading' => 'lazy',
					'marked'  => true,
				),
				$images[ $lazy_image ],
				"The image $lazy_image is not in the default tab panel, so it should be lazy-loaded."
			);
		}
	}

	/**
	 * Data provider.
	 *
	 * @return array<non-empty-string, array{ saved_index: int, eager_image: non-empty-string, lazy_images: non-empty-string[] }>
	 */
	public static function data_lazy_loaded_panels(): array {
		return array(
			'first tab is the default'      => array(
				'saved_index' => 0,
				'eager_image' => 'one.jpg',
				'lazy_images' => array( 'two.jpg', 'three.jpg' ),
			),
			'last tab is the default'       => array(
				'saved_index' => 2,
				'eager_image' => 'three.jpg',
				'lazy_images' => array( 'one.jpg', 'two.jpg' ),
			),
			'default tab past the last tab' => array(
				'saved_index' => 3,
				'eager_image' => 'one.jpg',
				'lazy_images' => array( 'two.jpg', 'three.jpg' ),
			),
		);
	}

	/**
	 * An image whose loading was already decided, by its author or by another
	 * part of WordPress, keeps that decision.
	 *
	 * @covers ::block_core_tab_panel_render
	 */
	public function test_should_not_change_images_that_already_have_loading_or_fetchpriority(): void {
		$rendered_block = do_blocks(
			$this->get_tabs_block(
				array(
					'<img src="one.jpg" alt=""/>',
					'<img src="eager.jpg" alt="" loading="eager"/><img src="lazy.jpg" alt="" loading="lazy"/><img src="high.jpg" alt="" fetchpriority="high"/><img src="low.jpg" alt="" fetchpriority="low"/>',
				)
			)
		);

		$images = $this->get_image_attributes( $rendered_block );

		$this->assertSame( 'eager', $images['eager.jpg']['loading'] );
		$this->assertSame( 'lazy', $images['lazy.jpg']['loading'] );
		$this->assertNull( $images['high.jpg']['loading'], 'A high-priority image should not be lazy-loaded.' );
		$this->assertNull( $images['low.jpg']['loading'], 'A low-priority image should not be lazy-loaded.' );

		foreach ( $images as $src => $image ) {
			$this->assertFalse( $image['marked'], "The image $src should not be marked for the view script to load." );
		}
	}

	/**
	 * A Tabs block inside a panel is hidden along with that panel, whichever of
	 * its own tabs is the default.
	 *
	 * @covers ::block_core_tabs_provide_context
	 * @covers ::block_core_tab_panel_render
	 */
	public function test_should_lazy_load_images_of_tabs_nested_in_a_panel_that_is_not_the_default_tab(): void {
		$nested_in_default_panel = $this->get_tabs_block(
			array(
				'<img src="inner-a-one.jpg" alt=""/>',
				'<img src="inner-a-two.jpg" alt=""/>',
			)
		);
		$nested_in_other_panel   = $this->get_tabs_block(
			array(
				'<img src="inner-b-one.jpg" alt=""/>',
				'<img src="inner-b-two.jpg" alt=""/>',
			)
		);

		$images = $this->get_image_attributes(
			do_blocks(
				$this->get_tabs_block(
					array(
						'<img src="outer-one.jpg" alt=""/>' . $nested_in_default_panel,
						'<img src="outer-two.jpg" alt=""/>' . $nested_in_other_panel,
					)
				)
			)
		);

		$this->assertSame(
			array(
				'outer-one.jpg'   => null,
				'inner-a-one.jpg' => null,
				'inner-a-two.jpg' => 'lazy',
				'outer-two.jpg'   => 'lazy',
				'inner-b-one.jpg' => 'lazy',
				'inner-b-two.jpg' => 'lazy',
			),
			wp_list_pluck( $images, 'loading' )
		);
	}

	/**
	 * The default tab index is read from the block as it was saved, where it
	 * can be any JSON value. A whole number saved as a float is the same tab as
	 * its integer, and anything that is not one of the tabs falls back to the
	 * first tab.
	 *
	 * @covers ::block_core_tabs_provide_context
	 * @covers ::block_core_tabs_render_block_callback
	 * @covers ::block_core_tab_panel_render
	 *
	 * @dataProvider data_saved_default_tab_index
	 *
	 * @param string $saved_index    Default tab index as JSON, as saved in the block.
	 * @param int    $expected_index Default tab index passed to the front end.
	 */
	public function test_should_resolve_the_saved_default_tab_index_to_a_tab( string $saved_index, int $expected_index ): void {
		$tabs_block = str_replace(
			'{"activeTabIndex":0}',
			'{"activeTabIndex":' . $saved_index . '}',
			$this->get_tabs_block(
				array(
					'<img src="0.jpg" alt=""/>',
					'<img src="1.jpg" alt=""/>',
				)
			)
		);
		$this->assertStringContainsString( '{"activeTabIndex":' . $saved_index . '}', $tabs_block );

		$rendered_block = do_blocks( $tabs_block );

		$processor = new WP_HTML_Tag_Processor( $rendered_block );
		$processor->next_tag( array( 'class_name' => 'wp-block-tabs' ) );
		$context = json_decode( (string) $processor->get_attribute( 'data-wp-context' ), true );
		$this->assertSame( $expected_index, $context['activeTabIndex'] ?? null );

		$expected_loading = array(
			'0.jpg' => 'lazy',
			'1.jpg' => 'lazy',
		);

		$expected_loading[ "$expected_index.jpg" ] = null;

		$this->assertSame(
			$expected_loading,
			wp_list_pluck( $this->get_image_attributes( $rendered_block ), 'loading' ),
			'Only the image in the default tab panel should be left as it is.'
		);
	}

	/**
	 * Data provider.
	 *
	 * @return array<non-empty-string, array{ saved_index: non-empty-string, expected_index: 0|1 }>
	 */
	public static function data_saved_default_tab_index(): array {
		return array(
			'whole number as a float'     => array(
				'saved_index'    => '1.0',
				'expected_index' => 1,
			),
			'whole number as an exponent' => array(
				'saved_index'    => '1e0',
				'expected_index' => 1,
			),
			'fraction'                    => array(
				'saved_index'    => '1.5',
				'expected_index' => 0,
			),
			'numeric string'              => array(
				'saved_index'    => '"1"',
				'expected_index' => 0,
			),
			'negative number'             => array(
				'saved_index'    => '-1',
				'expected_index' => 0,
			),
			'number too large for a tab'  => array(
				'saved_index'    => '1e999',
				'expected_index' => 0,
			),
		);
	}

	/**
	 * A panel with an HTML anchor uses it as its ID, which is how the panel is
	 * matched to its tab.
	 *
	 * @covers ::block_core_tab_panel_render
	 */
	public function test_should_lazy_load_images_in_panels_with_an_html_anchor(): void {
		$tabs_block = str_replace(
			array(
				'<!-- wp:tab-panel {"label":"Tab 0"} --><section',
				'<!-- wp:tab-panel {"label":"Tab 1"} --><section',
			),
			array(
				'<!-- wp:tab-panel {"label":"Tab 0","anchor":"first"} --><section id="first"',
				'<!-- wp:tab-panel {"label":"Tab 1","anchor":"second"} --><section id="second"',
			),
			$this->get_tabs_block(
				array(
					'<img src="one.jpg" alt=""/>',
					'<img src="two.jpg" alt=""/>',
				)
			)
		);
		$this->assertStringContainsString( 'id="second"', $tabs_block );

		$this->assertSame(
			array(
				'one.jpg' => null,
				'two.jpg' => 'lazy',
			),
			wp_list_pluck( $this->get_image_attributes( do_blocks( $tabs_block ) ), 'loading' )
		);
	}

	/**
	 * @covers ::block_core_tab_panel_render
	 */
	public function test_should_not_lazy_load_images_when_lazy_loading_is_disabled(): void {
		add_filter( 'wp_lazy_loading_enabled', '__return_false' );

		$rendered_block = do_blocks(
			$this->get_tabs_block(
				array(
					'<img src="one.jpg" alt=""/>',
					'<img src="two.jpg" alt=""/>',
				)
			)
		);

		$this->assertStringNotContainsString( 'loading=', $rendered_block );
		$this->assertStringNotContainsString( 'data-tab-panel-lazy', $rendered_block );
	}

	/**
	 * A panel that is not rendered as part of a Tabs block cannot tell whether
	 * it is shown first, so its images are left for the browser to load.
	 *
	 * @covers ::block_core_tab_panel_render
	 */
	public function test_should_not_lazy_load_images_in_a_panel_outside_a_tabs_block(): void {
		$rendered_block = do_blocks(
			<<<'BLOCK_CONTENT'
			<!-- wp:tab-panel {"label":"One"} -->
			<section role="tabpanel" tabindex="0" class="wp-block-tab-panel"><img src="one.jpg" alt=""/></section>
			<!-- /wp:tab-panel -->

			<!-- wp:tab-panel {"label":"Two"} -->
			<section role="tabpanel" tabindex="0" class="wp-block-tab-panel"><img src="two.jpg" alt=""/></section>
			<!-- /wp:tab-panel -->
			BLOCK_CONTENT
		);

		$this->assertStringContainsString( 'two.jpg', $rendered_block );
		$this->assertStringNotContainsString( 'loading=', $rendered_block );
		$this->assertStringNotContainsString( 'data-tab-panel-lazy', $rendered_block );
	}

	/**
	 * The view script loads the lazy images through a callback that runs when
	 * the Tabs block is set up in the browser.
	 *
	 * @covers ::block_core_tabs_render_block_callback
	 */
	public function test_should_add_the_directive_that_loads_lazy_images(): void {
		$processor = new WP_HTML_Tag_Processor(
			do_blocks(
				$this->get_tabs_block(
					array(
						'<img src="one.jpg" alt=""/>',
						'<img src="two.jpg" alt=""/>',
					)
				)
			)
		);

		$this->assertTrue( $processor->next_tag( array( 'class_name' => 'wp-block-tabs' ) ) );
		$this->assertSame( 'callbacks.loadImagesNearViewport', $processor->get_attribute( 'data-wp-init---load-images' ) );
	}

	/**
	 * Builds a Tabs block with one tab for each panel content given.
	 *
	 * @param string[] $panels           Inner HTML of each tab panel.
	 * @param int      $active_tab_index Optional. Default tab index saved in the block. Default 0.
	 *
	 * @return string Serialized Tabs block.
	 */
	private function get_tabs_block( array $panels, int $active_tab_index = 0 ): string {
		$buttons    = '';
		$tab_panels = '';

		foreach ( $panels as $index => $panel ) {
			$buttons    .= '<button type="button" role="tab">Tab ' . $index . '</button>';
			$tab_panels .= '<!-- wp:tab-panel {"label":"Tab ' . $index . '"} -->'
				. '<section role="tabpanel" tabindex="0" class="wp-block-tab-panel">' . $panel . '</section>'
				. '<!-- /wp:tab-panel -->';
		}

		return '<!-- wp:tabs {"activeTabIndex":' . $active_tab_index . '} -->'
			. '<div class="wp-block-tabs"><!-- wp:tab-list -->'
			. '<div role="tablist" class="wp-block-tab-list">' . $buttons . '</div>'
			. '<!-- /wp:tab-list -->'
			. '<!-- wp:tab-panels -->'
			. '<div class="wp-block-tab-panels">' . $tab_panels . '</div>'
			. '<!-- /wp:tab-panels --></div>'
			. '<!-- /wp:tabs -->';
	}

	/**
	 * Reads how each image in rendered HTML is set to load.
	 *
	 * @param string $html Rendered HTML.
	 *
	 * @return array<string, array{ loading: string|null, marked: bool }> Loading attribute, and whether
	 *                                                                    the view script is to load the
	 *                                                                    image, keyed by image source.
	 */
	private function get_image_attributes( string $html ): array {
		$processor = new WP_HTML_Tag_Processor( $html );
		$images    = array();

		while ( $processor->next_tag( 'IMG' ) ) {
			$images[ (string) $processor->get_attribute( 'src' ) ] = array(
				'loading' => $processor->get_attribute( 'loading' ),
				'marked'  => null !== $processor->get_attribute( 'data-tab-panel-lazy' ),
			);
		}

		return $images;
	}
}
