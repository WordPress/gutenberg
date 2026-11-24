<?php
/**
 * Tests for block_core_post_time_to_read_word_count function
 *
 * @package WordPress
 */

class Block_Post_Time_To_Read_Word_Count_Test extends WP_UnitTestCase {
	/**
	 * Tests that words are counted correctly based on the type
	 *
	 * @covers ::gutenberg_block_core_post_time_to_read_word_count
	 *
	 * @dataProvider data_get_string_variations
	 *
	 * @param string $input_string                String to count words.
	 * @param int    $words                       Expected value if the count type is based on word.
	 * @param int    $characters_excluding_spaces Expected value if the count type is based on single character excluding spaces.
	 * @param int    $characters_including_spaces Expected value if the count type is based on single character including spaces.
	 */
	public function test_word_count( $input_string, $words, $characters_excluding_spaces, $characters_including_spaces ) {
		$this->assertSame( $words, gutenberg_block_core_post_time_to_read_word_count( $input_string, 'words' ) );
		$this->assertSame( $characters_excluding_spaces, gutenberg_block_core_post_time_to_read_word_count( $input_string, 'characters_excluding_spaces' ) );
		$this->assertSame( $characters_including_spaces, gutenberg_block_core_post_time_to_read_word_count( $input_string, 'characters_including_spaces' ) );
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
			'No-break space' => array(
				'string'                      => 'one' . json_decode( '"\u00a0"' ) . 'two' . json_decode( '"\u00a0"' ) . 'three',
				'words'                       => 3,
				'characters_excluding_spaces' => 11,
				'characters_including_spaces' => 13,
			),
			'Unicode spaces' => array(
				'string'                      => 'one' . json_decode( '"\u2003"' ) . 'two' . json_decode( '"\u202f"' ) . 'three',
				'words'                       => 3,
				'characters_excluding_spaces' => 11,
				'characters_including_spaces' => 13,
			),
			'NBSP in number' => array(
				'string'                      => 'Il a payé 10' . json_decode( '"\u00a0"' ) . '000 euros',
				'words'                       => 6,
				'characters_excluding_spaces' => 17,
				'characters_including_spaces' => 22,
			),
			'Punctuation'    => array(
				'string'                      => "It's two three " . json_decode( '"\u2026"' ) . ' 4?',
				'words'                       => 4,
				'characters_excluding_spaces' => 15,
				'characters_including_spaces' => 19,
			),
			'Numbers'        => array(
				'string'                      => 'Should be 4 words',
				'words'                       => 4,
				'characters_excluding_spaces' => 14,
				'characters_including_spaces' => 17,
			),
			'Number formats' => array(
				'string'                      => 'In 2026 we sold 1,500 units for $5 each',
				'words'                       => 9,
				'characters_excluding_spaces' => 31,
				'characters_including_spaces' => 39,
			),
			'Em dash'        => array(
				'string'                      => 'one' . json_decode( '"\u2014"' ) . 'two--three',
				'words'                       => 3,
				'characters_excluding_spaces' => 14,
				'characters_including_spaces' => 14,
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
