<?php
/**
 * Tests for the guideline scopes registry and the slug/length helpers.
 *
 * @package gutenberg
 *
 * @group knowledge
 */
class Gutenberg_Guideline_Scopes_Test extends WP_UnitTestCase {

	/**
	 * The default scopes are registered in order, each with the expected shape.
	 */
	public function test_default_scopes_are_registered() {
		$scopes = wp_guideline_scopes();

		$this->assertSame( array( 'site', 'copy', 'images', 'blocks', 'additional' ), array_keys( $scopes ) );

		foreach ( $scopes as $scope ) {
			$this->assertArrayHasKey( 'title', $scope );
			$this->assertArrayHasKey( 'description', $scope );
			$this->assertArrayHasKey( 'order', $scope );
			$this->assertIsInt( $scope['order'] );
		}

		$this->assertSame( 'Site', $scopes['site']['title'] );
	}

	/**
	 * Plugins can register additional scopes through the filter.
	 */
	public function test_scopes_are_filterable() {
		add_filter(
			'wp_guideline_scopes',
			static function ( $scopes ) {
				$scopes['custom'] = array(
					'title'       => 'Custom',
					'description' => 'Custom scope.',
					'order'       => 99,
				);
				return $scopes;
			}
		);

		$scopes = wp_guideline_scopes();

		$this->assertArrayHasKey( 'custom', $scopes );
		$this->assertSame( 'Custom', $scopes['custom']['title'] );
	}

	/**
	 * The content length cap defaults to 5000 characters.
	 */
	public function test_max_length_defaults_to_5000() {
		$this->assertSame( 5000, wp_guideline_max_length() );
	}

	/**
	 * The content length cap is filterable.
	 */
	public function test_max_length_is_filterable() {
		add_filter(
			'wp_guideline_max_length',
			static function () {
				return 10;
			}
		);

		$this->assertSame( 10, wp_guideline_max_length() );
	}

	/**
	 * Data provider for scope resolution from a row slug.
	 *
	 * @return array<string, array{0: string, 1: string|null}>
	 */
	public function data_scope_from_slug(): array {
		return array(
			'registry scope'   => array( 'guideline-site', 'site' ),
			'another scope'    => array( 'guideline-images', 'images' ),
			'blocks scope'     => array( 'guideline-blocks', 'blocks' ),
			'block row'        => array( 'guideline-block-core_paragraph', 'blocks' ),
			'empty block name' => array( 'guideline-block-', null ),
			'unknown scope'    => array( 'guideline-nope', null ),
			'bare prefix'      => array( 'guideline-', null ),
			'not a guideline'  => array( 'note-site', null ),
		);
	}

	/**
	 * A row slug resolves to the scope that owns it.
	 *
	 * @dataProvider data_scope_from_slug
	 *
	 * @param string      $slug     Post slug.
	 * @param string|null $expected Expected scope key.
	 */
	public function test_scope_from_slug( $slug, $expected ) {
		$this->assertSame( $expected, wp_guideline_scope_from_slug( $slug ) );
	}

	/**
	 * Per-block rows resolve to the blocks scope only while it is registered.
	 */
	public function test_block_row_scope_requires_blocks_scope() {
		$this->assertSame( 'blocks', wp_guideline_scope_from_slug( 'guideline-block-core_paragraph' ) );

		add_filter(
			'wp_guideline_scopes',
			static function ( $scopes ) {
				unset( $scopes['blocks'] );
				return $scopes;
			}
		);

		$this->assertNull( wp_guideline_scope_from_slug( 'guideline-block-core_paragraph' ) );
	}
}
