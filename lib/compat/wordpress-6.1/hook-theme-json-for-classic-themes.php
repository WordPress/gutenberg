<?php

function theme_json_current_theme_has_support( ){
	return WP_Theme_JSON_Resolver_Gutenberg::theme_has_support();
}

function theme_json_default_filter_for_classic_themes( $theme_json_data ) {
	if ( ! theme_json_current_theme_has_support() ) {
		$new_data = array(
			'version'  => 2,
			'settings' => array(
				/*
				 * We should be able to remove this.
				 * Without it, it breaks.
				 */
				"spacing" => array(
					"spacingScale" => array(
						"operator" => "*",
						"increment" => 1.5,
						"steps" => 7,
						"mediumStep" => 1.5,
						"unit" => "rem"
					),
				),
			),
			'styles'   => array(
				'elements' => array(
					'button' => array(
						'color' => array(
							'text'       => '#fff',
							'background' => '#32373c',
						),
						'spacing' => array(
							'padding' =>'calc(0.667em + 2px) calc(1.333em + 2px)',
						),
						'typography' => array(
							'fontSize'       => 'inherit',
							'fontFamily'     => 'inherit',
							'lineHeight'     => 'inherit',
							'textDecoration' => 'none',
						),
						'border' => array(
							'width' => '0',
						),
					),
				),
			),
		);
		$theme_json_data->create_with( $new_data );
	}

	return $theme_json_data;
}
add_filter( 'theme_json_default', 'theme_json_default_filter_for_classic_themes');
