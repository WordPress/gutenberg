<?php

/**
 * @group media
 * @group shortcode
 */
class Tests_Media extends WP_UnitTestCase {

	function setUp() {
		parent::setUp();
		$this->caption = 'A simple caption.';
		$this->html_content = <<<CAP
A <strong class='classy'>bolded</strong> <em>caption</em> with a <a href="#">link</a>.
CAP;
		$this->img_content = <<<CAP
<img src="pic.jpg" id='anId' alt="pic"/>
CAP;
		$this->img_name = 'image.jpg';
		$this->img_url = 'http://' . WP_TESTS_DOMAIN . '/wp-content/uploads/' . $this->img_name;
		$this->img_html = '<img src="' . $this->img_url . '"/>';
		$this->img_meta = array( 'width' => 100, 'height' => 100, 'sizes' => '' );
	}

	function test_img_caption_shortcode_added() {
		global $shortcode_tags;
		$this->assertEquals( 'img_caption_shortcode', $shortcode_tags['caption'] );
		$this->assertEquals( 'img_caption_shortcode', $shortcode_tags['wp_caption'] );
	}

	function test_img_caption_shortcode_with_empty_params() {
		$result = img_caption_shortcode( array() );
		$this->assertNull( $result );
	}

	function test_img_caption_shortcode_with_bad_attr() {
		$result = img_caption_shortcode( array(), 'content' );
		$this->assertEquals( 'content', 'content' );
	}

	function test_img_caption_shortcode_with_old_format() {
		$result = img_caption_shortcode(
			array( 'width' => 20, 'caption' => $this->caption )
		);
		$this->assertEquals( 2, preg_match_all( '/wp-caption/', $result, $_r ) );
		$this->assertEquals( 1, preg_match_all( '/alignnone/', $result, $_r ) );
		$this->assertEquals( 1, preg_match_all( "/{$this->caption}/", $result, $_r ) );
		$this->assertEquals( 1, preg_match_all( "/width: 30/", $result, $_r ) );
	}

	function test_img_caption_shortcode_with_old_format_id_and_align() {
		$result = img_caption_shortcode(
			array(
				'width' => 20,
				'caption' => $this->caption,
				'id' => '"myId',
				'align' => '&myAlignment'
			)
		);
		$this->assertEquals( 1, preg_match_all( '/wp-caption &amp;myAlignment/', $result, $_r ) );
		$this->assertEquals( 1, preg_match_all( '/id="myId"/', $result, $_r ) );
		$this->assertEquals( 1, preg_match_all( "/{$this->caption}/", $result, $_r ) );
	}

	function test_new_img_caption_shortcode_with_html_caption() {
		$result = img_caption_shortcode(
			array( 'width' => 20, 'caption' => $this->html_content )
		);
		$our_preg = preg_quote( $this->html_content );

		$this->assertEquals( 1, preg_match_all( "~{$our_preg}~", $result, $_r ) );
	}

	function test_new_img_caption_shortcode_new_format() {
		$result = img_caption_shortcode(
			array( 'width' => 20 ),
			$this->img_content . $this->html_content
		);
		$img_preg = preg_quote( $this->img_content );
		$content_preg = preg_quote( $this->html_content );

		$this->assertEquals( 1, preg_match_all( "~{$img_preg}.*wp-caption-text~", $result, $_r ) );
		$this->assertEquals( 1, preg_match_all( "~wp-caption-text.*{$content_preg}~", $result, $_r ) );
	}

	function test_new_img_caption_shortcode_new_format_and_linked_image() {
		$linked_image = "<a href='#'>{$this->img_content}</a>";
		$result = img_caption_shortcode(
			array( 'width' => 20 ),
			$linked_image . $this->html_content
		);
		$img_preg = preg_quote( $linked_image );
		$content_preg = preg_quote( $this->html_content );

		$this->assertEquals( 1, preg_match_all( "~{$img_preg}.*wp-caption-text~", $result, $_r ) );
		$this->assertEquals( 1, preg_match_all( "~wp-caption-text.*{$content_preg}~", $result, $_r ) );
	}

	function test_new_img_caption_shortcode_new_format_and_linked_image_with_newline() {
		$linked_image = "<a href='#'>{$this->img_content}</a>";
		$result = img_caption_shortcode(
			array( 'width' => 20 ),
			$linked_image . "\n\n" . $this->html_content
		);
		$img_preg = preg_quote( $linked_image );
		$content_preg = preg_quote( $this->html_content );

		$this->assertEquals( 1, preg_match_all( "~{$img_preg}.*wp-caption-text~", $result, $_r ) );
		$this->assertEquals( 1, preg_match_all( "~wp-caption-text.*{$content_preg}~", $result, $_r ) );
	}

	function test_add_remove_oembed_provider() {
		wp_oembed_add_provider( 'http://foo.bar/*', 'http://foo.bar/oembed' );
		$this->assertTrue( wp_oembed_remove_provider( 'http://foo.bar/*' ) );
		$this->assertFalse( wp_oembed_remove_provider( 'http://foo.bar/*' ) );
	}

	/**
	 * Test secure youtube.com embeds
	 *
	 * @ticket 23149
	 */
	function test_youtube_com_secure_embed() {
		$out = wp_oembed_get( 'http://www.youtube.com/watch?v=oHg5SJYRHA0' );
		$this->assertContains( 'https://www.youtube.com/embed/oHg5SJYRHA0?feature=oembed', $out );

		$out = wp_oembed_get( 'https://www.youtube.com/watch?v=oHg5SJYRHA0' );
		$this->assertContains( 'https://www.youtube.com/embed/oHg5SJYRHA0?feature=oembed', $out );

		$out = wp_oembed_get( 'https://youtu.be/zHjMoNQN7s0' );
		$this->assertContains( 'https://www.youtube.com/embed/zHjMoNQN7s0?feature=oembed', $out );
	}

	/**
	 * Test m.youtube.com embeds
	 *
	 * @ticket 32714
	 */
	function test_youtube_com_mobile_embed() {
		$out = wp_oembed_get( 'http://m.youtube.com/watch?v=oHg5SJYRHA0' );
		$this->assertContains( 'https://www.youtube.com/embed/oHg5SJYRHA0?feature=oembed', $out );

		$out = wp_oembed_get( 'https://m.youtube.com/watch?v=oHg5SJYRHA0' );
		$this->assertContains( 'https://www.youtube.com/embed/oHg5SJYRHA0?feature=oembed', $out );
	}

	function test_youtube_embed_url() {
		global $wp_embed;
		$out = $wp_embed->autoembed( 'https://www.youtube.com/embed/QcIy9NiNbmo' );
		$this->assertContains( 'https://youtube.com/watch?v=QcIy9NiNbmo', $out );
	}

	function test_youtube_v_url() {
		global $wp_embed;
		$out = $wp_embed->autoembed( 'https://www.youtube.com/v/QcIy9NiNbmo' );
		$this->assertContains( 'https://youtube.com/watch?v=QcIy9NiNbmo', $out );
	}

	/**
	 * @ticket 23776
	 */
	function test_autoembed_empty() {
		global $wp_embed;

		$content = '';

		$result = $wp_embed->autoembed( $content );
		$this->assertEquals( $content, $result );
	}

	/**
	 * @ticket 23776
	 */
	function test_autoembed_no_paragraphs_around_urls() {
		global $wp_embed;

		$content = <<<EOF
$ my command
First line.

http://example.com/1/
http://example.com/2/
Last line.

<pre>http://some.link/
http://some.other.link/</pre>
EOF;

		$result = $wp_embed->autoembed( $content );
		$this->assertEquals( $content, $result );
	}

	function test_wp_prepare_attachment_for_js() {
		// Attachment without media
		$id = wp_insert_attachment(array(
			'post_status' => 'publish',
			'post_title' => 'Prepare',
			'post_content_filtered' => 'Prepare',
			'post_type' => 'post'
		));
		$post = get_post( $id );

		$prepped = wp_prepare_attachment_for_js( $post );
		$this->assertInternalType( 'array', $prepped );
		$this->assertEquals( 0, $prepped['uploadedTo'] );
		$this->assertEquals( '', $prepped['mime'] );
		$this->assertEquals( '', $prepped['type'] );
		$this->assertEquals( '', $prepped['subtype'] );
		// #21963, there will be a guid always, so there will be a URL
		$this->assertNotEquals( '', $prepped['url'] );
		$this->assertEquals( site_url( 'wp-includes/images/media/default.png' ), $prepped['icon'] );

		// Fake a mime
		$post->post_mime_type = 'image/jpeg';
		$prepped = wp_prepare_attachment_for_js( $post );
		$this->assertEquals( 'image/jpeg', $prepped['mime'] );
		$this->assertEquals( 'image', $prepped['type'] );
		$this->assertEquals( 'jpeg', $prepped['subtype'] );

		// Fake a mime without a slash. See #WP22532
		$post->post_mime_type = 'image';
		$prepped = wp_prepare_attachment_for_js( $post );
		$this->assertEquals( 'image', $prepped['mime'] );
		$this->assertEquals( 'image', $prepped['type'] );
		$this->assertEquals( '', $prepped['subtype'] );
	}

	/**
	 * @ticket 19067
	 * @expectedDeprecated wp_convert_bytes_to_hr
	 */
	function test_wp_convert_bytes_to_hr() {
		$kb = 1024;
		$mb = $kb * 1024;
		$gb = $mb * 1024;
		$tb = $gb * 1024;

		// test if boundaries are correct
		$this->assertEquals( '1TB', wp_convert_bytes_to_hr( $tb ) );
		$this->assertEquals( '1GB', wp_convert_bytes_to_hr( $gb ) );
		$this->assertEquals( '1MB', wp_convert_bytes_to_hr( $mb ) );
		$this->assertEquals( '1kB', wp_convert_bytes_to_hr( $kb ) );

		$this->assertEquals( '1 TB', size_format( $tb ) );
		$this->assertEquals( '1 GB', size_format( $gb ) );
		$this->assertEquals( '1 MB', size_format( $mb ) );
		$this->assertEquals( '1 kB', size_format( $kb ) );

		// now some values around
		$hr = wp_convert_bytes_to_hr( $tb + $tb / 2 + $mb );
		$this->assertTrue( abs( 1.50000095367 - (float) str_replace( ',', '.', $hr ) ) < 0.0001 );

		$hr = wp_convert_bytes_to_hr( $tb - $mb - $kb );
		$this->assertTrue( abs( 1023.99902248 - (float) str_replace( ',', '.', $hr ) ) < 0.0001 );

		$hr = wp_convert_bytes_to_hr( $gb + $gb / 2 + $mb );
		$this->assertTrue( abs( 1.5009765625 - (float) str_replace( ',', '.', $hr ) ) < 0.0001 );

		$hr = wp_convert_bytes_to_hr( $gb - $mb - $kb );
		$this->assertTrue( abs( 1022.99902344 - (float) str_replace( ',', '.', $hr ) ) < 0.0001 );

		// edge
		$this->assertEquals( '-1B', wp_convert_bytes_to_hr( -1 ) );
		$this->assertEquals( '0B', wp_convert_bytes_to_hr( 0 ) );
	}

	/**
	 * @ticket 22960
	 */
	function test_get_attached_images() {
		$post_id = $this->factory->post->create();
		$attachment_id = $this->factory->attachment->create_object( $this->img_name, $post_id, array(
			'post_mime_type' => 'image/jpeg',
			'post_type' => 'attachment'
		) );

		$images = get_attached_media( 'image', $post_id );
		$this->assertEquals( $images, array( $attachment_id => get_post( $attachment_id ) ) );
	}

	/**
	 * @ticket 22960
	 */
	function test_post_galleries_images() {
		$ids1 = array();
		$ids1_srcs = array();
		foreach ( range( 1, 3 ) as $i ) {
			$attachment_id = $this->factory->attachment->create_object( "image$i.jpg", 0, array(
				'post_mime_type' => 'image/jpeg',
				'post_type' => 'attachment'
			) );
			$metadata = array_merge( array( "file" => "image$i.jpg" ), $this->img_meta );
			wp_update_attachment_metadata( $attachment_id, $metadata );
			$ids1[] = $attachment_id;
			$ids1_srcs[] = 'http://' . WP_TESTS_DOMAIN . '/wp-content/uploads/' . "image$i.jpg";
		}

		$ids2 = array();
		$ids2_srcs = array();
		foreach ( range( 4, 6 ) as $i ) {
			$attachment_id = $this->factory->attachment->create_object( "image$i.jpg", 0, array(
				'post_mime_type' => 'image/jpeg',
				'post_type' => 'attachment'
			) );
			$metadata = array_merge( array( "file" => "image$i.jpg" ), $this->img_meta );
			wp_update_attachment_metadata( $attachment_id, $metadata );
			$ids2[] = $attachment_id;
			$ids2_srcs[] = 'http://' . WP_TESTS_DOMAIN . '/wp-content/uploads/' . "image$i.jpg";
		}

		$ids1_joined = join( ',', $ids1 );
		$ids2_joined = join( ',', $ids2 );

		$blob =<<<BLOB
[gallery ids="$ids1_joined"]

[gallery ids="$ids2_joined"]
BLOB;
		$post_id = $this->factory->post->create( array( 'post_content' => $blob ) );
		$srcs = get_post_galleries_images( $post_id );
		$this->assertEquals( $srcs, array( $ids1_srcs, $ids2_srcs ) );
	}

	/**
	 * @ticket 22960
	 */
	function test_post_gallery_images() {
		$ids1 = array();
		$ids1_srcs = array();
		foreach ( range( 1, 3 ) as $i ) {
			$attachment_id = $this->factory->attachment->create_object( "image$i.jpg", 0, array(
				'post_mime_type' => 'image/jpeg',
				'post_type' => 'attachment'
			) );
			$metadata = array_merge( array( "file" => "image$i.jpg" ), $this->img_meta );
			wp_update_attachment_metadata( $attachment_id, $metadata );
			$ids1[] = $attachment_id;
			$ids1_srcs[] = 'http://' . WP_TESTS_DOMAIN . '/wp-content/uploads/' . "image$i.jpg";
		}

		$ids2 = array();
		$ids2_srcs = array();
		foreach ( range( 4, 6 ) as $i ) {
			$attachment_id = $this->factory->attachment->create_object( "image$i.jpg", 0, array(
				'post_mime_type' => 'image/jpeg',
				'post_type' => 'attachment'
			) );
			$metadata = array_merge( array( "file" => "image$i.jpg" ), $this->img_meta );
			wp_update_attachment_metadata( $attachment_id, $metadata );
			$ids2[] = $attachment_id;
			$ids2_srcs[] = 'http://' . WP_TESTS_DOMAIN . '/wp-content/uploads/' . "image$i.jpg";
		}

		$ids1_joined = join( ',', $ids1 );
		$ids2_joined = join( ',', $ids2 );

		$blob =<<<BLOB
[gallery ids="$ids1_joined"]

[gallery ids="$ids2_joined"]
BLOB;
		$post_id = $this->factory->post->create( array( 'post_content' => $blob ) );
		$srcs = get_post_gallery_images( $post_id );
		$this->assertEquals( $srcs, $ids1_srcs );
	}

	function test_get_media_embedded_in_content() {
		$object =<<<OBJ
<object src="this" data="that">
	<param name="value"/>
</object>
OBJ;
		$embed =<<<EMBED
<embed src="something.mp4"/>
EMBED;
		$iframe =<<<IFRAME
<iframe src="youtube.com" width="7000" />
IFRAME;
		$audio =<<<AUDIO
<audio preload="none">
	<source />
</audio>
AUDIO;
		$video =<<<VIDEO
<video preload="none">
	<source />
</video>
VIDEO;

		$content =<<<CONTENT
This is a comment
$object

This is a comment
$embed

This is a comment
$iframe

This is a comment
$audio

This is a comment
$video

This is a comment
CONTENT;

		$types = array( 'object', 'embed', 'iframe', 'audio', 'video' );
		$contents = array_values( compact( $types ) );

		$matches = get_media_embedded_in_content( $content, 'audio' );
		$this->assertEquals( array( $audio ), $matches );

		$matches = get_media_embedded_in_content( $content, 'video' );
		$this->assertEquals( array( $video ), $matches );

		$matches = get_media_embedded_in_content( $content, 'object' );
		$this->assertEquals( array( $object ), $matches );

		$matches = get_media_embedded_in_content( $content, 'embed' );
		$this->assertEquals( array( $embed ), $matches );

		$matches = get_media_embedded_in_content( $content, 'iframe' );
		$this->assertEquals( array( $iframe ), $matches );

		$matches = get_media_embedded_in_content( $content, $types );
		$this->assertEquals( $contents, $matches );
	}

	function test_get_media_embedded_in_content_order() {
		$audio =<<<AUDIO
<audio preload="none">
	<source />
</audio>
AUDIO;
		$video =<<<VIDEO
<video preload="none">
	<source />
</video>
VIDEO;
		$content = $audio . $video;

		$matches1 = get_media_embedded_in_content( $content, array( 'audio', 'video' ) );
		$this->assertEquals( array( $audio, $video ), $matches1 );

		$reversed = $video . $audio;
		$matches2 = get_media_embedded_in_content( $reversed, array( 'audio', 'video' ) );
		$this->assertEquals( array( $video, $audio ), $matches2 );
	}

	/**
	 * Test [video] shortcode processing
	 *
	 */
	function test_video_shortcode_body() {
		$width = 720;
		$height = 480;

		$post_id = get_post() ? get_the_ID() : 0;

		$video =<<<VIDEO
[video width="720" height="480" mp4="http://domain.tld/wp-content/uploads/2013/12/xyz.mp4"]
<!-- WebM/VP8 for Firefox4, Opera, and Chrome -->
<source type="video/webm" src="myvideo.webm" />
<!-- Ogg/Vorbis for older Firefox and Opera versions -->
<source type="video/ogg" src="myvideo.ogv" />
<!-- Optional: Add subtitles for each language -->
<track kind="subtitles" src="subtitles.srt" srclang="en" />
<!-- Optional: Add chapters -->
<track kind="chapters" src="chapters.srt" srclang="en" />
[/video]
VIDEO;

		$w = empty( $GLOBALS['content_width'] ) ? 640 : $GLOBALS['content_width'];
		$h = ceil( ( $height * $w ) / $width );

		$content = apply_filters( 'the_content', $video );

		$expected = '<div style="width: ' . $w . 'px; " class="wp-video">' .
			"<!--[if lt IE 9]><script>document.createElement('video');</script><![endif]-->\n" .
			'<video class="wp-video-shortcode" id="video-' . $post_id . '-1" width="' . $w . '" height="' . $h . '" preload="metadata" controls="controls">' .
			'<source type="video/mp4" src="http://domain.tld/wp-content/uploads/2013/12/xyz.mp4?_=1" />' .
			'<!-- WebM/VP8 for Firefox4, Opera, and Chrome --><source type="video/webm" src="myvideo.webm" />' .
			'<!-- Ogg/Vorbis for older Firefox and Opera versions --><source type="video/ogg" src="myvideo.ogv" />' .
			'<!-- Optional: Add subtitles for each language --><track kind="subtitles" src="subtitles.srt" srclang="en" />' .
			'<!-- Optional: Add chapters --><track kind="chapters" src="chapters.srt" srclang="en" />' .
			'<a href="http://domain.tld/wp-content/uploads/2013/12/xyz.mp4">' .
			"http://domain.tld/wp-content/uploads/2013/12/xyz.mp4</a></video></div>\n";

		$this->assertEquals( $expected, $content );
	}

	/**
	 * @ticket 26768
	 */
	function test_add_image_size() {
		global $_wp_additional_image_sizes;

		if ( ! isset( $_wp_additional_image_sizes ) ) {
			$_wp_additional_image_sizes = array();
		}

		$this->assertArrayNotHasKey( 'test-size', $_wp_additional_image_sizes );
		add_image_size( 'test-size', 200, 600 );
		$this->assertArrayHasKey( 'test-size', $_wp_additional_image_sizes );
		$this->assertEquals( 200, $_wp_additional_image_sizes['test-size']['width'] );
		$this->assertEquals( 600, $_wp_additional_image_sizes['test-size']['height'] );

		// Clean up
		remove_image_size( 'test-size' );
	}

	/**
	 * @ticket 26768
	 */
	function test_remove_image_size() {
		add_image_size( 'test-size', 200, 600 );
		$this->assertTrue( has_image_size( 'test-size' ) );
		remove_image_size( 'test-size' );
		$this->assertFalse( has_image_size( 'test-size' ) );
	}

	/**
	 * @ticket 26951
	 */
	function test_has_image_size() {
		add_image_size( 'test-size', 200, 600 );
		$this->assertTrue( has_image_size( 'test-size' ) );

		// Clean up
		remove_image_size( 'test-size' );
	}

	/**
	 * @ticket 30346
	 */
	function test_attachment_url_to_postid() {
		$image_path = '2014/11/' . $this->img_name;
		$attachment_id = $this->factory->attachment->create_object( $image_path, 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_type'      => 'attachment',
		) );

		$image_url  = 'http://' . WP_TESTS_DOMAIN . '/wp-content/uploads/' . $image_path;
		$this->assertEquals( $attachment_id, attachment_url_to_postid( $image_url ) );
	}

	function test_attachment_url_to_postid_schemes() {
		$image_path = '2014/11/' . $this->img_name;
		$attachment_id = $this->factory->attachment->create_object( $image_path, 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_type'      => 'attachment',
		) );

		/**
		 * @ticket 33109 Testing protocols not matching
		 */
		$image_url  = 'https://' . WP_TESTS_DOMAIN . '/wp-content/uploads/' . $image_path;
		$this->assertEquals( $attachment_id, attachment_url_to_postid( $image_url ) );
	}

	function test_attachment_url_to_postid_filtered() {
		$image_path = '2014/11/' . $this->img_name;
		$attachment_id = $this->factory->attachment->create_object( $image_path, 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_type'      => 'attachment',
		) );

		add_filter( 'upload_dir', array( $this, '_upload_dir' ) );
		$image_url = 'http://192.168.1.20.com/wp-content/uploads/' . $image_path;
		$this->assertEquals( $attachment_id, attachment_url_to_postid( $image_url ) );
		remove_filter( 'upload_dir', array( $this, '_upload_dir' ) );
	}

	function _upload_dir( $dir ) {
		$dir['baseurl'] = 'http://192.168.1.20.com/wp-content/uploads';
		return $dir;
	}

	/**
	 * @ticket 31044
	 */
	function test_attachment_url_to_postid_with_empty_url() {
		$post_id = attachment_url_to_postid( '' );
		$this->assertInternalType( 'int', $post_id );
		$this->assertEquals( 0, $post_id );
	}

	/**
	 * @ticket 22768
	 */
	public function test_media_handle_upload_sets_post_excerpt() {
		$iptc_file = DIR_TESTDATA . '/images/test-image-iptc.jpg';

		// Make a copy of this file as it gets moved during the file upload
		$tmp_name = wp_tempnam( $iptc_file );

		copy( $iptc_file, $tmp_name );

		$_FILES['upload'] = array(
			'tmp_name' => $tmp_name,
			'name'     => 'test-image-iptc.jpg',
			'type'     => 'image/jpeg',
			'error'    => 0,
			'size'     => filesize( $iptc_file )
		);

		$post_id = media_handle_upload( 'upload', 0, array(), array( 'action' => 'test_iptc_upload', 'test_form' => false ) );

		unset( $_FILES['upload'] );

		$post = get_post( $post_id );

		// Clean up.
		wp_delete_attachment( $post_id );

		$this->assertEquals( 'This is a comment. / Это комментарий. / Βλέπετε ένα σχόλιο.', $post->post_excerpt );
	}

	/**
	 * @ticket 33016
	 */
	function test_multiline_cdata() {
		global $wp_embed;

		$content = <<<EOF
<script>// <![CDATA[
_my_function('data');
// ]]>
</script>
EOF;

		$result = $wp_embed->autoembed( $content );
		$this->assertEquals( $content, $result );
	}

	/**
	 * @ticket 33016
	 */
	function test_multiline_comment() {
		global $wp_embed;

		$content = <<<EOF
<script><!--
my_function();
// --> </script>
EOF;

		$result = $wp_embed->autoembed( $content );
		$this->assertEquals( $content, $result );
	}


	/**
	 * @ticket 33016
	 */
	function test_multiline_comment_with_embeds() {
		$content = <<<EOF
Start.
[embed]http://www.youtube.com/embed/TEST01YRHA0[/embed]
<script><!--
my_function();
// --> </script>
http://www.youtube.com/embed/TEST02YRHA0
[embed]http://www.example.com/embed/TEST03YRHA0[/embed]
http://www.example.com/embed/TEST04YRHA0
Stop.
EOF;

		$expected = <<<EOF
<p>Start.<br />
https://youtube.com/watch?v=TEST01YRHA0<br />
<script><!--
my_function();
// --> </script><br />
https://youtube.com/watch?v=TEST02YRHA0<br />
<a href="http://www.example.com/embed/TEST03YRHA0">http://www.example.com/embed/TEST03YRHA0</a><br />
http://www.example.com/embed/TEST04YRHA0<br />
Stop.</p>

EOF;

		$result = apply_filters( 'the_content', $content );
		$this->assertEquals( $expected, $result );
	}

	/**
	 * @ticket 33016
	 */
	function filter_wp_embed_shortcode_custom( $content, $url ) {
		if ( 'https://www.example.com/?video=1' == $url ) {
			$content = '@embed URL was replaced@';
		}
		return $content;
	}

	/**
	 * @ticket 33016
	 */
	function test_oembed_explicit_media_link() {
		global $wp_embed;
		add_filter( 'embed_maybe_make_link', array( $this, 'filter_wp_embed_shortcode_custom' ), 10, 2 );

		$content = <<<EOF
https://www.example.com/?video=1
EOF;

		$expected = <<<EOF
@embed URL was replaced@
EOF;

		$result = $wp_embed->autoembed( $content );
		$this->assertEquals( $expected, $result );

		$content = <<<EOF
<a href="https://www.example.com/?video=1">https://www.example.com/?video=1</a>
<script>// <![CDATA[
_my_function('data');
myvar = 'Hello world
https://www.example.com/?video=1
do not break this';
// ]]>
</script>
EOF;

		$result = $wp_embed->autoembed( $content );
		$this->assertEquals( $content, $result );

		remove_filter( 'embed_maybe_make_link', array( $this, 'filter_wp_embed_shortcode_custom' ), 10 );
	}

	/**
	 * @ticket 33878
	 */
	function test_wp_get_attachment_image_url() {
		$this->assertFalse( wp_get_attachment_image_url( 0 ) );

		$post_id = $this->factory->post->create();
		$attachment_id = $this->factory->attachment->create_object( $this->img_name, $post_id, array(
			'post_mime_type' => 'image/jpeg',
			'post_type' => 'attachment',
		) );

		$image = wp_get_attachment_image_src( $attachment_id, 'thumbnail', false );

		$this->assertEquals( $image[0], wp_get_attachment_image_url( $attachment_id ) );
	}

	/**
	 * @ticket 33641
	 */
	function test_wp_get_attachment_image_srcset_array() {
		$filename = DIR_TESTDATA . '/images/test-image-large.png';
		$id = $this->factory->attachment->create_upload_object( $filename );

		$year_month = date('Y/m');
		$image = wp_get_attachment_metadata( $id );

		$expected = array(
			array(
				'url'        => 'http://example.org/wp-content/uploads/' . $year_month . '/' . $image['sizes']['medium']['file'],
				'descriptor' => 'w',
				'value'      => $image['sizes']['medium']['width'],
			),
			array(
				'url'        => 'http://example.org/wp-content/uploads/' . $year_month . '/' . $image['sizes']['large']['file'],
				'descriptor' => 'w',
				'value'      => $image['sizes']['large']['width'],
			),
			array(
				'url'        => 'http://example.org/wp-content/uploads/' . $image['file'],
				'descriptor' => 'w',
				'value'      => $image['width'],
			),
		);

		// Set up test cases for all expected size names and a random one.
		$sizes = array( 'medium', 'large', 'full', 'yoav' );

		foreach ( $sizes as $size ) {
			$this->assertSame( $expected, wp_get_attachment_image_srcset_array( $id, $size ) );
		}
	}

	/**
	 * @ticket 33641
	 */
	function test_wp_get_attachment_image_srcset_array_no_date_upoads() {
		// Save the current setting for uploads folders
		$uploads_use_yearmonth_folders = get_option( 'uploads_use_yearmonth_folders' );

		// Disable date organized uploads
		update_option( 'uploads_use_yearmonth_folders', 0 );

		// Make an image.
		$filename = DIR_TESTDATA . '/images/test-image-large.png';
		$id = $this->factory->attachment->create_upload_object( $filename );

		$image = wp_get_attachment_metadata( $id );

		$expected = array(
			array(
				'url'        => 'http://example.org/wp-content/uploads/' . $image['sizes']['medium']['file'],
				'descriptor' => 'w',
				'value'      => $image['sizes']['medium']['width'],
			),
			array(
				'url'        => 'http://example.org/wp-content/uploads/' . $image['sizes']['large']['file'],
				'descriptor' => 'w',
				'value'      => $image['sizes']['large']['width'],
			),
			array(
				'url'        => 'http://example.org/wp-content/uploads/' . $image['file'],
				'descriptor' => 'w',
				'value'      => $image['width'],
			),
		);

		// Set up test cases for all expected size names and a random one.
		$sizes = array( 'medium', 'large', 'full', 'yoav' );

		foreach ( $sizes as $size ) {
			$this->assertSame( $expected, wp_get_attachment_image_srcset_array( $id, $size ) );
		}

		// Leave the uploads option the way you found it.
		update_option( 'uploads_use_yearmonth_folders', $uploads_use_yearmonth_folders );
	}

	/**
	 * @ticket 33641
	 */
	function test_wp_get_attachment_image_srcset_array_with_edits() {
		// Make an image.
		$filename = DIR_TESTDATA . '/images/test-image-large.png';
		$id = $this->factory->attachment->create_upload_object( $filename );
		// For this test we're going to mock metadata changes from an edit.
		// Start by getting the attachment metadata.
		$meta = wp_get_attachment_metadata( $id );

		// Copy hash generation method used in wp_save_image().
		$hash = 'e' . time() . rand(100, 999);

		// Replace file paths for full and medium sizes with hashed versions.
		$filename_base = basename( $meta['file'], '.png' );
		$meta['file'] = str_replace( $filename_base, $filename_base . '-' . $hash, $meta['file'] );
		$meta['sizes']['medium']['file'] = str_replace( $filename_base, $filename_base . '-' . $hash, $meta['sizes']['medium']['file'] );

		// Save edited metadata.
		wp_update_attachment_metadata( $id, $meta );

		// Get the edited image and observe that a hash was created.
		$img_url = wp_get_attachment_url( $id );

		// Calculate a srcset array.
		$sizes = wp_get_attachment_image_srcset_array( $id, 'medium' );

		// Test to confirm all sources in the array include the same edit hash.
		foreach ( $sizes as $size ) {
			$this->assertTrue( false !== strpos( $size['url'], $hash ) );
		}
	}

	/**
	 * @ticket 33641
	 */
	function test_wp_get_attachment_image_srcset_array_false() {
		// Make an image.
		$filename = DIR_TESTDATA . '/images/test-image-large.png';
		$id = $this->factory->attachment->create_upload_object( $filename );
		$sizes = wp_get_attachment_image_srcset_array( 99999, 'foo' );

		// For canola.jpg we should return
		$this->assertFalse( $sizes );
	}

	/**
	 * @ticket 33641
	 */
	function test_wp_get_attachment_image_srcset_array_no_width() {
		// Filter image_downsize() output.
		add_filter( 'wp_generate_attachment_metadata', array( $this, '_test_wp_get_attachment_image_srcset_array_no_width_filter' ) );

		// Make our attachment.
		$filename = DIR_TESTDATA . '/images/test-image-large.png';
		$id = $this->factory->attachment->create_upload_object( $filename );
		$srcset = wp_get_attachment_image_srcset_array( $id, 'medium' );

		// The srcset should be false.
		$this->assertFalse( $srcset );

		// Remove filter.
		remove_filter( 'wp_generate_attachment_metadata', array( $this, '_test_wp_get_attachment_image_srcset_array_no_width_filter' ) );
	}

	/**
	 * Helper function to filter image_downsize and return zero values for width and height.
	 */
	public function _test_wp_get_attachment_image_srcset_array_no_width_filter( $meta ) {
		$meta['sizes']['medium']['width'] = 0;
		$meta['sizes']['medium']['height'] = 0;
		return $meta;
	}

	/**
	 * @ticket 33641
	 */
	function test_wp_get_attachment_image_srcset() {
		// Make an image.
		$filename = DIR_TESTDATA . '/images/test-image-large.png';
		$id = $this->factory->attachment->create_upload_object( $filename );
		$sizes = wp_get_attachment_image_srcset( $id, 'full-size' );

		$image = wp_get_attachment_metadata( $id );
		$year_month = date('Y/m');

		$expected = 'http://example.org/wp-content/uploads/' . $year_month = date('Y/m') . '/'
			. $image['sizes']['medium']['file'] . ' ' . $image['sizes']['medium']['width'] . 'w, ';
		$expected .= 'http://example.org/wp-content/uploads/' . $year_month = date('Y/m') . '/'
			. $image['sizes']['large']['file'] . ' ' . $image['sizes']['large']['width'] . 'w, ';
		$expected .= 'http://example.org/wp-content/uploads/' . $image['file'] . ' ' . $image['width'] .'w';

		$this->assertSame( $expected, $sizes );
	}

	/**
	 * @ticket 33641
	 */
	function test_wp_get_attachment_image_srcset_single_srcset() {
		// Make an image.
		$filename = DIR_TESTDATA . '/images/test-image-large.png';
		$id = $this->factory->attachment->create_upload_object( $filename );
		/*
		 * In our tests, thumbnails will only return a single srcset candidate,
		 * so we shouldn't return a srcset value in order to avoid unneeded markup.
		 */
		$sizes = wp_get_attachment_image_srcset( $id, 'thumbnail' );

		$this->assertFalse( $sizes );
	}

	/**
	 * @ticket 33641
	 */
	function test_wp_get_attachment_image_sizes() {
		// Make an image.
		$filename = DIR_TESTDATA . '/images/test-image-large.png';
		$id = $this->factory->attachment->create_upload_object( $filename );


		global $content_width;

		// Test sizes against the default WP sizes.
		$intermediates = array('thumbnail', 'medium', 'large');

		foreach( $intermediates as $int ) {
			$width = get_option( $int . '_size_w' );

			// The sizes width gets constrained to $content_width by default.
			if ( $content_width > 0 ) {
				$width = ( $width > $content_width ) ? $content_width : $width;
			}

			$expected = '(max-width: ' . $width . 'px) 100vw, ' . $width . 'px';
			$sizes = wp_get_attachment_image_sizes( $id, $int );

			$this->assertSame($expected, $sizes);
		}
	}

	/**
	 * @ticket 33641
	 */
	function test_wp_get_attachment_image_sizes_with_args() {
		// Make an image.
		$filename = DIR_TESTDATA . '/images/test-image-large.png';
		$id = $this->factory->attachment->create_upload_object( $filename );


		$args = array(
			'sizes' => array(
				array(
					'size_value' 	=> '10em',
					'mq_value'		=> '60em',
					'mq_name'			=> 'min-width'
				),
				array(
					'size_value' 	=> '20em',
					'mq_value'		=> '30em',
					'mq_name'			=> 'min-width'
				),
				array(
					'size_value'	=> 'calc(100vm - 30px)'
				),
			)
		);

		$expected = '(min-width: 60em) 10em, (min-width: 30em) 20em, calc(100vm - 30px)';
		$sizes = wp_get_attachment_image_sizes( $id, 'medium', $args );

		$this->assertSame($expected, $sizes);
	}

	/**
	 * @ticket 33641
	 */
	function test_wp_get_attachment_image_sizes_with_filtered_args() {
		// Add our test filter.
		add_filter( 'wp_image_sizes_args', array( $this, '_test_wp_image_sizes_args' ) );

		// Make an image.
		$filename = DIR_TESTDATA . '/images/test-image-large.png';
		$id = $this->factory->attachment->create_upload_object( $filename );

		$sizes = wp_get_attachment_image_sizes($id, 'medium');

		// Evaluate that the sizes returned is what we expected.
		$this->assertSame( $sizes, '100vm');

		remove_filter( 'wp_image_sizes_args', array( $this, '_test_wp_image_sizes_args' ) );
	}

	/**
	 * A simple test filter for wp_get_attachment_image_sizes().
	 */
	function _test_wp_image_sizes_args( $args ) {
		$args['sizes'] = "100vm";
		return $args;
	}

	/**
	 * @ticket 33641
	 */
	function test_wp_make_content_images_responsive() {
		// Make an image.
		$filename = DIR_TESTDATA . '/images/test-image-large.png';
		$id = $this->factory->attachment->create_upload_object( $filename );

		$srcset = sprintf( 'srcset="%s"', wp_get_attachment_image_srcset( $id, 'medium' ) );
		$sizes = sprintf( 'sizes="%s"', wp_get_attachment_image_sizes( $id, 'medium' ) );

		// Function used to build HTML for the editor.
		$img = get_image_tag( $id, '', '', '', 'medium' );
		$img_no_size = str_replace( 'size-', '', $img );
		$img_no_size_id = str_replace( 'wp-image-', 'id-', $img_no_size );

		// Manually add srcset and sizes to the markup from get_image_tag();
		$respimg = preg_replace('|<img ([^>]+) />|', '<img $1 ' . $srcset . ' ' . $sizes . ' />', $img);
		$respimg_no_size = preg_replace('|<img ([^>]+) />|', '<img $1 ' . $srcset . ' ' . $sizes . ' />', $img_no_size);

		$content = '<p>Welcome to WordPress!  This post contains important information.  After you read it, you can make it private to hide it from visitors but still have the information handy for future reference.</p>
			<p>First things first:</p>

			%1$s

			<ul>
			<li><a href="http://wordpress.org" title="Subscribe to the WordPress mailing list for Release Notifications">Subscribe to the WordPress mailing list for release notifications</a></li>
			</ul>

			%2$s

			<p>As a subscriber, you will receive an email every time an update is available (and only then).  This will make it easier to keep your site up to date, and secure from evildoers.<br />
			When a new version is released, <a href="http://wordpress.org" title="If you are already logged in, this will take you directly to the Dashboard">log in to the Dashboard</a> and follow the instructions.<br />
			Upgrading is a couple of clicks!</p>

			%3$s

			<p>Then you can start enjoying the WordPress experience:</p>
			<ul>
			<li>Edit your personal information at <a href="http://wordpress.org" title="Edit settings like your password, your display name and your contact information">Users &#8250; Your Profile</a></li>
			<li>Start publishing at <a href="http://wordpress.org" title="Create a new post">Posts &#8250; Add New</a> and at <a href="http://wordpress.org" title="Create a new page">Pages &#8250; Add New</a></li>
			<li>Browse and install plugins at <a href="http://wordpress.org" title="Browse and install plugins at the official WordPress repository directly from your Dashboard">Plugins &#8250; Add New</a></li>
			<li>Browse and install themes at <a href="http://wordpress.org" title="Browse and install themes at the official WordPress repository directly from your Dashboard">Appearance &#8250; Add New Themes</a></li>
			<li>Modify and prettify your website&#8217;s links at <a href="http://wordpress.org" title="For example, select a link structure like: http://example.com/1999/12/post-name">Settings &#8250; Permalinks</a></li>
			<li>Import content from another system or WordPress site at <a href="http://wordpress.org" title="WordPress comes with importers for the most common publishing systems">Tools &#8250; Import</a></li>
			<li>Find answers to your questions at the <a href="http://wordpress.orgs" title="The official WordPress documentation, maintained by the WordPress community">WordPress Codex</a></li>
			</ul>';

		$content_unfiltered = sprintf( $content, $img, $img_no_size, $img_no_size_id );
		$content_filtered = sprintf( $content, $respimg, $respimg_no_size, $img_no_size_id );

		$this->assertSame( $content_filtered, wp_make_content_images_responsive( $content_unfiltered ) );
	}

	/**
	 * @ticket 33641
	 */
	function test_wp_make_content_images_responsive_with_preexisting_srcset() {
		// Make an image.
		$filename = DIR_TESTDATA . '/images/test-image-large.png';
		$id = $this->factory->attachment->create_upload_object( $filename );

		// Generate HTML and add a dummy srcset attribute.
		$image_html = get_image_tag( $id, '', '', '', 'medium' );
		$image_html = preg_replace('|<img ([^>]+) />|', '<img $1 ' . 'srcset="image2x.jpg 2x" />', $image_html );

		// The content filter should return the image unchanged.
		$this->assertSame( $image_html, wp_make_content_images_responsive( $image_html ) );
	}
}
