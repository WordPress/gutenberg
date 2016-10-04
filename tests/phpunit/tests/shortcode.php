<?php
/**
 * @group shortcode
 */
class Tests_Shortcode extends WP_UnitTestCase {

	protected $shortcodes = array( 'test-shortcode-tag', 'footag', 'bartag', 'baztag', 'dumptag', 'hyphen', 'hyphen-foo', 'hyphen-foo-bar', 'url', 'img' );

	function setUp() {
		parent::setUp();

		foreach ( $this->shortcodes as $shortcode )
			add_shortcode( $shortcode, array( $this, '_shortcode_' . str_replace( '-', '_', $shortcode ) ) );

		$this->atts = null;
		$this->content = null;
		$this->tagname = null;

	}

	function tearDown() {
		global $shortcode_tags;
		foreach ( $this->shortcodes as $shortcode ) {
			unset( $shortcode_tags[ $shortcode ] );
		}
		parent::tearDown();
	}

	function _shortcode_test_shortcode_tag( $atts, $content = null, $tagname = null ) {
		$this->atts = $atts;
		$this->content = $content;
		$this->tagname = $tagname;
		$this->filter_atts_out = null;
		$this->filter_atts_pairs = null;
		$this->filter_atts_atts = null;
	}

	// [footag foo="bar"]
	function _shortcode_footag( $atts ) {
		return @"foo = {$atts['foo']}";
	}

	// [bartag foo="bar"]
	function _shortcode_bartag( $atts ) {
		extract(shortcode_atts(array(
			'foo' => 'no foo',
			'baz' => 'default baz',
		), $atts, 'bartag'));

		return "foo = {$foo}";
	}

	// [baztag]content[/baztag]
	function _shortcode_baztag( $atts, $content = '' ) {
		return 'content = '.do_shortcode($content);
	}

	function _shortcode_dumptag( $atts ) {
		$out = '';
		foreach ($atts as $k=>$v)
			$out .= "$k = $v\n";
		return $out;
	}

	function _shortcode_hyphen() {
		return __FUNCTION__;
	}

	function _shortcode_hyphen_foo() {
		return __FUNCTION__;
	}

	function _shortcode_hyphen_foo_bar() {
		return __FUNCTION__;
	}

	function _shortcode_url() {
		return 'http://www.wordpress.org/';
	}

	function _shortcode_img( $atts ) {
		$out = '<img';
		foreach ( $atts as $k => $v ) {
			$out .= " $k=\"$v\"";
		}
		$out .= ' />';

		return $out;
	}

	function test_noatts() {
		do_shortcode('[test-shortcode-tag /]');
		$this->assertEquals( '', $this->atts );
		$this->assertEquals( 'test-shortcode-tag', $this->tagname );
	}

	function test_one_att() {
		do_shortcode('[test-shortcode-tag foo="asdf" /]');
		$this->assertEquals( array('foo' => 'asdf'), $this->atts );
		$this->assertEquals( 'test-shortcode-tag', $this->tagname );
	}

	function test_not_a_tag() {
		$out = do_shortcode('[not-a-shortcode-tag]');
		$this->assertEquals( '[not-a-shortcode-tag]', $out );
	}

	/**
	 * @ticket 17657
	 */
	function test_tag_hyphen_not_tag() {
		$out = do_shortcode( '[dumptag-notreal]' );
		$this->assertEquals( '[dumptag-notreal]', $out );
	}

	function test_tag_underscore_not_tag() {
		$out = do_shortcode( '[dumptag_notreal]' );
		$this->assertEquals( '[dumptag_notreal]', $out );
	}

	function test_tag_not_tag() {
		$out = do_shortcode( '[dumptagnotreal]' );
		$this->assertEquals( '[dumptagnotreal]', $out );
	}

	/**
	 * @ticket 17657
	 */
	function test_tag_hyphen() {
 		$this->assertEquals( '_shortcode_hyphen', do_shortcode( '[hyphen]' ) );
 		$this->assertEquals( '_shortcode_hyphen_foo', do_shortcode( '[hyphen-foo]' ) );
 		$this->assertEquals( '_shortcode_hyphen_foo_bar', do_shortcode( '[hyphen-foo-bar]' ) );
		$this->assertEquals( '[hyphen-baz]', do_shortcode( '[hyphen-baz]' ) );
		$this->assertEquals( '[hyphen-foo-bar-baz]', do_shortcode( '[hyphen-foo-bar-baz]' ) );
	}

	/**
	 * @ticket 9405
	 */
	function test_attr_hyphen() {
		do_shortcode('[test-shortcode-tag foo="foo" foo-bar="foo-bar" foo-bar-="foo-bar-" -foo-bar="-foo-bar" -foo-bar-="-foo-bar-" foo-bar-baz="foo-bar-baz" -foo-bar-baz="-foo-bar-baz" foo--bar="foo--bar" /]');
		$expected_attrs = array(
			'foo' => 'foo',
			'foo-bar' => 'foo-bar',
			'foo-bar-' => 'foo-bar-',
			'-foo-bar' => '-foo-bar',
			'-foo-bar-' => '-foo-bar-',
			'foo-bar-baz' => 'foo-bar-baz',
			'-foo-bar-baz' => '-foo-bar-baz',
			'foo--bar' => 'foo--bar',
		);
		$this->assertEquals( $expected_attrs, $this->atts );
	}

	function test_two_atts() {
		do_shortcode('[test-shortcode-tag foo="asdf" bar="bing" /]');
		$this->assertEquals( array('foo' => 'asdf', 'bar' => 'bing'), $this->atts );
		$this->assertEquals( 'test-shortcode-tag', $this->tagname );
	}

	function test_noatts_enclosing() {
		do_shortcode('[test-shortcode-tag]content[/test-shortcode-tag]');
		$this->assertEquals( '', $this->atts );
		$this->assertEquals( 'content', $this->content );
		$this->assertEquals( 'test-shortcode-tag', $this->tagname );
	}

	function test_one_att_enclosing() {
		do_shortcode('[test-shortcode-tag foo="bar"]content[/test-shortcode-tag]');
		$this->assertEquals( array('foo' => 'bar'), $this->atts );
		$this->assertEquals( 'content', $this->content );
		$this->assertEquals( 'test-shortcode-tag', $this->tagname );
	}

	function test_two_atts_enclosing() {
		do_shortcode('[test-shortcode-tag foo="bar" baz="bing"]content[/test-shortcode-tag]');
		$this->assertEquals( array('foo' => 'bar', 'baz' => 'bing'), $this->atts );
		$this->assertEquals( 'content', $this->content );
		$this->assertEquals( 'test-shortcode-tag', $this->tagname );
	}

	function test_unclosed() {
		$out = do_shortcode('[test-shortcode-tag]');
		$this->assertEquals( '', $out );
		$this->assertEquals( '', $this->atts );
		$this->assertEquals( 'test-shortcode-tag', $this->tagname );
	}

	function test_positional_atts_num() {
		$out = do_shortcode('[test-shortcode-tag 123]');
		$this->assertEquals( '', $out );
		$this->assertEquals( array(0=>'123'), $this->atts );
		$this->assertEquals( 'test-shortcode-tag', $this->tagname );
	}

	function test_positional_atts_url() {
		$out = do_shortcode('[test-shortcode-tag http://www.youtube.com/watch?v=eBGIQ7ZuuiU]');
		$this->assertEquals( '', $out );
		$this->assertEquals( array(0=>'http://www.youtube.com/watch?v=eBGIQ7ZuuiU'), $this->atts );
		$this->assertEquals( 'test-shortcode-tag', $this->tagname );
	}

	function test_positional_atts_quotes() {
		$out = do_shortcode('[test-shortcode-tag "something in quotes" "something else"]');
		$this->assertEquals( '', $out );
		$this->assertEquals( array(0=>'something in quotes', 1=>'something else'), $this->atts );
		$this->assertEquals( 'test-shortcode-tag', $this->tagname );
	}

	function test_positional_atts_mixed() {
		$out = do_shortcode('[test-shortcode-tag 123 https://wordpress.org/ 0 "foo" bar]');
		$this->assertEquals( '', $out );
		$this->assertEquals( array(0=>'123', 1=>'https://wordpress.org/', 2=>'0', 3=>'foo', 4=>'bar'), $this->atts );
		$this->assertEquals( 'test-shortcode-tag', $this->tagname );
	}

	function test_positional_and_named_atts() {
		$out = do_shortcode('[test-shortcode-tag 123 url=https://wordpress.org/ foo bar="baz"]');
		$this->assertEquals( '', $out );
		$this->assertEquals( array(0=>'123', 'url' => 'https://wordpress.org/', 1=>'foo', 'bar' => 'baz'), $this->atts );
		$this->assertEquals( 'test-shortcode-tag', $this->tagname );
	}

	function test_footag_default() {
		$out = do_shortcode('[footag]');
		$this->assertEquals('foo = ', $out);
	}

	function test_footag_val() {
		$val = rand_str();
		$out = do_shortcode('[footag foo="'.$val.'"]');
		$this->assertEquals('foo = '.$val, $out);
	}

	function test_nested_tags() {
		$out = do_shortcode('[baztag][dumptag abc="foo" def=123 https://wordpress.org/][/baztag]');
		$expected = "content = abc = foo\ndef = 123\n0 = https://wordpress.org\n";
		$this->assertEquals($expected, $out);
	}

	/**
	 * @ticket 6518
	 */
	function test_tag_escaped() {
		$out = do_shortcode('[[footag]] [[bartag foo="bar"]]');
		$this->assertEquals('[footag] [bartag foo="bar"]', $out);

		$out = do_shortcode('[[footag /]] [[bartag foo="bar" /]]');
		$this->assertEquals('[footag /] [bartag foo="bar" /]', $out);

		$out = do_shortcode('[[baztag foo="bar"]the content[/baztag]]');
		$this->assertEquals('[baztag foo="bar"]the content[/baztag]', $out);

		// double escaped
		$out = do_shortcode('[[[footag]]] [[[bartag foo="bar"]]]');
		$this->assertEquals('[[footag]] [[bartag foo="bar"]]', $out);
	}

	function test_tag_not_escaped() {
		// these have square brackets on either end but aren't actually escaped
		$out = do_shortcode('[[footag] [bartag foo="bar"]]');
		$this->assertEquals('[foo =  foo = bar]', $out);

		$out = do_shortcode('[[footag /] [bartag foo="bar" /]]');
		$this->assertEquals('[foo =  foo = bar]', $out);

		$out = do_shortcode('[[baztag foo="bar"]the content[/baztag]');
		$this->assertEquals('[content = the content', $out);

		$out = do_shortcode('[[not-a-tag]]');
		$this->assertEquals('[[not-a-tag]]', $out);

		$out = do_shortcode('[[[footag] [bartag foo="bar"]]]');
		$this->assertEquals('[[foo =  foo = bar]]', $out);
	}

	function test_mixed_tags() {
		$in = <<<EOF
So this is a post with [footag foo="some stuff"] and a bunch of tags.

[bartag]

[baztag]
Here's some content
on more than one line
[/baztag]

[bartag foo=1] [baztag] [footag foo="2"] [baztag]

[baztag]
more content
[/baztag]

EOF;
		$expected = <<<EOF
So this is a post with foo = some stuff and a bunch of tags.

foo = no foo

content =
Here's some content
on more than one line


foo = 1 content =  foo = 2 content =
content =
more content

EOF;
		$out = do_shortcode($in);
		$this->assertEquals(strip_ws($expected), strip_ws($out));
	}

	/**
	 * @ticket 6562
	 */
	function test_utf8_whitespace_1() {
		// NO-BREAK SPACE: U+00A0
		do_shortcode("[test-shortcode-tag foo=\"bar\" \xC2\xA0baz=\"123\"]");
		$this->assertEquals( array('foo' => 'bar', 'baz' => '123'), $this->atts );
		$this->assertEquals( '', $this->content );
	}

	/**
	 * @ticket 6562
	 */
	function test_utf8_whitespace_2() {
		// ZERO WIDTH SPACE: U+200B
		do_shortcode("[test-shortcode-tag foo=\"bar\" \xE2\x80\x8Babc=\"def\"]");
		$this->assertEquals( array('foo' => 'bar', 'abc' => 'def'), $this->atts );
		$this->assertEquals( '', $this->content );
	}

	/**
	 * @ticket 14050
	 */
	function test_shortcode_unautop() {
		// a blank line is added at the end, so test with it already there
		$test_string = "[footag]\n";
		$this->assertEquals( $test_string, shortcode_unautop( wpautop( $test_string ) ) );
	}

	/**
	 * @ticket 10326
	 */
	function test_strip_shortcodes() {
		$this->assertEquals('before', strip_shortcodes('before[gallery]'));
		$this->assertEquals('after', strip_shortcodes('[gallery]after'));
		$this->assertEquals('beforeafter', strip_shortcodes('before[gallery]after'));
	}


	// Store passed in shortcode_atts_{$shortcode} args
	function _filter_atts( $out, $pairs, $atts ) {
		$this->filter_atts_out = $out;
		$this->filter_atts_pairs = $pairs;
		$this->filter_atts_atts = $atts;
		return $out;
	}

	// Filter shortcode atts in various ways
	function _filter_atts2( $out, $pairs, $atts ) {
		// If foo attribute equals "foo1", change it to be default value
		if ( isset( $out['foo'] ) && 'foo1' == $out['foo'] )
			$out['foo'] = $pairs['foo'];

		// If baz attribute is set, remove it
		if ( isset( $out['baz'] ) )
			unset( $out['baz'] );

		$this->filter_atts_out = $out;
		return $out;
	}

	function test_shortcode_atts_filter_passes_original_arguments() {
		add_filter( 'shortcode_atts_bartag', array( $this, '_filter_atts' ), 10, 3 );

		do_shortcode('[bartag foo="foo1" /]');
		$this->assertEquals( array( 'foo' => 'foo1', 'baz' => 'default baz' ), $this->filter_atts_out );
		$this->assertEquals( array( 'foo' => 'no foo', 'baz' => 'default baz' ), $this->filter_atts_pairs );
		$this->assertEquals( array( 'foo' => 'foo1' ), $this->filter_atts_atts );

		remove_filter( 'shortcode_atts_bartag', array( $this, '_filter_atts' ), 10, 3 );
	}

	function test_shortcode_atts_filtering() {
		add_filter( 'shortcode_atts_bartag', array( $this, '_filter_atts2' ), 10, 3 );

		$out = do_shortcode('[bartag foo="foo1" baz="baz1" /]');
		$this->assertEquals( array( 'foo' => 'no foo' ), $this->filter_atts_out );
		$this->assertEquals( 'foo = no foo', $out );

		$out = do_shortcode('[bartag foo="foo2" /]');
		$this->assertEquals( 'foo = foo2', $out );

		remove_filter( 'shortcode_atts_bartag', array( $this, '_filter_atts2' ), 10, 3 );
	}

	/**
	 * Check that shortcode_unautop() will always recognize spaces around shortcodes.
	 *
	 * @ticket 22692
	 */
	function test_spaces_around_shortcodes() {
		$nbsp = "\xC2\xA0";

		$input  = array();

		$input[] = "<p>[gallery ids=\"37,15,11\"]</p>";
		$input[] = "<p> [gallery ids=\"37,15,11\"] </p>";
		$input[] = "<p> {$nbsp}[gallery ids=\"37,15,11\"] {$nbsp}</p>";
		$input[] = "<p> &nbsp;[gallery ids=\"37,15,11\"] &nbsp;</p>";

		$output = "[gallery ids=\"37,15,11\"]";

		foreach($input as $in) {
			$this->assertEquals( $output, shortcode_unautop( $in ) );
		}
	}

	/**
	 * Check for bugginess using normal input with latest patches.
	 *
	 * @dataProvider data_escaping
	 */
	function test_escaping( $input, $output ) {
		return $this->assertEquals( $output, do_shortcode( $input ) );
	}

	function data_escaping() {
		return array(
			array(
				'<!--[if lt IE 7]>',
				'<!--[if lt IE 7]>',
			),
			array(
				'1 <a href="[test-shortcode-tag]"> 2 <a href="[test-shortcode-tag]" >',
				'1 <a href=""> 2 <a href="" >',
			),
			array(
				'1 <a noise="[test-shortcode-tag]"> 2 <a noise=" [test-shortcode-tag] " >',
				'1 <a noise="[test-shortcode-tag]"> 2 <a noise=" [test-shortcode-tag] " >',
			),
			array(
				'[gallery title="<div>hello</div>"]',
				'',
			),
			array(
				'[caption caption="test" width="2"]<div>hello</div>[/caption]',
				'<div style="width: 12px" class="wp-caption alignnone"><div>hello</div><p class="wp-caption-text">test</p></div>',
			),
			array(
				'<div [gallery]>',
				'<div >',
			),
			array(
				'<div [[gallery]]>',
				'<div [gallery]>',
			),
			array(
				'<[[gallery]]>',
				'<[gallery]>',
			),
			array(
				'<div style="background:url([[gallery]])">',
				'<div style="background:url([[gallery]])">',
			),
			array(
				'[gallery]<div>Hello</div>[/gallery]',
				'',
			),
			array(
				'[url]',
				'http://www.wordpress.org/',
			),
			array(
				'<a href="[url]">',
				'<a href="http://www.wordpress.org/">',
			),
			array(
				'<a href=[url] >',
				'<a href=http://www.wordpress.org/ >',
			),
			array(
				'<a href="[url]plugins/">',
				'<a href="http://www.wordpress.org/plugins/">',
			),
			array(
				'<a href="bad[url]">',
				'<a href="//www.wordpress.org/">',
			),
			array(
				'<a onclick="bad[url]">',
				'<a onclick="bad[url]">',
			),
		);
	}

	/**
	 * Check for bugginess using normal input with latest patches.
	 *
	 * @dataProvider data_escaping2
	 */
	function test_escaping2( $input, $output ) {
		return $this->assertEquals( $output, strip_shortcodes( $input ) );
	}

	function data_escaping2() {
		return array(
			array(
				'<!--[if lt IE 7]>',
				'<!--[if lt IE 7]>',
			),
			array(
				'[gallery title="<div>hello</div>"]',
				'',
			),
			array(
				'[caption caption="test" width="2"]<div>hello</div>[/caption]',
				'',
			),
			array(
				'<div [gallery]>', // Shortcodes will never be stripped inside elements.
				'<div [gallery]>',
			),
			array(
				'<div [[gallery]]>', // Shortcodes will never be stripped inside elements.
				'<div [[gallery]]>',
			),
			array(
				'<[[gallery]]>',
				'<[[gallery]]>',
			),
			array(
				'[gallery]<div>Hello</div>[/gallery]',
				'',
			),
		);
	}

	/**
	 * @ticket 26343
	 */
	function test_has_shortcode() {
		$content = 'This is a blob with [gallery] in it';
		$this->assertTrue( has_shortcode( $content, 'gallery' ) );

		add_shortcode( 'foo', '__return_false' );
		$content_nested = 'This is a blob with [foo] [gallery] [/foo] in it';
		$this->assertTrue( has_shortcode( $content_nested, 'gallery' ) );
		remove_shortcode( 'foo' );
	}

	/**
	 * Make sure invalid shortcode names are not allowed.
	 *
	 * @dataProvider data_registration_bad
	 * @expectedIncorrectUsage add_shortcode
	 */
	function test_registration_bad( $input, $expected ) {
		return $this->sub_registration( $input, $expected );
	}

	/**
	 * Make sure valid shortcode names are allowed.
	 *
	 * @dataProvider data_registration_good
	 */
	function test_registration_good( $input, $expected ) {
		return $this->sub_registration( $input, $expected );
	}

	function sub_registration( $input, $expected ) {
		add_shortcode( $input, '' );
		$actual = shortcode_exists( $input );
		$test = $this->assertEquals( $expected, $actual );
		if ( $actual ) remove_shortcode( $input );
		return $test;
	}

	function data_registration_bad() {
		return array(
			array(
				'<html>',
				false,
			),
			array(
				'[shortcode]',
				false,
			),
			array(
				'bad/',
				false,
			),
			array(
				'/bad',
				false,
			),
			array(
				'bad space',
				false,
			),
			array(
				'&amp;',
				false,
			),
			array(
				'',
				false,
			),
		);
	}

	function data_registration_good() {
		return array(
			array(
				'good!',
				true,
			),
			array(
				'plain',
				true,
			),
			array(
				'unreserved!#$%()*+,-.;?@^_{|}~chars',
				true,
			),
		);
	}

	/**
	 * Automated performance testing of the main regex.
	 *
	 * @dataProvider data_whole_posts
	 */
	function test_pcre_performance( $input ) {
		$regex = '/' . get_shortcode_regex() . '/';
		$result = benchmark_pcre_backtracking( $regex, $input, 'match_all' );
		return $this->assertLessThan( 200, $result );
	}

	function data_whole_posts() {
		require_once( DIR_TESTDATA . '/formatting/whole-posts.php' );
		return data_whole_posts();
	}

	function test_php_and_js_shortcode_attribute_regexes_match() {

		$file = file_get_contents( ABSPATH . WPINC . '/js/shortcode.js' );
		$matched = preg_match( '|\s+pattern = (\/.+\/)g;|', $file, $matches );
		$php = get_shortcode_atts_regex();

		$this->assertSame( 1, $matched );

		$js = str_replace( "\'", "'", $matches[1] );
		$this->assertSame( $php, $js );

	}

	/**
	 * @ticket 34939
	 *
	 * Test the (not recommended) [shortcode=XXX] format
	 */
	function test_unnamed_attribute() {
		$out = do_shortcode('[dumptag=https://wordpress.org/]');
		$expected = "0 = =https://wordpress.org\n";
		$this->assertEquals($expected, $out);
	}

	/**
	 * @ticket 36306
	 */
	function test_smilies_arent_converted() {
		$out = apply_filters( 'the_content', '[img alt="Hello :-) World"]' );
		$expected = "<img alt=\"Hello :-) World\" />\n";
		$this->assertEquals( $expected, $out );
	}

	/**
	 * @ticket 37906
	 */
	public function test_pre_do_shortcode_tag() {
		// does nothing if no filters are set up
		$str = 'pre_do_shortcode_tag';
		add_shortcode( $str, array( $this, '_shortcode_pre_do_shortcode_tag' ) );
		$result_nofilter = do_shortcode( "[{$str}]" );
		$this->assertSame( 'foo', $result_nofilter );

		// short-circuit with filter
		add_filter( 'pre_do_shortcode_tag', array( $this, '_filter_pre_do_shortcode_tag_bar' ) );
		$result_filter = do_shortcode( "[{$str}]" );
		$this->assertSame( 'bar', $result_filter );

		// respect priority
		add_filter( 'pre_do_shortcode_tag', array( $this, '_filter_pre_do_shortcode_tag_p11' ), 11 );
		$result_priority = do_shortcode( "[{$str}]" );
		$this->assertSame( 'p11', $result_priority );

		// pass arguments
		$arr = array(
			'return'	=> 'p11',
			'key'			=> $str,
			'atts' 		=> array( 'a'=>'b', 'c'=>'d' ),
			'm'				=> array(
				"[{$str} a='b' c='d']",
				"",
				$str,
				" a='b' c='d'",
				"",
				"",
				"",
			),
		);
		add_filter( 'pre_do_shortcode_tag', array( $this, '_filter_pre_do_shortcode_tag_attr' ), 12, 4 );
		$result_atts = do_shortcode( "[{$str} a='b' c='d']" );
		$this->assertSame( wp_json_encode( $arr ), $result_atts );

		remove_filter( 'pre_do_shortcode_tag', array( $this, '_filter_pre_do_shortcode_tag_attr' ), 12, 4 );
		remove_filter( 'pre_do_shortcode_tag', array( $this, '_filter_pre_do_shortcode_tag_p11' ), 11 );
		remove_filter( 'pre_do_shortcode_tag', array( $this, '_filter_pre_do_shortcode_tag_bar' ) );
		remove_shortcode( $str );
	}

	public function _shortcode_pre_do_shortcode_tag( $atts = array(), $content = '' ) {
		return 'foo';
	}

	public function _filter_pre_do_shortcode_tag_bar() {
		return 'bar';
	}

	public function _filter_pre_do_shortcode_tag_p11() {
		return 'p11';
	}

	public function _filter_pre_do_shortcode_tag_attr( $return, $key, $atts, $m ){
		$arr = array(
			'return' => $return,
			'key'    => $key,
			'atts'   => $atts,
			'm'      => $m,
		);
		return wp_json_encode( $arr );
	}

	/**
	 * @ticket 32790
	 */
	public function test_do_shortcode_tag_filter() {
		// does nothing if no filters are set up
		$str = 'do_shortcode_tag';
		add_shortcode( $str, array( $this, '_shortcode_do_shortcode_tag' ) );
		$result_nofilter = do_shortcode( "[{$str}]" );
		$this->assertSame( 'foo', $result_nofilter );

		// modify output with filter
		add_filter( 'do_shortcode_tag', array( $this, '_filter_do_shortcode_tag_replace' ) );
		$result_filter = do_shortcode( "[{$str}]" );
		$this->assertSame( 'fee', $result_filter );

		// respect priority
		add_filter( 'do_shortcode_tag', array( $this, '_filter_do_shortcode_tag_generate' ), 11 );
		$result_priority = do_shortcode( "[{$str}]" );
		$this->assertSame( 'foobar', $result_priority );

		// pass arguments
		$arr = array(
			'return' => 'foobar',
			'key'    => $str,
			'atts'   => array( 'a' => 'b', 'c' => 'd' ),
			'm'      => array(
				"[{$str} a='b' c='d']",
				"",
				$str,
				" a='b' c='d'",
				"",
				"",
				"",
			),
		);
		add_filter( 'do_shortcode_tag', array( $this, '_filter_do_shortcode_tag_attr' ), 12, 4 );
		$result_atts = do_shortcode( "[{$str} a='b' c='d']" );
		$this->assertSame( wp_json_encode( $arr ), $result_atts );

		remove_filter( 'do_shortcode_tag', array( $this, '_filter_do_shortcode_tag_attr' ), 12 );
		remove_filter( 'do_shortcode_tag', array( $this, '_filter_do_shortcode_tag_generate' ), 11 );
		remove_filter( 'do_shortcode_tag', array( $this, '_filter_do_shortcode_tag_replace' ) );
		remove_shortcode( $str );
	}

	public function _shortcode_do_shortcode_tag( $atts = array(), $content = '' ) {
		return 'foo';
	}

	public function _filter_do_shortcode_tag_replace( $return ) {
		return str_replace( 'oo', 'ee', $return );
	}

	public function _filter_do_shortcode_tag_generate( $return ) {
		return 'foobar';
	}

	public function _filter_do_shortcode_tag_attr( $return, $key, $atts, $m ){
		$arr = array(
			'return' => $return,
			'key'    => $key,
			'atts'   => $atts,
			'm'      => $m,
		);
		return wp_json_encode( $arr );
	}
}
