<?php

class Mock_Provider extends WP_Webfonts_Provider {
	/**
	 * The provider's unique ID.
	 *
	 * @var string
	 */
	protected $id = 'mock';

	/**
	 * CSS to print.
	 *
	 * @var string
	 */
	public $css = '<mock id="wp-webfonts-mock" attr="some-attr">%s</mock>\n';

	public function get_css() {
		$handles = array_keys( $this->webfonts );
		return sprintf( $this->css, implode( '; ', $handles ) );
	}
}
