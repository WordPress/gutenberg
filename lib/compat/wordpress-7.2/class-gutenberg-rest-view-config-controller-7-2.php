<?php
/**
 * REST API: Gutenberg_REST_View_Config_Controller_7_2 class
 *
 * @package gutenberg
 */

/**
 * Controller which provides a REST endpoint for retrieving the default
 * view configuration for a given entity type.
 *
 * Extends the 7.1 controller with the properties the configuration gained in
 * 7.2, leaving the shipped schema of that release untouched.
 *
 * @since 7.2.0
 */
class Gutenberg_REST_View_Config_Controller_7_2 extends Gutenberg_REST_View_Config_Controller_7_1 {

	/**
	 * Retrieves the view configuration schema, conforming to JSON Schema.
	 *
	 * Adds the `count` of each entry in the view list, which is provided by
	 * _gutenberg_add_counts_to_page_view_config().
	 *
	 * @since 7.2.0
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		$schema = parent::get_item_schema();

		$schema['properties']['view_list']['items']['properties']['count'] = array(
			'description' => __( 'Number of items the view holds.', 'gutenberg' ),
			'type'        => 'integer',
			'readonly'    => true,
		);

		return $schema;
	}
}
