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

		$this->assertEquals('<code>---</code>', wptexturize('<code>---</code>'));

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
}
