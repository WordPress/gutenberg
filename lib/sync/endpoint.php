<?php
/**
 * Adds a HTTP-based signaling server for real time collaboration.
 *
 * @package gutenberg
 */

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
function _gutenberg_get_contents_from_file_descriptor( $fd ) {
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
 * @param integer $fd      A file descriptor.
 * @param array   $content Content to be serialized and written in a file descriptor.
 */
function _gutenberg_save_contents_to_file_descriptor( $fd, $content ) {
	rewind( $fd );
	$data = serialize( $content );
	fwrite( $fd, $data );
	ftruncate( $fd, strlen( $data ) );
}

/**
 * Handles HTTP requests for the gutenberg_signaling_server action.
 *
 * @access private
 * @internal
 */
function _gutenberg_wp_ajax_signaling_server() {
	session_write_close();
	$subscriber_to_messages_path = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'subscribers_to_messages.txt';
	// Example: array( 2323232121 => array( 'message hello','handshake message' ) ).

	$topics_to_subscribers_path = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'topics_to_subscribers.txt';
	// Example: array( 'doc1: array( 2323232121 ), 'doc2: array( 2323232123, 2323232121 ) ).

	$subscribers_to_last_connection_path = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'subscribers_to_last_connection.txt';
	// Example: array( 2323232121 => 34343433323(timestamp) ).

	$subscriber_id = $_REQUEST['unique'];
	if ( ! $subscriber_id ) {
		die( 'no identifier' );
	}

	if ( 'GET' === $_SERVER['REQUEST_METHOD'] ) {
		header( 'Content-Type: text/event-stream' );
		header( 'Cache-Control: no-cache' );
		echo 'retry: 3000' . PHP_EOL;
		$fd = fopen( $subscriber_to_messages_path, 'c+' );
		flock( $fd, LOCK_EX );
		$subscriber_to_messages = _gutenberg_get_contents_from_file_descriptor( $fd );
		if ( isset( $subscriber_to_messages[ $subscriber_id ] ) && count( $subscriber_to_messages[ $subscriber_id ] ) > 0 ) {
			$messages                                 = array_map( 'json_encode', $subscriber_to_messages[ $subscriber_id ] );
			$subscriber_to_messages[ $subscriber_id ] = array();
			$data                                     = null;
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
			_gutenberg_save_contents_to_file_descriptor( $fd, $subscriber_to_messages );

		} else {
			echo PHP_EOL;
		}
		flock( $fd, LOCK_UN );
		fclose( $fd );
	} else {
		$raw_data = $_POST['data'];
		$message  = json_decode( wp_unslash( $raw_data ), true );
		if ( ! $message ) {
			die( 'no message' );
		}
		$fd_topics_subscriber = fopen( $topics_to_subscribers_path, 'c+' );
		flock( $fd_topics_subscriber, LOCK_EX );
		$topics_to_subscribers = _gutenberg_get_contents_from_file_descriptor( $fd_topics_subscriber );

		switch ( $message['type'] ) {
			case 'subscribe':
				$topics = $message['topics'];
				foreach ( $topics as $topic ) {
					if ( ! $topics_to_subscribers[ $topic ] ) {
						$topics_to_subscribers[ $topic ] = array();
					}
					$topics_to_subscribers[ $topic ] = array_unique( array_merge( $topics_to_subscribers[ $topic ], array( $subscriber_id ) ) );
				}
				_gutenberg_save_contents_to_file_descriptor( $fd_topics_subscriber, $topics_to_subscribers );
				break;
			case 'unsubscribe':
				$topics = $message['topics'];
				foreach ( $topics as $topic ) {
					if ( $topics_to_subscribers[ $topic ] ) {
						$topics_to_subscribers[ $topic ] = array_diff( $topics_to_subscribers[ $topic ], array( $subscriber_id ) );
					}
				}
				_gutenberg_save_contents_to_file_descriptor( $fd_topics_subscriber, $topics_to_subscribers );
				break;
			case 'publish':
				$fd_subscriber_messages = fopen( $subscriber_to_messages_path, 'c+' );
				flock( $fd_subscriber_messages, LOCK_EX );
				$subscriber_to_messages = _gutenberg_get_contents_from_file_descriptor( $fd_subscriber_messages );
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
					_gutenberg_save_contents_to_file_descriptor( $fd_subscriber_messages, $subscriber_to_messages );
				}
				flock( $fd_subscriber_messages, LOCK_UN );
				fclose( $fd_subscriber_messages );
				break;
			case 'ping':
				$fd_subscriber_messages = fopen( $subscriber_to_messages_path, 'c+' );
				flock( $fd_subscriber_messages, LOCK_EX );
				$subscriber_to_messages = _gutenberg_get_contents_from_file_descriptor( $fd_subscriber_messages );
				if ( ! $subscriber_to_messages[ $subscriber_id ] ) {
					$subscriber_to_messages[ $subscriber_id ] = array();
				}
				$subscriber_to_messages[ $subscriber_id ][] = array( 'type' => 'pong' );
				_gutenberg_save_contents_to_file_descriptor( $fd_subscriber_messages, $subscriber_to_messages );
				flock( $fd_subscriber_messages, LOCK_UN );
				fclose( $fd_subscriber_messages );
				break;
		}
		flock( $fd_topics_subscriber, LOCK_UN );
		fclose( $fd_topics_subscriber );
		echo json_encode( array( 'result' => 'ok' ) ), PHP_EOL, PHP_EOL;
	}

	$fd_subscribers_last_connection = fopen( $subscribers_to_last_connection_path, 'c+' );
	flock( $fd_subscribers_last_connection, LOCK_EX );
	$subscribers_to_last_connection_time                   = _gutenberg_get_contents_from_file_descriptor( $fd_subscribers_last_connection );
	$subscribers_to_last_connection_time[ $subscriber_id ] = time();
	$needs_cleanup = false;
	foreach ( $subscribers_to_last_connection_time as $subscriber_id => $last_connection_time ) {
		// cleanup connections older than 24 hours.
		if ( $last_connection_time < time() - 24 * 60 * 60 ) {
			unset( $subscribers_to_last_connection_time[ $subscriber_id ] );
			$needs_cleanup = true;
		}
	}
	if ( $needs_cleanup ) {
		$fd_subscriber_messages = fopen( $subscriber_to_messages_path, 'c+' );
		flock( $fd_subscriber_messages, LOCK_EX );
		$subscriber_to_messages = _gutenberg_get_contents_from_file_descriptor( $fd_subscriber_messages );
		foreach ( $subscriber_to_messages as $subscriber_id => $messages ) {
			if ( ! isset( $subscribers_to_last_connection_time[ $subscriber_id ] ) ) {
				unset( $subscriber_to_messages[ $subscriber_id ] );
			}
		}
		_gutenberg_save_contents_to_file_descriptor( $fd_subscriber_messages, $subscriber_to_messages );
		flock( $fd_subscriber_messages, LOCK_UN );
		fclose( $fd_subscriber_messages );

		$fd_topics_subscriber = fopen( $topics_to_subscribers_path, 'c+' );
		flock( $fd_topics_subscriber, LOCK_EX );
		$topics_to_subscribers = _gutenberg_get_contents_from_file_descriptor( $fd_topics_subscriber );
		foreach ( $topics_to_subscribers as $topic => $subscribers ) {
			foreach ( $subscribers as $subscriber_id ) {
				if ( ! isset( $subscribers_to_last_connection_time[ $subscriber_id ] ) ) {
					$topics_to_subscribers[ $topic ] = array_diff( $topics_to_subscribers[ $topic ], array( $subscriber_id ) );
				}
			}
		}
		_gutenberg_save_contents_to_file_descriptor( $fd_topics_subscriber, $topics_to_subscribers );
		flock( $fd_topics_subscriber, LOCK_UN );
		fclose( $fd_topics_subscriber );
	}

	_gutenberg_save_contents_to_file_descriptor( $fd_subscribers_last_connection, $subscribers_to_last_connection_time );
	flock( $fd_subscribers_last_connection, LOCK_UN );
	fclose( $fd_subscribers_last_connection );
	exit;
}



add_action( 'wp_ajax_gutenberg_signaling_server', '_gutenberg_wp_ajax_signaling_server' );
