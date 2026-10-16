<?php
/**
 * Search block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Search block.
 *
 * @group blocks
 */
class Render_Block_Search_Test extends WP_UnitTestCase {

	/**
	 * An icon-only search button must expose an accessible name even when the
	 * button text has been cleared in the editor.
	 *
	 * @dataProvider data_button_text_without_a_name
	 *
	 * @param string $button_text The serialized `buttonText` attribute.
	 */
	public function test_icon_button_falls_back_to_default_aria_label( $button_text ) {
		$markup = do_blocks(
			sprintf(
				'<!-- wp:search {"buttonText":%s,"buttonUseIcon":true} /-->',
				wp_json_encode( $button_text )
			)
		);

		$this->assertStringContainsString(
			'aria-label="Search"',
			$markup,
			'The icon button should fall back to the default "Search" label.'
		);
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_button_text_without_a_name() {
		return array(
			'empty string'        => array( '' ),
			'whitespace only'     => array( '   ' ),
			'markup with no text' => array( '<em></em>' ),
		);
	}

	/**
	 * A button label supplied by the user must be preserved.
	 */
	public function test_icon_button_keeps_custom_aria_label() {
		$markup = do_blocks( '<!-- wp:search {"buttonText":"Find stuff","buttonUseIcon":true} /-->' );

		$this->assertStringContainsString( 'aria-label="Find stuff"', $markup );
	}
}
