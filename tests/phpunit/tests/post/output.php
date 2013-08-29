<?php

// test the output of post template tags etc

/**
 * @group post
 * @group formatting
 */
class Tests_Post_Output extends WP_UnitTestCase {

	function setUp() {
		parent::setUp();
		add_shortcode( 'dumptag', array( $this, '_shortcode_dumptag' ) );
		add_shortcode( 'paragraph', array( $this, '_shortcode_paragraph' ) );
	}

	function tearDown() {
		global $shortcode_tags;
		unset( $shortcode_tags['dumptag'], $shortcode_tags['paragraph'] );
		parent::tearDown();
	}

	function _shortcode_dumptag( $atts ) {
		$out = '';
		foreach ($atts as $k=>$v)
			$out .= "$k = $v\n";
		return $out;
	}

	function _shortcode_paragraph( $atts, $content ) {
		extract(shortcode_atts(array(
			'class' => 'graf',
		), $atts));
		return "<p class='$class'>$content</p>\n";
	}

	function test_the_content() {
		$post_content = <<<EOF
<i>This is the excerpt.</i>
<!--more-->
This is the <b>body</b>.
EOF;

		$post_id = $this->factory->post->create( compact( 'post_content' ) );

		$expected = <<<EOF
<p><i>This is the excerpt.</i><br />
<span id="more-{$post_id}"></span><br />
This is the <b>body</b>.</p>
EOF;

		$this->go_to( get_permalink( $post_id ) );
		$this->assertTrue( is_single() );
		$this->assertTrue( have_posts() );
		$this->assertNull( the_post() );

		$this->assertEquals( strip_ws( $expected ), strip_ws( get_echo( 'the_content' ) ) );
	}

	function test_the_content_shortcode() {
		$post_content = <<<EOF
[dumptag foo="bar" baz="123"]

[dumptag foo=123 baz=bar]

[dumptag http://example.com]

EOF;

		$expected =<<<EOF
foo = bar
baz = 123
foo = 123
baz = bar
0 = http://example.com

EOF;

		$post_id = $this->factory->post->create( compact( 'post_content' ) );
		$this->go_to( get_permalink( $post_id ) );
		$this->assertTrue( is_single() );
		$this->assertTrue( have_posts() );
		$this->assertNull( the_post() );

		$this->assertEquals( strip_ws( $expected ), strip_ws( get_echo( 'the_content' ) ) );
	}

	function test_the_content_shortcode_paragraph() {
		$post_content = <<<EOF
Graf by itself:

[paragraph]my graf[/paragraph]

  [paragraph foo="bar"]another graf with whitespace[/paragraph]

An [paragraph]inline graf[/paragraph], this doesn't make much sense.

A graf with a single EOL first:
[paragraph]blah[/paragraph]

EOF;

		$expected = <<<EOF
<p>Graf by itself:</p>
<p class='graf'>my graf</p>

  <p class='graf'>another graf with whitespace</p>

<p>An <p class='graf'>inline graf</p>
, this doesn&#8217;t make much sense.</p>
<p>A graf with a single EOL first:<br />
<p class='graf'>blah</p>
</p>

EOF;

		$post_id = $this->factory->post->create( compact( 'post_content' ) );
		$this->go_to( get_permalink( $post_id ) );
		$this->assertTrue( is_single() );
		$this->assertTrue( have_posts() );
		$this->assertNull( the_post() );

		$this->assertEquals( strip_ws( $expected ), strip_ws( get_echo( 'the_content' ) ) );
	}

	function test_the_content_attribute_filtering() {
		kses_init_filters();

		// http://bpr3.org/?p=87
		// the title attribute should make it through unfiltered
		$post_content = <<<EOF
<span class="Z3988" title="ctx_ver=Z39.88-2004&rft_val_fmt=info%3Aofi%2Ffmt%3Akev%3Amtx%3Ajournal&rft.aulast=Mariat&rft.aufirst=Denis&rft. au=Denis+Mariat&rft.au=Sead+Taourit&rft.au=G%C3%A9rard+Gu%C3%A9rin& rft.title=Genetics+Selection+Evolution&rft.atitle=&rft.date=2003&rft. volume=35&rft.issue=1&rft.spage=119&rft.epage=133&rft.genre=article& rft.id=info:DOI/10.1051%2Fgse%3A2002039"></span>Mariat, D., Taourit, S., GuÃ©rin, G. (2003). . <span style="font-style: italic;">Genetics Selection Evolution, 35</span>(1), 119-133. DOI: <a rev="review" href= "http://dx.doi.org/10.1051/gse:2002039">10.1051/gse:2002039</a>
EOF;

		$expected = <<<EOF
<p><span class="Z3988" title="ctx_ver=Z39.88-2004&amp;rft_val_fmt=info%3Aofi%2Ffmt%3Akev%3Amtx%3Ajournal&amp;rft.aulast=Mariat&amp;rft.aufirst=Denis&amp;rft. au=Denis+Mariat&amp;rft.au=Sead+Taourit&amp;rft.au=G%C3%A9rard+Gu%C3%A9rin&amp; rft.title=Genetics+Selection+Evolution&amp;rft.atitle=&amp;rft.date=2003&amp;rft. volume=35&amp;rft.issue=1&amp;rft.spage=119&amp;rft.epage=133&amp;rft.genre=article&amp; rft.id=info:DOI/10.1051%2Fgse%3A2002039"></span>Mariat, D., Taourit, S., GuÃ©rin, G. (2003). . <span style="font-style: italic">Genetics Selection Evolution, 35</span>(1), 119-133. DOI: <a rev="review" href="http://dx.doi.org/10.1051/gse:2002039">10.1051/gse:2002039</a></p>
EOF;

		$post_id = $this->factory->post->create( compact( 'post_content' ) );
		$this->go_to( get_permalink( $post_id ) );
		$this->assertTrue( is_single() );
		$this->assertTrue( have_posts() );
		$this->assertNull( the_post() );

		$this->assertEquals( strip_ws( $expected ), strip_ws( get_echo( 'the_content' ) ) );

		kses_remove_filters();
	}

	function test_the_content_attribute_value_with_colon() {
		kses_init_filters();

		// http://bpr3.org/?p=87
		// the title attribute should make it through unfiltered
		$post_content = <<<EOF
<span title="My friends: Alice, Bob and Carol">foo</span>
EOF;

		$expected = <<<EOF
<p><span title="My friends: Alice, Bob and Carol">foo</span></p>
EOF;

		$post_id = $this->factory->post->create( compact( 'post_content' ) );
		$this->go_to( get_permalink( $post_id ) );
		$this->assertTrue( is_single() );
		$this->assertTrue( have_posts() );
		$this->assertNull( the_post() );

		$this->assertEquals( strip_ws( $expected ), strip_ws( get_echo( 'the_content' ) ) );

		kses_remove_filters();
	}

}
