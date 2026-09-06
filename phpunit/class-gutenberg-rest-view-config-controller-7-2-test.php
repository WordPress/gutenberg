<?php
/**
 * Unit tests covering Gutenberg_REST_View_Config_Controller_7_2 functionality.
 *
 * @package gutenberg
 *
 * @coversDefaultClass Gutenberg_REST_View_Config_Controller_7_2
 */
class Tests_REST_View_Config_Controller_7_2 extends WP_Test_REST_TestCase {

	/**
	 * The REST route the controller registers.
	 */
	const ROUTE = '/wp/v2/view-config';

	/**
	 * The route is served by the 7.2 controller, not the 7.1 one.
	 */
	public function test_route_is_served_by_the_7_2_controller() {
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( self::ROUTE, $routes );
		$this->assertCount( 1, $routes[ self::ROUTE ], 'The route should be registered once.' );
		$this->assertInstanceOf( 'Gutenberg_REST_View_Config_Controller_7_2', $routes[ self::ROUTE ][0]['callback'][0] );
	}

	/**
	 * The table layout schema describes the column styles.
	 *
	 * @covers ::get_item_schema
	 * @covers ::get_table_layout_schema
	 * @covers ::get_column_style_schema
	 */
	public function test_item_schema_describes_table_column_styles() {
		$controller = new Gutenberg_REST_View_Config_Controller_7_2();
		$schema     = $controller->get_item_schema();

		$styles = $schema['properties']['default_layouts']['properties']['table']['properties']['layout']['properties']['styles'];

		$this->assertArrayHasKey( 'description', $styles );
		foreach ( array( 'width', 'maxWidth', 'minWidth', 'align' ) as $property ) {
			$this->assertArrayHasKey( 'description', $styles['additionalProperties']['properties'][ $property ], "The `$property` column style should be described." );
		}
	}
}
