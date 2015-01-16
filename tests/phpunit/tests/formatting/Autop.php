<?php

/**
 * @group formatting
 */
class Tests_Formatting_Autop extends WP_UnitTestCase {
	//From ticket https://core.trac.wordpress.org/ticket/11008
	function test_first_post() {
		$expected = '<p>Welcome to WordPress!  This post contains important information.  After you read it, you can make it private to hide it from visitors but still have the information handy for future reference.</p>
<p>First things first:</p>
<ul>
<li><a href="%1$s" title="Subscribe to the WordPress mailing list for Release Notifications">Subscribe to the WordPress mailing list for release notifications</a></li>
</ul>
<p>As a subscriber, you will receive an email every time an update is available (and only then).  This will make it easier to keep your site up to date, and secure from evildoers.<br />
When a new version is released, <a href="%2$s" title="If you are already logged in, this will take you directly to the Dashboard">log in to the Dashboard</a> and follow the instructions.<br />
Upgrading is a couple of clicks!</p>
<p>Then you can start enjoying the WordPress experience:</p>
<ul>
<li>Edit your personal information at <a href="%3$s" title="Edit settings like your password, your display name and your contact information">Users &#8250; Your Profile</a></li>
<li>Start publishing at <a href="%4$s" title="Create a new post">Posts &#8250; Add New</a> and at <a href="%5$s" title="Create a new page">Pages &#8250; Add New</a></li>
<li>Browse and install plugins at <a href="%6$s" title="Browse and install plugins at the official WordPress repository directly from your Dashboard">Plugins &#8250; Add New</a></li>
<li>Browse and install themes at <a href="%7$s" title="Browse and install themes at the official WordPress repository directly from your Dashboard">Appearance &#8250; Add New Themes</a></li>
<li>Modify and prettify your website&#8217;s links at <a href="%8$s" title="For example, select a link structure like: http://example.com/1999/12/post-name">Settings &#8250; Permalinks</a></li>
<li>Import content from another system or WordPress site at <a href="%9$s" title="WordPress comes with importers for the most common publishing systems">Tools &#8250; Import</a></li>
<li>Find answers to your questions at the <a href="%10$s" title="The official WordPress documentation, maintained by the WordPress community">WordPress Codex</a></li>
</ul>
<p>To keep this post for reference, <a href="%11$s" title="Click to edit the content and settings of this post">click to edit it</a>, go to the Publish box and change its Visibility from Public to Private.</p>
<p>Thank you for selecting WordPress.  We wish you happy publishing!</p>
<p>PS.  Not yet subscribed for update notifications?  <a href="%1$s" title="Subscribe to the WordPress mailing list for Release Notifications">Do it now!</a></p>
';
		$test_data = '
Welcome to WordPress!  This post contains important information.  After you read it, you can make it private to hide it from visitors but still have the information handy for future reference.

First things first:
<ul>
<li><a href="%1$s" title="Subscribe to the WordPress mailing list for Release Notifications">Subscribe to the WordPress mailing list for release notifications</a></li>
</ul>
As a subscriber, you will receive an email every time an update is available (and only then).  This will make it easier to keep your site up to date, and secure from evildoers.
When a new version is released, <a href="%2$s" title="If you are already logged in, this will take you directly to the Dashboard">log in to the Dashboard</a> and follow the instructions.
Upgrading is a couple of clicks!

Then you can start enjoying the WordPress experience:
<ul>
<li>Edit your personal information at <a href="%3$s" title="Edit settings like your password, your display name and your contact information">Users &#8250; Your Profile</a></li>
<li>Start publishing at <a href="%4$s" title="Create a new post">Posts &#8250; Add New</a> and at <a href="%5$s" title="Create a new page">Pages &#8250; Add New</a></li>
<li>Browse and install plugins at <a href="%6$s" title="Browse and install plugins at the official WordPress repository directly from your Dashboard">Plugins &#8250; Add New</a></li>
<li>Browse and install themes at <a href="%7$s" title="Browse and install themes at the official WordPress repository directly from your Dashboard">Appearance &#8250; Add New Themes</a></li>
<li>Modify and prettify your website&#8217;s links at <a href="%8$s" title="For example, select a link structure like: http://example.com/1999/12/post-name">Settings &#8250; Permalinks</a></li>
<li>Import content from another system or WordPress site at <a href="%9$s" title="WordPress comes with importers for the most common publishing systems">Tools &#8250; Import</a></li>
<li>Find answers to your questions at the <a href="%10$s" title="The official WordPress documentation, maintained by the WordPress community">WordPress Codex</a></li>
</ul>
To keep this post for reference, <a href="%11$s" title="Click to edit the content and settings of this post">click to edit it</a>, go to the Publish box and change its Visibility from Public to Private.

Thank you for selecting WordPress.  We wish you happy publishing!

PS.  Not yet subscribed for update notifications?  <a href="%1$s" title="Subscribe to the WordPress mailing list for Release Notifications">Do it now!</a>
';

		// On windows environments, the EOL-style is \r\n
		$expected = str_replace( "\r\n", "\n", $expected);

		$this->assertEquals($expected, wpautop($test_data));
	}

	/**
	 * wpautop() Should not alter the contents of "<pre>" elements
	 *
	 * @ticket 19855
	 */
	public function test_skip_pre_elements() {
		$code = file_get_contents( DIR_TESTDATA . '/formatting/sizzle.js' );
		$code = str_replace( "\r", '', $code );
		$code = htmlentities( $code );

		// Not wrapped in <p> tags
		$str = "<pre>$code</pre>";
		$this->assertEquals( $str, trim( wpautop( $str ) ) );

		// Text before/after is wrapped in <p> tags
		$str = "Look at this code\n\n<pre>$code</pre>\n\nIsn't that cool?";

		// Expected text after wpautop
		$expected = '<p>Look at this code</p>' . "\n<pre>" . $code . "</pre>\n" . '<p>Isn\'t that cool?</p>';
		$this->assertEquals( $expected, trim( wpautop( $str ) ) );

		// Make sure HTML breaks are maintained if manually inserted
		$str = "Look at this code\n\n<pre>Line1<br />Line2<br>Line3<br/>Line4\nActual Line 2\nActual Line 3</pre>\n\nCool, huh?";
		$expected = "<p>Look at this code</p>\n<pre>Line1<br />Line2<br>Line3<br/>Line4\nActual Line 2\nActual Line 3</pre>\n<p>Cool, huh?</p>";
		$this->assertEquals( $expected, trim( wpautop( $str ) ) );
	}

	/**
	 * wpautop() Should not add <br/> to "<input>" elements
	 *
	 * @ticket 16456
	 */
	public function test_skip_input_elements() {
		$str = 'Username: <input type="text" id="username" name="username" /><br />Password: <input type="password" id="password1" name="password1" />';
		$this->assertEquals( "<p>$str</p>", trim( wpautop( $str ) ) );
	}

	/**
	 * wpautop() Should not add <p> and <br/> around <source> and <track>
	 *
	 * @ticket 26864
	 */
	public function test_source_track_elements() {
		$content = "Paragraph one.\n\n" .
			'<video class="wp-video-shortcode" id="video-0-1" width="640" height="360" preload="metadata" controls="controls">
				<source type="video/mp4" src="http://domain.tld/wp-content/uploads/2013/12/xyz.mp4" />
				<!-- WebM/VP8 for Firefox4, Opera, and Chrome -->
				<source type="video/webm" src="myvideo.webm" />
				<!-- Ogg/Vorbis for older Firefox and Opera versions -->
				<source type="video/ogg" src="myvideo.ogv" />
				<!-- Optional: Add subtitles for each language -->
				<track kind="subtitles" src="subtitles.srt" srclang="en" />
				<!-- Optional: Add chapters -->
				<track kind="chapters" src="chapters.srt" srclang="en" />
				<a href="http://domain.tld/wp-content/uploads/2013/12/xyz.mp4">http://domain.tld/wp-content/uploads/2013/12/xyz.mp4</a>
			</video>' .
			"\n\nParagraph two.";

		$content2 = "Paragraph one.\n\n" .
			'<video class="wp-video-shortcode" id="video-0-1" width="640" height="360" preload="metadata" controls="controls">

			<source type="video/mp4" src="http://domain.tld/wp-content/uploads/2013/12/xyz.mp4" />

			<!-- WebM/VP8 for Firefox4, Opera, and Chrome -->
			<source type="video/webm" src="myvideo.webm" />

			<!-- Ogg/Vorbis for older Firefox and Opera versions -->
			<source type="video/ogg" src="myvideo.ogv" />

			<!-- Optional: Add subtitles for each language -->
			<track kind="subtitles" src="subtitles.srt" srclang="en" />

			<!-- Optional: Add chapters -->
			<track kind="chapters" src="chapters.srt" srclang="en" />

			<a href="http://domain.tld/wp-content/uploads/2013/12/xyz.mp4">http://domain.tld/wp-content/uploads/2013/12/xyz.mp4</a>

			</video>' .
			"\n\nParagraph two.";

		$expected = "<p>Paragraph one.</p>\n" . // line breaks only after <p>
			'<p><video class="wp-video-shortcode" id="video-0-1" width="640" height="360" preload="metadata" controls="controls">' .
			'<source type="video/mp4" src="http://domain.tld/wp-content/uploads/2013/12/xyz.mp4" />' .
			'<!-- WebM/VP8 for Firefox4, Opera, and Chrome -->' .
			'<source type="video/webm" src="myvideo.webm" />' .
			'<!-- Ogg/Vorbis for older Firefox and Opera versions -->' .
			'<source type="video/ogg" src="myvideo.ogv" />' .
			'<!-- Optional: Add subtitles for each language -->' .
			'<track kind="subtitles" src="subtitles.srt" srclang="en" />' .
			'<!-- Optional: Add chapters -->' .
			'<track kind="chapters" src="chapters.srt" srclang="en" />' .
			'<a href="http://domain.tld/wp-content/uploads/2013/12/xyz.mp4">' .
			"http://domain.tld/wp-content/uploads/2013/12/xyz.mp4</a></video></p>\n" .
			'<p>Paragraph two.</p>';

		// When running the content through wpautop() from wp_richedit_pre()
		$shortcode_content = "Paragraph one.\n\n" .
			'[video width="720" height="480" mp4="http://domain.tld/wp-content/uploads/2013/12/xyz.mp4"]
			<!-- WebM/VP8 for Firefox4, Opera, and Chrome -->
			<source type="video/webm" src="myvideo.webm" />
			<!-- Ogg/Vorbis for older Firefox and Opera versions -->
			<source type="video/ogg" src="myvideo.ogv" />
			<!-- Optional: Add subtitles for each language -->
			<track kind="subtitles" src="subtitles.srt" srclang="en" />
			<!-- Optional: Add chapters -->
			<track kind="chapters" src="chapters.srt" srclang="en" />
			[/video]' .
			"\n\nParagraph two.";

		$shortcode_expected = "<p>Paragraph one.</p>\n" . // line breaks only after <p>
			'<p>[video width="720" height="480" mp4="http://domain.tld/wp-content/uploads/2013/12/xyz.mp4"]' .
			'<!-- WebM/VP8 for Firefox4, Opera, and Chrome --><source type="video/webm" src="myvideo.webm" />' .
			'<!-- Ogg/Vorbis for older Firefox and Opera versions --><source type="video/ogg" src="myvideo.ogv" />' .
			'<!-- Optional: Add subtitles for each language --><track kind="subtitles" src="subtitles.srt" srclang="en" />' .
			'<!-- Optional: Add chapters --><track kind="chapters" src="chapters.srt" srclang="en" />' .
			"[/video]</p>\n" .
			'<p>Paragraph two.</p>';

		$this->assertEquals( $expected, trim( wpautop( $content ) ) );
		$this->assertEquals( $expected, trim( wpautop( $content2 ) ) );
		$this->assertEquals( $shortcode_expected, trim( wpautop( $shortcode_content ) ) );
	}

	/**
	 * wpautop() Should not add <p> and <br/> around <param> and <embed>
	 *
	 * @ticket 26864
	 */
	public function test_param_embed_elements() {
		$content1 = '
Paragraph one.

<object width="400" height="224" classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,40,0">
	<param name="src" value="http://domain.tld/wp-content/uploads/2013/12/xyz.swf" />
	<param name="allowfullscreen" value="true" />
	<param name="allowscriptaccess" value="always" />
	<param name="overstretch" value="true" />
	<param name="flashvars" value="isDynamicSeeking=true" />

	<embed width="400" height="224" type="application/x-shockwave-flash" src="http://domain.tld/wp-content/uploads/2013/12/xyz.swf" wmode="direct" seamlesstabbing="true" allowfullscreen="true" overstretch="true" flashvars="isDynamicSeeking=true" />
</object>

Paragraph two.';

		$expected1 = "<p>Paragraph one.</p>\n" . // line breaks only after <p>
			'<p><object width="400" height="224" classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=6,0,40,0">' .
			'<param name="src" value="http://domain.tld/wp-content/uploads/2013/12/xyz.swf" />' .
			'<param name="allowfullscreen" value="true" />' .
			'<param name="allowscriptaccess" value="always" />' .
			'<param name="overstretch" value="true" />' .
			'<param name="flashvars" value="isDynamicSeeking=true" />' .
			'<embed width="400" height="224" type="application/x-shockwave-flash" src="http://domain.tld/wp-content/uploads/2013/12/xyz.swf" wmode="direct" seamlesstabbing="true" allowfullscreen="true" overstretch="true" flashvars="isDynamicSeeking=true" />' .
			"</object></p>\n" .
			'<p>Paragraph two.</p>';

		$content2 = '
Paragraph one.

<div class="video-player" id="x-video-0">
<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="640" height="360" id="video-0" standby="Standby text">
  <param name="movie" value="http://domain.tld/wp-content/uploads/2013/12/xyz.swf" />
  <param name="quality" value="best" />

  <param name="seamlesstabbing" value="true" />
  <param name="allowfullscreen" value="true" />
  <param name="allowscriptaccess" value="always" />
  <param name="overstretch" value="true" />

  <!--[if !IE]--><object type="application/x-shockwave-flash" data="http://domain.tld/wp-content/uploads/2013/12/xyz.swf" width="640" height="360" standby="Standby text">
    <param name="quality" value="best" />

    <param name="seamlesstabbing" value="true" />
    <param name="allowfullscreen" value="true" />
    <param name="allowscriptaccess" value="always" />
    <param name="overstretch" value="true" />
  </object><!--<![endif]-->
</object></div>

Paragraph two.';

		$expected2 = "<p>Paragraph one.</p>\n" . // line breaks only after block tags
			'<div class="video-player" id="x-video-0">' . "\n" .
			'<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="640" height="360" id="video-0" standby="Standby text">' .
			'<param name="movie" value="http://domain.tld/wp-content/uploads/2013/12/xyz.swf" />' .
			'<param name="quality" value="best" />' .
			'<param name="seamlesstabbing" value="true" />' .
			'<param name="allowfullscreen" value="true" />' .
			'<param name="allowscriptaccess" value="always" />' .
			'<param name="overstretch" value="true" />' .
			'<!--[if !IE]--><object type="application/x-shockwave-flash" data="http://domain.tld/wp-content/uploads/2013/12/xyz.swf" width="640" height="360" standby="Standby text">' .
			'<param name="quality" value="best" />' .
			'<param name="seamlesstabbing" value="true" />' .
			'<param name="allowfullscreen" value="true" />' .
			'<param name="allowscriptaccess" value="always" />' .
			'<param name="overstretch" value="true" /></object><!--<![endif]-->' .
			"</object></div>\n" .
			'<p>Paragraph two.</p>';

		$this->assertEquals( $expected1, trim( wpautop( $content1 ) ) );
		$this->assertEquals( $expected2, trim( wpautop( $content2 ) ) );
	}

	/**
	 * wpautop() Should not add <br/> to "<select>" or "<option>" elements
	 *
	 * @ticket 22230
	 */
	public function test_skip_select_option_elements() {
		$str = 'Country: <select id="state" name="state"><option value="1">Alabama</option><option value="2">Alaska</option><option value="3">Arizona</option><option value="4">Arkansas</option><option value="5">California</option></select>';
		$this->assertEquals( "<p>$str</p>", trim( wpautop( $str ) ) );
	}

	/**
	 * wpautop() should treat block level HTML elements as blocks.
	 *
	 * @ticket 27268
	 */
	function test_that_wpautop_treats_block_level_elements_as_blocks() {
		$blocks = array(
			'table',
			'thead',
			'tfoot',
			'caption',
			'col',
			'colgroup',
			'tbody',
			'tr',
			'td',
			'th',
			'div',
			'dl',
			'dd',
			'dt',
			'ul',
			'ol',
			'li',
			'pre',
			'form',
			'map',
			'area',
			'address',
			'math',
			'style',
			'p',
			'h1',
			'h2',
			'h3',
			'h4',
			'h5',
			'h6',
			'hr',
			'fieldset',
			'legend',
			'section',
			'article',
			'aside',
			'hgroup',
			'header',
			'footer',
			'nav',
			'figure',
			'details',
			'menu',
			'summary',
		);

		$content = array();

		foreach ( $blocks as $block ) {
			$content[] = "<$block>foo</$block>";
		}

		$expected = join( "\n", $content );
		$content = join( "\n\n", $content ); // WS difference

		$this->assertEquals( $expected, trim( wpautop( $content ) ) );
	}

	/**
	 * wpautop() should autop a blockquote's contents but not the blockquote itself
	 *
	 * @ticket 27268
	 */
	function test_that_wpautop_does_not_wrap_blockquotes_but_does_autop_their_contents() {
		$content  = "<blockquote>foo</blockquote>";
		$expected = "<blockquote><p>foo</p></blockquote>";

		$this->assertEquals( $expected, trim( wpautop( $content ) ) );
	}

	/**
	 * wpautop() should treat inline HTML elements as inline.
	 *
	 * @ticket 27268
	 */
	function test_that_wpautop_treats_inline_elements_as_inline() {
		$inlines = array(
			'a',
			'em',
			'strong',
			'small',
			's',
			'cite',
			'q',
			'dfn',
			'abbr',
			'data',
			'time',
			'code',
			'var',
			'samp',
			'kbd',
			'sub',
			'sup',
			'i',
			'b',
			'u',
			'mark',
			'span',
			'del',
			'ins',
			'noscript',
			'select',
		);

		$content = $expected = array();

		foreach ( $inlines as $inline ) {
			$content[] = "<$inline>foo</$inline>";
			$expected[] = "<p><$inline>foo</$inline></p>";
		}

		$content = join( "\n\n", $content );
		$expected = join( "\n", $expected );

		$this->assertEquals( $expected, trim( wpautop( $content ) ) );
	}
}
