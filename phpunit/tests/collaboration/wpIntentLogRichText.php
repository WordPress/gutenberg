<?php
/**
 * Frozen-vector tests for the rich-text codec PHP twin.
 *
 * @package Gutenberg
 */

/**
 * @group collaboration
 */
class Tests_Collaboration_WpIntentLogRichText extends WP_UnitTestCase {
	/**
	 * Loads the frozen vectors from the sync package.
	 *
	 * @return array Decoded vectors.
	 */
	private static function load_vectors(): array {
		$path = dirname( __DIR__, 3 ) . '/packages/sync/src/engines/intent-log/test-vectors/rich-text.json';
		if ( ! file_exists( $path ) ) {
			self::fail( "Missing vector file: $path" );
		}
		$decoded = json_decode( file_get_contents( $path ), true );
		self::assertIsArray( $decoded, "Malformed vector file: $path" );

		return $decoded;
	}

	public function test_codec_reproduces_every_frozen_html_vector() {
		$vectors = self::load_vectors();
		$this->assertNotEmpty( $vectors['cases']['html'] );

		foreach ( $vectors['cases']['html'] as $case ) {
			$field = WP_Intent_Log_Rich_Text::html_to_field( $case['html'] );
			$this->assertSame(
				$case['field'],
				$field,
				'html_to_field diverged for: ' . $case['html']
			);
			$this->assertSame(
				$case['serialized'],
				WP_Intent_Log_Rich_Text::field_to_html( $field ),
				'field_to_html diverged for: ' . $case['html']
			);
		}
	}

	public function test_codec_reproduces_every_frozen_field_vector() {
		$vectors = self::load_vectors();
		$this->assertNotEmpty( $vectors['cases']['field'] );

		foreach ( $vectors['cases']['field'] as $case ) {
			$serialized = WP_Intent_Log_Rich_Text::field_to_html( $case['field'] );
			$this->assertSame(
				$case['serialized'],
				$serialized,
				'field_to_html diverged for: ' . wp_json_encode( $case['field'] )
			);
			$this->assertSame(
				$case['reparsed'],
				WP_Intent_Log_Rich_Text::html_to_field( $serialized ),
				'reparse diverged for: ' . $serialized
			);
		}
	}

	public function test_format_id_round_trip() {
		$format = WP_Intent_Log_Rich_Text::encode_format(
			'a',
			array(
				'rel'  => 'nofollow',
				'href' => 'https://x.test/?a=1&b=2',
			)
		);
		$this->assertSame( 'a|{"href":"https://x.test/?a=1&b=2","rel":"nofollow"}', $format );
		$this->assertSame(
			array(
				'tag'   => 'a',
				'attrs' => array(
					'href' => 'https://x.test/?a=1&b=2',
					'rel'  => 'nofollow',
				),
			),
			WP_Intent_Log_Rich_Text::decode_format( $format )
		);
		$this->assertNull( WP_Intent_Log_Rich_Text::decode_format( 'obj|{"html":"<img>"}' ) );
	}
}
