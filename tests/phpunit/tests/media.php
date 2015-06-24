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
		$this->img_dimensions = array( 'width' => 100, 'height' => 100 );
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
		$this->assertEquals( 1, preg_match_all( '/id="&quot;myId"/', $result, $_r ) );
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
			wp_update_attachment_metadata( $attachment_id, $this->img_dimensions );
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
			wp_update_attachment_metadata( $attachment_id, $this->img_dimensions );
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
			wp_update_attachment_metadata( $attachment_id, $this->img_dimensions );
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
			wp_update_attachment_metadata( $attachment_id, $this->img_dimensions );
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

}
