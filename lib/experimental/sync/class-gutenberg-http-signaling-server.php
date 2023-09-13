<?php
/**
 * Gutenberg_HTTP_Signaling_Server class
 *
 * @package    Gutenberg
 */

/**
 * Gutenberg class that contains an HTTP based signaling server used for collaborative editing.
 *
 * @access private
 * @internal
 */
class Gutenberg_HTTP_Signaling_Server {

	/**
	 * Contains the path of the subscriber to messages file.
	 * The file contains a data-structure similar to the following example:
	 * array( 2323232121 => array( 'message hello','handshake message' ) ).
	 *
	 * @access private
	 * @var array
	 */
	private static $subscriber_to_messages_path;

	/**
	 * Contains the path of the topics to subscriber file.
	 * The file contains a data-structure similar to the following example:
	 * array( 'doc1: array( 2323232121 ), 'doc2: array( 2323232123, 2323232121 ) ).
	 *
	 * @access private
	 * @var array
	 */
	private static $topics_to_subscribers_path;

	/**
	 * Contains the path of the subscribers to last connection file.
	 * The file contains a data-structure similar to the following example:
	 * array( 2323232121 => 34343433323(timestamp) ).
	 *
	 * @access private
	 * @var array
	 */
	private static $subscribers_to_last_connection_path;

	/**
	 * Contains the subscriber id of the client reading or sending messages.
	 *
	 * @access private
	 * @var Integer
	 */
	private static $subscriber_id;

	/**
	 * Adds a wp_ajax action to handle the signaling server requests.
	 */
	public static function init() {
		add_action( 'wp_ajax_gutenberg_signaling_server', array( __CLASS__, 'do_wp_ajax_action' ) );
	}

	/**
	 * Handles a wp_ajax signaling server request.
	 */
	public static function do_wp_ajax_action() {
		static::initialize_paths();

		if ( empty( $_REQUEST ) || empty( $_REQUEST['unique'] ) ) {
			die( 'no identifier' );
		}
		static::$subscriber_id = $_REQUEST['unique'];

		if ( 'GET' === $_SERVER['REQUEST_METHOD'] ) {
			static::handle_message_read_request();
		} else {
			if ( empty( $_POST ) || empty( $_POST['data'] ) ) {
				die( 'no message' );
			}
			$message = json_decode( wp_unslash( $_POST['data'] ), true );
			if ( ! $message ) {
				die( 'no message' );
			}
			static::handle_message_operation( $message );
		}

		static::clean_up_old_connections();
		exit;
	}

	/**
	 * Initializes the paths of the temporary files used.
	 */
	private static function initialize_paths() {
		static::$subscriber_to_messages_path = get_temp_dir() . DIRECTORY_SEPARATOR . 'subscribers_to_messages.txt';
		// Example: array( 2323232121 => array( 'message hello','handshake message' ) ).

		static::$topics_to_subscribers_path = get_temp_dir() . DIRECTORY_SEPARATOR . 'topics_to_subscribers.txt';
		// Example: array( 'doc1: array( 2323232121 ), 'doc2: array( 2323232123, 2323232121 ) ).

		static::$subscribers_to_last_connection_path = get_temp_dir() . DIRECTORY_SEPARATOR . 'subscribers_to_last_connection.txt';
		// Example: array( 2323232121 => 34343433323(timestamp) ).
	}

	/**
	 * Reads the contents of $fd and returns them unserialized.
	 *
	 * @access private
	 * @internal
	 *
	 * @param resource $fd  A file descriptor.
	 *
	 * @return array Unserialized contents of fd.
	 */
	private static function get_contents_from_file_descriptor( $fd ) {
		$contents_raw = stream_get_contents( $fd );
		$result       = array();
		if ( $contents_raw ) {
			$result = unserialize( $contents_raw );
		}
		return $result;
	}


	/**
	 * Makes the file descriptor content of $fd equal to the serialization of content.
	 * Overwrites what was previously in $fd.
	 *
	 * @access private
	 * @internal
	 *
	 * @param resource $fd      A file descriptor.
	 * @param array    $content Content to be serialized and written in a file descriptor.
	 */
	private static function save_contents_to_file_descriptor( $fd, $content ) {
		rewind( $fd );
		$data = serialize( $content );
		fwrite( $fd, $data );
		ftruncate( $fd, strlen( $data ) );
	}

	/**
	 * Handles a wp_ajax signaling server request of client that wants to retrieve its messages.
	 */
	private static function handle_message_read_request() {
		header( 'Content-Type: text/event-stream' );
		header( 'Cache-Control: no-cache' );
		echo 'retry: 3000' . PHP_EOL;
		$fd = fopen( static::$subscriber_to_messages_path, 'c+' );
		if( ! $fd ) {
			die( 'Could not open required file.' );
		}
		flock( $fd, LOCK_EX );
		$subscriber_to_messages = static::get_contents_from_file_descriptor( $fd );
		if ( isset( $subscriber_to_messages[ static::$subscriber_id ] ) && count( $subscriber_to_messages[ static::$subscriber_id ] ) > 0 ) {
			$messages = array_map( 'wp_json_encode', $subscriber_to_messages[ static::$subscriber_id ] );
			$subscriber_to_messages[ static::$subscriber_id ] = array();
			if ( count( $messages ) > 1 ) {
				$data = implode( '|MULTIPLE|', $messages );
			} else {
				$data = $messages[0];
			}
			if ( $data ) {
				echo 'id: ' . time() . PHP_EOL;
				echo 'event: message' . PHP_EOL;
				echo 'data: ' . $data . PHP_EOL . PHP_EOL;
			}
			static::save_contents_to_file_descriptor( $fd, $subscriber_to_messages );

		} else {
			echo PHP_EOL;
		}
		flock( $fd, LOCK_UN );
		fclose( $fd );
	}

	/**
	 * Receives a $topics_to_subscribers data-structure and an array of topics,
	 * and returns a new $topics_to_subscribers data-structure where the current subscriber is subscribed to the topics.
	 *
	 * @access private
	 * @internal
	 *
	 * @param array $topics_to_subscribers  Topics to subscribers data-structure.
	 * @param array $topics                 An array of topics e.g: array( 'doc1', 'doc2' ).
	 */
	private static function subscribe_to_topics( $topics_to_subscribers, $topics ) {
		foreach ( $topics as $topic ) {
			if ( ! $topics_to_subscribers[ $topic ] ) {
				$topics_to_subscribers[ $topic ] = array();
			}
			$topics_to_subscribers[ $topic ] = array_unique( array_merge( $topics_to_subscribers[ $topic ], array( static::$subscriber_id ) ) );
		}
		return $topics_to_subscribers;
	}

	/**
	 * Receives a $topics_to_subscribers data-structure and an array of topics,
	 * and returns a new $topics_to_subscribers data-structure where the current subscriber is not subscribed to the topics.
	 *
	 * @access private
	 * @internal
	 *
	 * @param array $topics_to_subscribers  Topics to subscribers data-structure.
	 * @param array $topics                 An array of topics e.g: array( 'doc1', 'doc2' ).
	 */
	private static function unsubscribe_from_topics( $topics_to_subscribers, $topics ) {
		foreach ( $topics as $topic ) {
			if ( $topics_to_subscribers[ $topic ] ) {
				$topics_to_subscribers[ $topic ] = array_diff( $topics_to_subscribers[ $topic ], array( static::$subscriber_id ) );
			}
		}
		return $topics_to_subscribers;
	}

	/**
	 * Handles a wp_ajax signaling server request of client that is performing an operation.
	 * An operation can be a ping to say the client is alive, sending a message, or subscribing/unscribing to a set of topics.
	 *
	 * @param array $message                 An array of topics e.g: array( 'doc1', 'doc2' ).
	 */
	private static function handle_message_operation( $message ) {
		$fd_topics_subscriber = fopen( static::$topics_to_subscribers_path, 'c+' );
		if( ! $fd_topics_subscriber ) {
			die( 'Could not open required file.' );
		}
		flock( $fd_topics_subscriber, LOCK_EX );
		$topics_to_subscribers = static::get_contents_from_file_descriptor( $fd_topics_subscriber );

		switch ( $message['type'] ) {
			case 'subscribe':
				static::save_contents_to_file_descriptor( $fd_topics_subscriber, static::subscribe_to_topics( $topics_to_subscribers, $message['topics'] ) );
				break;
			case 'unsubscribe':
				static::save_contents_to_file_descriptor( $fd_topics_subscriber, static::unsubscribe_from_topics( $topics_to_subscribers, $message['topics'] ) );
				break;
			case 'publish':
				$fd_subscriber_messages = fopen( static::$subscriber_to_messages_path, 'c+' );
				if( ! $fd_subscriber_messages ) {
					die( 'Could not open required file.' );
				}
				flock( $fd_subscriber_messages, LOCK_EX );
				$subscriber_to_messages = static::get_contents_from_file_descriptor( $fd_subscriber_messages );
				$topic                  = $message['topic'];
				$receivers              = $topics_to_subscribers[ $topic ];
				if ( $receivers ) {
					$message['clients'] = count( $receivers );
					foreach ( $receivers as $receiver ) {
						if ( ! $subscriber_to_messages[ $receiver ] ) {
							$subscriber_to_messages[ $receiver ] = array();
						}
						$subscriber_to_messages[ $receiver ][] = $message;
					}
					static::save_contents_to_file_descriptor( $fd_subscriber_messages, $subscriber_to_messages );
				}
				flock( $fd_subscriber_messages, LOCK_UN );
				fclose( $fd_subscriber_messages );
				break;
			case 'ping':
				$fd_subscriber_messages = fopen( static::$subscriber_to_messages_path, 'c+' );
				if( ! $fd_subscriber_messages ) {
					die( 'Could not open required file.' );
				}
				flock( $fd_subscriber_messages, LOCK_EX );
				$subscriber_to_messages = static::get_contents_from_file_descriptor( $fd_subscriber_messages );
				if ( ! $subscriber_to_messages[ static::$subscriber_id ] ) {
					$subscriber_to_messages[ static::$subscriber_id ] = array();
				}
				$subscriber_to_messages[ static::$subscriber_id ][] = array( 'type' => 'pong' );
				static::save_contents_to_file_descriptor( $fd_subscriber_messages, $subscriber_to_messages );
				flock( $fd_subscriber_messages, LOCK_UN );
				fclose( $fd_subscriber_messages );
				break;
		}
		flock( $fd_topics_subscriber, LOCK_UN );
		fclose( $fd_topics_subscriber );
		echo wp_json_encode( array( 'result' => 'ok' ) ), PHP_EOL, PHP_EOL;
	}

	/**
	 * Deletes messages and subcriber information of clients that have not interacted with the signaling server in a long time.
	 */
	private static function clean_up_old_connections() {
		$fd_subscribers_last_connection = fopen( static::$subscribers_to_last_connection_path, 'c+' );
		if( ! $fd_subscribers_last_connection ) {
			die( 'Could not open required file.' );
		}
		flock( $fd_subscribers_last_connection, LOCK_EX );
		$subscribers_to_last_connection_time                           = static::get_contents_from_file_descriptor( $fd_subscribers_last_connection );
		$subscribers_to_last_connection_time[ static::$subscriber_id ] = time();
		$needs_cleanup = false;
		foreach ( $subscribers_to_last_connection_time as $subscriber_id => $last_connection_time ) {
			// cleanup connections older than 24 hours.
			if ( $last_connection_time < time() - 24 * 60 * 60 ) {
				unset( $subscribers_to_last_connection_time[ $subscriber_id ] );
				$needs_cleanup = true;
			}
		}
		static::save_contents_to_file_descriptor( $fd_subscribers_last_connection, $subscribers_to_last_connection_time );

		if ( $needs_cleanup ) {
			$fd_subscriber_messages = fopen( static::$subscriber_to_messages_path, 'c+' );
			if( ! $fd_subscriber_messages ) {
				die( 'Could not open required file.' );
			}
			flock( $fd_subscriber_messages, LOCK_EX );
			$subscriber_to_messages = static::get_contents_from_file_descriptor( $fd_subscriber_messages );
			foreach ( $subscriber_to_messages as $subscriber_id => $messages ) {
				if ( ! isset( $subscribers_to_last_connection_time[ static::$subscriber_id ] ) ) {
					unset( $subscriber_to_messages[ $subscriber_id ] );
				}
			}
			static::save_contents_to_file_descriptor( $fd_subscriber_messages, $subscriber_to_messages );

			$fd_topics_subscriber = fopen( static::$topics_to_subscribers_path, 'c+' );
			if( ! $fd_topics_subscriber ) {
				die( 'Could not open required file.' );
			}
			flock( $fd_topics_subscriber, LOCK_EX );
			$topics_to_subscribers = static::get_contents_from_file_descriptor( $fd_topics_subscriber );
			foreach ( $topics_to_subscribers as $topic => $subscribers ) {
				foreach ( $subscribers as $subscriber_id ) {
					if ( ! isset( $subscribers_to_last_connection_time[ static::$subscriber_id ] ) ) {
						$topics_to_subscribers[ $topic ] = array_diff( $topics_to_subscribers[ $topic ], array( static::$subscriber_id ) );
					}
				}
			}
			static::save_contents_to_file_descriptor( $fd_topics_subscriber, $topics_to_subscribers );

			flock( $fd_subscriber_messages, LOCK_UN );
			fclose( $fd_subscriber_messages );

			flock( $fd_topics_subscriber, LOCK_UN );
			fclose( $fd_topics_subscriber );
		}
		
		flock( $fd_subscribers_last_connection, LOCK_UN );
		fclose( $fd_subscribers_last_connection );
	}


}

Gutenberg_HTTP_Signaling_Server::init();
