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
 * Extends the 7.1 controller to describe the table column styles in the
 * item schema.
 *
 * @since 7.2.0
 *
 * @see Gutenberg_REST_View_Config_Controller_7_1
 */
class Gutenberg_REST_View_Config_Controller_7_2 extends Gutenberg_REST_View_Config_Controller_7_1 {

	/**
	 * Returns the schema for the ColumnStyle type.
	 *
	 * @since 7.2.0 Added descriptions to the column style properties.
	 *
	 * @return array Schema for a column style object.
	 */
	protected function get_column_style_schema() {
		$schema = parent::get_column_style_schema();

		$schema['properties']['width']['description']    = __( 'The width of the column.', 'gutenberg' );
		$schema['properties']['maxWidth']['description'] = __( 'The maximum width of the column.', 'gutenberg' );
		$schema['properties']['minWidth']['description'] = __( 'The minimum width of the column.', 'gutenberg' );
		$schema['properties']['align']['description']    = __( 'The horizontal alignment of the column content.', 'gutenberg' );

		return $schema;
	}

	/**
	 * Returns the layout schema for table-type views (ViewTable, ViewPickerTable).
	 *
	 * @since 7.2.0 Added a description to the `styles` property.
	 *
	 * @return array Schema for a table layout object.
	 */
	protected function get_table_layout_schema() {
		$schema = parent::get_table_layout_schema();

		$schema['properties']['styles']['description'] = __( 'Column styles keyed by field id, for the columns listed in the view fields. The primary column (title, media, and description fields) ignores these styles; in the table layout it takes the width left over by the other columns, or the last column does when there is no primary column.', 'gutenberg' );

		return $schema;
	}
}
