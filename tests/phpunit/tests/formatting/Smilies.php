<?php

/**
 * @group formatting
 */
class Tests_Formatting_Smilies extends WP_UnitTestCase {

	/**
	 * Basic Test Content DataProvider
	 *
	 * array ( input_txt, converted_output_txt)
	 */
	public function get_smilies_input_output() {
		$includes_path = includes_url("images/smilies/");

		return array (
			array (
				'Lorem ipsum dolor sit amet mauris ;-) Praesent gravida sodales. :lol: Vivamus nec diam in faucibus eu, bibendum varius nec, imperdiet purus est, at augue at lacus malesuada elit dapibus a, :eek: mauris. Cras mauris viverra elit. Nam laoreet viverra. Pellentesque tortor. Nam libero ante, porta urna ut turpis. Nullam wisi magna, :mrgreen: tincidunt nec, sagittis non, fringilla enim. Nam consectetuer nec, ullamcorper pede eu dui odio consequat vel, vehicula tortor quis pede turpis cursus quis, egestas ipsum ultricies ut, eleifend velit. Mauris vestibulum iaculis. Sed in nunc. Vivamus elit porttitor egestas. Mauris purus :?:',
				"Lorem ipsum dolor sit amet mauris \xf0\x9f\x98\x89 Praesent gravida sodales. \xf0\x9f\x98\x86 Vivamus nec diam in faucibus eu, bibendum varius nec, imperdiet purus est, at augue at lacus malesuada elit dapibus a, \xf0\x9f\x98\xae mauris. Cras mauris viverra elit. Nam laoreet viverra. Pellentesque tortor. Nam libero ante, porta urna ut turpis. Nullam wisi magna, <img src=\"${includes_path}mrgreen.png\" alt=\":mrgreen:\" class=\"wp-smiley\" style=\"height: 1em; max-height: 1em;\" /> tincidunt nec, sagittis non, fringilla enim. Nam consectetuer nec, ullamcorper pede eu dui odio consequat vel, vehicula tortor quis pede turpis cursus quis, egestas ipsum ultricies ut, eleifend velit. Mauris vestibulum iaculis. Sed in nunc. Vivamus elit porttitor egestas. Mauris purus \xe2\x9d\x93"
			),
			array (
				'<strong>Welcome to the jungle!</strong> We got fun n games! :) We got everything you want 8-) <em>Honey we know the names :)</em>',
				"<strong>Welcome to the jungle!</strong> We got fun n games! <img src=\"${includes_path}simple-smile.png\" alt=\":)\" class=\"wp-smiley\" style=\"height: 1em; max-height: 1em;\" /> We got everything you want \xf0\x9f\x98\x8e <em>Honey we know the names <img src=\"${includes_path}simple-smile.png\" alt=\":)\" class=\"wp-smiley\" style=\"height: 1em; max-height: 1em;\" /></em>"
			),
			array (
				"<strong;)>a little bit of this\na little bit:other: of that :D\n:D a little bit of good\nyeah with a little bit of bad8O",
				"<strong;)>a little bit of this\na little bit:other: of that \xf0\x9f\x98\x80\n\xf0\x9f\x98\x80 a little bit of good\nyeah with a little bit of bad8O"
			),
			array (
				'<strong style="here comes the sun :-D">and I say it\'s allright:D:D',
				'<strong style="here comes the sun :-D">and I say it\'s allright:D:D'
			),
			array (
				'<!-- Woo-hoo, I\'m a comment, baby! :x > -->',
				'<!-- Woo-hoo, I\'m a comment, baby! :x > -->'
			),
			array (
				':?:P:?::-x:mrgreen:::',
				':?:P:?::-x:mrgreen:::'
			),
		);
	}

	/**
	 * @dataProvider get_smilies_input_output
	 *
	 * Basic Validation Test to confirm that smilies are converted to image
	 * when use_smilies = 1 and not when use_smilies = 0
	 */
	function test_convert_standard_smilies( $in_txt, $converted_txt ) {
		// standard smilies, use_smilies: ON
		update_option( 'use_smilies', 1 );

		smilies_init();

		$this->assertEquals( $converted_txt, convert_smilies($in_txt) );

		// standard smilies, use_smilies: OFF
		update_option( 'use_smilies', 0 );

		$this->assertEquals( $in_txt, convert_smilies($in_txt) );
	}

	/**
	 * Custom Smilies Test Content DataProvider
	 *
	 * array ( input_txt, converted_output_txt)
	 */
	public function get_custom_smilies_input_output() {
		$includes_path = includes_url("images/smilies/");

		return array (
			array (
				'Peter Brian Gabriel (born 13 February 1950) is a British singer, musician, and songwriter who rose to fame as the lead vocalist and flautist of the progressive rock group Genesis. :monkey:',
				'Peter Brian Gabriel (born 13 February 1950) is a British singer, musician, and songwriter who rose to fame as the lead vocalist and flautist of the progressive rock group Genesis. <img src="' . $includes_path . 'icon_shock_the_monkey.gif" alt=":monkey:" class="wp-smiley" style="height: 1em; max-height: 1em;" />'
			),
			array (
				'Star Wars Jedi Knight :arrow: Jedi Academy is a first and third-person shooter action game set in the Star Wars universe. It was developed by Raven Software and published, distributed and marketed by LucasArts in North America and by Activision in the rest of the world. :nervou:',
				'Star Wars Jedi Knight <img src="' . $includes_path . 'icon_arrow.gif" alt=":arrow:" class="wp-smiley" style="height: 1em; max-height: 1em;" /> Jedi Academy is a first and third-person shooter action game set in the Star Wars universe. It was developed by Raven Software and published, distributed and marketed by LucasArts in North America and by Activision in the rest of the world. <img src="' . $includes_path . 'icon_nervou.gif" alt=":nervou:" class="wp-smiley" style="height: 1em; max-height: 1em;" />'
			),
			array (
				':arrow: monkey: Lorem ipsum dolor sit amet enim. Etiam ullam :PP <br />corper. Suspendisse a pellentesque dui, non felis.<a> :arrow: :arrow</a>',
				'<img src="' . $includes_path . 'icon_arrow.gif" alt=":arrow:" class="wp-smiley" style="height: 1em; max-height: 1em;" /> monkey: Lorem ipsum dolor sit amet enim. Etiam ullam <img src="' . $includes_path . 'icon_tongue.gif" alt=":PP" class="wp-smiley" style="height: 1em; max-height: 1em;" /> <br />corper. Suspendisse a pellentesque dui, non felis.<a> <img src="' . $includes_path . 'icon_arrow.gif" alt=":arrow:" class="wp-smiley" style="height: 1em; max-height: 1em;" /> :arrow</a>'
			),
		);
	}

	/**
	 * @dataProvider get_custom_smilies_input_output
	 *
	 * Validate Custom Smilies are converted to images when use_smilies = 1
	 */
	function test_convert_custom_smilies ( $in_txt, $converted_txt ) {
		global $wpsmiliestrans;

		// custom smilies, use_smilies: ON
		update_option( 'use_smilies', 1 );

		if ( !isset( $wpsmiliestrans ) ) {
			smilies_init();
		}

		$trans_orig = $wpsmiliestrans; // save original translations array

		$wpsmiliestrans = array(
		  ':PP' => 'icon_tongue.gif',
		  ':arrow:' => 'icon_arrow.gif',
		  ':monkey:' => 'icon_shock_the_monkey.gif',
		  ':nervou:' => 'icon_nervou.gif'
		);

		smilies_init();

		$this->assertEquals( $converted_txt, convert_smilies($in_txt) );

		// standard smilies, use_smilies: OFF
		update_option( 'use_smilies', 0 );

		$this->assertEquals( $in_txt, convert_smilies($in_txt) );

		$wpsmiliestrans = $trans_orig; // reset original translations array
	}


	/**
	 * DataProvider of HTML elements/tags that smilie matches should be ignored in
	 *
	 */
	public function get_smilies_ignore_tags() {
		return array (
			array( 'pre' ),
			array( 'code' ),
			array( 'script' ),
			array( 'style' ),
			array( 'textarea'),
		);
	}

	/**
	 * Validate Conversion of Smilies is ignored in pre-determined tags
	 * pre, code, script, style
	 *
	 * @ticket 16448
	 * @dataProvider get_smilies_ignore_tags
	 */
	public function test_ignore_smilies_in_tags( $element ) {
		$includes_path = includes_url("images/smilies/");

		$in_str = 'Do we ingore smilies ;-) in ' . $element . ' tags <' . $element . '>My Content Here :?: </' . $element . '>';
		$exp_str = "Do we ingore smilies \xf0\x9f\x98\x89 in $element tags <$element>My Content Here :?: </$element>";

		// standard smilies, use_smilies: ON
		update_option( 'use_smilies', 1 );
		smilies_init();

		$this->assertEquals( $exp_str, convert_smilies($in_str) );

		// standard smilies, use_smilies: OFF
		update_option( 'use_smilies', 0 );
	}

	/**
	 * DataProvider of Smilie Combinations
	 *
	 */
	public function get_smilies_combinations() {
		$includes_path = includes_url("images/smilies/");

		return array (
			array (
				'8-O :-(',
				"\xf0\x9f\x98\xaf <img src=\"{$includes_path}frownie.png\" alt=\":-(\" class=\"wp-smiley\" style=\"height: 1em; max-height: 1em;\" />"
			),
			array (
				'8-) 8-O',
				"\xf0\x9f\x98\x8e \xf0\x9f\x98\xaf"
			),
			array (
				'8-) 8O',
				"\xf0\x9f\x98\x8e \xf0\x9f\x98\xaf"
			),
			array (
				'8-) :-(',
				"\xf0\x9f\x98\x8e <img src=\"{$includes_path}frownie.png\" alt=\":-(\" class=\"wp-smiley\" style=\"height: 1em; max-height: 1em;\" />"
			),
			array (
				'8-) :twisted:',
				"\xf0\x9f\x98\x8e \xf0\x9f\x98\x88"
			),
			array (
				'8O :twisted: :( :? :(',
				"\xf0\x9f\x98\xaf \xf0\x9f\x98\x88 <img src=\"{$includes_path}frownie.png\" alt=\":(\" class=\"wp-smiley\" style=\"height: 1em; max-height: 1em;\" /> \xf0\x9f\x98\x95 <img src=\"{$includes_path}frownie.png\" alt=\":(\" class=\"wp-smiley\" style=\"height: 1em; max-height: 1em;\" />"
			),
		);
	}

	/**
	 * Validate Combinations of Smilies separated by single space
	 * are converted correctly
	 *
	 * @ticket 20124
	 * @dataProvider get_smilies_combinations
	 */
	public function test_smilies_combinations( $in_txt, $converted_txt ) {
		// custom smilies, use_smilies: ON
		update_option( 'use_smilies', 1 );
		smilies_init();

		$this->assertEquals( $converted_txt, convert_smilies($in_txt) );

		// custom smilies, use_smilies: OFF
		update_option( 'use_smilies', 0 );

		$this->assertEquals( $in_txt, convert_smilies($in_txt) );
	}

	/**
	 * DataProvider of Single Smilies input and converted output
	 *
	 */
	public function get_single_smilies_input_output() {
		$includes_path = includes_url("images/smilies/");

		return array (
			array (
				'8-O :-(',
				'8-O :-('
			),
			array (
				'8O :) additional text here :)',
				'8O <img src="' . $includes_path . 'simple-smile.png" alt=":)" class="wp-smiley" style="height: 1em; max-height: 1em;" /> additional text here <img src="' . $includes_path . 'simple-smile.png" alt=":)" class="wp-smiley" style="height: 1em; max-height: 1em;" />'
			),
			array (
				':) :) :) :)',
				'<img src="' . $includes_path . 'simple-smile.png" alt=":)" class="wp-smiley" style="height: 1em; max-height: 1em;" /> <img src="' . $includes_path . 'simple-smile.png" alt=":)" class="wp-smiley" style="height: 1em; max-height: 1em;" /> <img src="' . $includes_path . 'simple-smile.png" alt=":)" class="wp-smiley" style="height: 1em; max-height: 1em;" /> <img src="' . $includes_path . 'simple-smile.png" alt=":)" class="wp-smiley" style="height: 1em; max-height: 1em;" />'
			),
		);
	}

	/**
	 * Validate Smilies are converted for single smilie in
	 * the $wpsmiliestrans global array
	 *
	 * @ticket 25303
	 * @dataProvider get_single_smilies_input_output
	 */
	public function test_single_smilies_in_wpsmiliestrans( $in_txt, $converted_txt ) {
		global $wpsmiliestrans;

		// standard smilies, use_smilies: ON
		update_option( 'use_smilies', 1 );

		if ( !isset( $wpsmiliestrans ) ) {
			smilies_init();
		}

		$orig_trans = $wpsmiliestrans; // save original tranlations array

		$wpsmiliestrans = array (
		  ':)' => 'simple-smile.png'
		);

		smilies_init();

		$this->assertEquals( $converted_txt, convert_smilies($in_txt) );

		// standard smilies, use_smilies: OFF
		update_option( 'use_smilies', 0 );

		$this->assertEquals( $in_txt, convert_smilies($in_txt) );

		$wpsmiliestrans = $orig_trans; // reset original translations array
	}

	/**
	 * Check that $wp_smiliessearch pattern will match smilies
	 * between spaces, but never capture those spaces.
	 *
	 * Further check that spaces aren't randomly deleted
	 * or added when replacing the text with an image.
	 *
	 * @ticket 22692
	 */
	function test_spaces_around_smilies() {
		$nbsp = "\xC2\xA0";

		// standard smilies, use_smilies: ON
		update_option( 'use_smilies', 1 );
		smilies_init();

		$input  = array();
		$output = array();

		$input[]  = 'My test :) smile';
		$output[] = array('test <img ', 'alt=":)"', ' /> smile');

		$input[]  = 'My test &nbsp;:)&nbsp;smile';
		$output[] = array('test &nbsp;<img ', 'alt=":)"', ' />&nbsp;smile');

		$input[]  = "My test {$nbsp}:){$nbsp}smile";
		$output[] = array("test {$nbsp}<img ", 'alt=":)"', " />{$nbsp}smile");

		foreach($input as $key => $in) {
			$result = convert_smilies( $in );
			foreach($output[$key] as $out) {

				// Each output element must appear in the results.
				$this->assertContains( $out, $result );

			}
		}

		// standard smilies, use_smilies: OFF
		update_option( 'use_smilies', 0 );
	}
}
