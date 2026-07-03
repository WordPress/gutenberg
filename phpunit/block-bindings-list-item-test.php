<?php
/**
 * Tests for the `core/list-item` block bindings shim.
 *
 * The `gutenberg_restore_list_item_inner_blocks_after_binding` shim
 * (WordPress 7.1 compat) restores a List Item's nested inner blocks after a
 * `content` binding replaces the whole `<li>`:
 *
 * - On WP 6.9/7.0, `WP_Block::replace_html()` lacks the inner-blocks fix
 *   (wordpress-develop#12113), so applying the content binding wipes the
 *   whole `<li>` inner HTML; the shim re-appends the instance's rendered
 *   inner blocks before the closing `</li>`.
 * - On cores that preserve the inner blocks while applying the content
 *   binding, the shim's `str_contains` check skips the re-append, so the
 *   nested list never renders twice.
 *
 * @package gutenberg
 */
class Tests_Block_Bindings_List_Item extends WP_UnitTestCase {

	const CONTENT_SOURCE_NAME = 'test/list-item-content';

	/**
	 * Cleans up any block bindings sources registered during a test.
	 */
	public function tear_down() {
		foreach ( get_all_registered_block_bindings_sources() as $source_name => $source_properties ) {
			if ( str_starts_with( $source_name, 'test/' ) ) {
				unregister_block_bindings_source( $source_name );
			}
		}

		parent::tear_down();
	}

	/**
	 * Registers a source supplying a List Item's `content` rich text.
	 *
	 * @param string $content_value The value returned for the `content` attribute.
	 */
	private function register_content_source( $content_value ) {
		register_block_bindings_source(
			self::CONTENT_SOURCE_NAME,
			array(
				'label'              => 'List item content source',
				'get_value_callback' => static function ( $source_args, $block_instance, $attribute_name ) use ( $content_value ) {
					if ( 'content' === $attribute_name ) {
						return $content_value;
					}
					return null;
				},
			)
		);
	}

	/**
	 * On WP 6.9/7.0, applying the content binding wipes the whole `<li>` inner
	 * HTML — including the nested inner blocks. The shim must restore them.
	 *
	 * This calls the shim directly with block content that no longer contains
	 * the inner blocks' rendered HTML (the wiped state those cores produce);
	 * the `str_contains` check alone already prevents a double-append on
	 * fixed cores.
	 *
	 * @covers ::gutenberg_restore_list_item_inner_blocks_after_binding
	 */
	public function test_shim_restores_inner_blocks_when_content_binding_wiped_them() {
		$parsed_block = array(
			'blockName' => 'core/list-item',
			'attrs'     => array(
				'metadata' => array(
					'bindings' => array(
						'content' => array( 'source' => self::CONTENT_SOURCE_NAME ),
					),
				),
			),
		);

		// A real instance whose inner blocks render to markup not present in the
		// supplied `$block_content`, so the `str_contains` guard would not fire.
		$instance = new WP_Block(
			array(
				'blockName'    => 'core/list-item',
				'attrs'        => $parsed_block['attrs'],
				'innerBlocks'  => array(
					array(
						'blockName'    => 'core/list',
						'attrs'        => array(),
						'innerBlocks'  => array(),
						'innerHTML'    => '<ul class="wp-block-list"></ul>',
						'innerContent' => array( '<ul class="wp-block-list">', '</ul>' ),
					),
				),
				'innerHTML'    => '<li></li>',
				'innerContent' => array( '<li>', null, '</li>' ),
			)
		);

		$block_content = '<li>Bound item text</li>';

		$result = gutenberg_restore_list_item_inner_blocks_after_binding(
			$block_content,
			$parsed_block,
			$instance
		);

		$this->assertStringContainsString(
			'<ul class="wp-block-list"></ul>',
			$result,
			'The shim must restore the inner blocks when the content binding wiped them.'
		);
		$this->assertStringEndsWith(
			'</li>',
			$result,
			'The restored inner blocks must be re-appended inside the closing </li>.'
		);
		$this->assertSame(
			1,
			substr_count( $result, '<ul class="wp-block-list"></ul>' ),
			'The restored inner blocks must render exactly once.'
		);
	}

	/**
	 * A List Item with a bound `content` attribute keeps its nested inner
	 * blocks: the shim restores the nested list dropped when the content
	 * binding replaces the `<li>`, and it renders exactly once.
	 *
	 * @covers ::gutenberg_restore_list_item_inner_blocks_after_binding
	 */
	public function test_content_binding_restores_inner_blocks() {
		$this->register_content_source( 'Bound item text' );

		$markup = '<!-- wp:list-item {"metadata":{"bindings":{"content":{"source":"' . self::CONTENT_SOURCE_NAME . '"}}}} -->' .
			'<li>Original text<!-- wp:list {"ordered":false} --><ul class="wp-block-list"><!-- wp:list-item --><li>Nested item</li><!-- /wp:list-item --></ul><!-- /wp:list --></li>' .
			'<!-- /wp:list-item -->';

		$parsed = parse_blocks( $markup );
		$result = render_block( $parsed[0] );

		// The content binding supplies the rich text.
		$this->assertStringContainsString(
			'Bound item text',
			$result,
			'The content binding should supply the list item rich text.'
		);

		// The shim restores the nested list dropped when the content binding
		// replaced the `<li>`, and it renders exactly once.
		$this->assertStringContainsString(
			'Nested item',
			$result,
			'The shim should restore the nested inner blocks for a content binding.'
		);
		$this->assertSame(
			1,
			substr_count( $result, 'Nested item' ),
			'The restored inner blocks must render exactly once.'
		);
	}
}
