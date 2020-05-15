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

		$this->menu_item_id = $this->create_menu_item( 0 );

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
	public function test_compute_batch() {
		$tree  = $this->create_one_item_tree();
		$batch = $this->batch_processor->compute_batch( $tree );

		$expected_update           = $tree[0];
		$expected_update['parent'] = 0;
		unset( $expected_update['children'] );
		$this->assertEquals(
			array(
				array( 'update', $expected_update ),
				array(
					'delete',
					array(
						'menus' => $this->menu_id,
						'force' => true,
						'id'    => $this->menu_item_id,
					),
				),
			),
			$batch
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
	protected function create_one_item_tree() {
		return array(
			array(
				'id'          => $this->menu_item_id + 1,
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
			),
		);
	}


}
