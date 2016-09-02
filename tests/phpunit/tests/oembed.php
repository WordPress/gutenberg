<?php

class Tests_oEmbed extends WP_UnitTestCase {
	protected static $oembed;
	protected static $provider_map = array(
		'youtube'              => '#https?://((m|www)\.)?youtube\.com/watch.*#i',
		'youtube-playlist'     => '#https?://((m|www)\.)?youtube\.com/playlist.*#i',
		'youtube-shorturl'     => '#https?://youtu\.be/.*#i',
		'vimeo'                => '#https?://(.+\.)?vimeo\.com/.*#i',
		'dailymotion'          => '#https?://(www\.)?dailymotion\.com/.*#i',
		'dailymotion-shorturl' => '#https?://dai.ly/.*#i',
		'flickr'               => '#https?://(www\.)?flickr\.com/.*#i',
		'flickr-shorturl'      => '#https?://flic\.kr/.*#i',
		'smugmug'              => '#https?://(.+\.)?smugmug\.com/.*#i',
		'hulu'                 => '#https?://(www\.)?hulu\.com/watch/.*#i',
		'photobucket-album'    => 'http://i*.photobucket.com/albums/*',
		'photobucket-group'    => 'http://gi*.photobucket.com/groups/*',
		'scribd'               => '#https?://(www\.)?scribd\.com/doc/.*#i',
		'wordpress-tv'         => '#https?://wordpress.tv/.*#i',
		'polldaddy'            => '#https?://(.+\.)?polldaddy\.com/.*#i',
		'polldaddy-shorturl'   => '#https?://poll\.fm/.*#i',
		'funnyordie'           => '#https?://(www\.)?funnyordie\.com/videos/.*#i',
		'twitter'              => '#https?://(www\.)?twitter\.com/.+?/status(es)?/.*#i',
		'twitter-timeline'     => '#https?://(www\.)?twitter\.com/.+?/timelines/.*#i',
		'twitter-moment'       => '#https?://(www\.)?twitter\.com/i/moments/.*#i',
		'vine'                 => '#https?://vine.co/v/.*#i',
		'soundcloud'           => '#https?://(www\.)?soundcloud\.com/.*#i',
		'slideshare'           => '#https?://(.+?\.)?slideshare\.net/.*#i',
		'instagram'            => '#https?://(www\.)?instagr(\.am|am\.com)/p/.*#i',
		'spotify'              => '#https?://(open|play)\.spotify\.com/.*#i',
		'imgur'                => '#https?://(.+\.)?imgur\.com/.*#i',
		'meetup'               => '#https?://(www\.)?meetu(\.ps|p\.com)/.*#i',
		'issuu'                => '#https?://(www\.)?issuu\.com/.+/docs/.+#i',
		'collegehumor'         => '#https?://(www\.)?collegehumor\.com/video/.*#i',
		'mixcloud'             => '#https?://(www\.)?mixcloud\.com/.*#i',
		'ted'                  => '#https?://(www\.|embed\.)?ted\.com/talks/.*#i',
		'animoto'              => '#https?://(www\.)?(animoto|video214)\.com/play/.*#i',
		'tumblr'               => '#https?://(.+)\.tumblr\.com/post/.*#i',
		'kickstarter'          => '#https?://(www\.)?kickstarter\.com/projects/.*#i',
		'kickstarter-shorturl' => '#https?://kck\.st/.*#i',
		'cloudup'              => '#https?://cloudup\.com/.*#i',
		'reverbnation'         => '#https?://(www\.)?reverbnation\.com/.*#i',
		'videopress'           => '#https?://videopress.com/v/.*#',
		'reddit-comments'      => '#https?://(www\.)?reddit\.com/r/[^/]+/comments/.*#i',
		'speakerdeck'          => '#https?://(www\.)?speakerdeck\.com/.*#i',
		'facebook-post'        => '#https?://www\.facebook\.com/.*/posts/.*#i',
		'facebook-activity'    => '#https?://www\.facebook\.com/.*/activity/.*#i',
		'facebook-photo'       => '#https?://www\.facebook\.com/photo(s/|\.php).*#i',
		'facebook-permalink'   => '#https?://www\.facebook\.com/permalink\.php.*#i',
		'facebook-media'       => '#https?://www\.facebook\.com/media/.*#i',
		'facebook-questions'   => '#https?://www\.facebook\.com/questions/.*#i',
		'facebook-notes'       => '#https?://www\.facebook\.com/notes/.*#i',
		'facebook-video'       => '#https?://www\.facebook\.com/.*/videos/.*#i',
		'facebook-videophp'    => '#https?://www\.facebook\.com/video\.php.*#i',
	);

	/**
	 * An HTTP API response.
	 *
	 * @var array
	 */
	protected $http_response = array();

	public static function wpSetUpBeforeClass() {
		self::$oembed = _wp_oembed_get_object();
	}

	/**
	 * Test the tests
	 *
	 * @group external-oembed
	 * @ticket 28507
	 * @ticket 32360
	 *
	 * @dataProvider oEmbedProviderData
	 */
	public function testOembedTestURLsResolve( $match, array $urls ) {

		if ( empty( $urls ) ) {
			$this->markTestIncomplete();
		}

		foreach ( $urls as $url ) {

			$msg = sprintf( 'Test URL: %s', $url );

			$r = wp_remote_head( $url, array(
				'redirection' => 3,
			) );

			if ( is_wp_error( $r ) ) {
				$this->fail( sprintf( "%s (%s)\n%s", $r->get_error_message(), $r->get_error_code(), $msg ) );
			}

			$http_code    = wp_remote_retrieve_response_code( $r );
			$http_message = wp_remote_retrieve_response_message( $r );
			$this->assertSame( 200, $http_code, "{$msg}\n- HTTP response code: {$http_code} {$http_message}" );

		}

	}

	/**
	 * Test the response from each oEmbed provider
	 *
	 * @group external-oembed
	 * @ticket 32360
	 *
	 * @dataProvider oEmbedProviderData
	 */
	public function testOembedProviderReturnsExpectedResponse( $match, array $urls ) {

		if ( empty( $urls ) ) {
			$this->markTestIncomplete();
		}

		$this->setup_http_hooks();

		$args = array(
			'width'  => 500,
			'height' => 500,
		);
		$supports_https = ( 0 === strpos( $match, '#https?' ) );

		foreach ( $urls as $url ) {
			$test_urls[] = set_url_scheme( $url, 'http' );
			if ( $supports_https ) {
				$test_urls[] = set_url_scheme( $url, 'https' );
			}
		}

		foreach ( $test_urls as $url ) {

			$msg = sprintf( "- Test URL: %s", $url );

			$provider = self::$oembed->get_provider( $url, array(
				'discover' => false,
			) );
			$this->assertNotFalse( $provider, "{$msg}\n- No oEmbed provider found." );

			$data = self::$oembed->fetch( $provider, $url, $args );

			$r = $this->http_response;

			$msg .= sprintf( "\n- oEmbed URL: %s", $r['url'] );

			$scheme = parse_url( $r['url'], PHP_URL_SCHEME );
			$query  = parse_url( $r['url'], PHP_URL_QUERY );
			parse_str( $query, $query_vars );

			// Test request
			$this->assertInternalType( 'array', $query_vars, $msg );
			$this->assertArrayHasKey( 'maxheight', $query_vars, $msg );
			$this->assertArrayHasKey( 'maxwidth', $query_vars, $msg );
			$this->assertArrayHasKey( 'url', $query_vars, $msg );
			$this->assertArrayHasKey( 'format', $query_vars, $msg );
			$this->assertTrue( in_array( $query_vars['format'], array( 'json', 'xml' ), true ), $msg );
			$this->assertEquals( $args['width'], $query_vars['maxwidth'], $msg );
			$this->assertEquals( $args['height'], $query_vars['maxheight'], $msg );

			// `WP_oEmbed::fetch()` only returns boolean false, so we need to hook into the HTTP API to get its error
			if ( is_wp_error( $r['response'] ) ) {
				$error_message = $r['response']->get_error_message();
				if ( empty( $error_message ) ) {
					$error_message = '- no message -';
				}

				$this->fail( sprintf( "%s (%s)\n%s", $error_message, $r['response']->get_error_code(), $msg ) );
			}

			$http_code    = wp_remote_retrieve_response_code( $r['response'] );
			$http_message = wp_remote_retrieve_response_message( $r['response'] );
			$this->assertSame( 200, $http_code, "{$msg}\n- HTTP response code: {$http_code} {$http_message}" );

			// Test response
			$this->assertNotFalse( $data, $msg );

			// Check for required response parameters
			$this->assertObjectHasAttribute( 'type', $data, $msg );
			$this->assertObjectHasAttribute( 'version', $data, $msg );
			$this->assertEquals( '1.0', $data->version, $msg );

			switch ( $data->type ) {

			case 'photo':

				// Check for required response parameters
				$this->assertObjectHasAttribute( 'url', $data, $msg );
				$this->assertObjectHasAttribute( 'width', $data, $msg );
				$this->assertObjectHasAttribute( 'height', $data, $msg );

				// Validate response parameters
				$this->assertNotEmpty( $data->url, $msg );
				$this->assertInternalType( 'string', $data->url, $msg );

				// Validate response URL scheme
				if ( 'https' === $scheme ) {
					$response_scheme = parse_url( $data->url, PHP_URL_SCHEME );
					if ( ! in_array( $response_scheme, array( null, 'https' ), true ) ) {
						$this->fail( sprintf( "Invalid scheme in response URL: %s\n%s", $data->url, $msg ) );
					}
				}

				break;

			case 'video':

				// Check for required response parameters
				$this->assertObjectHasAttribute( 'html', $data, $msg );
				$this->assertObjectHasAttribute( 'width', $data, $msg );
				$this->assertObjectHasAttribute( 'height', $data, $msg );

				// Validate response parameters
				$this->assertNotEmpty( $data->html, $msg );
				$this->assertInternalType( 'string', $data->html, $msg );

				break;

			case 'rich':

				// Check for required response parameters
				$this->assertObjectHasAttribute( 'html', $data, $msg );
				$this->assertObjectHasAttribute( 'width', $data, $msg );
				$this->assertObjectHasAttribute( 'height', $data, $msg );

				// Validate response parameters
				$this->assertNotEmpty( $data->html, $msg );
				$this->assertInternalType( 'string', $data->html, $msg );

				// Validate response URL schemes
				if ( 'https' === $scheme ) {

					if ( preg_match_all( '#src="([^"]+)"#', $data->html, $matches ) ) {
						foreach ( $matches[1] as $src ) {
							$src_scheme = parse_url( $src, PHP_URL_SCHEME );
							if ( ! in_array( $src_scheme, array( null, 'https' ), true ) ) {
								$this->fail( sprintf( "Invalid src scheme in response: %s\n%s", $src, $msg ) );
							}
						}
					}

				}

				break;

			case 'link':

				// Check for required response parameters
				$this->assertObjectHasAttribute( 'title', $data, $msg );

				// Validate response parameters
				$this->assertNotEmpty( $data->title, $msg );
				$this->assertInternalType( 'string', $data->title, $msg );

				break;

			default:

				$this->fail( sprintf( "Invalid value for the 'type' response parameter\n%s", $msg ) );

				break;

			}

			if ( ! empty( $data->width ) ) {

				// Validate response parameter
				$this->assertTrue( is_numeric( $data->width ), $msg );
				$this->assertLessThanOrEqual( intval( $query_vars['maxwidth'] ), $data->width, $msg );

			}

			if ( ! empty( $data->height ) ) {

				// Validate response parameter
				$this->assertTrue( is_numeric( $data->height ), $msg );
				$this->assertLessThanOrEqual( intval( $query_vars['maxheight'] ), $data->height, $msg );

			}

			if ( ! empty( $data->thumbnail_url ) ) {

				// Check for required response parameters
				$this->assertObjectHasAttribute( 'thumbnail_width', $data, $msg );
				$this->assertObjectHasAttribute( 'thumbnail_height', $data, $msg );

			}

			if ( ! empty( $data->thumbnail_width ) ) {

				// Check for required response parameters
				$this->assertObjectHasAttribute( 'thumbnail_url', $data, $msg );

				// Validate response parameter
				$this->assertTrue( is_numeric( $data->thumbnail_width ), $msg );
				$this->assertLessThanOrEqual( intval( $query_vars['maxwidth'] ), $data->thumbnail_width, $msg );

			}

			if ( ! empty( $data->thumbnail_height ) ) {

				// Check for required response parameters
				$this->assertObjectHasAttribute( 'thumbnail_url', $data, $msg );

				// Validate response parameter
				$this->assertTrue( is_numeric( $data->thumbnail_height ), $msg );
				$this->assertLessThanOrEqual( intval( $query_vars['maxheight'] ), $data->thumbnail_height, $msg );

			}

		}

		$this->teardown_http_hooks();

	}

	/**
	 * Test the response from each oEmbed provider when provided with invalid data
	 *
	 * @group external-oembed
	 * @ticket 32360
	 *
	 * @dataProvider oEmbedProviderData
	 */
	public function testOembedProviderHandlesInvalidData( $match, array $urls ) {

		if ( empty( $urls ) ) {
			$this->markTestIncomplete();
		}

		$this->setup_http_hooks();
		add_filter( 'oembed_fetch_url', array( $this, 'filter_oembed_fetch_url' ), 99, 3 );

		$invalid = '500" onmouseover="alert(document.cookie)';

		$args = array(
			'width'  => $invalid,
			'height' => $invalid,
		);

		// Only need to test with one URL for each provider
		$url = $urls[0];

		$msg = sprintf( "- Test URL: %s", $url );

		$provider = self::$oembed->get_provider( $url, array(
			'discover' => false,
		) );
		$this->assertNotFalse( $provider, "{$msg}\n- No oEmbed provider found." );
		$data = self::$oembed->fetch( $provider, $url, $args );

		$r = $this->http_response;

		$msg .= sprintf( "\n- oEmbed URL: %s", $r['url'] );

		$query = parse_url( $r['url'], PHP_URL_QUERY );
		parse_str( $query, $query_vars );

		// Test request
		$this->assertInternalType( 'array', $query_vars, $msg );
		$this->assertArrayHasKey( 'maxheight', $query_vars, $msg );
		$this->assertArrayHasKey( 'maxwidth', $query_vars, $msg );
		$this->assertEquals( $args['width'], $query_vars['maxwidth'], $msg );
		$this->assertEquals( $args['height'], $query_vars['maxheight'], $msg );

		// `WP_oEmbed::fetch()` only returns boolean false, so we need to hook into the HTTP API to get its error
		if ( is_wp_error( $r['response'] ) ) {
			$error_message = $r['response']->get_error_message();
			if ( empty( $error_message ) ) {
				$error_message = '- no message -';
			}

			$this->fail( sprintf( "%s (%s)\n%s", $error_message, $r['response']->get_error_code(), $msg ) );
		}

		$http_code    = wp_remote_retrieve_response_code( $r['response'] );
		$http_message = wp_remote_retrieve_response_message( $r['response'] );
		$this->assertContains( $http_code, array(
			200,
			400,
			404,
		), "{$msg}\n- HTTP response code: {$http_code} {$http_message}" );

		if ( false === $data ) {
			// For an erroneous request, it's valid to return no data (or no JSON/XML, which evaluates to false) and
			// therefore the rest of the assertions can be skipped
			return;
		}

		// Check invalid data isn't echoed
		$this->assertNotContains( 'onmouseover', wp_remote_retrieve_body( $r['response'] ), $msg );

		if ( isset( $data->width ) ) {
			$this->assertTrue( is_numeric( $data->width ), $msg );
		}

		if ( isset( $data->height ) ) {
			$this->assertTrue( is_numeric( $data->height ), $msg );
		}

		if ( isset( $data->thumbnail_width ) ) {
			$this->assertTrue( is_numeric( $data->thumbnail_width ), $msg );
		}

		if ( isset( $data->thumbnail_height ) ) {
			$this->assertTrue( is_numeric( $data->thumbnail_height ), $msg );
		}

		remove_filter( 'oembed_fetch_url', array( $this, 'filter_oembed_fetch_url' ), 99 );
		$this->teardown_http_hooks();

	}

	/**
	 * Test the tests
	 *
	 * @group oembed
	 * @ticket 32360
	 */
	public function testOembedTestsCoverAllProviders() {

		$tests     = wp_list_pluck( $this->oEmbedProviderData(), 0 );
		$providers = array_keys( self::$oembed->providers );
		$missing   = array_diff( $providers, $tests );

		$this->assertEmpty( $missing, sprintf( "These oEmbed providers are not tested:\n- %s", implode( "\n- ", $missing ) ) );

	}

	/**
	 * Test the tests
	 *
	 * @group oembed
	 * @ticket 32360
	 *
	 */
	public function testOembedTestsAreAllUseful() {

		$tests     = wp_list_pluck( $this->oEmbedProviderData(), 0 );
		$providers = array_keys( self::$oembed->providers );
		$useless   = array_diff( $tests, $providers );

		$this->assertEmpty( $useless, sprintf( "These tests do not cover any oEmbed provider:\n- %s", implode( "\n- ", $useless ) ) );

	}

	/**
	 * Test the tests
	 *
	 * @group oembed
	 * @ticket 32360
	 *
	 */
	public function testOembedTestProvidersMatchActualProviders() {

		$providers    = array_keys( self::$oembed->providers );
		$provider_map = array_values( self::$provider_map );

		$this->assertEquals( $providers, $provider_map );

	}

	/**
	 * Data provider for our oEmbed tests
	 *
	 * @return array
	 */
	public function oEmbedProviderData() {
		$providers = self::$provider_map;

		return array(
			array(
				$providers['youtube'],
				array(
					'http://youtube.com/watch?v=zdtD19tXX30',
					'http://m.youtube.com/watch?v=QkP_rOCBrpY',
					'http://www.youtube.com/watch?v=bDRQRdFaFEo',
				),
			),
			array(
				$providers['youtube-playlist'],
				array(
					'http://youtube.com/playlist?list=PL93B9F6B77FBB0160',
					'http://m.youtube.com/playlist?list=PL1AC02C68F976A10F',
					'http://www.youtube.com/playlist?list=PLC7D2959C96B8D27B',
				),
			),
			array(
				$providers['youtube-shorturl'],
				array(
					'http://youtu.be/nfWlot6h_JM?list=PLirAqAtl_h2r5g8xGajEwdXd3x1sZh8hC',
					'http://youtu.be/U8SYRUYfs_I',
				),
			),
			array(
				$providers['vimeo'],
				array(
					'http://vimeo.com/12339198',
				),
			),
			array(
				$providers['dailymotion'],
				array(
					'http://www.dailymotion.com/video/x27bwvb_how-to-wake-up-better_news',
				),
			),
			array(
				$providers['dailymotion-shorturl'],
				array(
					'http://dai.ly/x33exze',
				),
			),
			array(
				$providers['flickr'],
				array(
					'http://www.flickr.com/photos/bon/14004280667/',
				),
			),
			array(
				$providers['flickr-shorturl'],
				array(
					'http://flic.kr/p/6BFrbQ',
				),
			),
			array(
				$providers['smugmug'],
				array(
					'http://fotoeffects.smugmug.com/Daily-shots-for-the-dailies/Dailies/6928550_9gMRmv/476011624_WhGWpts#!i=476011624&k=WhGWpts',
				),
			),
			array(
				$providers['hulu'],
				array(
					'http://www.hulu.com/watch/807443',
				),
			),
			array(
				$providers['photobucket-album'],
				array(
					'http://i415.photobucket.com/albums/pp236/Keefers_/Keffers%20Animals/funny-cats-a10.jpg',
				),
			),
			array(
				$providers['photobucket-group'],
				array(
					// ??
				),
			),
			array(
				$providers['scribd'],
				array(
					'http://www.scribd.com/doc/110799637/Synthesis-of-Knowledge-Effects-of-Fire-and-Thinning-Treatments-on-Understory-Vegetation-in-Dry-U-S-Forests',
				),
			),
			array(
				$providers['wordpress-tv'],
				array(
					'http://wordpress.tv/2015/08/18/billie/',
				),
			),
			array(
				$providers['polldaddy'],
				array(
					'http://polldaddy.com/poll/9066794/',
				),
			),
			array(
				$providers['polldaddy-shorturl'],
				array(
					'http://poll.fm/5ebze',
				),
			),
			array(
				$providers['funnyordie'],
				array(
					'http://www.funnyordie.com/videos/e5ef40bf2a/cute-overload',
				),
			),
			array(
				$providers['twitter'],
				array(
					'http://twitter.com/WordPress/status/633718182335922177',
				),
			),
			array(
				$providers['twitter-timeline'],
				array(
					'https://twitter.com/TwitterDev/timelines/539487832448843776',
				),
			),
			array(
				$providers['twitter-moment'],
				array(
					'https://twitter.com/i/moments/770661957397573633',
				),
			),
			array(
				$providers['reddit-comments'],
				array(
					'https://www.reddit.com/r/Wordpress/comments/3xerq8/list_of_useful_wordpress_functions/'
				),
			),
			array(
				$providers['vine'],
				array(
					'http://vine.co/v/OjiLun5LuQ6',
				),
			),
			array(
				$providers['soundcloud'],
				array(
					'http://soundcloud.com/steveaoki/kid-cudi-pursuit-of-happiness',
				),
			),
			array(
				$providers['slideshare'],
				array(
					'http://www.slideshare.net/haraldf/business-quotes-for-2011',
				),
			),
			array(
				$providers['instagram'],
				array(
					'http://instagram.com/p/68WqXbTcfl/',
					'http://instagr.am/p/MRM3HQy6kh/',
				),
			),
			array(
				$providers['spotify'],
				array(
					'http://open.spotify.com/track/2i1KmyEXN3pNLwdxAWSGcg',
				),
			),
			array(
				$providers['imgur'],
				array(
					'http://imgur.com/a/WdJim',
					'http://i.imgur.com/mbOPX2L.png',
				),
			),
			array(
				$providers['meetup'],
				array(
					'http://www.meetup.com/WordPress-Amsterdam/events/224346396/',
					'http://meetu.ps/2L533w',
				),
			),
			array(
				$providers['issuu'],
				array(
					'http://issuu.com/vmagazine/docs/v87',
				),
			),
			array(
				$providers['collegehumor'],
				array(
					'http://www.collegehumor.com/video/2862877/jake-and-amir-math',
				),
			),
			array(
				$providers['mixcloud'],
				array(
					'http://www.mixcloud.com/8_8s/disclosurefriends/',
				),
			),
			array(
				$providers['ted'],
				array(
					'http://www.ted.com/talks/rodney_mullen_pop_an_ollie_and_innovate',
				),
			),
			array(
				$providers['animoto'],
				array(
					'http://animoto.com/play/MlRRgXHhoT8gOZyHanM6TA',
					'http://video214.com/play/MlRRgXHhoT8gOZyHanM6TA',
				),
			),
			array(
				$providers['tumblr'],
				array(
					'http://yahoo.tumblr.com/post/50902111638/tumblr-yahoo',
				),
			),
			array(
				$providers['kickstarter'],
				array(
					'http://www.kickstarter.com/projects/zackdangerbrown/potato-salad',
				),
			),
			array(
				$providers['kickstarter-shorturl'],
				array(
					'http://kck.st/1ukxHcx',
				),
			),
			array(
				$providers['cloudup'],
				array(
					'http://cloudup.com/cWX2Bi5DmfJ',
				),
			),
			array(
				$providers['reverbnation'],
				array(
					'http://www.reverbnation.com/enemyplanes/song/16729753-we-want-blood',
					'http://www.reverbnation.com/enemyplanes',
				),
			),
			array(
				$providers['videopress'],
				array(
					'https://videopress.com/v/kUJmAcSf',
				),
			),
			array(
				$providers['speakerdeck'],
				array(
					'https://speakerdeck.com/tollmanz/scaling-wordpress'
				),
			),
			array(
				$providers['facebook-post'],
				array(
					'https://www.facebook.com/WordPress/posts/10154220015487911'
				),
			),
			array(
				$providers['facebook-activity'],
				array(
					// ??
				),
			),
			array(
				$providers['facebook-photo'],
				array(
					'https://www.facebook.com/WordPress/photos/a.111006762910.97747.6427302910/10153207719422911/'
				),
			),
			array(
				$providers['facebook-permalink'],
				array(
					'https://www.facebook.com/permalink.php?story_fbid=10154220015487911'
				),
			),
			array(
				$providers['facebook-media'],
				array(
					'https://www.facebook.com/media/set/?set=a.164630483698579.1073741878.150601778434783&type=1&l=6c3a7725d5'
				),
			),
			array(
				$providers['facebook-questions'],
				array(
					// ??
				),
			),
			array(
				$providers['facebook-notes'],
				array(
					'https://www.facebook.com/notes/facebook/searching-for-answers-ask-facebook-questions/411795942130/'
				),
			),
			array(
				$providers['facebook-video'],
				array(
					'https://www.facebook.com/WordPress/videos/317622575398/'
				),
			),
			array(
				$providers['facebook-videophp'],
				array(
					'https://www.facebook.com/video.php?v=317622575398',
					'https://www.facebook.com/video.php?id=317622575398',
				),
			),
		);
	}

	protected function setup_http_hooks() {
		add_action( 'http_api_debug', array( $this, 'action_http_api_debug' ), 99, 5 );
	}

	protected function teardown_http_hooks() {
		remove_action( 'http_api_debug', array( $this, 'action_http_api_debug' ), 99 );
		$this->http_response = null;
	}

	public function filter_oembed_fetch_url( $provider_url, $embed_url, $args ) {
		// this allows us to test invalid data without it being converted to an integer in `WP_oEmbed::fetch()`
		$provider_url = add_query_arg( 'maxwidth', $args['width'], $provider_url );
		$provider_url = add_query_arg( 'maxheight', $args['height'], $provider_url );
		return $provider_url;
	}

	/**
	 * Debugging action for the HTTP API response.
	 *
	 * @param array|WP_Error $response The HTTP response.
	 * @param string         $action   The debug action.
	 * @param string         $class    The HTTP transport class name.
	 * @param array          $args     HTTP request arguments.
	 * @param string         $url      The request URL.
	 */
	public function action_http_api_debug( $response, $action, $class, $args, $url ) {

		if ( 'response' !== $action ) {
			return;
		}

		$this->http_response = compact( 'response', 'args', 'url' );

	}

}
