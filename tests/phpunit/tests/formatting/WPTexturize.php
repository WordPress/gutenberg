<?php

/**
 * @group formatting
 */
class Tests_Formatting_WPTexturize extends WP_UnitTestCase {
	function test_dashes() {
		$this->assertEquals('Hey &#8212; boo?', wptexturize('Hey -- boo?'));
		$this->assertEquals('<a href="http://xx--xx">Hey &#8212; boo?</a>', wptexturize('<a href="http://xx--xx">Hey -- boo?</a>'));
	}

	function test_disable() {
		$this->assertEquals('<pre>---</pre>', wptexturize('<pre>---</pre>'));
		$this->assertEquals('<pre><code></code>--</pre>', wptexturize('<pre><code></code>--</pre>'));

		$this->assertEquals( '<code>---</code>',     wptexturize( '<code>---</code>'     ) );
		$this->assertEquals( '<kbd>---</kbd>',       wptexturize( '<kbd>---</kbd>'       ) );
		$this->assertEquals( '<style>---</style>',   wptexturize( '<style>---</style>'   ) );
		$this->assertEquals( '<script>---</script>', wptexturize( '<script>---</script>' ) );
		$this->assertEquals( '<tt>---</tt>',         wptexturize( '<tt>---</tt>'         ) );

		$this->assertEquals('<code>href="baba"</code> &#8220;baba&#8221;', wptexturize('<code>href="baba"</code> "baba"'));

		$enabled_tags_inside_code = '<code>curl -s <a href="http://x/">baba</a> | grep sfive | cut -d "\"" -f 10 &gt; topmp3.txt</code>';
		$this->assertEquals($enabled_tags_inside_code, wptexturize($enabled_tags_inside_code));

		$double_nest = '<pre>"baba"<code>"baba"<pre></pre></code>"baba"</pre>';
		$this->assertEquals($double_nest, wptexturize($double_nest));

		$invalid_nest = '<pre></code>"baba"</pre>';
		$this->assertEquals($invalid_nest, wptexturize($invalid_nest));

	}

	//WP Ticket #1418
	function test_bracketed_quotes_1418() {
		$this->assertEquals('(&#8220;test&#8221;)', wptexturize('("test")'));
		$this->assertEquals('(&#8216;test&#8217;)', wptexturize("('test')"));
		$this->assertEquals('(&#8217;twas)', wptexturize("('twas)"));
	}

	//WP Ticket #3810
	function test_bracketed_quotes_3810() {
		$this->assertEquals('A dog (&#8220;Hubertus&#8221;) was sent out.', wptexturize('A dog ("Hubertus") was sent out.'));
	}

	//WP Ticket #4539
	function test_basic_quotes() {
		$this->assertEquals('test&#8217;s', wptexturize('test\'s'));

		$this->assertEquals('&#8216;quoted&#8217;', wptexturize('\'quoted\''));
		$this->assertEquals('&#8220;quoted&#8221;', wptexturize('"quoted"'));

		$this->assertEquals('space before &#8216;quoted&#8217; space after', wptexturize('space before \'quoted\' space after'));
		$this->assertEquals('space before &#8220;quoted&#8221; space after', wptexturize('space before "quoted" space after'));

		$this->assertEquals('(&#8216;quoted&#8217;)', wptexturize('(\'quoted\')'));
		$this->assertEquals('{&#8220;quoted&#8221;}', wptexturize('{"quoted"}'));

		$this->assertEquals('&#8216;qu(ot)ed&#8217;', wptexturize('\'qu(ot)ed\''));
		$this->assertEquals('&#8220;qu{ot}ed&#8221;', wptexturize('"qu{ot}ed"'));

		$this->assertEquals(' &#8216;test&#8217;s quoted&#8217; ', wptexturize(' \'test\'s quoted\' '));
		$this->assertEquals(' &#8220;test&#8217;s quoted&#8221; ', wptexturize(' "test\'s quoted" '));
	}

	/**
	 * @ticket 4539
	 * @ticket 15241
	 */
	function test_full_sentences_with_unmatched_single_quotes() {
		$this->assertEquals(
			'That means every moment you&#8217;re working on something without it being in the public it&#8217;s actually dying.',
			wptexturize("That means every moment you're working on something without it being in the public it's actually dying.")
		);
	}

	/**
	 * @ticket 4539
	 */
	function test_quotes() {
		$this->assertEquals('&#8220;Quoted String&#8221;', wptexturize('"Quoted String"'));
		//$this->assertEquals('Here is &#8220;<a href="http://example.com">a test with a link</a>&#8221;', wptexturize('Here is "<a href="http://example.com">a test with a link</a>"'));
		//$this->assertEquals('Here is &#8220;<a href="http://example.com">a test with a link and a period</a>&#8221;.', wptexturize('Here is "<a href="http://example.com">a test with a link and a period</a>".'));
		$this->assertEquals('Here is &#8220;<a href="http://example.com">a test with a link</a>&#8221; and a space.', wptexturize('Here is "<a href="http://example.com">a test with a link</a>" and a space.'));
		$this->assertEquals('Here is &#8220;<a href="http://example.com">a test with a link</a> and some text quoted&#8221;', wptexturize('Here is "<a href="http://example.com">a test with a link</a> and some text quoted"'));
		//$this->assertEquals('Here is &#8220;<a href="http://example.com">a test with a link</a>&#8221;, and a comma.', wptexturize('Here is "<a href="http://example.com">a test with a link</a>", and a comma.'));
		//$this->assertEquals('Here is &#8220;<a href="http://example.com">a test with a link</a>&#8221;; and a semi-colon.', wptexturize('Here is "<a href="http://example.com">a test with a link</a>"; and a semi-colon.'));
		//$this->assertEquals('Here is &#8220;<a href="http://example.com">a test with a link</a>&#8221;- and a dash.', wptexturize('Here is "<a href="http://example.com">a test with a link</a>"- and a dash.'));
		//$this->assertEquals('Here is &#8220;<a href="http://example.com">a test with a link</a>&#8221;&#8230; and ellipses.', wptexturize('Here is "<a href="http://example.com">a test with a link</a>"... and ellipses.'));
		//$this->assertEquals('Here is &#8220;a test <a href="http://example.com">with a link</a>&#8221;.', wptexturize('Here is "a test <a href="http://example.com">with a link</a>".'));
		//$this->assertEquals('Here is &#8220;<a href="http://example.com">a test with a link</a>&#8221;and a work stuck to the end.', wptexturize('Here is "<a href="http://example.com">a test with a link</a>"and a work stuck to the end.'));
		$this->assertEquals('A test with a finishing number, &#8220;like 23&#8221;.', wptexturize('A test with a finishing number, "like 23".'));
		$this->assertEquals('A test with a number, &#8220;like 62&#8221;, is nice to have.', wptexturize('A test with a number, "like 62", is nice to have.'));
	}

	/**
	 * @ticket 4539
	 */
	function test_quotes_before_s() {
		$this->assertEquals('test&#8217;s', wptexturize("test's"));
		$this->assertEquals('&#8216;test&#8217;s', wptexturize("'test's"));
		$this->assertEquals('&#8216;test&#8217;s&#8217;', wptexturize("'test's'"));
		$this->assertEquals('&#8216;string&#8217;', wptexturize("'string'"));
		$this->assertEquals('&#8216;string&#8217;s&#8217;', wptexturize("'string's'"));
	}

	/**
	 * @ticket 4539
	 */
	function test_quotes_before_numbers() {
		$this->assertEquals('Class of &#8217;99', wptexturize("Class of '99"));
		$this->assertEquals('Class of &#8217;99&#8217;s', wptexturize("Class of '99's"));
		$this->assertEquals('&#8216;Class of &#8217;99&#8217;', wptexturize("'Class of '99'"));
		$this->assertEquals('&#8216;Class of &#8217;99&#8217; ', wptexturize("'Class of '99' "));
		$this->assertEquals('&#8216;Class of &#8217;99&#8217;.', wptexturize("'Class of '99'."));
		$this->assertEquals('&#8216;Class of &#8217;99&#8217;, she said', wptexturize("'Class of '99', she said"));
		$this->assertEquals('&#8216;Class of &#8217;99&#8217;:', wptexturize("'Class of '99':"));
		$this->assertEquals('&#8216;Class of &#8217;99&#8217;;', wptexturize("'Class of '99';"));
		$this->assertEquals('&#8216;Class of &#8217;99&#8217;!', wptexturize("'Class of '99'!"));
		$this->assertEquals('&#8216;Class of &#8217;99&#8217;?', wptexturize("'Class of '99'?"));
		$this->assertEquals('&#8216;Class of &#8217;99&#8217;s&#8217;', wptexturize("'Class of '99's'"));
		$this->assertEquals('&#8216;Class of &#8217;99&#8217;s&#8217;', wptexturize("'Class of '99&#8217;s'"));
		$this->assertEquals('&#8220;Class of 99&#8221;', wptexturize("\"Class of 99\""));
		$this->assertEquals('&#8220;Class of &#8217;99&#8221;', wptexturize("\"Class of '99\""));
		$this->assertEquals('{&#8220;Class of &#8217;99&#8221;}', wptexturize("{\"Class of '99\"}"));
		$this->assertEquals(' &#8220;Class of &#8217;99&#8221; ', wptexturize(" \"Class of '99\" "));
		$this->assertEquals(' &#8220;Class of &#8217;99&#8221;.', wptexturize(" \"Class of '99\"."));
		$this->assertEquals(' &#8220;Class of &#8217;99&#8221;, she said', wptexturize(" \"Class of '99\", she said"));
		$this->assertEquals(' &#8220;Class of &#8217;99&#8221;:', wptexturize(" \"Class of '99\":"));
		$this->assertEquals(' &#8220;Class of &#8217;99&#8221;;', wptexturize(" \"Class of '99\";"));
		$this->assertEquals(' &#8220;Class of &#8217;99&#8221;!', wptexturize(" \"Class of '99\"!"));
		$this->assertEquals(' &#8220;Class of &#8217;99&#8221;?', wptexturize(" \"Class of '99\"?"));
		$this->assertEquals('}&#8221;Class of &#8217;99&#8243;{', wptexturize("}\"Class of '99\"{")); // Not a quotation, may be between two other quotations.
	}

	function test_quotes_after_numbers() {
		$this->assertEquals('Class of &#8217;99', wptexturize("Class of '99"));
	}

	/**
	 * @ticket 4539
	 * @ticket 15241
	 */
	function test_other_html() {
		$this->assertEquals('&#8216;<strong>', wptexturize("'<strong>"));
		//$this->assertEquals('&#8216;<strong>Quoted Text</strong>&#8217;,', wptexturize("'<strong>Quoted Text</strong>',"));
		//$this->assertEquals('&#8220;<strong>Quoted Text</strong>&#8221;,', wptexturize('"<strong>Quoted Text</strong>",'));
	}

	function test_x() {
		$this->assertEquals('14&#215;24', wptexturize("14x24"));
	}

	function test_minutes_seconds() {
		$this->assertEquals('9&#8242;', wptexturize('9\''));
		$this->assertEquals('9&#8243;', wptexturize("9\""));

		$this->assertEquals('a 9&#8242; b', wptexturize('a 9\' b'));
		$this->assertEquals('a 9&#8243; b', wptexturize("a 9\" b"));

		$this->assertEquals('&#8220;a 9&#8242; b&#8221;', wptexturize('"a 9\' b"'));
		$this->assertEquals('&#8216;a 9&#8243; b&#8217;', wptexturize("'a 9\" b'"));
	}

	/**
	 * @ticket 8775
	 */
	function test_wptexturize_quotes_around_numbers() {
		$this->assertEquals('&#8220;12345&#8221;', wptexturize('"12345"'));
		$this->assertEquals('&#8216;12345&#8217;', wptexturize('\'12345\''));
		$this->assertEquals('&#8220;a 9&#8242; plus a &#8216;9&#8217;, maybe a 9&#8242; &#8216;9&#8217;&#8221;', wptexturize('"a 9\' plus a \'9\', maybe a 9\' \'9\'"'));
		$this->assertEquals('<p>&#8217;99<br />&#8216;123&#8217;<br />&#8217;tis<br />&#8216;s&#8217;</p>', wptexturize('<p>\'99<br />\'123\'<br />\'tis<br />\'s\'</p>'));
	}

	/**
	 * @ticket 8912
	 */
	function test_wptexturize_html_comments() {
		$this->assertEquals('<!--[if !IE]>--><!--<![endif]-->', wptexturize('<!--[if !IE]>--><!--<![endif]-->'));
		$this->assertEquals('<!--[if !IE]>"a 9\' plus a \'9\', maybe a 9\' \'9\' "<![endif]-->', wptexturize('<!--[if !IE]>"a 9\' plus a \'9\', maybe a 9\' \'9\' "<![endif]-->'));
		$this->assertEquals('<ul><li>Hello.</li><!--<li>Goodbye.</li>--></ul>', wptexturize('<ul><li>Hello.</li><!--<li>Goodbye.</li>--></ul>'));
	}

	/**
	 * @ticket 4539
	 * @ticket 15241
	 */
	function test_entity_quote_cuddling() {
		$this->assertEquals('&nbsp;&#8220;Testing&#8221;', wptexturize('&nbsp;"Testing"'));
		//$this->assertEquals('&#38;&#8220;Testing&#8221;', wptexturize('&#38;"Testing"'));
	}

	/**
	 * @ticket 22823
	 */
	function test_apostrophes_before_primes() {
		$this->assertEquals( 'WordPress 3.5&#8217;s release date', wptexturize( "WordPress 3.5's release date" ) );
	}

	/**
	 * @ticket 23185
	 */
	function test_spaces_around_hyphens() {
		$nbsp = "\xC2\xA0";

		$this->assertEquals( ' &#8211; ', wptexturize( ' - ' ) );
		$this->assertEquals( '&nbsp;&#8211;&nbsp;', wptexturize( '&nbsp;-&nbsp;' ) );
		$this->assertEquals( ' &#8211;&nbsp;', wptexturize( ' -&nbsp;' ) );
		$this->assertEquals( '&nbsp;&#8211; ', wptexturize( '&nbsp;- ') );
		$this->assertEquals( "$nbsp&#8211;$nbsp", wptexturize( "$nbsp-$nbsp" ) );
		$this->assertEquals( " &#8211;$nbsp", wptexturize( " -$nbsp" ) );
		$this->assertEquals( "$nbsp&#8211; ", wptexturize( "$nbsp- ") );

		$this->assertEquals( ' &#8212; ', wptexturize( ' -- ' ) );
		$this->assertEquals( '&nbsp;&#8212;&nbsp;', wptexturize( '&nbsp;--&nbsp;' ) );
		$this->assertEquals( ' &#8212;&nbsp;', wptexturize( ' --&nbsp;' ) );
		$this->assertEquals( '&nbsp;&#8212; ', wptexturize( '&nbsp;-- ') );
		$this->assertEquals( "$nbsp&#8212;$nbsp", wptexturize( "$nbsp--$nbsp" ) );
		$this->assertEquals( " &#8212;$nbsp", wptexturize( " --$nbsp" ) );
		$this->assertEquals( "$nbsp&#8212; ", wptexturize( "$nbsp-- ") );
	}

	/**
	 * @ticket 31030
	 */
	function test_hyphens_at_start_and_end() {
		$this->assertEquals( '&#8211; ', wptexturize( '- ' ) );
		$this->assertEquals( '&#8211; &#8211;', wptexturize( '- -' ) );
		$this->assertEquals( ' &#8211;', wptexturize( ' -' ) );

		$this->assertEquals( '&#8212; ', wptexturize( '-- ' ) );
		$this->assertEquals( '&#8212; &#8212;', wptexturize( '-- --' ) );
		$this->assertEquals( ' &#8212;', wptexturize( ' --' ) );
	}

	/**
	 * Test spaces around quotes.
	 *
	 * These should never happen, even if the desired output changes some day.
	 *
	 * @ticket 22692
	 */
	function test_spaces_around_quotes_never() {
		$nbsp = "\xC2\xA0";

		$problem_input  = "$nbsp\"A";
		$problem_output = "$nbsp&#8221;A";

		$this->assertNotEquals( $problem_output, wptexturize( $problem_input ) );
	}

	/**
	 * Test spaces around quotes.
	 *
	 * These are desirable outputs for the current design.
	 *
	 * @ticket 22692
	 * @dataProvider data_spaces_around_quotes
	 */
	function test_spaces_around_quotes( $input, $output ) {
		return $this->assertEquals( $output, wptexturize( $input ) );
	}

	function data_spaces_around_quotes() {
		$nbsp = "\xC2\xA0";
		$pi   = "\xCE\xA0";

		return array(
			array(
				"stop. $nbsp\"A quote after 2 spaces.\"",
				"stop. $nbsp&#8220;A quote after 2 spaces.&#8221;",
			),
			array(
				"stop.$nbsp$nbsp\"A quote after 2 spaces.\"",
				"stop.$nbsp$nbsp&#8220;A quote after 2 spaces.&#8221;",
			),
			array(
				"stop. $nbsp'A quote after 2 spaces.'",
				"stop. $nbsp&#8216;A quote after 2 spaces.&#8217;",
			),
			array(
				"stop.$nbsp$nbsp'A quote after 2 spaces.'",
				"stop.$nbsp$nbsp&#8216;A quote after 2 spaces.&#8217;",
			),
			array(
				"stop. &nbsp;\"A quote after 2 spaces.\"",
				"stop. &nbsp;&#8220;A quote after 2 spaces.&#8221;",
			),
			array(
				"stop.&nbsp;&nbsp;\"A quote after 2 spaces.\"",
				"stop.&nbsp;&nbsp;&#8220;A quote after 2 spaces.&#8221;",
			),
			array(
				"stop. &nbsp;'A quote after 2 spaces.'",
				"stop. &nbsp;&#8216;A quote after 2 spaces.&#8217;",
			),
			array(
				"stop.&nbsp;&nbsp;'A quote after 2 spaces.'",
				"stop.&nbsp;&nbsp;&#8216;A quote after 2 spaces.&#8217;",
			),
			array(
				"Contraction: $pi's",
				"Contraction: $pi&#8217;s",
			),
		);
	}

	/**
	 * Apostrophe before a number always becomes &#8217 (apos);
	 *
	 * Checks all baseline patterns. If anything ever changes in wptexturize(), these tests may fail.
	 *
	 * @ticket 22692
	 * @dataProvider data_apos_before_digits
	 */
	function test_apos_before_digits( $input, $output ) {
		return $this->assertEquals( $output, wptexturize( $input ) );
	}

	function data_apos_before_digits() {
		return array(
			array(
				"word '99 word",
				"word &#8217;99 word",
			),
			array(
				"word'99 word",
				"word&#8217;99 word",
			),
			array(
				"word '99word",
				"word &#8217;99word",
			),
			array(
				"word'99word",
				"word&#8217;99word",
			),
			array(
				"word '99&#8217;s word", // Appears as a separate but logically superfluous pattern in 3.8.
				"word &#8217;99&#8217;s word",
			),
			array(
				"according to our source, '33 students scored less than 50' on the test.", // Apostrophes and primes have priority over quotes
				"according to our source, &#8217;33 students scored less than 50&#8242; on the test.",
			),
		);
	}

	/**
	 * Apostrophe after a space or ([{<" becomes &#8216; (opening_single_quote)
	 *
	 * Checks all baseline patterns. If anything ever changes in wptexturize(), these tests may fail.
	 *
	 * @ticket 22692
	 * @dataProvider data_opening_single_quote
	 */
	function test_opening_single_quote( $input, $output ) {
		return $this->assertEquals( $output, wptexturize( $input ) );
	}

	function data_opening_single_quote() {
		return array(
			array(
				"word 'word word",
				"word &#8216;word word",
			),
			array(
				"word ('word word",
				"word (&#8216;word word",
			),
			array(
				"word ['word word",
				"word [&#8216;word word",
			),
			array(
				"word <'word word", // Invalid HTML input triggers the apos in a word pattern.
				"word <&#8217;word word",
			),
			array(
				"word &lt;'word word", // Valid HTML input makes curly quotes.
				"word &lt;&#8216;word word",
			),
			array(
				"word {'word word",
				"word {&#8216;word word",
			),
			array(
				"word \"'word word",
				"word &#8220;&#8216;word word", // Two opening quotes
			),
			array(
				"'word word",
				"&#8216;word word",
			),
			array(
				"word('word word",
				"word(&#8216;word word",
			),
			array(
				"word['word word",
				"word[&#8216;word word",
			),
			array(
				"word<'word word",
				"word<&#8217;word word",
			),
			array(
				"word&lt;'word word",
				"word&lt;&#8216;word word",
			),
			array(
				"word{'word word",
				"word{&#8216;word word",
			),
			array(
				"word\"'word word",
				"word&#8221;&#8216;word word", // Closing quote, then opening quote
			),
			array(
				"word ' word word",
				"word &#8216; word word",
			),
			array(
				"word (' word word",
				"word (&#8216; word word",
			),
			array(
				"word [' word word",
				"word [&#8216; word word",
			),
			array(
				"word <' word word",
				"word <&#8217; word word",
			),
			array(
				"word &lt;' word word",
				"word &lt;&#8216; word word",
			),
			array(
				"word {' word word",
				"word {&#8216; word word",
			),
			array(
				"word \"' word word",
				"word &#8220;&#8216; word word", // Two opening quotes
			),
			array(
				"' word word",
				"&#8216; word word",
			),
			array(
				"word(' word word",
				"word(&#8216; word word",
			),
			array(
				"word[' word word",
				"word[&#8216; word word",
			),
			array(
				"word<' word word",
				"word<&#8217; word word",
			),
			array(
				"word&lt;' word word",
				"word&lt;&#8216; word word",
			),
			array(
				"word{' word word",
				"word{&#8216; word word",
			),
			array(
				"word\"' word word",
				"word&#8221;&#8216; word word", // Closing quote, then opening quote
			),
		);
	}

	/**
	 * Double quote after a number becomes &#8243; (double_prime)
	 *
	 * Checks all baseline patterns. If anything ever changes in wptexturize(), these tests may fail.
	 *
	 * @ticket 22692
	 * @dataProvider data_double_prime
	 */
	function test_double_prime( $input, $output ) {
		return $this->assertEquals( $output, wptexturize( $input ) );
	}

	function data_double_prime() {
		return array(
			array(
				'word 99" word',
				'word 99&#8243; word',
			),
			array(
				'word 99"word',
				'word 99&#8243;word',
			),
			array(
				'word99" word',
				'word99&#8243; word',
			),
			array(
				'word99"word',
				'word99&#8243;word',
			),
		);
	}

	/**
	 * Apostrophe after a number becomes &#8242; (prime)
	 *
	 * Checks all baseline patterns. If anything ever changes in wptexturize(), these tests may fail.
	 *
	 * @ticket 22692
	 * @dataProvider data_single_prime
	 */
	function test_single_prime( $input, $output ) {
		return $this->assertEquals( $output, wptexturize( $input ) );
	}

	function data_single_prime() {
		return array(
			array(
				"word 99' word",
				"word 99&#8242; word",
			),
			array(
				"word 99'word", // Not a prime anymore. Apostrophes get priority.
				"word 99&#8217;word",
			),
			array(
				"word99' word",
				"word99&#8242; word",
			),
			array(
				"word99'word", // Not a prime anymore.
				"word99&#8217;word",
			),
		);
	}

	/**
	 * Apostrophe "in a word" becomes &#8217; (apos)
	 *
	 * Checks all baseline patterns. If anything ever changes in wptexturize(), these tests may fail.
	 *
	 * @ticket 22692
	 * @dataProvider data_contractions
	 */
	function test_contractions( $input, $output ) {
		return $this->assertEquals( $output, wptexturize( $input ) );
	}

	function data_contractions() {
		return array(
			array(
				"word word's word",
				"word word&#8217;s word",
			),
			array(
				"word'[ word", // Apostrophes are never followed by opening punctuation.
				"word'[ word",
			),
			array(
				"word'( word",
				"word'( word",
			),
			array(
				"word'{ word",
				"word'{ word",
			),
			array(
				"word'&lt; word",
				"word'&lt; word",
			),
			array(
				"word'< word", // Invalid HTML input does trigger the apos pattern.
				"word&#8217;< word",
			),
		);
	}

	/**
	 * Double quote after a space or ([-{< becomes &#8220; (opening_quote) if not followed by spaces
	 *
	 * Checks all baseline patterns. If anything ever changes in wptexturize(), these tests may fail.
	 *
	 * @ticket 22692
	 * @dataProvider data_opening_quote
	 */
	function test_opening_quote( $input, $output ) {
		return $this->assertEquals( $output, wptexturize( $input ) );
	}

	function data_opening_quote() {
		return array(
			array(
				'word "word word',
				'word &#8220;word word',
			),
			array(
				'word ("word word',
				'word (&#8220;word word',
			),
			array(
				'word ["word word',
				'word [&#8220;word word',
			),
			array(
				'word <"word word', // Invalid HTML input triggers the closing quote pattern.
				'word <&#8221;word word',
			),
			array(
				'word &lt;"word word',
				'word &lt;&#8220;word word',
			),
			array(
				'word {"word word',
				'word {&#8220;word word',
			),
			array(
				'word -"word word',
				'word -&#8220;word word',
			),
			array(
				'word-"word word',
				'word-&#8220;word word',
			),
			array(
				'"word word',
				'&#8220;word word',
			),
			array(
				'word("word word',
				'word(&#8220;word word',
			),
			array(
				'word["word word',
				'word[&#8220;word word',
			),
			array(
				'word<"word word',
				'word<&#8221;word word',
			),
			array(
				'word&lt;"word word',
				'word&lt;&#8220;word word',
			),
			array(
				'word{"word word',
				'word{&#8220;word word',
			),
			array(
				'word "99 word',
				'word &#8220;99 word',
			),
		);
	}

	/**
	 * Double quote becomes &#8221; (closing_quote) unless it is already converted to double_prime or opening_quote.
	 *
	 * Checks all baseline patterns. If anything ever changes in wptexturize(), these tests may fail.
	 *
	 * @ticket 22692
	 * @dataProvider data_closing_quote
	 */
	function test_closing_quote( $input, $output ) {
		return $this->assertEquals( $output, wptexturize( $input ) );
	}

	function data_closing_quote() {
		return array(
			array(
				'word word" word',
				'word word&#8221; word',
			),
			array(
				'word word") word',
				'word word&#8221;) word',
			),
			array(
				'word word"] word',
				'word word&#8221;] word',
			),
			array(
				'word word"} word',
				'word word&#8221;} word',
			),
			array(
				'word word"> word', // Invalid HTML input?
				'word word&#8221;> word',
			),
			array(
				'word word"&gt; word', // Valid HTML should work
				'word word&#8221;&gt; word',
			),
			array(
				'word word"',
				'word word&#8221;',
			),
			array(
				'word word"word',
				'word word&#8221;word',
			),
			array(
				'word"word"word',
				'word&#8221;word&#8221;word',
			),
			array(
				'test sentence".',
				'test sentence&#8221;.',
			),
			array(
				'test sentence",',
				'test sentence&#8221;,',
			),
			array(
				'test sentence":',
				'test sentence&#8221;:',
			),
			array(
				'test sentence";',
				'test sentence&#8221;;',
			),
			array(
				'test sentence"!',
				'test sentence&#8221;!',
			),
			array(
				'test sentence"?',
				'test sentence&#8221;?',
			),
			array(
				'test sentence."',
				'test sentence.&#8221;',
			),
			array(
				'test sentence". word',
				'test sentence&#8221;. word',
			),
			array(
				'test sentence." word',
				'test sentence.&#8221; word',
			),
		);
	}

	/**
	 * Test that single quotes followed by a space or .,-)}]> become &#8217; (closing_single_quote)
	 *
	 * Checks all baseline patterns. If anything ever changes in wptexturize(), these tests may fail.
	 *
	 * @ticket 22692
	 * @dataProvider data_closing_single_quote
	 */
	function test_closing_single_quote( $input, $output ) {
		return $this->assertEquals( $output, wptexturize( $input ) );
	}

	function data_closing_single_quote() {
		return array(
			array(
				"word word' word",
				"word word&#8217; word",
			),
			array(
				"word word'. word",
				"word word&#8217;. word",
			),
			array(
				"word word'.word",
				"word word&#8217;.word",
			),
			array(
				"word word', she said",
				"word word&#8217;, she said",
			),
			array(
				"word word': word",
				"word word&#8217;: word",
			),
			array(
				"word word'; word",
				"word word&#8217;; word",
			),
			array(
				"word word'! word",
				"word word&#8217;! word",
			),
			array(
				"word word'? word",
				"word word&#8217;? word",
			),
			array(
				"word word'- word",
				"word word&#8217;- word",
			),
			array(
				"word word') word",
				"word word&#8217;) word",
			),
			array(
				"word word'} word",
				"word word&#8217;} word",
			),
			array(
				"word word'] word",
				"word word&#8217;] word",
			),
			array(
				"word word'&gt; word",
				"word word&#8217;&gt; word",
			),
			array(
				"word word'",
				"word word&#8217;",
			),
			array(
				"test sentence'.",
				"test sentence&#8217;.",
			),
			array(
				"test sentence.'",
				"test sentence.&#8217;",
			),
			array(
				"test sentence'. word",
				"test sentence&#8217;. word",
			),
			array(
				"test sentence.' word",
				"test sentence.&#8217; word",
			),
		);
	}

	/**
	 * Tests multiplication.
	 *
	 * Checks all baseline patterns. If anything ever changes in wptexturize(), these tests may fail.
	 *
	 * @ticket 22692
	 * @dataProvider data_multiplication
	 */
	function test_multiplication( $input, $output ) {
		return $this->assertEquals( $output, wptexturize( $input ) );
	}

	function data_multiplication() {
		return array(
			array(
				"9x9",
				"9&#215;9",
			),
			array(
				"12x34",
				"12&#215;34",
			),
			array(
				"-123x1=-123",
				"-123&#215;1=-123",
			),
			// @ticket 30445
			array(
				"-123x-1",
				"-123x-1",
			),
			array(
				"0.675x1=0.675",
				"0.675&#215;1=0.675",
			),
			array(
				"9 x 9",
				"9 x 9",
			),
			array(
				"0x70",
				"0x70",
			),
			array(
				"3x2x1x0",
				"3x2x1x0",
			),
		);
	}

	/**
	 * Test ampersands. & always becomes &#038; unless it is followed by # or ;
	 *
	 * Checks all baseline patterns. If anything ever changes in wptexturize(), these tests may fail.
	 *
	 * @ticket 22692
	 * @dataProvider data_ampersand
	 */
	function test_ampersand( $input, $output ) {
		return $this->assertEquals( $output, wptexturize( $input ) );
	}

	function data_ampersand() {
		return array(
			array(
				"word & word",
				"word &#038; word",
			),
			array(
				"word&word",
				"word&#038;word",
			),
			array(
				"word &nbsp; word",
				"word &nbsp; word",
			),
			array(
				"word &#038; word",
				"word &#038; word",
			),
			array(
				"word &#xabc; word",
				"word &#xabc; word",
			),
			array(
				"word &#X394; word",
				"word &#X394; word",
			),
			array(
				"word &# word",
				"word &#038;# word",
			),
			array(
				"word &44; word",
				"word &44; word",
			),
			array(
				"word &&amp; word",
				"word &#038;&amp; word",
			),
			array(
				"word &!amp; word",
				"word &#038;!amp; word",
			),
			array(
				"word &#",
				"word &#038;#",
			),
			array(
				"word &",
				"word &#038;",
			),
		);
	}

	/**
	 * Test "cockney" phrases, which begin with an apostrophe instead of an opening single quote.
	 *
	 * Checks all baseline patterns. If anything ever changes in wptexturize(), these tests may fail.
	 *
	 * @ticket 22692
	 * @dataProvider data_cockney
	 */
	function test_cockney( $input, $output ) {
		return $this->assertEquals( $output, wptexturize( $input ) );
	}

	function data_cockney() {
		return array(
			array(
				"word 'tain't word",
				"word &#8217;tain&#8217;t word",
			),
			array(
				"word 'twere word",
				"word &#8217;twere word",
			),
			array(
				"word 'twas word",
				"word &#8217;twas word",
			),
			array(
				"word 'tis word",
				"word &#8217;tis word",
			),
			array(
				"word 'twill word",
				"word &#8217;twill word",
			),
			array(
				"word 'til word",
				"word &#8217;til word",
			),
			array(
				"word 'bout word",
				"word &#8217;bout word",
			),
			array(
				"word 'nuff word",
				"word &#8217;nuff word",
			),
			array(
				"word 'round word",
				"word &#8217;round word",
			),
			array(
				"word 'cause word",
				"word &#8217;cause word",
			),
			array(
				"word 'em word",
				"word &#8217;em word",
			),
		);
	}

	/**
	 * Test smart dashes.
	 *
	 * Checks all baseline patterns. If anything ever changes in wptexturize(), these tests may fail.
	 *
	 * @ticket 22692
	 * @dataProvider data_smart_dashes
	 */
	function test_smart_dashes( $input, $output ) {
		return $this->assertEquals( $output, wptexturize( $input ) );
	}

	function data_smart_dashes() {
		return array(
			array(
				"word --- word",
				"word &#8212; word",
			),
			array(
				"word---word",
				"word&#8212;word",
			),
			array(
				"word -- word",
				"word &#8212; word",
			),
			array(
				"word--word",
				"word&#8211;word",
			),
			array(
				"word - word",
				"word &#8211; word",
			),
			array(
				"word-word",
				"word-word",
			),
			array(
				"word xn&#8211; word",
				"word xn&#8211; word",
			),
			array(
				"wordxn&#8211;word",
				"wordxn&#8211;word",
			),
			array(
				"wordxn--word",
				"wordxn--word",
			),
		);
	}

	/**
	 * Test miscellaneous static replacements.
	 *
	 * Checks all baseline patterns. If anything ever changes in wptexturize(), these tests may fail.
	 *
	 * @ticket 22692
	 * @dataProvider data_misc_static_replacements
	 */
	function test_misc_static_replacements( $input, $output ) {
		return $this->assertEquals( $output, wptexturize( $input ) );
	}

	function data_misc_static_replacements() {
		return array(
			array(
				"word ... word",
				"word &#8230; word",
			),
			array(
				"word...word",
				"word&#8230;word",
			),
			array(
				"word `` word",
				"word &#8220; word",
			),
			array(
				"word``word",
				"word&#8220;word",
			),
			array(
				"word '' word",
				"word &#8221; word",
			),
			array(
				"word''word",
				"word&#8221;word",
			),
			array(
				"word (tm) word",
				"word &#8482; word",
			),
			array(
				"word (tm)word",
				"word &#8482;word",
			),
			array(
				"word(tm) word",
				"word(tm) word",
			),
			array(
				"word(tm)word",
				"word(tm)word",
			),
		);
	}

	/**
	 * Numbers inside of matching quotes get curly quotes instead of apostrophes and primes.
	 *
	 * @ticket 8775
	 * @dataProvider data_quoted_numbers
	 */
	function test_quoted_numbers( $input, $output ) {
		return $this->assertEquals( $output, wptexturize( $input ) );
	}

	function data_quoted_numbers() {
		return array(
			array(
				'word "42.00" word',
				'word &#8220;42.00&#8221; word',
			),
			array(
				'word "42.00"word',
				'word &#8220;42.00&#8221;word',
			),
			array(
				"word '42.00' word",
				"word &#8216;42.00&#8217; word",
			),
			array(
				"word '42.00'word",
				"word &#8216;42.00&#8217;word",
			),
			array(
				'word "42" word',
				'word &#8220;42&#8221; word',
			),
			array(
				'word "42,00" word',
				'word &#8220;42,00&#8221; word',
			),
			array(
				'word "4,242.00" word',
				'word &#8220;4,242.00&#8221; word',
			),
			array(
				"word '99's word",
				"word &#8217;99&#8217;s word",
			),
			array(
				"word '99'samsonite",
				"word &#8217;99&#8217;samsonite",
			),
		);
	}

	/**
	 * Quotations should be allowed to have dashes around them.
	 *
	 * @ticket 20342
	 * @dataProvider data_quotes_and_dashes
	 */
	function test_quotes_and_dashes( $input, $output ) {
		return $this->assertEquals( $output, wptexturize( $input ) );
	}

	function data_quotes_and_dashes() {
		return array(
			array(
				'word---"quote"',
				'word&#8212;&#8220;quote&#8221;',
			),
			array(
				'word--"quote"',
				'word&#8211;&#8220;quote&#8221;',
			),
			array(
				'word-"quote"',
				'word-&#8220;quote&#8221;',
			),
			array(
				"word---'quote'",
				"word&#8212;&#8216;quote&#8217;",
			),
			array(
				"word--'quote'",
				"word&#8211;&#8216;quote&#8217;",
			),
			array(
				"word-'quote'",
				"word-&#8216;quote&#8217;",
			),
			array(
				'"quote"---word',
				'&#8220;quote&#8221;&#8212;word',
			),
			array(
				'"quote"--word',
				'&#8220;quote&#8221;&#8211;word',
			),
			array(
				'"quote"-word',
				'&#8220;quote&#8221;-word',
			),
			array(
				"'quote'---word",
				"&#8216;quote&#8217;&#8212;word",
			),
			array(
				"'quote'--word",
				"&#8216;quote&#8217;&#8211;word",
			),
			array(
				"'quote'-word",
				"&#8216;quote&#8217;-word",
			),
		);
	}

	/**
	 * Test HTML and shortcode avoidance.
	 *
	 * @ticket 12690
	 * @dataProvider data_tag_avoidance
	 */
	function test_tag_avoidance( $input, $output ) {
		return $this->assertEquals( $output, wptexturize( $input ) );
	}

	function data_tag_avoidance() {
		return array(
			array(
				'[ ... ]',
				'[ &#8230; ]',
			),
			array(
				'[ is it wise to <a title="allow user content ] here? hmm"> maybe </a> ]',
				'[ is it wise to <a title="allow user content ] here? hmm"> maybe </a> ]',
			),
			array(
				'[is it wise to <a title="allow user content ] here? hmm"> maybe </a> ]',
				'[is it wise to <a title="allow user content ] here? hmm"> maybe </a> ]',
			),
			array(
				'[caption - is it wise to <a title="allow user content ] here? hmm"> maybe </a> ]',
				'[caption &#8211; is it wise to <a title="allow user content ] here? hmm"> maybe </a> ]',
			),
			array(
				'[ photos by <a href="http://example.com/?a[]=1&a[]=2"> this guy </a> ]',
				'[ photos by <a href="http://example.com/?a[]=1&#038;a[]=2"> this guy </a> ]',
			),
			array(
				'[photos by <a href="http://example.com/?a[]=1&a[]=2"> this guy </a>]',
				'[photos by <a href="http://example.com/?a[]=1&#038;a[]=2"> this guy </a>]',
			),
			array(
				'[gallery ...]',
				'[gallery ...]',
			),
			array(
				'[[gallery ...]', // This tag is still valid.
				'[[gallery ...]',
			),
			array(
				'[gallery ...]]', // This tag is also valid.
				'[gallery ...]]',
			),
			array(
				'[/gallery ...]', // This would actually be ignored by the shortcode system.  The decision to not texturize it is intentional, if not correct.
				'[/gallery ...]',
			),
			array(
				'[[gallery]]...[[/gallery]]', // Shortcode parsing will ignore the inner ]...[ part and treat this as a single escaped shortcode.
				'[[gallery]]&#8230;[[/gallery]]',
			),
			array(
				'[[[gallery]]]...[[[/gallery]]]', // Again, shortcode parsing matches, but only the [[gallery] and [/gallery]] parts.
				'[[[gallery]]]&#8230;[[[/gallery]]]',
			),
			array(
				'[gallery ...',
				'[gallery &#8230;',
			),
			array(
				'[gallery <br ... /> ...]', // This tag is still valid. Shortcode 'attributes' are not considered in the initial parsing of shortcodes, and HTML is allowed.
				'[gallery <br ... /> ...]',
			),
			array(
				'<br [gallery ...] ... />',
				'<br [gallery ...] ... />',
			),
			array(
				'<br [gallery ...] ... /',
				'<br [gallery ...] &#8230; /',
			),
			array(
				'<br ... />',
				'<br ... />',
			),
			array(
				'<br ... />...<br ... />',
				'<br ... />&#8230;<br ... />',
			),
			array(
				'[gallery ...]...[gallery ...]',
				'[gallery ...]&#8230;[gallery ...]',
			),
			array(
				'[[gallery ...]]',
				'[[gallery ...]]',
			),
			array(
				'[[gallery ...]',
				'[[gallery ...]',
			),
			array(
				'[gallery ...]]',
				'[gallery ...]]',
			),
			array(
				'[/gallery ...]]',
				'[/gallery ...]]',
			),
			array(
				'[[gallery <br ... /> ...]]', // This gets parsed as an escaped shortcode with embedded HTML.  Brains may explode.
				'[[gallery <br ... /> ...]]',
			),
			array(
				'<br [[gallery ...]] ... />',
				'<br [[gallery ...]] ... />',
			),
			array(
				'<br [[gallery ...]] ... /',
				'<br [[gallery ...]] &#8230; /',
			),
			array(
				'[[gallery ...]]...[[gallery ...]]',
				'[[gallery ...]]&#8230;[[gallery ...]]',
			),
			array(
				'[[gallery ...]...[/gallery]]',
				'[[gallery ...]&#8230;[/gallery]]',
			),
			array(
				'<!-- ... -->',
				'<!-- ... -->',
			),
			array(
				'<!--...-->',
				'<!--...-->',
			),
			array(
				'<!-- ... -- > ...',
				'<!-- ... -- > ...',
			),
			array(
				'<!-- ...', // An unclosed comment is still a comment.
				'<!-- ...',
			),
			array(
				'a<!-->b', // Browsers seem to allow this.
				'a<!-->b',
			),
			array(
				'a<!--->b',
				'a<!--->b',
			),
			array(
				'a<!---->b',
				'a<!---->b',
			),
			array(
				'a<!----->b',
				'a<!----->b',
			),
			array(
				'a<!-- c --->b',
				'a<!-- c --->b',
			),
			array(
				'a<!-- c -- d -->b',
				'a<!-- c -- d -->b',
			),
			array(
				'a<!-- <!-- c --> -->b<!-- close -->',
				'a<!-- <!-- c --> &#8211;>b<!-- close -->',
			),
			array(
				'<!-- <br /> [gallery] ... -->',
				'<!-- <br /> [gallery] ... -->',
			),
			array(
				'...<!-- ... -->...',
				'&#8230;<!-- ... -->&#8230;',
			),
			array(
				'[gallery ...]...<!-- ... -->...<br ... />',
				'[gallery ...]&#8230;<!-- ... -->&#8230;<br ... />',
			),
			array(
				'<ul><li>Hello.</li><!--<li>Goodbye.</li>--></ul>',
				'<ul><li>Hello.</li><!--<li>Goodbye.</li>--></ul>',
			),
			array(
				'word <img src="http://example.com/wp-content/uploads/2014/06/image-300x216.gif" /> word', // Ensure we are not corrupting image URLs.
				'word <img src="http://example.com/wp-content/uploads/2014/06/image-300x216.gif" /> word',
			),
			array(
				'[ do texturize "[quote]" here ]',
				'[ do texturize &#8220;[quote]&#8221; here ]',
			),
			array(
				'[ regex catches this <a href="[quote]">here</a> ]',
				'[ regex catches this <a href="[quote]">here</a> ]',
			),
			array(
				'[ but also catches the <b>styled "[quote]" here</b> ]',
				'[ but also catches the <b>styled &#8220;[quote]&#8221; here</b> ]',
			),
			array(
				'[Let\'s get crazy<input>[caption code="<a href=\'?a[]=100\'>hello</a>"]</input>world]', // caption shortcode is invalid here because it contains [] chars.
				'[Let&#8217;s get crazy<input>[caption code=&#8221;<a href=\'?a[]=100\'>hello</a>&#8220;]</input>world]',
			),
			array(
				'<> ... <>',
				'<> &#8230; <>',
			),
			array(
				'<> ... <> ... >',
				'<> &#8230; <> &#8230; >',
			),
			array(
				'<> ... < ... > ... <>',
				'<> &#8230; < ... > &#8230; <>',
			),
		);
	}

	/**
	 * Year abbreviations consist of exactly two digits.
	 *
	 * @ticket 26850
	 * @dataProvider data_year_abbr
	 */
	function test_year_abbr( $input, $output ) {
		return $this->assertEquals( $output, wptexturize( $input ) );
	}

	function data_year_abbr() {
		return array(
			array(
				"word '99 word",
				"word &#8217;99 word",
			),
			array(
				"word '99. word",
				"word &#8217;99. word",
			),
			array(
				"word '99, word",
				"word &#8217;99, word",
			),
			array(
				"word '99; word",
				"word &#8217;99; word",
			),
			array(
				"word '99' word", // For this pattern, prime doesn't make sense.  Should get apos and a closing quote.
				"word &#8217;99&#8217; word",
			),
			array(
				"word '99'. word",
				"word &#8217;99&#8217;. word",
			),
			array(
				"word '99', word",
				"word &#8217;99&#8217;, word",
			),
			array(
				"word '99.' word",
				"word &#8217;99.&#8217; word",
			),
			array(
				"word '99",
				"word &#8217;99",
			),
			array(
				"'99 word",
				"&#8217;99 word",
			),
			array(
				"word '999 word", // Does not match the apos pattern, should be opening quote.
				"word &#8216;999 word",
			),
			array(
				"word '99% word",
				"word &#8216;99% word",
			),
			array(
				"word '9 word",
				"word &#8216;9 word",
			),
			array(
				"word '99.9 word",
				"word &#8216;99.9 word",
			),
			array(
				"word '999",
				"word &#8216;999",
			),
			array(
				"word '9",
				"word &#8216;9",
			),
			array(
				"in '4 years, 3 months,' Obama cut the deficit",
				"in &#8216;4 years, 3 months,&#8217; Obama cut the deficit",
			),
			array(
				"testing's '4' through 'quotes'",
				"testing&#8217;s &#8216;4&#8217; through &#8216;quotes&#8217;",
			),
		);
	}

	/**
	 * Make sure translation actually works.
	 *
	 * Also make sure apostrophes and closing quotes aren't being confused by default.
	 *
	 * @ticket 27426
	 * @dataProvider data_translate
	 */
	function test_translate( $input, $output ) {
		add_filter( 'gettext_with_context', array( $this, 'filter_translate' ), 10, 4 );

		$result = wptexturize( $input, true );

		remove_filter( 'gettext_with_context', array( $this, 'filter_translate' ), 10, 4 );
		wptexturize( 'reset', true );

		return $this->assertEquals( $output, $result );
	}

	function filter_translate( $translations, $text, $context, $domain ) {
		switch ($text) {
			case '&#8211;' : return '!endash!';
			case '&#8212;' : return '!emdash!';
			case '&#8216;' : return '!openq1!';
			case '&#8217;' :
				if ( 'apostrophe' == $context ) {
					return '!apos!';
				} else {
					return '!closeq1!';
				}
			case '&#8220;' : return '!openq2!';
			case '&#8221;' : return '!closeq2!';
			case '&#8242;' : return '!prime1!';
			case '&#8243;' : return '!prime2!';
			case '&#8217;tain&#8217;t,&#8217;twere,&#8217;twas,&#8217;tis,&#8217;twill,&#8217;til,&#8217;bout,&#8217;nuff,&#8217;round,&#8217;cause,&#8217;em' : 
				return '!apos!tain!apos!t,!apos!twere,!apos!twas,!apos!tis,!apos!twill,!apos!til,!apos!bout,!apos!nuff,!apos!round,!apos!cause,!apos!em';
			default : return $translations;
		}
	}

	function data_translate() {
		return array(
			array(
				"word '99 word",
				"word !apos!99 word",
			),
			array(
				"word'99 word",
				"word!apos!99 word",
			),
			array(
				"word 'test sentence' word",
				"word !openq1!test sentence!closeq1! word",
			),
			array(
				"'test sentence'",
				"!openq1!test sentence!closeq1!",
			),
			array(
				'word "test sentence" word',
				'word !openq2!test sentence!closeq2! word',
			),
			array(
				'"test sentence"',
				'!openq2!test sentence!closeq2!',
			),
			array(
				"word 'word word",
				"word !openq1!word word",
			),
			array(
				"word ('word word",
				"word (!openq1!word word",
			),
			array(
				"word ['word word",
				"word [!openq1!word word",
			),
			array(
				'word 99" word',
				'word 99!prime2! word',
			),
			array(
				'word 99"word',
				'word 99!prime2!word',
			),
			array(
				'word99" word',
				'word99!prime2! word',
			),
			array(
				'word99"word',
				'word99!prime2!word',
			),
			array(
				"word 99' word",
				"word 99!prime1! word",
			),
			array(
				"word99' word",
				"word99!prime1! word",
			),
			array(
				"word word's word",
				"word word!apos!s word",
			),
			array(
				"word word'. word",
				"word word!closeq1!. word",
			),
			array(
				"word ]'. word",
				"word ]!closeq1!. word",
			),
			array(
				'word "word word',
				'word !openq2!word word',
			),
			array(
				'word ("word word',
				'word (!openq2!word word',
			),
			array(
				'word ["word word',
				'word [!openq2!word word',
			),
			array(
				'word word" word',
				'word word!closeq2! word',
			),
			array(
				'word word") word',
				'word word!closeq2!) word',
			),
			array(
				'word word"] word',
				'word word!closeq2!] word',
			),
			array(
				'word word"',
				'word word!closeq2!',
			),
			array(
				'word word"word',
				'word word!closeq2!word',
			),
			array(
				'test sentence".',
				'test sentence!closeq2!.',
			),
			array(
				'test sentence."',
				'test sentence.!closeq2!',
			),
			array(
				'test sentence." word',
				'test sentence.!closeq2! word',
			),
			array(
				"word word' word",
				"word word!closeq1! word",
			),
			array(
				"word word'. word",
				"word word!closeq1!. word",
			),
			array(
				"word word'.word",
				"word word!closeq1!.word",
			),
			array(
				"word word'",
				"word word!closeq1!",
			),
			array(
				"test sentence'.",
				"test sentence!closeq1!.",
			),
			array(
				"test sentence.'",
				"test sentence.!closeq1!",
			),
			array(
				"test sentence'. word",
				"test sentence!closeq1!. word",
			),
			array(
				"test sentence.' word",
				"test sentence.!closeq1! word",
			),
			array(
				"word 'tain't word",
				"word !apos!tain!apos!t word",
			),
			array(
				"word 'twere word",
				"word !apos!twere word",
			),
			array(
				'word "42.00" word',
				'word !openq2!42.00!closeq2! word',
			),
			array(
				"word '42.00' word",
				"word !openq1!42.00!closeq1! word",
			),
			array(
				"word word'. word",
				"word word!closeq1!. word",
			),
			array(
				"word word'.word",
				"word word!closeq1!.word",
			),
			array(
				"word word', she said",
				"word word!closeq1!, she said",
			),
		);
	}

	/**
	 * Extra sanity checks for _wptexturize_pushpop_element()
	 *
	 * @ticket 28483
	 * @dataProvider data_element_stack
	 */
	function test_element_stack( $input, $output ) {
		return $this->assertEquals( $output, wptexturize( $input ) );
	}

	function data_element_stack() {
		return array(
			array(
				'<span>hello</code>---</span>',
				'<span>hello</code>&#8212;</span>',
			),
			array(
				'</code>hello<span>---</span>',
				'</code>hello<span>&#8212;</span>',
			),
			array(
				'<code>hello</code>---</span>',
				'<code>hello</code>&#8212;</span>',
			),
			array(
				'<span>hello</span>---<code>',
				'<span>hello</span>&#8212;<code>',
			),
			array(
				'<span>hello<code>---</span>',
				'<span>hello<code>---</span>',
			),
			array(
				'<code>hello<span>---</span>',
				'<code>hello<span>---</span>',
			),
			array(
				'<code>hello</span>---</span>',
				'<code>hello</span>---</span>',
			),
			array(
				'<span><code>hello</code>---</span>',
				'<span><code>hello</code>&#8212;</span>',
			),
			array(
				'<code>hello</code>world<span>---</span>',
				'<code>hello</code>world<span>&#8212;</span>',
			),
		);
	}

	/**
	 * Test disabling shortcode texturization.
	 *
	 * @ticket 29557
	 * @dataProvider data_unregistered_shortcodes
	 */
	function test_unregistered_shortcodes( $input, $output ) {
		add_filter( 'no_texturize_shortcodes', array( $this, 'filter_shortcodes' ), 10, 1 );
	
		$output = $this->assertEquals( $output, wptexturize( $input ) );
	
		remove_filter( 'no_texturize_shortcodes', array( $this, 'filter_shortcodes' ), 10, 1 );
		return $output;
	}
	
	function filter_shortcodes( $disabled ) {
		$disabled[] = 'audio';
		return $disabled;
	}

	function data_unregistered_shortcodes() {
		return array(
			array(
				'[a]a--b[audio]---[/audio]a--b[/a]',
				'[a]a&#8211;b[audio]---[/audio]a&#8211;b[/a]',
			),
			array(
				'[code ...]...[/code]', // code is not a registered shortcode.
				'[code &#8230;]&#8230;[/code]',
			),
			array(
				'[hello ...]...[/hello]', // hello is not a registered shortcode.
				'[hello &#8230;]&#8230;[/hello]',
			),
			array(
				'[...]...[/...]', // These are potentially usable shortcodes.
				'[&#8230;]&#8230;[/&#8230;]',
			),
			array(
				'[gal>ery ...]',
				'[gal>ery &#8230;]',
			),
			array(
				'[randomthing param="test"]',
				'[randomthing param=&#8221;test&#8221;]',
			),
			array(
				'[[audio]...[/audio]...', // These are potentially usable shortcodes.  Unfortunately, the meaning of [[audio] is ambiguous unless we run the entire shortcode regexp.
				'[[audio]&#8230;[/audio]&#8230;',
			),
			array(
				'[audio]...[/audio]]...', // These are potentially usable shortcodes.  Unfortunately, the meaning of [/audio]] is ambiguous unless we run the entire shortcode regexp.
				'[audio]...[/audio]]...', // This test would not pass in 3.9 because the extra brace was always ignored by texturize.
			),
			array(
				'<span>hello[/audio]---</span>',
				'<span>hello[/audio]&#8212;</span>',
			),
			array(
				'[/audio]hello<span>---</span>',
				'[/audio]hello<span>&#8212;</span>',
			),
			array(
				'[audio]hello[/audio]---</span>',
				'[audio]hello[/audio]&#8212;</span>',
			),
			array(
				'<span>hello</span>---[audio]',
				'<span>hello</span>&#8212;[audio]',
			),
			array(
				'<span>hello[audio]---</span>',
				'<span>hello[audio]---</span>',
			),
			array(
				'[audio]hello<span>---</span>',
				'[audio]hello<span>---</span>',
			),
			array(
				'[audio]hello</span>---</span>',
				'[audio]hello</span>---</span>',
			),
		);
	}

	/**
	 * Ensure primes logic is not too greedy at the end of a quotation.
	 *
	 * @ticket 29256
	 * @dataProvider data_primes_vs_quotes
	 */
	function test_primes_vs_quotes( $input, $output ) {
		return $this->assertEquals( $output, wptexturize( $input ) );
	}

	function data_primes_vs_quotes() {
		return array(
			array(
				"George's porch is 99' long.",
				"George&#8217;s porch is 99&#8242; long.",
			),
			array(
				'The best year "was that time in 2012" when everyone partied, he said.',
				'The best year &#8220;was that time in 2012&#8221; when everyone partied, he said.',
			),
			array(
				"I need 4 x 20' = 80' of trim.", // Works only with a space before the = char.
				"I need 4 x 20&#8242; = 80&#8242; of trim.",
			),
			array(
				'"Lorem ipsum dolor sit amet 1234"',
				'&#8220;Lorem ipsum dolor sit amet 1234&#8221;',
			),
			array(
				"'Etiam eu egestas dui 1234'",
				"&#8216;Etiam eu egestas dui 1234&#8217;",
			),
			array(
				'according to our source, "33% of all students scored less than 50" on the test.',
				'according to our source, &#8220;33% of all students scored less than 50&#8221; on the test.',
			),
			array(
				"The doctor said, 'An average height is between 5' and 6' in study group 7'.  He then produced a 6' chart of averages.  A man of 7', incredibly, is very possible.",
				"The doctor said, &#8216;An average height is between 5&#8242; and 6&#8242; in study group 7&#8217;.  He then produced a 6&#8242; chart of averages.  A man of 7&#8242;, incredibly, is very possible.",
			),
			array(
				'Pirates have voted on "The Expendables 3" with their clicks -- and it turns out the Sylvester Stallone-starrer hasn\'t been astoundingly popular among digital thieves, relatively speaking.

As of Sunday, 5.12 million people worldwide had pirated "Expendables 3" since a high-quality copy hit torrent-sharing sites July 23, according to piracy-tracking firm Excipio.

That likely contributed to the action movie\'s dismal box-office debut this weekend. But over the same July 23-Aug. 18 time period, the movie was No. 4 in downloads, after "Captain America: The Winter Soldier" (7.31 million), "Divergent" (6.29 million) and "The Amazing Spider-Man 2" (5.88 million). Moreover, that\'s despite "Expendables 3" becoming available more than three weeks prior to the film\'s U.S. theatrical debut.

String with a number followed by a single quote \'Expendables 3\' vestibulum in arcu mi.',

				'Pirates have voted on &#8220;The Expendables 3&#8221; with their clicks &#8212; and it turns out the Sylvester Stallone-starrer hasn&#8217;t been astoundingly popular among digital thieves, relatively speaking.

As of Sunday, 5.12 million people worldwide had pirated &#8220;Expendables 3&#8221; since a high-quality copy hit torrent-sharing sites July 23, according to piracy-tracking firm Excipio.

That likely contributed to the action movie&#8217;s dismal box-office debut this weekend. But over the same July 23-Aug. 18 time period, the movie was No. 4 in downloads, after &#8220;Captain America: The Winter Soldier&#8221; (7.31 million), &#8220;Divergent&#8221; (6.29 million) and &#8220;The Amazing Spider-Man 2&#8221; (5.88 million). Moreover, that&#8217;s despite &#8220;Expendables 3&#8221; becoming available more than three weeks prior to the film&#8217;s U.S. theatrical debut.

String with a number followed by a single quote &#8216;Expendables 3&#8217; vestibulum in arcu mi.',
			),
		);
	}

	/**
	 * Make sure translation actually works.
	 *
	 * Also make sure opening and closing quotes are allowed to be identical.
	 *
	 * @ticket 29256
	 * @dataProvider data_primes_quotes_translation
	 */
	function test_primes_quotes_translation( $input, $output ) {
		add_filter( 'gettext_with_context', array( $this, 'filter_translate2' ), 10, 4 );

		$result = wptexturize( $input, true );

		remove_filter( 'gettext_with_context', array( $this, 'filter_translate2' ), 10, 4 );
		wptexturize( 'reset', true );

		return $this->assertEquals( $output, $result );
	}

	function filter_translate2( $translations, $text, $context, $domain ) {
		switch ($text) {
			case '&#8211;' : return '!endash!';
			case '&#8212;' : return '!emdash!';
			case '&#8216;' : return '!q1!';
			case '&#8217;' :
				if ( 'apostrophe' == $context ) {
					return '!apos!';
				} else {
					return '!q1!';
				}
			case '&#8220;' : return '!q2!';
			case '&#8221;' : return '!q2!';
			case '&#8242;' : return '!prime1!';
			case '&#8243;' : return '!prime2!';
			default : return $translations;
		}
	}

	function data_primes_quotes_translation() {
		return array(
			array(
				"George's porch is 99' long.",
				"George!apos!s porch is 99!prime1! long.",
			),
			array(
				'The best year "was that time in 2012" when everyone partied, he said.',
				'The best year !q2!was that time in 2012!q2! when everyone partied, he said.',
			),
			array(
				"I need 4 x 20' = 80' of trim.", // Works only with a space before the = char.
				"I need 4 x 20!prime1! = 80!prime1! of trim.",
			),
			array(
				'"Lorem ipsum dolor sit amet 1234"',
				'!q2!Lorem ipsum dolor sit amet 1234!q2!',
			),
			array(
				"'Etiam eu egestas dui 1234'",
				"!q1!Etiam eu egestas dui 1234!q1!",
			),
			array(
				'according to our source, "33% of all students scored less than 50" on the test.',
				'according to our source, !q2!33% of all students scored less than 50!q2! on the test.',
			),
			array(
				"The doctor said, 'An average height is between 5' and 6' in study group 7'.  He then produced a 6' chart of averages.  A man of 7', incredibly, is very possible.",
				"The doctor said, !q1!An average height is between 5!prime1! and 6!prime1! in study group 7!q1!.  He then produced a 6!prime1! chart of averages.  A man of 7!prime1!, incredibly, is very possible.",
			),
			array(
				'Pirates have voted on "The Expendables 3" with their clicks -- and it turns out the Sylvester Stallone-starrer hasn\'t been astoundingly popular among digital thieves, relatively speaking.

As of Sunday, 5.12 million people worldwide had pirated "Expendables 3" since a high-quality copy hit torrent-sharing sites July 23, according to piracy-tracking firm Excipio.

That likely contributed to the action movie\'s dismal box-office debut this weekend. But over the same July 23-Aug. 18 time period, the movie was No. 4 in downloads, after "Captain America: The Winter Soldier" (7.31 million), "Divergent" (6.29 million) and "The Amazing Spider-Man 2" (5.88 million). Moreover, that\'s despite "Expendables 3" becoming available more than three weeks prior to the film\'s U.S. theatrical debut.

String with a number followed by a single quote \'Expendables 3\' vestibulum in arcu mi.',

				'Pirates have voted on !q2!The Expendables 3!q2! with their clicks !emdash! and it turns out the Sylvester Stallone-starrer hasn!apos!t been astoundingly popular among digital thieves, relatively speaking.

As of Sunday, 5.12 million people worldwide had pirated !q2!Expendables 3!q2! since a high-quality copy hit torrent-sharing sites July 23, according to piracy-tracking firm Excipio.

That likely contributed to the action movie!apos!s dismal box-office debut this weekend. But over the same July 23-Aug. 18 time period, the movie was No. 4 in downloads, after !q2!Captain America: The Winter Soldier!q2! (7.31 million), !q2!Divergent!q2! (6.29 million) and !q2!The Amazing Spider-Man 2!q2! (5.88 million). Moreover, that!apos!s despite !q2!Expendables 3!q2! becoming available more than three weeks prior to the film!apos!s U.S. theatrical debut.

String with a number followed by a single quote !q1!Expendables 3!q1! vestibulum in arcu mi.',
			),
		);
	}
}