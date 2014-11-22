<?php

/**
 * @group formatting
 */
class Tests_Formatting_MakeClickable extends WP_UnitTestCase {
	function test_mailto_xss() {
		$in = 'testzzz@"STYLE="behavior:url(\'#default#time2\')"onBegin="alert(\'refresh-XSS\')"';
		$this->assertEquals($in, make_clickable($in));
	}

	function test_valid_mailto() {
		$valid_emails = array(
			'foo@example.com',
			'foo.bar@example.com',
			'Foo.Bar@a.b.c.d.example.com',
			'0@example.com',
			'foo@example-example.com',
			);
		foreach ($valid_emails as $email) {
			$this->assertEquals('<a href="mailto:'.$email.'">'.$email.'</a>', make_clickable($email));
		}
	}

	function test_invalid_mailto() {
		$invalid_emails = array(
			'foo',
			'foo@',
			'foo@@example.com',
			'@example.com',
			'foo @example.com',
			'foo@example',
			);
		foreach ($invalid_emails as $email) {
			$this->assertEquals($email, make_clickable($email));
		}
	}

	// tests that make_clickable will not link trailing periods, commas and
	// (semi-)colons in URLs with protocol (i.e. http://wordpress.org)
	function test_strip_trailing_with_protocol() {
		$urls_before = array(
			'http://wordpress.org/hello.html',
			'There was a spoon named http://wordpress.org. Alice!',
			'There was a spoon named http://wordpress.org, said Alice.',
			'There was a spoon named http://wordpress.org; said Alice.',
			'There was a spoon named http://wordpress.org: said Alice.',
			'There was a spoon named (http://wordpress.org) said Alice.'
			);
		$urls_expected = array(
			'<a href="http://wordpress.org/hello.html" rel="nofollow">http://wordpress.org/hello.html</a>',
			'There was a spoon named <a href="http://wordpress.org" rel="nofollow">http://wordpress.org</a>. Alice!',
			'There was a spoon named <a href="http://wordpress.org" rel="nofollow">http://wordpress.org</a>, said Alice.',
			'There was a spoon named <a href="http://wordpress.org" rel="nofollow">http://wordpress.org</a>; said Alice.',
			'There was a spoon named <a href="http://wordpress.org" rel="nofollow">http://wordpress.org</a>: said Alice.',
			'There was a spoon named (<a href="http://wordpress.org" rel="nofollow">http://wordpress.org</a>) said Alice.'
			);

		foreach ($urls_before as $key => $url) {
			$this->assertEquals($urls_expected[$key], make_clickable($url));
		}
	}

	// tests that make_clickable will not link trailing periods, commas and
	// (semi-)colons in URLs with protocol (i.e. http://wordpress.org)
	function test_strip_trailing_with_protocol_nothing_afterwards() {
		$urls_before = array(
			'http://wordpress.org/hello.html',
			'There was a spoon named http://wordpress.org.',
			'There was a spoon named http://wordpress.org,',
			'There was a spoon named http://wordpress.org;',
			'There was a spoon named http://wordpress.org:',
			'There was a spoon named (http://wordpress.org)',
			'There was a spoon named (http://wordpress.org)x',
			);
		$urls_expected = array(
			'<a href="http://wordpress.org/hello.html" rel="nofollow">http://wordpress.org/hello.html</a>',
			'There was a spoon named <a href="http://wordpress.org" rel="nofollow">http://wordpress.org</a>.',
			'There was a spoon named <a href="http://wordpress.org" rel="nofollow">http://wordpress.org</a>,',
			'There was a spoon named <a href="http://wordpress.org" rel="nofollow">http://wordpress.org</a>;',
			'There was a spoon named <a href="http://wordpress.org" rel="nofollow">http://wordpress.org</a>:',
			'There was a spoon named (<a href="http://wordpress.org" rel="nofollow">http://wordpress.org</a>)',
			'There was a spoon named (<a href="http://wordpress.org" rel="nofollow">http://wordpress.org</a>)x',
			);

		foreach ($urls_before as $key => $url) {
			$this->assertEquals($urls_expected[$key], make_clickable($url));
		}
	}

	// tests that make_clickable will not link trailing periods, commas and
	// (semi-)colons in URLs without protocol (i.e. www.wordpress.org)
	function test_strip_trailing_without_protocol() {
		$urls_before = array(
			'www.wordpress.org',
			'There was a spoon named www.wordpress.org. Alice!',
			'There was a spoon named www.wordpress.org, said Alice.',
			'There was a spoon named www.wordpress.org; said Alice.',
			'There was a spoon named www.wordpress.org: said Alice.',
			'There was a spoon named www.wordpress.org) said Alice.'
			);
		$urls_expected = array(
			'<a href="http://www.wordpress.org" rel="nofollow">http://www.wordpress.org</a>',
			'There was a spoon named <a href="http://www.wordpress.org" rel="nofollow">http://www.wordpress.org</a>. Alice!',
			'There was a spoon named <a href="http://www.wordpress.org" rel="nofollow">http://www.wordpress.org</a>, said Alice.',
			'There was a spoon named <a href="http://www.wordpress.org" rel="nofollow">http://www.wordpress.org</a>; said Alice.',
			'There was a spoon named <a href="http://www.wordpress.org" rel="nofollow">http://www.wordpress.org</a>: said Alice.',
			'There was a spoon named <a href="http://www.wordpress.org" rel="nofollow">http://www.wordpress.org</a>) said Alice.'
			);

		foreach ($urls_before as $key => $url) {
			$this->assertEquals($urls_expected[$key], make_clickable($url));
		}
	}

	// tests that make_clickable will not link trailing periods, commas and
	// (semi-)colons in URLs without protocol (i.e. www.wordpress.org)
	function test_strip_trailing_without_protocol_nothing_afterwards() {
		$urls_before = array(
			'www.wordpress.org',
			'There was a spoon named www.wordpress.org.',
			'There was a spoon named www.wordpress.org,',
			'There was a spoon named www.wordpress.org;',
			'There was a spoon named www.wordpress.org:',
			'There was a spoon named www.wordpress.org)'
			);
		$urls_expected = array(
			'<a href="http://www.wordpress.org" rel="nofollow">http://www.wordpress.org</a>',
			'There was a spoon named <a href="http://www.wordpress.org" rel="nofollow">http://www.wordpress.org</a>.',
			'There was a spoon named <a href="http://www.wordpress.org" rel="nofollow">http://www.wordpress.org</a>,',
			'There was a spoon named <a href="http://www.wordpress.org" rel="nofollow">http://www.wordpress.org</a>;',
			'There was a spoon named <a href="http://www.wordpress.org" rel="nofollow">http://www.wordpress.org</a>:',
			'There was a spoon named <a href="http://www.wordpress.org" rel="nofollow">http://www.wordpress.org</a>)'
			);

		foreach ($urls_before as $key => $url) {
			$this->assertEquals($urls_expected[$key], make_clickable($url));
		}
	}

	// #4570
	function test_iri() {
		$urls_before = array(
			'http://www.詹姆斯.com/',
			'http://bg.wikipedia.org/Баба',
			'http://example.com/?a=баба&b=дядо',
		);
		$urls_expected = array(
			'<a href="http://www.詹姆斯.com/" rel="nofollow">http://www.詹姆斯.com/</a>',
			'<a href="http://bg.wikipedia.org/Баба" rel="nofollow">http://bg.wikipedia.org/Баба</a>',
			'<a href="http://example.com/?a=баба&#038;b=дядо" rel="nofollow">http://example.com/?a=баба&#038;b=дядо</a>',
		);
		foreach ($urls_before as $key => $url) {
			$this->assertEquals($urls_expected[$key], make_clickable($url));
		}
	}

	// #10990
	function test_brackets_in_urls() {
		$urls_before = array(
			'http://en.wikipedia.org/wiki/PC_Tools_(Central_Point_Software)',
			'(http://en.wikipedia.org/wiki/PC_Tools_(Central_Point_Software))',
			'blah http://en.wikipedia.org/wiki/PC_Tools_(Central_Point_Software) blah',
			'blah (http://en.wikipedia.org/wiki/PC_Tools_(Central_Point_Software)) blah',
			'blah blah blah http://en.wikipedia.org/wiki/PC_Tools_(Central_Point_Software) blah blah',
			'blah blah blah http://en.wikipedia.org/wiki/PC_Tools_(Central_Point_Software)) blah blah',
			'blah blah (http://en.wikipedia.org/wiki/PC_Tools_(Central_Point_Software)) blah blah',
			'blah blah http://en.wikipedia.org/wiki/PC_Tools_(Central_Point_Software).) blah blah',
			'blah blah http://en.wikipedia.org/wiki/PC_Tools_(Central_Point_Software).)moreurl blah blah',
			'In his famous speech “You and Your research” (here:
			http://www.cs.virginia.edu/~robins/YouAndYourResearch.html)
			Richard Hamming wrote about people getting more done with their doors closed, but',
		);
		$urls_expected = array(
			'<a href="http://en.wikipedia.org/wiki/PC_Tools_(Central_Point_Software)" rel="nofollow">http://en.wikipedia.org/wiki/PC_Tools_(Central_Point_Software)</a>',
			'(<a href="http://en.wikipedia.org/wiki/PC_Tools_(Central_Point_Software)" rel="nofollow">http://en.wikipedia.org/wiki/PC_Tools_(Central_Point_Software)</a>)',
			'blah <a href="http://en.wikipedia.org/wiki/PC_Tools_(Central_Point_Software)" rel="nofollow">http://en.wikipedia.org/wiki/PC_Tools_(Central_Point_Software)</a> blah',
			'blah (<a href="http://en.wikipedia.org/wiki/PC_Tools_(Central_Point_Software)" rel="nofollow">http://en.wikipedia.org/wiki/PC_Tools_(Central_Point_Software)</a>) blah',
			'blah blah blah <a href="http://en.wikipedia.org/wiki/PC_Tools_(Central_Point_Software)" rel="nofollow">http://en.wikipedia.org/wiki/PC_Tools_(Central_Point_Software)</a> blah blah',
			'blah blah blah <a href="http://en.wikipedia.org/wiki/PC_Tools_(Central_Point_Software)" rel="nofollow">http://en.wikipedia.org/wiki/PC_Tools_(Central_Point_Software)</a>) blah blah',
			'blah blah (<a href="http://en.wikipedia.org/wiki/PC_Tools_(Central_Point_Software)" rel="nofollow">http://en.wikipedia.org/wiki/PC_Tools_(Central_Point_Software)</a>) blah blah',
			'blah blah <a href="http://en.wikipedia.org/wiki/PC_Tools_(Central_Point_Software)" rel="nofollow">http://en.wikipedia.org/wiki/PC_Tools_(Central_Point_Software)</a>.) blah blah',
			'blah blah <a href="http://en.wikipedia.org/wiki/PC_Tools_(Central_Point_Software)" rel="nofollow">http://en.wikipedia.org/wiki/PC_Tools_(Central_Point_Software)</a>.)moreurl blah blah',
			'In his famous speech “You and Your research” (here:
			<a href="http://www.cs.virginia.edu/~robins/YouAndYourResearch.html" rel="nofollow">http://www.cs.virginia.edu/~robins/YouAndYourResearch.html</a>)
			Richard Hamming wrote about people getting more done with their doors closed, but',
		);
		foreach ($urls_before as $key => $url) {
			$this->assertEquals($urls_expected[$key], make_clickable($url));
		}
	}

	// Based on a real comments which were incorrectly linked. #11211
	function test_real_world_examples() {
		$urls_before = array(
			'Example: WordPress, test (some text), I love example.com (http://example.org), it is brilliant',
			'Example: WordPress, test (some text), I love example.com (http://example.com), it is brilliant',
			'Some text followed by a bracketed link with a trailing elipsis (http://example.com)...',
			'In his famous speech “You and Your research” (here: http://www.cs.virginia.edu/~robins/YouAndYourResearch.html) Richard Hamming wrote about people getting more done with their doors closed...',
		);
		$urls_expected = array(
			'Example: WordPress, test (some text), I love example.com (<a href="http://example.org" rel="nofollow">http://example.org</a>), it is brilliant',
			'Example: WordPress, test (some text), I love example.com (<a href="http://example.com" rel="nofollow">http://example.com</a>), it is brilliant',
			'Some text followed by a bracketed link with a trailing elipsis (<a href="http://example.com" rel="nofollow">http://example.com</a>)...',
			'In his famous speech “You and Your research” (here: <a href="http://www.cs.virginia.edu/~robins/YouAndYourResearch.html" rel="nofollow">http://www.cs.virginia.edu/~robins/YouAndYourResearch.html</a>) Richard Hamming wrote about people getting more done with their doors closed...',
		);
		foreach ($urls_before as $key => $url) {
			$this->assertEquals($urls_expected[$key], make_clickable($url));
		}
	}

	// #14993
	function test_twitter_hash_bang() {
		$urls_before = array(
			'http://twitter.com/#!/wordpress/status/25907440233',
			'This is a really good tweet http://twitter.com/#!/wordpress/status/25907440233 !',
			'This is a really good tweet http://twitter.com/#!/wordpress/status/25907440233!',
		);
		$urls_expected = array(
			'<a href="http://twitter.com/#!/wordpress/status/25907440233" rel="nofollow">http://twitter.com/#!/wordpress/status/25907440233</a>',
			'This is a really good tweet <a href="http://twitter.com/#!/wordpress/status/25907440233" rel="nofollow">http://twitter.com/#!/wordpress/status/25907440233</a> !',
			'This is a really good tweet <a href="http://twitter.com/#!/wordpress/status/25907440233" rel="nofollow">http://twitter.com/#!/wordpress/status/25907440233</a>!',
		);
		foreach ($urls_before as $key => $url) {
			$this->assertEquals($urls_expected[$key], make_clickable($url));
		}
	}

	function test_wrapped_in_angles() {
		$before = array(
			'URL wrapped in angle brackets <http://example.com/>',
			'URL wrapped in angle brackets with padding < http://example.com/ >',
			'mailto wrapped in angle brackets <foo@example.com>',
		);
		$expected = array(
			'URL wrapped in angle brackets <<a href="http://example.com/" rel="nofollow">http://example.com/</a>>',
			'URL wrapped in angle brackets with padding < <a href="http://example.com/" rel="nofollow">http://example.com/</a> >',
			'mailto wrapped in angle brackets <foo@example.com>',
		);
		foreach ($before as $key => $url) {
			$this->assertEquals($expected[$key], make_clickable($url));
		}
	}

	function test_preceded_by_punctuation() {
		$before = array(
			'Comma then URL,http://example.com/',
			'Period then URL.http://example.com/',
			'Semi-colon then URL;http://example.com/',
			'Colon then URL:http://example.com/',
			'Exclamation mark then URL!http://example.com/',
			'Question mark then URL?http://example.com/',
		);
		$expected = array(
			'Comma then URL,<a href="http://example.com/" rel="nofollow">http://example.com/</a>',
			'Period then URL.<a href="http://example.com/" rel="nofollow">http://example.com/</a>',
			'Semi-colon then URL;<a href="http://example.com/" rel="nofollow">http://example.com/</a>',
			'Colon then URL:<a href="http://example.com/" rel="nofollow">http://example.com/</a>',
			'Exclamation mark then URL!<a href="http://example.com/" rel="nofollow">http://example.com/</a>',
			'Question mark then URL?<a href="http://example.com/" rel="nofollow">http://example.com/</a>',
		);
		foreach ($before as $key => $url) {
			$this->assertEquals($expected[$key], make_clickable($url));
		}
	}

	function test_dont_break_attributes() {
		$urls_before = array(
			"<img src='http://trunk.domain/wp-includes/images/smilies/icon_smile.gif' alt=':)' class='wp-smiley'>",
			"(<img src='http://trunk.domain/wp-includes/images/smilies/icon_smile.gif' alt=':)' class='wp-smiley'>)",
			"http://trunk.domain/testing#something (<img src='http://trunk.domain/wp-includes/images/smilies/icon_smile.gif' alt=':)' class='wp-smiley'>)",
			"http://trunk.domain/testing#something
			(<img src='http://trunk.domain/wp-includes/images/smilies/icon_smile.gif' alt=':)' class='wp-smiley'>)",
			"<span style='text-align:center; display: block;'><object width='425' height='350'><param name='movie' value='http://www.youtube.com/v/nd_BdvG43rE&rel=1&fs=1&showsearch=0&showinfo=1&iv_load_policy=1' /> <param name='allowfullscreen' value='true' /> <param name='wmode' value='opaque' /> <embed src='http://www.youtube.com/v/nd_BdvG43rE&rel=1&fs=1&showsearch=0&showinfo=1&iv_load_policy=1' type='application/x-shockwave-flash' allowfullscreen='true' width='425' height='350' wmode='opaque'></embed> </object></span>",
			'<a href="http://example.com/example.gif" title="Image from http://example.com">Look at this image!</a>',
		);
		$urls_expected = array(
			"<img src='http://trunk.domain/wp-includes/images/smilies/icon_smile.gif' alt=':)' class='wp-smiley'>",
			"(<img src='http://trunk.domain/wp-includes/images/smilies/icon_smile.gif' alt=':)' class='wp-smiley'>)",
			"<a href=\"http://trunk.domain/testing#something\" rel=\"nofollow\">http://trunk.domain/testing#something</a> (<img src='http://trunk.domain/wp-includes/images/smilies/icon_smile.gif' alt=':)' class='wp-smiley'>)",
			"<a href=\"http://trunk.domain/testing#something\" rel=\"nofollow\">http://trunk.domain/testing#something</a>
			(<img src='http://trunk.domain/wp-includes/images/smilies/icon_smile.gif' alt=':)' class='wp-smiley'>)",
			"<span style='text-align:center; display: block;'><object width='425' height='350'><param name='movie' value='http://www.youtube.com/v/nd_BdvG43rE&rel=1&fs=1&showsearch=0&showinfo=1&iv_load_policy=1' /> <param name='allowfullscreen' value='true' /> <param name='wmode' value='opaque' /> <embed src='http://www.youtube.com/v/nd_BdvG43rE&rel=1&fs=1&showsearch=0&showinfo=1&iv_load_policy=1' type='application/x-shockwave-flash' allowfullscreen='true' width='425' height='350' wmode='opaque'></embed> </object></span>",
			'<a href="http://example.com/example.gif" title="Image from http://example.com">Look at this image!</a>',
		);
		foreach ($urls_before as $key => $url) {
			$this->assertEquals($urls_expected[$key], make_clickable($url));
		}
	}

	/**
	 * @ticket 23756
	 */
	function test_no_links_inside_pre_or_code() {
		$before = array(
			'<pre>http://wordpress.org</pre>',
			'<code>http://wordpress.org</code>',
			'<pre class="foobar" id="foo">http://wordpress.org</pre>',
			'<code class="foobar" id="foo">http://wordpress.org</code>',
			'<precustomtag>http://wordpress.org</precustomtag>',
			'<codecustomtag>http://wordpress.org</codecustomtag>',
			'URL before pre http://wordpress.org<pre>http://wordpress.org</pre>',
			'URL before code http://wordpress.org<code>http://wordpress.org</code>',
			'URL after pre <PRE>http://wordpress.org</PRE>http://wordpress.org',
			'URL after code <code>http://wordpress.org</code>http://wordpress.org',
			'URL before and after pre http://wordpress.org<pre>http://wordpress.org</pre>http://wordpress.org',
			'URL before and after code http://wordpress.org<code>http://wordpress.org</code>http://wordpress.org',
			'code inside pre <pre>http://wordpress.org <code>http://wordpress.org</code> http://wordpress.org</pre>',
		);

		$expected = array(
			'<pre>http://wordpress.org</pre>',
			'<code>http://wordpress.org</code>',
			'<pre class="foobar" id="foo">http://wordpress.org</pre>',
			'<code class="foobar" id="foo">http://wordpress.org</code>',
			'<precustomtag><a href="http://wordpress.org" rel="nofollow">http://wordpress.org</a></precustomtag>',
			'<codecustomtag><a href="http://wordpress.org" rel="nofollow">http://wordpress.org</a></codecustomtag>',
			'URL before pre <a href="http://wordpress.org" rel="nofollow">http://wordpress.org</a><pre>http://wordpress.org</pre>',
			'URL before code <a href="http://wordpress.org" rel="nofollow">http://wordpress.org</a><code>http://wordpress.org</code>',
			'URL after pre <PRE>http://wordpress.org</PRE><a href="http://wordpress.org" rel="nofollow">http://wordpress.org</a>',
			'URL after code <code>http://wordpress.org</code><a href="http://wordpress.org" rel="nofollow">http://wordpress.org</a>',
			'URL before and after pre <a href="http://wordpress.org" rel="nofollow">http://wordpress.org</a><pre>http://wordpress.org</pre><a href="http://wordpress.org" rel="nofollow">http://wordpress.org</a>',
			'URL before and after code <a href="http://wordpress.org" rel="nofollow">http://wordpress.org</a><code>http://wordpress.org</code><a href="http://wordpress.org" rel="nofollow">http://wordpress.org</a>',
			'code inside pre <pre>http://wordpress.org <code>http://wordpress.org</code> http://wordpress.org</pre>',
		);

		foreach ( $before as $key => $url )
			$this->assertEquals( $expected[ $key ], make_clickable( $url ) );
	}

	/**
	 * @ticket 16892
	 */
	function test_click_inside_html() {
		$urls_before = array(
			'<span>http://example.com</span>',
			'<p>http://example.com/</p>',
		);
		$urls_expected = array(
			'<span><a href="http://example.com" rel="nofollow">http://example.com</a></span>',
			'<p><a href="http://example.com/" rel="nofollow">http://example.com/</a></p>',
		);
		foreach ($urls_before as $key => $url) {
			$this->assertEquals( $urls_expected[$key], make_clickable( $url ) );
		}
	}

	function test_no_links_within_links() {
		$in = array(
			'Some text with a link <a href="http://example.com">http://example.com</a>',
			//'<a href="http://wordpress.org">This is already a link www.wordpress.org</a>', // fails in 3.3.1 too
		);
		foreach ( $in as $text ) {
			$this->assertEquals( $text, make_clickable( $text ) );
		}
	}

	/**
	 * @ticket 16892
	 */
	function test_no_segfault() {
		$in = str_repeat( 'http://example.com/2011/03/18/post-title/', 256 );
		$out = make_clickable( $in );
		$this->assertEquals( $in, $out );
	}

	/**
	 * @ticket 19028
	 */
	function test_line_break_in_existing_clickable_link() {
		$html = "<a
				  href='mailto:someone@example.com'>someone@example.com</a>";
		$this->assertEquals( $html, make_clickable( $html ) );
	}
}
