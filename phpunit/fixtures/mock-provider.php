<?php

class Mock_Provider extends WP_Webfonts_Provider {
	/**
	 * The provider's unique ID.
	 *
	 * @var string
	 */
	protected $id = 'mock';

	public function get_css() {
		$handles = array_keys( $this->webfonts );
		return implode( '; ', $handles );
		return sprintf( $this->css, implode( '; ', $handles ) );
	}

	/**
	 * Gets the `<style>` element for wrapping the `@font-face` CSS.
	 *
	 * @since X.X.X
	 *
	 * @return string The style element.
	 */
	protected function get_style_element() {
		return '<mock id="wp-webfonts-mock" attr="some-attr">%s</mock>\n';
	}
}
