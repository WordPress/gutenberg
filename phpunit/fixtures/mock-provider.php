<?php

class Mock_Provider extends WP_Fonts_Provider {
	/**
	 * The provider's unique ID.
	 *
	 * @var string
	 */
	protected $id = 'mock';

	public function get_css() {
		$handles = array_keys( $this->fonts );
		return implode( '; ', $handles );
	}

	/**
	 * Gets the `<style>` element for wrapping the `@font-face` CSS.
	 *
	 * @since X.X.X
	 *
	 * @return string The style element.
	 */
	protected function get_style_element() {
		return '<mock id="wp-fonts-mock" attr="some-attr">%s</mock>\n';
	}
}
