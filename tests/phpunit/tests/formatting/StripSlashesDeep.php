<?php

/**
 * @group formatting
 */
class Tests_Formatting_StripSlashesDeep extends WP_UnitTestCase {
	/**
	 * @ticket 18026
	 */
	function test_preserves_original_datatype() {

		$this->assertEquals( true, stripslashes_deep( true ) );
		$this->assertEquals( false, stripslashes_deep( false ) );
		$this->assertEquals( 4, stripslashes_deep( 4 ) );
		$this->assertEquals( 'foo', stripslashes_deep( 'foo' ) );
		$arr = array( 'a' => true, 'b' => false, 'c' => 4, 'd' => 'foo' );
		$arr['e'] = $arr; // Add a sub-array
		$this->assertEquals( $arr, stripslashes_deep( $arr ) ); // Keyed array
		$this->assertEquals( array_values( $arr ), stripslashes_deep( array_values( $arr ) ) ); // Non-keyed

		$obj = new stdClass;
		foreach ( $arr as $k => $v )
			$obj->$k = $v;
		$this->assertEquals( $obj, stripslashes_deep( $obj ) );
	}

	function test_strips_slashes() {
		$old = "I can\'t see, isn\'t that it?";
		$new = "I can't see, isn't that it?";
		$this->assertEquals( $new, stripslashes_deep( $old ) );
		$this->assertEquals( $new, stripslashes_deep( "I can\\'t see, isn\\'t that it?" ) );
		$this->assertEquals( array( 'a' => $new ), stripslashes_deep( array( 'a' => $old ) ) ); // Keyed array
		$this->assertEquals( array( $new ), stripslashes_deep( array( $old ) ) ); // Non-keyed

		$obj_old = new stdClass;
		$obj_old->a = $old;
		$obj_new = new stdClass;
		$obj_new->a = $new;
		$this->assertEquals( $obj_new, stripslashes_deep( $obj_old ) );
	}

	function test_permits_escaped_slash() {
		$txt = "I can't see, isn\'t that it?";
		$this->assertEquals( $txt, stripslashes_deep( "I can\'t see, isn\\\'t that it?" ) );
		$this->assertEquals( $txt, stripslashes_deep( "I can\'t see, isn\\\\\'t that it?" ) );
	}
}
