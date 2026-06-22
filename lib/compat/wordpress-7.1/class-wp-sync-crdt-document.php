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
		 * Root Y.Map key holding the synced record. Mirrors CRDT_RECORD_MAP_KEY
		 * in packages/sync/src/config.ts.
		 *
		 * @since 7.1.0
		 * @var string
		 */
		const RECORD_MAP_KEY = 'document';

		/**
		 * Transaction origin used for server-side HTML sanitization edits, so the
		 * sanitization changes are attributed distinctly from applied peer updates.
		 *
		 * @since 7.1.0
		 * @var string
		 */
		const SANITIZATION_ORIGIN = 'server-html-sanitization';

		/**
		 * HTML attribute targets that carry a single URL. When a block attribute is
		 * sourced (source: attribute) into one of these, its value is protocol-
		 * validated with esc_url_raw rather than passed through wp_kses_post (which
		 * would corrupt URLs). This is the primary, name-agnostic URL detection:
		 * the value is matched by where the schema says it lands, so a custom-named
		 * attribute (e.g. linkUrl, linkDestination) is still covered.
		 *
		 * Multi-URL attributes such as srcset and ping are intentionally excluded,
		 * since esc_url_raw expects a single URL.
		 *
		 * @since 7.1.0
		 * @var string[]
		 */
		const URL_HTML_ATTRIBUTES = array( 'href', 'src', 'poster', 'cite', 'action', 'formaction', 'data', 'background', 'longdesc', 'manifest', 'xlink:href' );

		/**
		 * The authoritative Yjs document.
		 *
		 * @since 7.1.0
		 * @var Yjs\Doc
		 */
		private $doc;

		/**
		 * Cached block attribute schemas, keyed by block name then attribute name.
		 *
		 * Mirrors getBlockAttributeSchema() in packages/core-data/src/utils/crdt-blocks.ts,
		 * but reads from the server-side block registry.
		 *
		 * @since 7.1.0
		 * @var array<string, array<string, array<string, mixed>>>|null
		 */
		private static $attribute_schemas = null;

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
		 * Sanitizes a base64-encoded V2 document snapshot and re-encodes it.
		 *
		 * Used to sanitize a client-supplied persisted CRDT document (see
		 * WP_Sync_Save_Server) so a user without the unfiltered_html capability
		 * cannot persist unfiltered HTML by posting directly to the save endpoint.
		 *
		 * @since 7.1.0
		 *
		 * @param string $base64 Base64-encoded V2 full-state update.
		 * @return string Base64-encoded V2 full-state update with HTML sanitized.
		 */
		public static function sanitize_encoded_state( string $base64 ): string {
			$document = new self();

			Yjs\applyUpdateV2( $document->doc, Yjs\Lib0\Buffer::fromBase64( $base64 ), 'server-persisted-doc' );
			$document->sanitize_html_content();

			return Yjs\encodeStateAsUpdateV2( $document->doc )->toBase64();
		}

		/**
		 * Sanitizes HTML-bearing content in the authoritative document in place.
		 *
		 * Walks the synced record's rich-text fields and block tree, running
		 * wp_kses_post on every rich-text leaf (and html-source string attribute)
		 * and esc_url_raw on URL attributes. Intended to run for updates from users
		 * lacking the unfiltered_html capability, so dangerous markup is stripped
		 * before the update is broadcast to peers. All edits are wrapped in a single
		 * transaction so the resulting diff can be encoded and broadcast as one
		 * corrective update.
		 *
		 * @since 7.1.0
		 *
		 * @return bool True when sanitization changed the document, false otherwise.
		 */
		public function sanitize_html_content(): bool {
			$record  = $this->doc->getMap( self::RECORD_MAP_KEY );
			$changed = false;

			Yjs\transact(
				$this->doc,
				function () use ( $record, &$changed ): void {
					// Post-record rich-text fields.
					foreach ( array( 'content', 'excerpt' ) as $field ) {
						$value = $record->get( $field );
						if ( $value instanceof Yjs\Types\YText ) {
							$this->sanitize_y_text( $value, 'wp_kses_post', $changed );
						}
					}

					// Title is plain text in the editor, so strip all markup.
					$title = $record->get( 'title' );
					if ( $title instanceof Yjs\Types\YText ) {
						$this->sanitize_y_text( $title, 'sanitize_text_field', $changed );
					}

					$blocks = $record->get( 'blocks' );
					if ( $blocks instanceof Yjs\Types\YArray ) {
						$this->sanitize_blocks( $blocks, $changed );
					}
				},
				self::SANITIZATION_ORIGIN
			);

			return $changed;
		}

		/**
		 * Recursively sanitizes a block list (Y.Array of block Y.Maps).
		 *
		 * @since 7.1.0
		 *
		 * @param Yjs\Types\YArray $blocks  Block list to sanitize.
		 * @param bool             $changed Set to true when any leaf changes.
		 */
		private function sanitize_blocks( $blocks, bool &$changed ): void {
			$length = $blocks->length;

			for ( $index = 0; $index < $length; $index++ ) {
				$block = $blocks->get( $index );
				if ( ! $block instanceof Yjs\Types\YMap ) {
					continue;
				}

				$block_name = $block->get( 'name' );
				$block_name = is_string( $block_name ) ? $block_name : '';

				$attributes = $block->get( 'attributes' );
				if ( $attributes instanceof Yjs\Types\YMap ) {
					foreach ( $attributes->keys() as $attribute_name ) {
						$this->sanitize_attribute_value(
							$block_name,
							$attribute_name,
							$attributes->get( $attribute_name ),
							$attributes,
							$changed
						);
					}
				}

				// Invalid blocks persist their raw saved HTML here.
				$original_content = $block->get( 'originalContent' );
				if ( is_string( $original_content ) ) {
					$clean = $this->maybe_sanitize_html_string( $original_content, 'wp_kses_post' );
					if ( null !== $clean ) {
						$block->set( 'originalContent', $clean );
						$changed = true;
					}
				}

				$inner_blocks = $block->get( 'innerBlocks' );
				if ( $inner_blocks instanceof Yjs\Types\YArray ) {
					$this->sanitize_blocks( $inner_blocks, $changed );
				}
			}
		}

		/**
		 * Sanitizes a single attribute value, recursing into nested Y types.
		 *
		 * @since 7.1.0
		 *
		 * @param string         $block_name     Block name owning the attribute.
		 * @param string         $attribute_name Attribute key.
		 * @param mixed          $value          Attribute value (Y type or scalar).
		 * @param Yjs\Types\YMap $owner          Y.Map holding the attribute.
		 * @param bool           $changed        Set to true when any leaf changes.
		 */
		private function sanitize_attribute_value( string $block_name, string $attribute_name, $value, $owner, bool &$changed ): void {
			// Rich-text leaves (and any Y.Text anywhere) are always run through
			// wp_kses_post. Client-side only rich-text attributes become Y.Text,
			// so this is safe even for blocks the server cannot classify.
			if ( $value instanceof Yjs\Types\YText ) {
				$this->sanitize_y_text( $value, 'wp_kses_post', $changed );
				return;
			}

			if ( $value instanceof Yjs\Types\YArray ) {
				$this->sanitize_y_array( $value, $changed );
				return;
			}

			if ( $value instanceof Yjs\Types\YMap ) {
				foreach ( $value->keys() as $key ) {
					$this->sanitize_attribute_value( $block_name, $key, $value->get( $key ), $value, $changed );
				}
				return;
			}

			if ( is_string( $value ) ) {
				$this->sanitize_attribute_string( $block_name, $attribute_name, $value, $owner, $changed );
			}
		}

		/**
		 * Recursively sanitizes the elements of a Y.Array attribute value (e.g. the
		 * nested rows/cells of a query-sourced attribute such as core/table `body`).
		 *
		 * @since 7.1.0
		 *
		 * @param Yjs\Types\YArray $y_array Array to sanitize.
		 * @param bool             $changed Set to true when any leaf changes.
		 */
		private function sanitize_y_array( $y_array, bool &$changed ): void {
			$length = $y_array->length;

			for ( $index = 0; $index < $length; $index++ ) {
				$item = $y_array->get( $index );

				if ( $item instanceof Yjs\Types\YText ) {
					$this->sanitize_y_text( $item, 'wp_kses_post', $changed );
				} elseif ( $item instanceof Yjs\Types\YMap ) {
					foreach ( $item->keys() as $key ) {
						$this->sanitize_attribute_value( '', $key, $item->get( $key ), $item, $changed );
					}
				} elseif ( $item instanceof Yjs\Types\YArray ) {
					$this->sanitize_y_array( $item, $changed );
				}
			}
		}

		/**
		 * Sanitizes a plain string attribute value.
		 *
		 * URL attributes are protocol-validated with esc_url_raw; attributes the
		 * block schema (or the html-string allowlist) marks as raw/html are run
		 * through wp_kses_post. All other strings are left untouched, since running
		 * wp_kses_post on plain text would corrupt legitimate values.
		 *
		 * @since 7.1.0
		 *
		 * @param string         $block_name     Block name owning the attribute.
		 * @param string         $attribute_name Attribute key.
		 * @param string         $value          Attribute value.
		 * @param Yjs\Types\YMap $owner          Y.Map holding the attribute.
		 * @param bool           $changed        Set to true when the value changes.
		 */
		private function sanitize_attribute_string( string $block_name, string $attribute_name, string $value, $owner, bool &$changed ): void {
			if ( '' === $value ) {
				return;
			}

			if ( $this->is_url_attribute( $block_name, $attribute_name ) ) {
				$clean = esc_url_raw( $value );
				if ( $clean !== $value ) {
					$owner->set( $attribute_name, $clean );
					$changed = true;
				}
				return;
			}

			if ( $this->is_html_source_attribute( $block_name, $attribute_name ) ) {
				$clean = $this->maybe_sanitize_html_string( $value, 'wp_kses_post' );
				if ( null !== $clean ) {
					$owner->set( $attribute_name, $clean );
					$changed = true;
				}
			}
		}

		/**
		 * Sanitizes a Y.Text in place, replacing its contents when the sanitizer
		 * changes the value.
		 *
		 * @since 7.1.0
		 *
		 * @param Yjs\Types\YText $text      Y.Text to sanitize.
		 * @param callable        $sanitizer Sanitizer applied to the string value.
		 * @param bool            $changed   Set to true when the value changes.
		 */
		private function sanitize_y_text( $text, callable $sanitizer, bool &$changed ): void {
			$clean = $this->maybe_sanitize_html_string( $text->toString(), $sanitizer );
			if ( null === $clean ) {
				return;
			}

			$text->delete( 0, $text->length );
			if ( '' !== $clean ) {
				$text->insert( 0, $clean );
			}
			$changed = true;
		}

		/**
		 * Runs a sanitizer on a string, returning the cleaned value only when it
		 * differs from the input.
		 *
		 * A cheap pre-check skips strings that an HTML sanitizer cannot change.
		 * wp_kses only transforms a string via tag parsing (needs `<`/`>`), entity
		 * normalization (needs `&`), or NUL-byte stripping (needs `\0`), so a string
		 * containing none of those characters is left untouched. (A custom pre_kses
		 * filter could in theory rewrite plain text, but that is out of scope here.)
		 *
		 * @since 7.1.0
		 *
		 * @param string   $value     String to sanitize.
		 * @param callable $sanitizer Sanitizer to apply.
		 * @return string|null Cleaned value, or null when unchanged.
		 */
		private function maybe_sanitize_html_string( string $value, callable $sanitizer ): ?string {
			if ( '' === $value || false === strpbrk( $value, "<>&\0" ) ) {
				return null;
			}

			$clean = call_user_func( $sanitizer, $value );
			return $clean === $value ? null : $clean;
		}

		/**
		 * Determines whether a string attribute carries a URL and should be
		 * protocol-validated with esc_url_raw.
		 *
		 * Detection is name-agnostic: an attribute sourced (source: attribute) into
		 * a URL-bearing HTML attribute (href, src, ...) is treated as a URL
		 * regardless of its key name, so custom names such as linkUrl or
		 * linkDestination are covered while ambiguous key-name matching is avoided.
		 *
		 * @since 7.1.0
		 *
		 * @param string $block_name     Block name owning the attribute.
		 * @param string $attribute_name Attribute key.
		 * @return bool True when the attribute carries a URL.
		 */
		private function is_url_attribute( string $block_name, string $attribute_name ): bool {
			$schema = $this->get_block_attribute_schema( $block_name, $attribute_name );

			return null !== $schema &&
				isset( $schema['source'], $schema['attribute'] ) &&
				'attribute' === $schema['source'] &&
				in_array( strtolower( (string) $schema['attribute'] ), self::URL_HTML_ATTRIBUTES, true );
		}

		/**
		 * Determines whether a string attribute is sourced as raw/html and should
		 * therefore be run through wp_kses_post.
		 *
		 * @since 7.1.0
		 *
		 * @param string $block_name     Block name owning the attribute.
		 * @param string $attribute_name Attribute key.
		 * @return bool True when the attribute carries raw HTML.
		 */
		private function is_html_source_attribute( string $block_name, string $attribute_name ): bool {
			$schema = $this->get_block_attribute_schema( $block_name, $attribute_name );
			if ( null !== $schema && isset( $schema['source'] ) && in_array( $schema['source'], array( 'html', 'raw', 'rich-text' ), true ) ) {
				return true;
			}

			$allowlist = self::html_string_attribute_allowlist();
			return isset( $allowlist[ $block_name ] ) && in_array( $attribute_name, $allowlist[ $block_name ], true );
		}

		/**
		 * Returns the attribute schema for a block attribute from the server-side
		 * block registry, or null when unknown.
		 *
		 * @since 7.1.0
		 *
		 * @param string $block_name     Block name.
		 * @param string $attribute_name Attribute key.
		 * @return array<string, mixed>|null Attribute schema, or null.
		 */
		private function get_block_attribute_schema( string $block_name, string $attribute_name ): ?array {
			if ( '' === $block_name ) {
				return null;
			}

			if ( null === self::$attribute_schemas ) {
				self::$attribute_schemas = array();

				if ( class_exists( 'WP_Block_Type_Registry' ) ) {
					foreach ( WP_Block_Type_Registry::get_instance()->get_all_registered() as $block_type ) {
						$attributes                                   = $block_type->get_attributes();
						self::$attribute_schemas[ $block_type->name ] = is_array( $attributes ) ? $attributes : array();
					}
				}
			}

			return self::$attribute_schemas[ $block_name ][ $attribute_name ] ?? null;
		}

		/**
		 * Returns the allowlist of html-source string attributes used as a backstop
		 * for blocks not classifiable via the registry.
		 *
		 * @since 7.1.0
		 *
		 * @return array<string, string[]> Map of block name to attribute keys.
		 */
		private static function html_string_attribute_allowlist(): array {
			$allowlist = array(
				'core/html'      => array( 'content' ),
				'core/freeform'  => array( 'content' ),
				'core/shortcode' => array( 'text' ),
				'core/missing'   => array( 'originalContent' ),
			);

			/**
			 * Filters the allowlist of block string attributes treated as raw HTML
			 * during real-time collaboration sanitization.
			 *
			 * @since 7.1.0
			 *
			 * @param array<string, string[]> $allowlist Map of block name to attribute keys.
			 */
			$filtered = apply_filters( 'gutenberg_sync_html_string_attributes', $allowlist );

			return is_array( $filtered ) ? $filtered : $allowlist;
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
