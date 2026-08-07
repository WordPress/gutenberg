<?php
/**
 * WP_WebSocket_Connection class
 *
 * @package gutenberg
 */

if ( ! class_exists( 'WP_WebSocket_Connection' ) ) {

	/**
	 * A single client connection to the experimental PHP WebSocket sync server.
	 *
	 * Implements the parts of RFC 6455 the sync transport needs: HTTP upgrade
	 * handshake parsing, Sec-WebSocket-Accept computation, and frame
	 * encoding/decoding for text, close, ping, and pong frames. Client frames
	 * must be masked per the RFC. Fragmented messages are rejected with a
	 * clean close, which is acceptable for this experimental transport.
	 *
	 * @since 7.4.0
	 * @access private
	 */
	class WP_WebSocket_Connection {
		/**
		 * WebSocket handshake GUID from RFC 6455.
		 *
		 * @since 7.4.0
		 * @var string
		 */
		const HANDSHAKE_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

		/**
		 * Maximum payload size (in bytes) accepted from a client.
		 *
		 * @since 7.4.0
		 * @var int
		 */
		const MAX_PAYLOAD_SIZE = 2097152; // 2 MB.

		/**
		 * Maximum size (in bytes) of an HTTP handshake request.
		 *
		 * @since 7.4.0
		 * @var int
		 */
		const MAX_HANDSHAKE_SIZE = 16384; // 16 KB.

		/**
		 * Frame opcodes.
		 *
		 * @since 7.4.0
		 * @var int
		 */
		const OPCODE_CONTINUATION = 0x0;
		const OPCODE_TEXT         = 0x1;
		const OPCODE_BINARY       = 0x2;
		const OPCODE_CLOSE        = 0x8;
		const OPCODE_PING         = 0x9;
		const OPCODE_PONG         = 0xA;

		/**
		 * Underlying stream resource.
		 *
		 * @since 7.4.0
		 * @var resource
		 */
		private $stream;

		/**
		 * Buffered bytes read from the socket, not yet consumed.
		 *
		 * @since 7.4.0
		 * @var string
		 */
		private string $read_buffer = '';

		/**
		 * Buffered bytes waiting to be written to the socket.
		 *
		 * @since 7.4.0
		 * @var string
		 */
		private string $write_buffer = '';

		/**
		 * Whether the WebSocket handshake has completed.
		 *
		 * @since 7.4.0
		 * @var bool
		 */
		private bool $is_open = false;

		/**
		 * Whether the connection has been closed.
		 *
		 * @since 7.4.0
		 * @var bool
		 */
		private bool $is_closed = false;

		/**
		 * Constructor.
		 *
		 * @since 7.4.0
		 *
		 * @param resource $stream Accepted client stream (non-blocking).
		 */
		public function __construct( $stream ) {
			$this->stream = $stream;
			stream_set_blocking( $stream, false );
		}

		/**
		 * Gets the underlying stream resource.
		 *
		 * @since 7.4.0
		 *
		 * @return resource Stream resource.
		 */
		public function get_stream() {
			return $this->stream;
		}

		/**
		 * Whether the WebSocket handshake has completed.
		 *
		 * @since 7.4.0
		 *
		 * @return bool True once the connection is upgraded.
		 */
		public function is_open(): bool {
			return $this->is_open && ! $this->is_closed;
		}

		/**
		 * Whether the connection has been closed.
		 *
		 * @since 7.4.0
		 *
		 * @return bool True if closed.
		 */
		public function is_closed(): bool {
			return $this->is_closed;
		}

		/**
		 * Whether bytes are waiting to be flushed to the socket.
		 *
		 * @since 7.4.0
		 *
		 * @return bool True if the write buffer is non-empty.
		 */
		public function has_pending_writes(): bool {
			return '' !== $this->write_buffer;
		}

		/**
		 * Reads available bytes from the socket into the buffer.
		 *
		 * @since 7.4.0
		 *
		 * @return bool False if the peer closed the connection.
		 */
		public function read_from_socket(): bool {
			if ( $this->is_closed ) {
				return false;
			}

			$data = fread( $this->stream, 65536 );

			if ( false === $data ) {
				return ! feof( $this->stream );
			}

			if ( '' === $data ) {
				return ! feof( $this->stream );
			}

			$this->read_buffer .= $data;

			return true;
		}

		/**
		 * Attempts to parse a complete HTTP upgrade request from the buffer.
		 *
		 * @since 7.4.0
		 *
		 * @return array{method: string, path: string, query: array<string, string>, headers: array<string, string>}|null|WP_Error
		 *         Parsed request, null if the request is incomplete, or WP_Error on malformed input.
		 */
		public function parse_handshake_request() {
			$header_end = strpos( $this->read_buffer, "\r\n\r\n" );

			if ( false === $header_end ) {
				if ( strlen( $this->read_buffer ) > self::MAX_HANDSHAKE_SIZE ) {
					return new WP_Error( 'websocket_handshake_too_large', 'Handshake request too large.' );
				}

				return null;
			}

			$raw_headers       = substr( $this->read_buffer, 0, $header_end );
			$this->read_buffer = substr( $this->read_buffer, $header_end + 4 );

			$lines        = explode( "\r\n", $raw_headers );
			$request_line = array_shift( $lines );
			$parts        = explode( ' ', $request_line );

			if ( count( $parts ) < 3 ) {
				return new WP_Error( 'websocket_bad_request', 'Malformed request line.' );
			}

			$method      = strtoupper( $parts[0] );
			$request_uri = $parts[1];
			$path        = (string) wp_parse_url( $request_uri, PHP_URL_PATH );
			$query_str   = (string) wp_parse_url( $request_uri, PHP_URL_QUERY );

			$query = array();
			if ( '' !== $query_str ) {
				parse_str( $query_str, $query );
			}

			$headers = array();
			foreach ( $lines as $line ) {
				$colon = strpos( $line, ':' );
				if ( false === $colon ) {
					continue;
				}

				$name             = strtolower( trim( substr( $line, 0, $colon ) ) );
				$headers[ $name ] = trim( substr( $line, $colon + 1 ) );
			}

			return array(
				'headers' => $headers,
				'method'  => $method,
				'path'    => $path,
				'query'   => $query,
			);
		}

		/**
		 * Computes the Sec-WebSocket-Accept value for a handshake key.
		 *
		 * @since 7.4.0
		 *
		 * @param string $key Client-provided Sec-WebSocket-Key.
		 * @return string Accept header value.
		 */
		public static function compute_accept_key( string $key ): string {
			// The RFC 6455 accept key requires raw binary SHA-1.
			// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode
			return base64_encode( sha1( $key . self::HANDSHAKE_GUID, true ) );
		}

		/**
		 * Sends the 101 Switching Protocols response completing the handshake.
		 *
		 * @since 7.4.0
		 *
		 * @param string $key Client-provided Sec-WebSocket-Key.
		 */
		public function accept_handshake( string $key ): void {
			$response = "HTTP/1.1 101 Switching Protocols\r\n"
				. "Upgrade: websocket\r\n"
				. "Connection: Upgrade\r\n"
				. 'Sec-WebSocket-Accept: ' . self::compute_accept_key( $key ) . "\r\n\r\n";

			$this->queue_write( $response );
			$this->is_open = true;
		}

		/**
		 * Sends a plain HTTP response (pre-upgrade) and marks the connection
		 * for closing once flushed.
		 *
		 * @since 7.4.0
		 *
		 * @param int    $status_code HTTP status code.
		 * @param string $reason      HTTP reason phrase.
		 * @param string $body        Response body.
		 */
		public function send_http_response( int $status_code, string $reason, string $body = '' ): void {
			$response = sprintf( "HTTP/1.1 %d %s\r\n", $status_code, $reason )
				. "Content-Type: text/plain\r\n"
				. 'Content-Length: ' . strlen( $body ) . "\r\n"
				. "Connection: close\r\n\r\n"
				. $body;

			$this->queue_write( $response );
		}

		/**
		 * Extracts complete WebSocket frames from the read buffer.
		 *
		 * @since 7.4.0
		 *
		 * @return array<int, array{opcode: int, payload: string}>|WP_Error
		 *         Decoded frames, or WP_Error on a protocol violation.
		 */
		public function read_frames() {
			$frames = array();

			while ( true ) {
				$buffer_length = strlen( $this->read_buffer );

				if ( $buffer_length < 2 ) {
					break;
				}

				$byte1 = ord( $this->read_buffer[0] );
				$byte2 = ord( $this->read_buffer[1] );

				$fin    = (bool) ( $byte1 & 0x80 );
				$rsv    = $byte1 & 0x70;
				$opcode = $byte1 & 0x0F;
				$masked = (bool) ( $byte2 & 0x80 );
				$length = $byte2 & 0x7F;

				if ( 0 !== $rsv ) {
					return new WP_Error( 'websocket_protocol_error', 'Reserved bits must be zero.' );
				}

				// Clients must mask frames per RFC 6455.
				if ( ! $masked ) {
					return new WP_Error( 'websocket_protocol_error', 'Client frames must be masked.' );
				}

				// Reject fragmented messages with a clean close.
				if ( ! $fin || self::OPCODE_CONTINUATION === $opcode ) {
					return new WP_Error( 'websocket_unsupported', 'Fragmented messages are not supported.' );
				}

				/*
				 * RFC 6455 section 5.5: control frames (close, ping, pong)
				 * must carry a payload of 125 bytes or less. Enforcing this
				 * also prevents a large ping from being echoed back as an
				 * equally large pong. The 7-bit length is checked before the
				 * extended-length decoding below, which control frames must
				 * not use (126/127 imply payloads over 125 bytes).
				 */
				if ( $opcode >= self::OPCODE_CLOSE && $length > 125 ) {
					return new WP_Error( 'websocket_protocol_error', 'Control frame payload too large.' );
				}

				$offset = 2;

				if ( 126 === $length ) {
					if ( $buffer_length < $offset + 2 ) {
						break;
					}

					$unpacked = unpack( 'n', substr( $this->read_buffer, $offset, 2 ) );
					$length   = $unpacked[1];
					$offset  += 2;
				} elseif ( 127 === $length ) {
					if ( $buffer_length < $offset + 8 ) {
						break;
					}

					$unpacked = unpack( 'J', substr( $this->read_buffer, $offset, 8 ) );
					$length   = $unpacked[1];
					$offset  += 8;
				}

				if ( $length < 0 || $length > self::MAX_PAYLOAD_SIZE ) {
					return new WP_Error( 'websocket_payload_too_large', 'Payload exceeds maximum size.' );
				}

				if ( $buffer_length < $offset + 4 + $length ) {
					break;
				}

				$mask_key = substr( $this->read_buffer, $offset, 4 );
				$offset  += 4;
				$payload  = substr( $this->read_buffer, $offset, $length );

				$this->read_buffer = substr( $this->read_buffer, $offset + $length );

				// Unmask the payload.
				$unmasked = '';
				for ( $i = 0; $i < $length; $i++ ) {
					$unmasked .= $payload[ $i ] ^ $mask_key[ $i % 4 ];
				}

				$frames[] = array(
					'opcode'  => $opcode,
					'payload' => $unmasked,
				);
			}

			return $frames;
		}

		/**
		 * Sends a text frame.
		 *
		 * @since 7.4.0
		 *
		 * @param string $payload UTF-8 text payload.
		 */
		public function send_text( string $payload ): void {
			$this->queue_write( self::encode_frame( self::OPCODE_TEXT, $payload ) );
		}

		/**
		 * Sends a ping frame.
		 *
		 * @since 7.4.0
		 *
		 * @param string $payload Optional ping payload.
		 */
		public function send_ping( string $payload = '' ): void {
			$this->queue_write( self::encode_frame( self::OPCODE_PING, $payload ) );
		}

		/**
		 * Sends a pong frame.
		 *
		 * @since 7.4.0
		 *
		 * @param string $payload Payload echoed from the ping frame.
		 */
		public function send_pong( string $payload = '' ): void {
			$this->queue_write( self::encode_frame( self::OPCODE_PONG, $payload ) );
		}

		/**
		 * Sends a close frame.
		 *
		 * @since 7.4.0
		 *
		 * @param int    $code   Close status code.
		 * @param string $reason Optional close reason.
		 */
		public function send_close( int $code = 1000, string $reason = '' ): void {
			$payload = pack( 'n', $code ) . $reason;
			$this->queue_write( self::encode_frame( self::OPCODE_CLOSE, $payload ) );
		}

		/**
		 * Encodes a server-to-client (unmasked) WebSocket frame.
		 *
		 * @since 7.4.0
		 *
		 * @param int    $opcode  Frame opcode.
		 * @param string $payload Frame payload.
		 * @return string Encoded frame bytes.
		 */
		public static function encode_frame( int $opcode, string $payload ): string {
			$length = strlen( $payload );
			$header = chr( 0x80 | ( $opcode & 0x0F ) );

			if ( $length < 126 ) {
				$header .= chr( $length );
			} elseif ( $length < 65536 ) {
				$header .= chr( 126 ) . pack( 'n', $length );
			} else {
				$header .= chr( 127 ) . pack( 'J', $length );
			}

			return $header . $payload;
		}

		/**
		 * Queues bytes for writing and attempts an immediate flush.
		 *
		 * @since 7.4.0
		 *
		 * @param string $data Bytes to write.
		 */
		private function queue_write( string $data ): void {
			if ( $this->is_closed ) {
				return;
			}

			$this->write_buffer .= $data;
			$this->flush_writes();
		}

		/**
		 * Flushes as much of the write buffer as the socket accepts.
		 *
		 * @since 7.4.0
		 *
		 * @return bool False if the connection failed while writing.
		 */
		public function flush_writes(): bool {
			if ( $this->is_closed || '' === $this->write_buffer ) {
				return true;
			}

			// Intentional silencing: a peer disconnect mid-write raises a
			// warning; the false return value is handled below.
			// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
			$written = @fwrite( $this->stream, $this->write_buffer );

			if ( false === $written ) {
				$this->close();
				return false;
			}

			$this->write_buffer = substr( $this->write_buffer, $written );

			return true;
		}

		/**
		 * Closes the underlying stream.
		 *
		 * @since 7.4.0
		 */
		public function close(): void {
			if ( $this->is_closed ) {
				return;
			}

			$this->is_closed = true;
			$this->is_open   = false;

			if ( is_resource( $this->stream ) ) {
				// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged
				@fclose( $this->stream );
			}
		}
	}
}
