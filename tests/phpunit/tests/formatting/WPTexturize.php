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
		$this->assertEquals('[a]a&#8211;b[code]---[/code]a&#8211;b[/a]', wptexturize('[a]a--b[code]---[/code]a--b[/a]'));
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
		$this->assertEquals('Here is &#8220;<a href="http://example.com">a test with a link</a>&#8221;', wptexturize('Here is "<a href="http://example.com">a test with a link</a>"'));
		$this->assertEquals('Here is &#8220;<a href="http://example.com">a test with a link and a period</a>&#8221;.', wptexturize('Here is "<a href="http://example.com">a test with a link and a period</a>".'));
		$this->assertEquals('Here is &#8220;<a href="http://example.com">a test with a link</a>&#8221; and a space.', wptexturize('Here is "<a href="http://example.com">a test with a link</a>" and a space.'));
		$this->assertEquals('Here is &#8220;<a href="http://example.com">a test with a link</a> and some text quoted&#8221;', wptexturize('Here is "<a href="http://example.com">a test with a link</a> and some text quoted"'));
		$this->assertEquals('Here is &#8220;<a href="http://example.com">a test with a link</a>&#8221;, and a comma.', wptexturize('Here is "<a href="http://example.com">a test with a link</a>", and a comma.'));
		$this->assertEquals('Here is &#8220;<a href="http://example.com">a test with a link</a>&#8221;; and a semi-colon.', wptexturize('Here is "<a href="http://example.com">a test with a link</a>"; and a semi-colon.'));
		$this->assertEquals('Here is &#8220;<a href="http://example.com">a test with a link</a>&#8221;- and a dash.', wptexturize('Here is "<a href="http://example.com">a test with a link</a>"- and a dash.'));
		$this->assertEquals('Here is &#8220;<a href="http://example.com">a test with a link</a>&#8221;&#8230; and ellipses.', wptexturize('Here is "<a href="http://example.com">a test with a link</a>"... and ellipses.'));
		$this->assertEquals('Here is &#8220;a test <a href="http://example.com">with a link</a>&#8221;.', wptexturize('Here is "a test <a href="http://example.com">with a link</a>".'));
		$this->assertEquals('Here is &#8220;<a href="http://example.com">a test with a link</a>&#8221;and a work stuck to the end.', wptexturize('Here is "<a href="http://example.com">a test with a link</a>"and a work stuck to the end.'));
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
		$this->assertEquals('&#8216;Class of &#8217;99&#8217;s&#8217;', wptexturize("'Class of '99's'"));
		$this->assertEquals('&#8216;Class of &#8217;99&#8217;s&#8217;', wptexturize("'Class of '99&#8217;s'"));
		$this->assertEquals('&#8220;Class of 99&#8221;', wptexturize("\"Class of 99\""));
		$this->assertEquals('&#8220;Class of &#8217;99&#8221;', wptexturize("\"Class of '99\""));
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
		$this->assertEquals('&#8216;<strong>Quoted Text</strong>&#8217;,', wptexturize("'<strong>Quoted Text</strong>',"));
		$this->assertEquals('&#8220;<strong>Quoted Text</strong>&#8221;,', wptexturize('"<strong>Quoted Text</strong>",'));
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
		$this->assertEquals('&#8220;a 9&#8242; plus a &#8216;9&#8217;, maybe a 9&#8242; &#8216;9&#8217; &#8221;', wptexturize('"a 9\' plus a \'9\', maybe a 9\' \'9\' "'));
		$this->assertEquals('<p>&#8216;99<br />&#8216;123&#8217;<br />&#8217;tis<br />&#8216;s&#8217;</p>', wptexturize('<p>\'99<br />\'123\'<br />\'tis<br />\'s\'</p>'));
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
		$this->assertEquals('&#38;&#8220;Testing&#8221;', wptexturize('&#38;"Testing"'));
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
		$this->assertEquals( ' &#8211; ', wptexturize( ' - ' ) ); 
		$this->assertEquals( '&nbsp;&#8211;&nbsp;', wptexturize( '&nbsp;-&nbsp;' ) );
		$this->assertEquals( ' &#8211;&nbsp;', wptexturize( ' -&nbsp;' ) );
		$this->assertEquals( '&nbsp;&#8211; ', wptexturize( '&nbsp;- ') );

		$this->assertEquals( ' &#8212; ', wptexturize( ' -- ' ) ); 
		$this->assertEquals( '&nbsp;&#8212;&nbsp;', wptexturize( '&nbsp;--&nbsp;' ) );
		$this->assertEquals( ' &#8212;&nbsp;', wptexturize( ' --&nbsp;' ) );
		$this->assertEquals( '&nbsp;&#8212; ', wptexturize( '&nbsp;-- ') );
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
				"word '99's word", // Due to the logic error, second apos becomes a prime.  See ticket #22823
				"word &#8217;99&#8242;s word",
			),
			array(
				"word '99'samsonite",
				"word &#8217;99&#8242;samsonite",
			),
			array(
				"according to our source, '33% of all students scored less than 50' on the test.", // Apostrophes and primes have priority over quotes
				"according to our source, &#8217;33% of all students scored less than 50&#8242; on the test.",
			),
			array(
				"word '99' word", // See ticket #8775
				"word &#8217;99&#8242; word",
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
				"word <'word word", // Invalid HTML input?
				"word <&#8216;word word",
			),
			array(
				"word &lt;'word word", // Valid HTML input triggers the apos in a word pattern
				"word &lt;&#8217;word word",
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
				"word<&#8216;word word",
			),
			array(
				"word&lt;'word word",
				"word&lt;&#8217;word word",
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
				"word <' word word", // Invalid HTML input?
				"word <&#8216; word word",
			),
			array(
				"word &lt;' word word", // Valid HTML input triggers the closing single quote here
				"word &lt;&#8217; word word",
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
				"word<&#8216; word word",
			),
			array(
				"word&lt;' word word",
				"word&lt;&#8217; word word",
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
				"word 99'word",
				"word 99&#8242;word",
			),
			array(
				"word99' word",
				"word99&#8242; word",
			),
			array(
				"word99'word",
				"word99&#8242;word",
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
				"word word'. word", // Quotes with outside punctuation could end with apostrophes instead of closing quotes (may affect i18n)
				"word word&#8217;. word",
			),
			array(
				"word ]'. word",
				"word ]&#8217;. word",
			),
			array(
				"word )'. word",
				"word )&#8217;. word",
			),
			array(
				"word }'. word",
				"word }&#8217;. word",
			),
			array(
				"word >'. word", // Not tested
				"word >&#8217;. word",
			),
			array(
				"word &gt;'. word",
				"word &gt;&#8217;. word",
			),
		);
	}

	/**
	 * Double quote after a space or ([{< becomes &#8220; (opening_quote) if not followed by spaces
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
				'word <"word word', // Invalid HTML input?
				'word <&#8220;word word',
			),
			array(
				'word &lt;"word word', // Valid HTML input triggers the closing quote pattern
				'word &lt;&#8221;word word',
			),
			array(
				'word {"word word',
				'word {&#8220;word word',
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
				'word<"word word', // Invalid HTML input?
				'word<&#8220;word word',
			),
			array(
				'word&lt;"word word', // Valid HTML input triggers the closing quote pattern
				'word&lt;&#8221;word word',
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
	 * Test that single quotes followed by a space or a period become &#8217; (closing_single_quote)
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
				"9 x 9",
				"9 x 9",
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
				"word &# word",
				"word &# word", // invalid output?
			),
			array(
				"word &44; word",
				"word &44; word",
			),
			array(
				"word &&amp; word",
				"word &&amp; word",
			),
			array(
				"word &!amp; word",
				"word &!amp; word",
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
				"word &#8216;em word",
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
				"word xn-- word",
			),
			array(
				"wordxn&#8211;word",
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
}
