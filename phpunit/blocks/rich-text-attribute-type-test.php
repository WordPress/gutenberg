<?php
/**
 * Tests for rich text block attribute types.
 *
 * @package gutenberg
 */

/**
 * @group blocks
 */
class Tests_Blocks_Rich_Text_Attribute_Type extends WP_UnitTestCase {
	const BLOCK_NAME = 'test/rich-text-attribute-type';

	/**
	 * Admin user id.
	 *
	 * @var int
	 */
	protected static $admin_id;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$admin_id = $factory->user->create( array( 'role' => 'administrator' ) );
	}

	public function tear_down() {
		unregister_block_type( self::BLOCK_NAME );
		wp_set_current_user( 0 );

		parent::tear_down();
	}

	private function assert_rich_text_attribute_types_are_preserved(
		$block_type,
		$attribute_names
	) {
		foreach ( $attribute_names as $attribute_name ) {
			$this->assertSame( 'rich-text', $block_type->attributes[ $attribute_name ]['type'] );
			$this->assertSame( 'rich-text', $block_type->attributes[ $attribute_name ]['source'] );
		}
	}

	private function register_test_block() {
		register_block_type(
			self::BLOCK_NAME,
			array(
				'attributes'      => array(
					'content' => array(
						'type'   => 'rich-text',
						'source' => 'rich-text',
					),
					'default' => array(
						'type'   => 'rich-text',
						'source' => 'rich-text',
					),
					'enum'    => array(
						'type'   => 'rich-text',
						'source' => 'rich-text',
					),
					'example' => array(
						'type'   => 'rich-text',
						'source' => 'rich-text',
					),
					'type'    => array(
						'type'   => 'rich-text',
						'source' => 'rich-text',
					),
				),
				'render_callback' => static function ( $attributes ) {
					return implode(
						'|',
						array(
							$attributes['content'],
							$attributes['default'],
							$attributes['enum'],
							$attributes['example'],
							$attributes['type'],
						)
					);
				},
			)
		);
	}

	public function test_rich_text_attribute_type_is_preserved_for_rest_validation() {
		$attribute_values = array(
			'content' => 'Rich text content',
			'default' => 'Default attribute content',
			'enum'    => 'Enum attribute content',
			'example' => 'Example attribute content',
			'type'    => 'Type attribute content',
		);

		$this->register_test_block();

		$block_type = WP_Block_Type_Registry::get_instance()->get_registered( self::BLOCK_NAME );

		$this->assert_rich_text_attribute_types_are_preserved(
			$block_type,
			array_keys( $attribute_values )
		);

		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'GET', '/wp/v2/block-renderer/' . self::BLOCK_NAME );
		$request->set_param( 'attributes', $attribute_values );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame(
			array(
				'rendered' => implode( '|', $attribute_values ),
			),
			$response->get_data()
		);
		$this->assert_rich_text_attribute_types_are_preserved(
			$block_type,
			array_keys( $attribute_values )
		);
	}

	public function test_rich_text_attribute_type_is_preserved_for_block_rendering() {
		$attribute_values = array(
			'content' => 'Rich text content',
			'default' => 'Default attribute content',
			'enum'    => 'Enum attribute content',
			'example' => 'Example attribute content',
			'type'    => 'Type attribute content',
		);

		$this->register_test_block();

		$block_type = WP_Block_Type_Registry::get_instance()->get_registered( self::BLOCK_NAME );

		$this->assert_rich_text_attribute_types_are_preserved(
			$block_type,
			array_keys( $attribute_values )
		);

		$doing_it_wrong_messages = array();
		$collect_doing_it_wrong  = static function (
			$function_name,
			$message
		) use (
			&$doing_it_wrong_messages
		) {
			if ( 'rest_validate_value_from_schema' === $function_name ) {
				$doing_it_wrong_messages[] = $message;
			}
		};
		add_action( 'doing_it_wrong_run', $collect_doing_it_wrong, 10, 2 );

		try {
			$rendered_block = render_block(
				array(
					'blockName'    => self::BLOCK_NAME,
					'attrs'        => $attribute_values,
					'innerBlocks'  => array(),
					'innerHTML'    => '',
					'innerContent' => array(),
				)
			);
		} finally {
			remove_action( 'doing_it_wrong_run', $collect_doing_it_wrong, 10 );
		}

		$this->assertSame( implode( '|', $attribute_values ), $rendered_block );
		$this->assertSame( array(), $doing_it_wrong_messages );
		$this->assert_rich_text_attribute_types_are_preserved(
			$block_type,
			array_keys( $attribute_values )
		);
	}
}
