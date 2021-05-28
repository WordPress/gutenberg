<?php

/**
 * Test WP_Theme_JSON_Gutenberg class.
 *
 * @package Gutenberg
 */

class WP_Theme_JSON_Schema_V0_Test extends WP_UnitTestCase {

	function test_parse() {
		$theme_json_v0 = array(
			'settings' => array(
				'defaults'       => array(
					'color' => array(
						'palette' => array(
							array(
								'name'  => 'Black',
								'slug'  => 'black',
								'color' => '#00000',
							),
							array(
								'name'  => 'White',
								'slug'  => 'white',
								'color' => '#ffffff',
							),
							array(
								'name'  => 'Pale Pink',
								'slug'  => 'pale-pink',
								'color' => '#f78da7',
							),
							array(
								'name'  => 'Vivid Red',
								'slug'  => 'vivid-red',
								'color' => '#cf2e2',
							),
						),
						'custom'  => false,
						'link'    => false,
					),
				),
				'root'           => array(
					'color'  => array(
						'palette' => array(
							array(
								'name'  => 'Pale Pink',
								'slug'  => 'pale-pink',
								'color' => '#f78da7',
							),
							array(
								'name'  => 'Vivid Red',
								'slug'  => 'vivid-red',
								'color' => '#cf2e2e',
							),
						),
						'link'    => true,
					),
					'border' => array(
						'customRadius' => false,
					),
				),
				'core/paragraph' => array(
					'typography' => array(
						'dropCap' => false,
					),
				),
			),
			'styles'   => array(
				'root'       => array(
					'color' => array(
						'background' => 'purple',
						'link'       => 'red',
					),
				),
				'core/group' => array(
					'color'   => array(
						'background' => 'red',
						'link'       => 'yellow',
					),
					'spacing' => array(
						'padding' => array(
							'top' => '10px',
						),
					),
				),
			),
		);

		$actual = WP_Theme_JSON_Schema_V0::parse( $theme_json_v0 );

		$expected = array(
			'version'  => 1,
			'settings' => array(
				'color'  => array(
					'palette' => array(
						array(
							'name'  => 'Pale Pink',
							'slug'  => 'pale-pink',
							'color' => '#f78da7',
						),
						array(
							'name'  => 'Vivid Red',
							'slug'  => 'vivid-red',
							'color' => '#cf2e2e',
						),
					),
					'custom'  => false,
					'link'    => true,
				),
				'border' => array(
					'customRadius' => false,
				),
				'blocks' => array(
					'core/paragraph' => array(
						'typography' => array(
							'dropCap' => false,
						),
					),
				),
			),
			'styles'   => array(
				'color'    => array(
					'background' => 'purple',
				),
				'blocks'   => array(
					'core/group' => array(
						'color'    => array(
							'background' => 'red',
						),
						'spacing'  => array(
							'padding' => array(
								'top' => '10px',
							),
						),
						'elements' => array(
							'link' => array(
								'color' => array(
									'text' => 'yellow',
								),
							),
						),
					),
				),
				'elements' => array(
					'link' => array(
						'color' => array(
							'text' => 'red',
						),
					),
				),
			),
		);

		$this->assertEqualSetsWithIndex( $expected, $actual );
	}

	function test_get_settings() {
		$defaults   = WP_Theme_JSON_Schema_V0::ALL_BLOCKS_NAME;
		$root       = WP_Theme_JSON_Schema_V0::ROOT_BLOCK_NAME;
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'settings' => array(
					$defaults             => array(
						'color' => array(
							'customGradient' => false,
							'palette'        => array(
								array(
									'slug'  => 'white',
									'color' => 'white',
								),
								array(
									'slug'  => 'black',
									'color' => 'black',
								),
							),
						),
					),
					$root                 => array(
						'color'       => array(
							'custom'  => false,
							'palette' => array(
								array(
									'slug'  => 'grey',
									'color' => 'grey',
								),
							),
						),
						'invalid/key' => 'value',
					),
					'core/heading/h1'     => array(
						'color' => array(
							'customGradient' => false,
							'palette'        => array(
								array(
									'slug'  => 'white',
									'color' => 'white',
								),
								array(
									'slug'  => 'black',
									'color' => 'black',
								),
							),
						),
					),
					'core/heading/h2'     => array(
						'color' => array(
							'custom'  => false,
							'palette' => array(
								array(
									'slug'  => 'grey',
									'color' => 'grey',
								),
							),
						),
					),
					'core/post-title/h1'  => array(
						'color' => array(
							'customGradient' => false,
							'palette'        => array(
								array(
									'slug'  => 'white',
									'color' => 'white',
								),
								array(
									'slug'  => 'black',
									'color' => 'black',
								),
							),
						),
					),
					'core/post-title/h2'  => array(
						'color' => array(
							'custom'  => false,
							'palette' => array(
								array(
									'slug'  => 'grey',
									'color' => 'grey',
								),
							),
						),
					),
					'core/query-title/h1' => array(
						'color' => array(
							'customGradient' => false,
							'palette'        => array(
								array(
									'slug'  => 'white',
									'color' => 'white',
								),
								array(
									'slug'  => 'black',
									'color' => 'black',
								),
							),
						),
					),
					'core/query-title/h2' => array(
						'color' => array(
							'custom'  => false,
							'palette' => array(
								array(
									'slug'  => 'grey',
									'color' => 'grey',
								),
							),
						),
					),
				),
				'styles'   => array(
					$root => array(
						'color' => array(
							'link' => 'blue',
						),
					),
				),
			)
		);

		$actual = $theme_json->get_settings();

		$expected = array(
			'color'  => array(
				'custom'         => false,
				'customGradient' => false,
				'palette'        => array(
					array(
						'slug'  => 'grey',
						'color' => 'grey',
					),
				),
			),
			'blocks' => array(
				'core/heading'     => array(
					'color' => array(
						'customGradient' => false,
						'custom'         => false,
						'palette'        => array(
							array(
								'slug'  => 'grey',
								'color' => 'grey',
							),
						),
					),
				),
				'core/post-title'  => array(
					'color' => array(
						'customGradient' => false,
						'custom'         => false,
						'palette'        => array(
							array(
								'slug'  => 'grey',
								'color' => 'grey',
							),
						),
					),
				),
				'core/query-title' => array(
					'color' => array(
						'customGradient' => false,
						'custom'         => false,
						'palette'        => array(
							array(
								'slug'  => 'grey',
								'color' => 'grey',
							),
						),
					),
				),
			),
		);

		$this->assertEqualSetsWithIndex( $expected, $actual );
	}

	function test_get_stylesheet() {
		$root_name       = WP_Theme_JSON_Schema_V0::ROOT_BLOCK_NAME;
		$all_blocks_name = WP_Theme_JSON_Schema_V0::ALL_BLOCKS_NAME;

		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'settings' => array(
					$all_blocks_name => array(
						'color'      => array(
							'text'    => 'value',
							'palette' => array(
								array(
									'slug'  => 'white',
									'color' => 'white',
								),
								array(
									'slug'  => 'black',
									'color' => 'black',
								),
							),
						),
						'typography' => array(
							'fontFamilies' => array(
								array(
									'slug'       => 'small',
									'fontFamily' => '14px',
								),
								array(
									'slug'       => 'big',
									'fontFamily' => '41px',
								),
							),
						),
						'misc'       => 'value',
					),
					$root_name       => array(
						'color' => array(
							'palette' => array(
								array(
									'slug'  => 'grey',
									'color' => 'grey',
								),
							),
						),
					),
					'core/group'     => array(
						'custom' => array(
							'base-font'   => 16,
							'line-height' => array(
								'small'  => 1.2,
								'medium' => 1.4,
								'large'  => 1.8,
							),
						),
					),
				),
				'styles'   => array(
					$root_name            => array(
						'color' => array(
							'link' => '#111',
							'text' => 'var:preset|color|grey',
						),
						'misc'  => 'value',
					),
					'core/group'          => array(
						'color'   => array(
							'link' => '#333',
						),
						'spacing' => array(
							'padding' => array(
								'top'    => '12px',
								'bottom' => '24px',
							),
						),
					),
					'core/heading/h1'     => array(
						'color'      => array(
							'link' => '#111',
						),
						'typography' => array(
							'fontSize' => '1em',
						),
					),
					'core/heading/h2'     => array(
						'color'      => array(
							'link' => '#222',
						),
						'typography' => array(
							'fontSize' => '2em',
						),
					),
					'core/post-title/h2'  => array(
						'color'      => array(
							'link' => '#222',
						),
						'typography' => array(
							'fontSize' => '2em',
						),
					),
					'core/post-title/h5'  => array(
						'color'      => array(
							'link' => '#555',
						),
						'typography' => array(
							'fontSize' => '5em',
						),
					),
					'core/query-title/h4' => array(
						'color'      => array(
							'link' => '#444',
						),
						'typography' => array(
							'fontSize' => '4em',
						),
					),
					'core/query-title/h5' => array(
						'color'      => array(
							'link' => '#555',
						),
						'typography' => array(
							'fontSize' => '5em',
						),
					),
				),
				'misc'     => 'value',
			)
		);

		$this->assertEquals(
			'body{--wp--preset--color--grey: grey;--wp--preset--font-family--small: 14px;--wp--preset--font-family--big: 41px;}.wp-block-group{--wp--custom--base-font: 16;--wp--custom--line-height--small: 1.2;--wp--custom--line-height--medium: 1.4;--wp--custom--line-height--large: 1.8;}body{color: var(--wp--preset--color--grey);}a{color: #111;}h1{font-size: 1em;}h2{font-size: 2em;}.wp-block-group{padding-top: 12px;padding-bottom: 24px;}.wp-block-group a{color: #333;}h1 a,h2 a,h3 a,h4 a,h5 a,h6 a{color: #222;}.wp-block-post-title{font-size: 5em;}.wp-block-post-title a{color: #555;}.wp-block-query-title{font-size: 5em;}.wp-block-query-title a{color: #555;}.has-grey-color{color: grey !important;}.has-grey-background-color{background-color: grey !important;}.has-grey-border-color{border-color: grey !important;}',
			$theme_json->get_stylesheet()
		);
		$this->assertEquals(
			'body{color: var(--wp--preset--color--grey);}a{color: #111;}h1{font-size: 1em;}h2{font-size: 2em;}.wp-block-group{padding-top: 12px;padding-bottom: 24px;}.wp-block-group a{color: #333;}h1 a,h2 a,h3 a,h4 a,h5 a,h6 a{color: #222;}.wp-block-post-title{font-size: 5em;}.wp-block-post-title a{color: #555;}.wp-block-query-title{font-size: 5em;}.wp-block-query-title a{color: #555;}.has-grey-color{color: grey !important;}.has-grey-background-color{background-color: grey !important;}.has-grey-border-color{border-color: grey !important;}',
			$theme_json->get_stylesheet( 'block_styles' )
		);
		$this->assertEquals(
			'body{--wp--preset--color--grey: grey;--wp--preset--font-family--small: 14px;--wp--preset--font-family--big: 41px;}.wp-block-group{--wp--custom--base-font: 16;--wp--custom--line-height--small: 1.2;--wp--custom--line-height--medium: 1.4;--wp--custom--line-height--large: 1.8;}',
			$theme_json->get_stylesheet( 'css_variables' )
		);
	}

}
