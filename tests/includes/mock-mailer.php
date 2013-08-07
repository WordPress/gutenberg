<?php
require_once( ABSPATH . '/wp-includes/class-phpmailer.php' );

class MockPHPMailer extends PHPMailer {
	var $mock_sent = array();

	// override the Send function so it doesn't actually send anything
	function Send() {
		try {
			if ( ! $this->PreSend() )
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
