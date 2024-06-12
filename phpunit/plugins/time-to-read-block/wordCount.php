<?php
/**
 * Time To Read block word count tests.
 */

class Tests_Plugins_Time_To_Read_Block_wordCount extends WP_UnitTestCase {
	/**
	 * Tests that words are counted correctly based on the type
	 *
	 * @covers ::gutenberg_time_to_read_word_count
	 *
	 * @dataProvider data_get_string_variations
	 *
	 * @param string $input_string                String to count words.
	 * @param int    $words                       Expected value if the count type is based on word.
	 * @param int    $characters_excluding_spaces Expected value if the count type is based on single character excluding spaces.
	 * @param int    $characters_including_spaces Expected value if the count type is based on single character including spaces.
	 */
	public function test_word_count( $input_string, $words, $characters_excluding_spaces, $characters_including_spaces ) {
		$settings = array(
			'shortcodes' => array( 'shortcode' ),
		);

		$this->assertEquals( wp_word_count( $input_string, 'words', $settings ), $words );
		$this->assertEquals( wp_word_count( $input_string, 'characters_excluding_spaces', $settings ), $characters_excluding_spaces );
		$this->assertEquals( wp_word_count( $input_string, 'characters_including_spaces', $settings ), $characters_including_spaces );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_get_string_variations() {
		return array(
			'Basic test'     => array(
				'string'                      => 'one two three',
				'words'                       => 3,
				'characters_excluding_spaces' => 11,
				'characters_including_spaces' => 13,
			),
			'HTML tags'      => array(
				'string'                      => 'one <em class="test">two</em><br />three',
				'words'                       => 3,
				'characters_excluding_spaces' => 11,
				'characters_including_spaces' => 12,
			),
			'Line breaks'    => array(
				'string'                      => "one\ntwo\nthree",
				'words'                       => 3,
				'characters_excluding_spaces' => 11,
				'characters_including_spaces' => 11,
			),
			'Encoded spaces' => array(
				'string'                      => 'one&nbsp;two&#160;three',
				'words'                       => 3,
				'characters_excluding_spaces' => 11,
				'characters_including_spaces' => 13,
			),
			'Punctuation'    => array(
				'string'                      => "It's two three " . json_decode( '"\u2026"' ) . ' 4?',
				'words'                       => 3,
				'characters_excluding_spaces' => 15,
				'characters_including_spaces' => 19,
			),
			'Em dash'        => array(
				'string'                      => 'one' . json_decode( '"\u2014"' ) . 'two--three',
				'words'                       => 3,
				'characters_excluding_spaces' => 14,
				'characters_including_spaces' => 14,
			),
			'Shortcodes'     => array(
				'string'                      => 'one [shortcode attribute="value"]two[/shortcode]three',
				'words'                       => 3,
				'characters_excluding_spaces' => 11,
				'characters_including_spaces' => 12,
			),
			'Astrals'        => array(
				'string'                      => json_decode( '"\uD83D\uDCA9"' ),
				'words'                       => 1,
				'characters_excluding_spaces' => 1,
				'characters_including_spaces' => 1,
			),
			'HTML comment'   => array(
				'string'                      => 'one<!-- comment -->two three',
				'words'                       => 2,
				'characters_excluding_spaces' => 11,
				'characters_including_spaces' => 12,
			),
			'HTML entity'    => array(
				'string'                      => '&gt; test',
				'words'                       => 1,
				'characters_excluding_spaces' => 5,
				'characters_including_spaces' => 6,
			),
		);
	}
}
