<?php
/**
 * WP_Sync_CRDT_Document class
 *
 * @package gutenberg
 */

if ( ! class_exists( 'WP_Sync_CRDT_Document' ) ) {

	/**
	 * Small y-php-backed helper for sync protocol decoding and encoding.
	 *
	 * @since 7.1.0
	 * @access private
	 */
	class WP_Sync_CRDT_Document {
		/**
		 * The authoritative Yjs document.
		 *
		 * @since 7.1.0
		 * @var Yjs\Doc
		 */
		private $doc;

		/**
		 * Constructor.
		 *
		 * @since 7.1.0
		 */
		private function __construct() {
			self::ensure_yjs_loaded();

			$this->doc = new Yjs\Doc();
		}

		/**
		 * Reconstructs a CRDT document from stored polling updates.
		 *
		 * @since 7.1.0
		 *
		 * @param array<int, array{data?: string, type?: string}> $updates Stored room updates.
		 * @return self Reconstructed document.
		 */
		public static function from_update_snapshot( array $updates ): self {
			$document = new self();

			foreach ( $updates as $update ) {
				if ( ! is_array( $update ) || ! isset( $update['type'], $update['data'] ) || ! is_string( $update['type'] ) || ! is_string( $update['data'] ) ) {
					continue;
				}

				if ( WP_HTTP_Polling_Sync_Server_Gutenberg::UPDATE_TYPE_SYNC_STEP1 === $update['type'] ) {
					continue;
				}

				$document->apply_polling_update( $update['data'], $update['type'] );
			}

			return $document;
		}

		/**
		 * Applies a polling update to the document.
		 *
		 * @since 7.1.0
		 *
		 * @param string $base64 Base64-encoded update payload.
		 * @param string $type   Polling update type.
		 */
		public function apply_polling_update( string $base64, string $type ): void {
			switch ( $type ) {
				case WP_HTTP_Polling_Sync_Server_Gutenberg::UPDATE_TYPE_COMPACTION:
				case WP_HTTP_Polling_Sync_Server_Gutenberg::UPDATE_TYPE_UPDATE:
					Yjs\applyUpdateV2( $this->doc, Yjs\Lib0\Buffer::fromBase64( $base64 ), 'server-polling-update' );
					return;

				case WP_HTTP_Polling_Sync_Server_Gutenberg::UPDATE_TYPE_SYNC_STEP2:
					$this->read_sync_message(
						$base64,
						Yjs\Protocols\Sync::MESSAGE_YJS_SYNC_STEP2,
						'server-legacy-sync-step2'
					);
					return;
			}

			throw new InvalidArgumentException( 'Invalid sync update type.' );
		}

		/**
		 * Creates a server-generated sync_step2 response for a sync_step1 request.
		 *
		 * @since 7.1.0
		 *
		 * @param string $base64_step1 Base64-encoded sync_step1 frame.
		 * @return string Base64-encoded sync_step2 frame.
		 */
		public function create_sync_step2_response( string $base64_step1 ): string {
			$read = $this->read_sync_message(
				$base64_step1,
				Yjs\Protocols\Sync::MESSAGE_YJS_SYNC_STEP1,
				'server-sync-step1'
			);

			return Yjs\Lib0\Encoding::toUint8Array( $read['encoder'] )->toBase64();
		}

		/**
		 * Returns the document state vector.
		 *
		 * @since 7.1.0
		 *
		 * @return Yjs\Lib0\Buffer Encoded state vector.
		 */
		public function state_vector() {
			return Yjs\encodeStateVector( $this->doc );
		}

		/**
		 * Encodes the diff between the current document and a state vector.
		 *
		 * @since 7.1.0
		 *
		 * @param Yjs\Lib0\Buffer $state_vector Encoded state vector.
		 * @return string Base64-encoded V2 update.
		 */
		public function encode_diff( $state_vector ): string {
			return Yjs\encodeStateAsUpdateV2( $this->doc, $state_vector )->toBase64();
		}

		/**
		 * Encodes the full document state as a single compaction update.
		 *
		 * @since 7.1.0
		 *
		 * @return string Base64-encoded V2 full-state update.
		 */
		public function encode_state_as_compaction(): string {
			return Yjs\encodeStateAsUpdateV2( $this->doc )->toBase64();
		}

		/**
		 * Checks whether a base64-encoded V2 update contains no structs or deletes.
		 *
		 * @since 7.1.0
		 *
		 * @param string $base64 Base64-encoded V2 update.
		 * @return bool True when the decoded update carries no changes.
		 */
		public function is_empty_update( string $base64 ): bool {
			$decoded = Yjs\decodeUpdateV2( Yjs\Lib0\Buffer::fromBase64( $base64 ) );
			return empty( $decoded['structs'] ) && empty( $decoded['ds']->clients );
		}

		/**
		 * Reads a y-protocols/sync message and validates its envelope.
		 *
		 * @since 7.1.0
		 *
		 * @param string   $base64                Base64-encoded sync frame.
		 * @param int|null $expected_message_type Expected inner sync message type.
		 * @param mixed    $transaction_origin    Transaction origin for applied updates.
		 * @return array{message_type: int, encoder: Yjs\Lib0\Encoder} Read metadata and reply encoder.
		 */
		private function read_sync_message( string $base64, ?int $expected_message_type, $transaction_origin ): array {
			$buffer  = Yjs\Lib0\Buffer::fromBase64( $base64 );
			$decoder = Yjs\Lib0\Decoding::createDecoder( $buffer );
			$encoder = Yjs\Lib0\Encoding::createEncoder();

			$message_type = Yjs\Protocols\Sync::readSyncMessage( $decoder, $encoder, $this->doc, $transaction_origin );

			if ( null !== $expected_message_type && $expected_message_type !== $message_type ) {
				throw new InvalidArgumentException( 'Unexpected sync message type.' );
			}

			if ( Yjs\Lib0\Decoding::hasContent( $decoder ) ) {
				throw new InvalidArgumentException( 'Malformed sync message.' );
			}

			return array(
				'encoder'      => $encoder,
				'message_type' => $message_type,
			);
		}

		/**
		 * Ensures the y-php runtime is available.
		 *
		 * @since 7.1.0
		 */
		private static function ensure_yjs_loaded(): void {
			if ( class_exists( 'Yjs\Doc' ) ) {
				return;
			}

			$autoload = dirname( __DIR__, 3 ) . '/vendor/autoload.php';
			if ( file_exists( $autoload ) ) {
				require_once $autoload;
			}

			if ( ! class_exists( 'Yjs\Doc' ) ) {
				throw new RuntimeException( 'The yjs/y-php Composer package is required for HTTP polling sync.' );
			}
		}
	}
}
