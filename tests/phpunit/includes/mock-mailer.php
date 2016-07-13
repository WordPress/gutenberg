<?php
require_once( ABSPATH . '/wp-includes/class-phpmailer.php' );

class MockPHPMailer extends PHPMailer {
	var $mock_sent = array();

	function preSend() {
		$this->Encoding = '8bit';
		return parent::preSend();
	}

	/**
	 * Override postSend() so mail isn't actually sent.
	 */
	function postSend() {
		$this->mock_sent[] = array(
			'to'      => $this->to,
			'cc'      => $this->cc,
			'bcc'     => $this->bcc,
			'header'  => $this->MIMEHeader . $this->mailHeader,
			'subject' => $this->Subject,
			'body'    => $this->MIMEBody,
		);

		return true;
	}

	/**
	 * Decorator to return the information for a sent mock.
	 *
	 * @since 4.5.0
	 *
	 * @param int $index Optional. Array index of mock_sent value.
	 * @return object
	 */
	public function get_sent( $index = 0 ) {
		$retval = false;
		if ( isset( $this->mock_sent[ $index ] ) ) {
			$retval = (object) $this->mock_sent[ $index ];
		}
		return $retval;
	}

	/**
	 * Get a recipient for a sent mock.
	 *
	 * @since 4.5.0
	 *
	 * @param string $address_type    The type of address for the email such as to, cc or bcc.
	 * @param int    $mock_sent_index Optional. The sent_mock index we want to get the recipient for.
	 * @param int    $recipient_index Optional. The recipient index in the array.
	 * @return bool|object Returns object on success, or false if any of the indices don't exist.
	 */
	public function get_recipient( $address_type, $mock_sent_index = 0, $recipient_index = 0 ) {
		$retval = false;
		$mock = $this->get_sent( $mock_sent_index );
		if ( $mock ) {
			if ( isset( $mock->{$address_type}[ $recipient_index ] ) ) {
				$address_index = $mock->{$address_type}[ $recipient_index ];
				$recipient_data = array(
					'address' => ( isset( $address_index[0] ) && ! empty( $address_index[0] ) ) ? $address_index[0] : 'No address set',
					'name'    => ( isset( $address_index[1] ) && ! empty( $address_index[1] ) ) ? $address_index[1] : 'No name set',
				);

				$retval = (object) $recipient_data;
			}
		}

		return $retval;
	}
}

/**
 * Helper method to return the global phpmailer instance defined in the bootstrap
 *
 * @since 4.4.0
 *
 * @return object|bool
 */
function tests_retrieve_phpmailer_instance() {
	$mailer = false;
	if ( isset( $GLOBALS['phpmailer'] ) ) {
		$mailer = $GLOBALS['phpmailer'];
	}
	return $mailer;
}

/**
 * Helper method to reset the phpmailer instance.
 *
 * @since 4.6.0
 *
 * @return bool
 */
function reset_phpmailer_instance() {
	$mailer = tests_retrieve_phpmailer_instance();
	if ( $mailer && isset( $mailer->mock_sent ) ) {
		unset( $mailer->mock_sent );
		return true;
	}

	return false;
}
