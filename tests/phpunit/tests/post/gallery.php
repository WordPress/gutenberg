<?php

/**
 * @group media
 * @group gallery
 * @ticket UT30
 */
class Tests_Post_Gallery extends WP_UnitTestCase { // _WPDataset1
	function setUp() {
		parent::setUp();
		global $wp_rewrite;
		$wp_rewrite->set_permalink_structure('/%year%/%monthnum%/%day%/%postname%/');
		$wp_rewrite->flush_rules();
	}

	function test_the_content() {
		// permalink page
		$link = '/2008/04/01/simple-gallery-test/';
		$this->go_to('/2008/04/01/simple-gallery-test/');
		the_post();
		// filtered output
		$out = get_echo('the_content');
		$this->assertNotEmpty($out, "Could not get the_content for $link.");

		$expected = <<<EOF
<p>There are ten images attached to this post.  Here&#8217;s a gallery:</p>

		<style type='text/css'>
			.gallery {
				margin: auto;
			}
			.gallery-item {
				float: left;
				margin-top: 10px;
				text-align: center;
				width: 33%;			}
			.gallery img {
				border: 2px solid #cfcfcf;
			}
			.gallery-caption {
				margin-left: 0;
			}
		</style>
		<!-- see gallery_shortcode() in wp-includes/media.php -->
		<div class='gallery'><dl class='gallery-item'>
			<dt class='gallery-icon'>
				<a href='http://example.com/2008/04/01/simple-gallery-test/dsc20040724_152504_53/' title='dsc20040724_152504_53'><img src="http://example.com/wp-content/uploads/2008/04/dsc20040724_152504_537.jpg" class="attachment-thumbnail" alt="" /></a>
			</dt></dl><dl class='gallery-item'>
			<dt class='gallery-icon'>
				<a href='http://example.com/2008/04/01/simple-gallery-test/canola/' title='canola'><img src="http://example.com/wp-content/uploads/2008/04/canola3.jpg" class="attachment-thumbnail" alt="" /></a>
			</dt></dl><dl class='gallery-item'>
			<dt class='gallery-icon'>
				<a href='http://example.com/2008/04/01/simple-gallery-test/dsc20050315_145007_13/' title='dsc20050315_145007_13'><img src="http://example.com/wp-content/uploads/2008/04/dsc20050315_145007_134.jpg" class="attachment-thumbnail" alt="" /></a>
			</dt></dl><br style="clear: both" /><dl class='gallery-item'>
			<dt class='gallery-icon'>
				<a href='http://example.com/2008/04/01/simple-gallery-test/dsc20050604_133440_34/' title='dsc20050604_133440_34'><img src="http://example.com/wp-content/uploads/2008/04/dsc20050604_133440_343.jpg" class="attachment-thumbnail" alt="" /></a>
			</dt></dl><dl class='gallery-item'>
			<dt class='gallery-icon'>
				<a href='http://example.com/2008/04/01/simple-gallery-test/dsc20050831_165238_33/' title='dsc20050831_165238_33'><img src="http://example.com/wp-content/uploads/2008/04/dsc20050831_165238_333.jpg" class="attachment-thumbnail" alt="" /></a>
			</dt></dl><dl class='gallery-item'>
			<dt class='gallery-icon'>
				<a href='http://example.com/2008/04/01/simple-gallery-test/dsc20050901_105100_21/' title='dsc20050901_105100_21'><img src="http://example.com/wp-content/uploads/2008/04/dsc20050901_105100_213.jpg" class="attachment-thumbnail" alt="" /></a>
			</dt></dl><br style="clear: both" /><dl class='gallery-item'>
			<dt class='gallery-icon'>
				<a href='http://example.com/2008/04/01/simple-gallery-test/dsc20050813_115856_5/' title='dsc20050813_115856_5'><img src="http://example.com/wp-content/uploads/2008/04/dsc20050813_115856_54.jpg" class="attachment-thumbnail" alt="" /></a>
			</dt></dl><dl class='gallery-item'>
			<dt class='gallery-icon'>
				<a href='http://example.com/2008/04/01/simple-gallery-test/dsc20050720_123726_27/' title='dsc20050720_123726_27'><img src="http://example.com/wp-content/uploads/2008/04/dsc20050720_123726_274.jpg" class="attachment-thumbnail" alt="" /></a>
			</dt></dl><dl class='gallery-item'>
			<dt class='gallery-icon'>
				<a href='http://example.com/2008/04/01/simple-gallery-test/dsc20050727_091048_22/' title='Title: Seedlings'><img src="http://example.com/wp-content/uploads/2008/04/dsc20050727_091048_224.jpg" class="attachment-thumbnail" alt="" /></a>
			</dt></dl><br style="clear: both" /><dl class='gallery-item'>
			<dt class='gallery-icon'>
				<a href='http://example.com/2008/04/01/simple-gallery-test/dsc20050726_083116_18/' title='dsc20050726_083116_18'><img src="http://example.com/wp-content/uploads/2008/04/dsc20050726_083116_184.jpg" class="attachment-thumbnail" alt="" /></a>
			</dt></dl>
			<br style='clear: both;' />
		</div>

<p>It&#8217;s the simplest form of the gallery tag.  All images are from the public domain site burningwell.org.</p>
<p>The images have various combinations of titles, captions and descriptions.</p>
EOF;
		$this->assertEquals(strip_ws($expected), strip_ws($out));
	}

	function test_gallery_attributes() {
		// make sure the gallery shortcode attributes are parsed correctly

		$id = 575;
		$post = get_post($id);
		$this->assertNotNull($post, "get_post($id) could not find the post.");
		$post->post_content = '[gallery columns="1" size="medium"]';
		wp_update_post($post);

		// permalink page
		$this->go_to('/2008/04/01/simple-gallery-test/');
		the_post();
		// filtered output
		$out = get_echo('the_content');

		$expected = <<<EOF
		<style type='text/css'>
			.gallery {
				margin: auto;
			}
			.gallery-item {
				float: left;
				margin-top: 10px;
				text-align: center;
				width: 100%;			}
			.gallery img {
				border: 2px solid #cfcfcf;
			}
			.gallery-caption {
				margin-left: 0;
			}
		</style>
		<!-- see gallery_shortcode() in wp-includes/media.php -->
		<div class='gallery'><dl class='gallery-item'>
			<dt class='gallery-icon'>
				<a href='http://example.com/?attachment_id=565' title='dsc20040724_152504_53'><img src="http://example.com/wp-content/uploads/2008/04/dsc20040724_152504_537.jpg" class="attachment-medium" alt="" /></a>
			</dt></dl><br style="clear: both" /><dl class='gallery-item'>
			<dt class='gallery-icon'>
				<a href='http://example.com/?attachment_id=566' title='canola'><img src="http://example.com/wp-content/uploads/2008/04/canola3.jpg" class="attachment-medium" alt="" /></a>
			</dt></dl><br style="clear: both" /><dl class='gallery-item'>
			<dt class='gallery-icon'>
				<a href='http://example.com/?attachment_id=567' title='dsc20050315_145007_13'><img src="http://example.com/wp-content/uploads/2008/04/dsc20050315_145007_134.jpg" class="attachment-medium" alt="" /></a>
			</dt></dl><br style="clear: both" /><dl class='gallery-item'>
			<dt class='gallery-icon'>
				<a href='http://example.com/?attachment_id=568' title='dsc20050604_133440_34'><img src="http://example.com/wp-content/uploads/2008/04/dsc20050604_133440_343.jpg" class="attachment-medium" alt="" /></a>
			</dt></dl><br style="clear: both" /><dl class='gallery-item'>
			<dt class='gallery-icon'>
				<a href='http://example.com/?attachment_id=569' title='dsc20050831_165238_33'><img src="http://example.com/wp-content/uploads/2008/04/dsc20050831_165238_333.jpg" class="attachment-medium" alt="" /></a>
			</dt></dl><br style="clear: both" /><dl class='gallery-item'>
			<dt class='gallery-icon'>
				<a href='http://example.com/?attachment_id=570' title='dsc20050901_105100_21'><img src="http://example.com/wp-content/uploads/2008/04/dsc20050901_105100_213.jpg" class="attachment-medium" alt="" /></a>
			</dt></dl><br style="clear: both" /><dl class='gallery-item'>
			<dt class='gallery-icon'>
				<a href='http://example.com/?attachment_id=571' title='dsc20050813_115856_5'><img src="http://example.com/wp-content/uploads/2008/04/dsc20050813_115856_54.jpg" class="attachment-medium" alt="" /></a>
			</dt></dl><br style="clear: both" /><dl class='gallery-item'>
			<dt class='gallery-icon'>
				<a href='http://example.com/?attachment_id=572' title='dsc20050720_123726_27'><img src="http://example.com/wp-content/uploads/2008/04/dsc20050720_123726_274.jpg" class="attachment-medium" alt="" /></a>
			</dt></dl><br style="clear: both" /><dl class='gallery-item'>
			<dt class='gallery-icon'>
				<a href='http://example.com/?attachment_id=573' title='Title: Seedlings'><img src="http://example.com/wp-content/uploads/2008/04/dsc20050727_091048_224.jpg" class="attachment-medium" alt="" /></a>
			</dt></dl><br style="clear: both" /><dl class='gallery-item'>
			<dt class='gallery-icon'>
				<a href='http://example.com/?attachment_id=574' title='dsc20050726_083116_18'><img src="http://example.com/wp-content/uploads/2008/04/dsc20050726_083116_184.jpg" class="attachment-medium" alt="" /></a>
			</dt></dl><br style="clear: both" />
			<br style='clear: both;' />
		</div>

EOF;
		$this->assertEquals(strip_ws($expected), strip_ws($out));
	}

}
