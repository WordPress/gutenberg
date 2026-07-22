<?php
/**
 * Plugin Name: Gutenberg Test View Config Extensibility
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-view-config-extensibility
 */

/**
 * Customizes the Pages view configuration for end-to-end testing.
 *
 * @param Gutenberg_View_Config_Data $data The Pages view configuration.
 * @return Gutenberg_View_Config_Data The customized configuration.
 */
function gutenberg_test_customize_page_view_config( $data ) {
	$data->merge(
		array(
			'default_view' => array(
				'type' => 'table',
				'sort' => array(
					'field'     => 'date',
					'direction' => 'desc',
				),
			),
			'view_list'    => array(
				array(
					'slug'  => 'drafts',
					'title' => 'In progress',
					'view'  => array(
						'filters' => array(
							array(
								'field'    => 'date',
								'operator' => 'after',
								'value'    => '2018-01-01T00:00:00',
								'isLocked' => true,
							),
						),
					),
				),
				array(
					'slug'  => 'published-after-2020',
					'title' => 'Published after 2020',
					'view'  => array(
						'filters' => array(
							array(
								'field'    => 'status',
								'operator' => 'isAny',
								'value'    => 'publish',
								'isLocked' => true,
							),
							array(
								'field'    => 'date',
								'operator' => 'after',
								'value'    => '2020-12-31T23:59:59',
								'isLocked' => true,
							),
						),
					),
				),
			),
			'form'         => array(
				'layout' => array( 'type' => 'regular' ),
			),
		),
		1
	);

	$data->remove(
		array(
			'default_view' => array(
				'fields' => array( 'author' ),
			),
			'view_list'    => array( 'future' ),
		),
		1
	);

	$data->set(
		array(
			'default_layouts' => array(
				'table' => array(
					'layout' => array(
						'styles' => array(
							'status' => array(
								'width' => '240px',
							),
						),
					),
				),
			),
		),
		1
	);

	$data->replace(
		array(
			'form' => array(
				'fields' => array( 'slug' ),
			),
		),
		1
	);

	return $data;
}
add_filter(
	'get_entity_view_config_postType_page',
	'gutenberg_test_customize_page_view_config'
);
