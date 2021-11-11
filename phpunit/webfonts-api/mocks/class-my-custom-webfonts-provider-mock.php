<?php

require_once ABSPATH . WPINC . '/webfonts-api/providers/class-wp-webfonts-provider.php';

class My_Custom_Webfonts_Provider_Mock extends WP_Webfonts_Provider {
	protected $id = 'my-custom-provider';

	protected $resource_hints = array(
		'preconnect' => array(
			array(
				'href'        => 'https://fonts.my-custom-api.com',
				'crossorigin' => 'anonymous',
			),
		),
	);

	public function get_css() {
		return "
		@font-face{
			font-family: 'Source Serif Pro';
			font-weight: 200 900;
			font-style: normal;
			font-stretch: normal;
			src: url('https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Roman.ttf.woff2') format('woff2');
		}
		@font-face{
			font-family: 'Source Serif Pro';
			font-weight: 200 900;
			font-style: italic;
			font-stretch: normal;
			src: url('https://example.com/assets/fonts/source-serif-pro/SourceSerif4Variable-Italic.ttf.woff2') format('woff2');
		}
		";
	}
}
