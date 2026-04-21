<?php
/**
 * Playlist block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Playlist block.
 *
 * @group blocks
 */
class Tests_Blocks_Render_Playlist extends WP_UnitTestCase {

	private $original_wp_interactivity;

	public function set_up() {
		parent::set_up();
		global $wp_interactivity;
		$this->original_wp_interactivity = $wp_interactivity;
		$wp_interactivity                = new WP_Interactivity_API();
	}

	public function tear_down() {
		global $wp_interactivity;
		$wp_interactivity = $this->original_wp_interactivity;
		parent::tear_down();
	}

	/**
	 * Helper to build playlist block markup for do_blocks().
	 *
	 * @param array  $playlist_attrs Attributes for the playlist block.
	 * @param array  $tracks         Array of track attribute arrays.
	 * @return string Block markup.
	 */
	private function build_playlist_markup( $playlist_attrs, $tracks = array() ) {
		$attrs_json   = wp_json_encode( (object) $playlist_attrs );
		$track_markup = '';
		foreach ( $tracks as $track ) {
			$track_json    = wp_json_encode( $track );
			$track_markup .= '<!-- wp:playlist-track ' . $track_json . ' /-->';
		}

		return '<!-- wp:playlist ' . $attrs_json . ' -->'
			. '<figure class="wp-block-playlist">'
			. '<ol class="wp-block-playlist__tracklist">'
			. $track_markup
			. '</ol>'
			. '</figure>'
			. '<!-- /wp:playlist -->';
	}

	/**
	 * @covers ::render_block_core_playlist
	 */
	public function test_returns_empty_when_current_track_is_missing() {
		$markup = $this->build_playlist_markup(
			array(),
			array(
				array(
					'id'       => 1,
					'uniqueId' => 'track-1',
					'title'    => 'Song One',
					'src'      => 'http://example.com/song1.mp3',
				),
			)
		);

		$output = do_blocks( $markup );
		$this->assertEmpty( trim( $output ) );
	}

	/**
	 * @covers ::render_block_core_playlist
	 */
	public function test_returns_empty_when_no_inner_blocks() {
		$markup = $this->build_playlist_markup(
			array( 'currentTrack' => 'track-1' )
		);

		$output = do_blocks( $markup );
		$this->assertEmpty( trim( $output ) );
	}

	/**
	 * @covers ::render_block_core_playlist
	 */
	public function test_returns_empty_when_current_track_does_not_match_any_track() {
		$markup = $this->build_playlist_markup(
			array( 'currentTrack' => 'nonexistent-track' ),
			array(
				array(
					'id'       => 1,
					'uniqueId' => 'track-1',
					'title'    => 'Song One',
					'src'      => 'http://example.com/song1.mp3',
				),
			)
		);

		$output = do_blocks( $markup );
		$this->assertEmpty( trim( $output ) );
	}

	/**
	 * @covers ::render_block_core_playlist
	 */
	public function test_renders_with_interactivity_attributes() {
		$markup = $this->build_playlist_markup(
			array( 'currentTrack' => 'track-1' ),
			array(
				array(
					'id'       => 1,
					'uniqueId' => 'track-1',
					'title'    => 'Song One',
					'artist'   => 'Artist One',
					'album'    => 'Album One',
					'src'      => 'http://example.com/song1.mp3',
					'image'    => 'http://example.com/image1.jpg',
				),
			)
		);

		$output = do_blocks( $markup );
		$p      = new WP_HTML_Tag_Processor( $output );

		$p->next_tag( 'figure' );
		$this->assertSame( 'core/playlist', $p->get_attribute( 'data-wp-interactive' ) );

		$context = json_decode( $p->get_attribute( 'data-wp-context' ), true );
		$this->assertSame( 'track-1', $context['currentId'] );
		$this->assertIsArray( $context['tracks'] );
		$this->assertContains( 'track-1', $context['tracks'] );
		$this->assertArrayHasKey( 'playlistId', $context );
	}

	/**
	 * @covers ::render_block_core_playlist
	 */
	public function test_renders_waveform_player_container() {
		$markup = $this->build_playlist_markup(
			array( 'currentTrack' => 'track-1' ),
			array(
				array(
					'id'       => 1,
					'uniqueId' => 'track-1',
					'title'    => 'Song One',
					'src'      => 'http://example.com/song1.mp3',
				),
			)
		);

		$output = do_blocks( $markup );
		$this->assertStringContainsString( 'wp-block-playlist__waveform-player', $output );
		$this->assertStringContainsString( 'data-wp-watch="callbacks.initWaveformPlayer"', $output );
	}

	/**
	 * @covers ::render_block_core_playlist
	 */
	public function test_track_data_in_interactivity_state() {
		$markup = $this->build_playlist_markup(
			array( 'currentTrack' => 'track-1' ),
			array(
				array(
					'id'       => 1,
					'uniqueId' => 'track-1',
					'title'    => 'Song One',
					'artist'   => 'Artist One',
					'album'    => 'Album One',
					'src'      => 'http://example.com/song1.mp3',
					'image'    => 'http://example.com/image1.jpg',
				),
				array(
					'id'       => 2,
					'uniqueId' => 'track-2',
					'title'    => 'Song Two',
					'artist'   => 'Artist Two',
					'album'    => 'Album Two',
					'src'      => 'http://example.com/song2.mp3',
				),
			)
		);

		do_blocks( $markup );

		$state = wp_interactivity_state( 'core/playlist' );
		// Find the playlist entry (key is dynamic).
		$playlists = $state['playlists'];
		$this->assertCount( 1, $playlists );

		$playlist = reset( $playlists );
		$tracks   = $playlist['tracks'];
		$this->assertArrayHasKey( 'track-1', $tracks );
		$this->assertArrayHasKey( 'track-2', $tracks );

		$this->assertSame( 'http://example.com/song1.mp3', $tracks['track-1']['url'] );
		$this->assertSame( 'Song One', $tracks['track-1']['title'] );
		$this->assertSame( 'Artist One', $tracks['track-1']['artist'] );
		$this->assertSame( 'Album One', $tracks['track-1']['album'] );
		$this->assertSame( 'http://example.com/image1.jpg', $tracks['track-1']['image'] );

		$this->assertSame( 'http://example.com/song2.mp3', $tracks['track-2']['url'] );
		$this->assertSame( 'Song Two', $tracks['track-2']['title'] );
	}

	/**
	 * @covers ::render_block_core_playlist
	 */
	public function test_aria_label_with_title_artist_and_album() {
		$markup = $this->build_playlist_markup(
			array( 'currentTrack' => 'track-1' ),
			array(
				array(
					'id'       => 1,
					'uniqueId' => 'track-1',
					'title'    => 'Song One',
					'artist'   => 'Artist One',
					'album'    => 'Album One',
					'src'      => 'http://example.com/song1.mp3',
				),
			)
		);

		do_blocks( $markup );

		$state    = wp_interactivity_state( 'core/playlist' );
		$playlist = reset( $state['playlists'] );
		$track    = $playlist['tracks']['track-1'];

		$this->assertSame(
			'Song One by Artist One from the album Album One',
			$track['ariaLabel']
		);
	}

	/**
	 * @covers ::render_block_core_playlist
	 */
	public function test_aria_label_falls_back_to_title_when_artist_or_album_missing() {
		$markup = $this->build_playlist_markup(
			array( 'currentTrack' => 'track-1' ),
			array(
				array(
					'id'       => 1,
					'uniqueId' => 'track-1',
					'title'    => 'Song One',
					'src'      => 'http://example.com/song1.mp3',
				),
			)
		);

		do_blocks( $markup );

		$state    = wp_interactivity_state( 'core/playlist' );
		$playlist = reset( $state['playlists'] );
		$track    = $playlist['tracks']['track-1'];

		$this->assertSame( 'Song One', $track['ariaLabel'] );
	}

	/**
	 * @covers ::render_block_core_playlist
	 */
	public function test_title_defaults_to_unknown_when_not_set() {
		$markup = $this->build_playlist_markup(
			array( 'currentTrack' => 'track-1' ),
			array(
				array(
					'id'       => 1,
					'uniqueId' => 'track-1',
					'src'      => 'http://example.com/song1.mp3',
				),
			)
		);

		do_blocks( $markup );

		$state    = wp_interactivity_state( 'core/playlist' );
		$playlist = reset( $state['playlists'] );
		$track    = $playlist['tracks']['track-1'];

		$this->assertSame( 'Unknown title', $track['title'] );
	}

	/**
	 * @covers ::render_block_core_playlist
	 */
	public function test_renders_multiple_tracks_in_context() {
		$markup = $this->build_playlist_markup(
			array( 'currentTrack' => 'track-1' ),
			array(
				array(
					'id'       => 1,
					'uniqueId' => 'track-1',
					'title'    => 'Song One',
					'src'      => 'http://example.com/song1.mp3',
				),
				array(
					'id'       => 2,
					'uniqueId' => 'track-2',
					'title'    => 'Song Two',
					'src'      => 'http://example.com/song2.mp3',
				),
				array(
					'id'       => 3,
					'uniqueId' => 'track-3',
					'title'    => 'Song Three',
					'src'      => 'http://example.com/song3.mp3',
				),
			)
		);

		$output = do_blocks( $markup );
		$p      = new WP_HTML_Tag_Processor( $output );
		$p->next_tag( 'figure' );

		$context = json_decode( $p->get_attribute( 'data-wp-context' ), true );
		$this->assertCount( 3, $context['tracks'] );
		$this->assertSame( array( 'track-1', 'track-2', 'track-3' ), $context['tracks'] );
	}
}
