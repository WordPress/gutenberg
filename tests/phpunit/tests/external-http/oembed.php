<?php
/**
 * @group external-http
 */
class Tests_External_HTTP_OEmbed extends WP_UnitTestCase {
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
}