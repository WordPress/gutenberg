<?php
/**
 * Tests for the filterable list of note reaction emoji.
 *
 * @package gutenberg
 */
class Tests_Note_Reaction_Emojis extends WP_UnitTestCase {

	public function tear_down(): void {
		remove_all_filters( 'wp_note_reaction_emojis' );
		parent::tear_down();
	}

	public function test_defaults_to_the_seven_quick_reactions(): void {
		$this->assertSame(
			array( '1f44d', '2795', '2764', '1f389', '1f604', '1f440', '1f680' ),
			gutenberg_get_note_reaction_keys()
		);
	}

	public function test_filter_can_add_and_remove_emoji(): void {
		add_filter(
			'wp_note_reaction_emojis',
			static function ( $emojis ) {
				$emojis[] = array(
					'hex_key' => '1f984',
					'label'   => 'unicorn',
				);
				return array_slice( $emojis, 1 );
			}
		);

		$this->assertSame(
			array( '2795', '2764', '1f389', '1f604', '1f440', '1f680', '1f984' ),
			gutenberg_get_note_reaction_keys()
		);
	}

	public function test_filter_can_remove_every_emoji(): void {
		add_filter( 'wp_note_reaction_emojis', '__return_empty_array' );

		$this->assertSame( array(), gutenberg_get_note_reaction_emojis() );
	}

	public function test_falls_back_to_the_defaults_when_the_filter_returns_no_list(): void {
		add_filter( 'wp_note_reaction_emojis', '__return_null' );

		$this->assertCount( 7, gutenberg_get_note_reaction_emojis() );
	}

	public function test_drops_malformed_and_duplicate_entries(): void {
		add_filter(
			'wp_note_reaction_emojis',
			static function () {
				return array(
					// Normalized: lowercase, padded, U+FE0F dropped.
					array(
						'hex_key' => '2764-FE0F',
						'label'   => 'heart',
					),
					// The same key again.
					array(
						'hex_key' => '2764',
						'label'   => 'red heart',
					),
					array(
						'hex_key' => '1F468-200D-1F4BB',
						'label'   => '<b>technologist</b>',
					),
					array(
						'hex_key' => 'not-hex',
						'label'   => 'broken',
					),
					array(
						'hex_key' => 'd83d',
						'label'   => 'surrogate',
					),
					array(
						'hex_key' => '110000',
						'label'   => 'past U+10FFFF',
					),
					array(
						'hex_key' => '1f984',
						'label'   => '',
					),
					array( 'hex_key' => '1f680' ),
					'1f389',
				);
			}
		);

		$this->assertSame(
			array(
				array(
					'hex_key' => '2764',
					'label'   => 'heart',
				),
				array(
					'hex_key' => '1f468-200d-1f4bb',
					'label'   => 'technologist',
				),
			),
			gutenberg_get_note_reaction_emojis()
		);
	}

	public function test_passes_the_emoji_to_the_editor(): void {
		$settings = apply_filters( 'block_editor_settings_all', array(), new WP_Block_Editor_Context() );

		$this->assertSame( gutenberg_get_note_reaction_emojis(), $settings['noteReactionEmojis'] );
	}
}
