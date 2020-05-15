<?php
/**
 * REST API => REST_Nav_Menu_Items_Batch_Processor_Test class
 *
 * @package    WordPress
 * @subpackage REST_API
 */

/**
 * Tests for REST API batch processor for Menu items.
 *
 * @see WP_UnitTestCase
 */
class REST_Nav_Menu_Items_Batch_Processor_Test extends WP_UnitTestCase {

	/**
	 * @var int
	 */
	protected $menu_id;

	/**
	 * @var int
	 */
	protected $tag_id;

	/**
	 * @var int
	 */
	protected $menu_item_id;

	/**
	 * @var WP_REST_Menu_Items_Batch_Processor
	 */
	protected $batch_processor;

	/**
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * @var int
	 */
	protected static $subscriber_id;

	/**
	 *
	 */
	const POST_TYPE = 'nav_menu_item';

	/**
	 * Create fake data before our tests run.
	 *
	 * @param WP_UnitTest_Factory $factory Helper that lets us create fake data.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$admin_id      = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
		self::$subscriber_id = $factory->user->create(
			array(
				'role' => 'subscriber',
			)
		);
	}

	/**
	 *
	 */
	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		self::delete_user( self::$subscriber_id );
	}

	/**
	 *
	 */
	public function setUp() {
		parent::setUp();

		$this->tag_id = self::factory()->tag->create();

		$this->menu_id = wp_create_nav_menu( rand_str() );

		$request               = new WP_REST_Request( 'POST', '/__experimental/menu-items/batch' );
		$controller            = new WP_REST_Menu_Items_Controller( 'nav_menu_item' );
		$this->batch_processor = new WP_REST_Menu_Items_Batch_Processor(
			$this->menu_id,
			$controller,
			$request
		);
	}

	/**
	 *
	 */
	public function test_compute_batch_returns_delete_when_empty_tree_is_provided_single_item() {
		$menu_item_id = $this->create_menu_item( 0 );
		$batch        = $this->batch_processor->compute_batch( array() );

		$this->assertEquals(
			array(
				$this->delete_operation( $menu_item_id ),
			),
			$batch
		);
	}

	/**
	 *
	 */
	public function test_compute_batch_returns_deletes_when_empty_tree_is_provided_flat_list() {
		$menu_item_ids = array(
			$this->create_menu_item( 0 ),
			$this->create_menu_item( 0 ),
			$this->create_menu_item( 0 ),
			$this->create_menu_item( 0 ),
			$this->create_menu_item( 0 ),
		);

		$batch = $this->batch_processor->compute_batch( array() );

		$expected_operations = array();
		foreach ( $menu_item_ids as $id ) {
			$expected_operations[] = $this->delete_operation( $id );
		}

		$this->assertEquals(
			$expected_operations,
			$batch
		);
	}

	/**
	 *
	 */
	public function test_compute_batch_returns_deletes_when_empty_tree_is_provided_nested_list() {
		$menu_item_ids = array(
			$this->create_menu_item( 0 ),
			$this->create_menu_item( 0 ),
			$this->create_menu_item( 0 ),
			$this->create_menu_item( 0 ),
			$this->create_menu_item( 0 ),
		);

		$menu_item_ids[] = $this->create_menu_item( $menu_item_ids[0] );
		$menu_item_ids[] = $this->create_menu_item( $menu_item_ids[ count( $menu_item_ids ) - 1 ] );
		$menu_item_ids[] = $this->create_menu_item( $menu_item_ids[ count( $menu_item_ids ) - 2 ] );
		$menu_item_ids[] = $this->create_menu_item( $menu_item_ids[ count( $menu_item_ids ) - 1 ] );
		$menu_item_ids[] = $this->create_menu_item( $menu_item_ids[1] );
		$menu_item_ids[] = $this->create_menu_item( $menu_item_ids[ count( $menu_item_ids ) - 1 ] );

		$batch = $this->batch_processor->compute_batch( array() );

		$expected_operations = array();
		foreach ( $menu_item_ids as $id ) {
			$expected_operations[] = $this->delete_operation( $id );
		}

		$this->assertEquals(
			$expected_operations,
			$batch
		);
	}

	/**
	 *
	 */
	public function test_compute_batch_refuses_to_produce_an_insert() {
		$tree = array( $this->create_tree_item( 0 ) );
		unset( $tree[0]['id'] );
		$batch = $this->batch_processor->compute_batch( $tree );

		$this->assertTrue( is_wp_error( $batch ) );
		$this->assertEquals( 'insert_unsupported', $batch->get_error_code() );
	}

	/**
	 *
	 */
	public function test_compute_batch_returns_update_when_single_item_to_update_is_provided() {
		$menu_item_id    = $this->create_menu_item( 0 );
		$input_menu_item = $this->create_tree_item( $menu_item_id );
		$tree            = array( $input_menu_item );

		$batch = $this->batch_processor->compute_batch( $tree );

		unset( $input_menu_item['children'] );
		$input_menu_item['parent']     = 0;
		$input_menu_item['menu_order'] = 1;

		// @TODO: Delete menu item from the previous test case
		$this->assertEquals(
			array(
				$this->update_operation( $input_menu_item ),
			),
			$batch
		);
	}

	/**
	 *
	 */
	protected function delete_operation( $menu_item_id ) {
		return
			array(
				'delete',
				array(
					'menus' => $this->menu_id,
					'force' => true,
					'id'    => $menu_item_id,
				),
			);
	}

	/**
	 *
	 */
	protected function update_operation( $raw_menu_item ) {
		return
			array(
				'update',
				$raw_menu_item,
			);
	}

	/**
	 *
	 * @param int $parent_id Parent id.
	 */
	protected function create_menu_item( $parent_id ) {
		return wp_update_nav_menu_item(
			$this->menu_id,
			0,
			array(
				'menu-item-type'      => 'taxonomy',
				'menu-item-object'    => 'post_tag',
				'menu-item-object-id' => $this->tag_id,
				'menu-item-status'    => 'publish',
				'menu-item-parent-id' => $parent_id,
			)
		);
	}

	/**
	 *
	 */
	protected function create_tree_item( $id ) {
		return array(
			'id'          => $id + 1,
			'title'       => 'Be first',
			'status'      => 'publish',
			'url'         => 'http://localhost:8888/?page_id=5',
			'attr_title'  => '',
			'description' => '',
			'type'        => 'custom',
			'type_label'  => 'Custom Link',
			'object'      => 'custom',
			'menu_order'  => 1,
			'target'      => '',
			'classes'     => array(
				'',
			),
			'xfn'         => array(
				'',
			),
			'meta'        => array(),
			'menus'       => $this->menu_id,
			'children'    => array(),
		);
	}


}
