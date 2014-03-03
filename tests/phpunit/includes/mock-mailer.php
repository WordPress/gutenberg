<?php
require_once( ABSPATH . '/wp-includes/class-phpmailer.php' );

class MockPHPMailer extends PHPMailer {
	var $mock_sent = array();

	/**
	 * Override send() so mail isn't actually sent.
	 */
	function send() {
		try {
			if ( ! $this->preSend() )
				return false;

			$this->mock_sent[] = array(
				'to'     => $this->to,
				'cc'     => $this->cc,
				'bcc'    => $this->bcc,
				'header' => $this->MIMEHeader,
				'body'   => $this->MIMEBody,
			);

			return true;
		} catch ( phpmailerException $e ) {
			return false;
		}
	}
}
