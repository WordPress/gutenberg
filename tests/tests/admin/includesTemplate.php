<?php
/**
 * @group admin
 */
class Tests_Admin_includesTemplate extends WP_UnitTestCase {
	function test_equal() {
		$this->assertEquals(' selected=\'selected\'', selected('foo','foo',false));
		$this->assertEquals(' checked=\'checked\'', checked('foo','foo',false));

		$this->assertEquals(' selected=\'selected\'', selected('1',1,false));
		$this->assertEquals(' checked=\'checked\'', checked('1',1,false));

		$this->assertEquals(' selected=\'selected\'', selected('1',true,false));
		$this->assertEquals(' checked=\'checked\'', checked('1',true,false));

		$this->assertEquals(' selected=\'selected\'', selected(1,1,false));
		$this->assertEquals(' checked=\'checked\'', checked(1,1,false));

		$this->assertEquals(' selected=\'selected\'', selected(1,true,false));
		$this->assertEquals(' checked=\'checked\'', checked(1,true,false));

		$this->assertEquals(' selected=\'selected\'', selected(true,true,false));
		$this->assertEquals(' checked=\'checked\'', checked(true,true,false));

		$this->assertEquals(' selected=\'selected\'', selected('0',0,false));
		$this->assertEquals(' checked=\'checked\'', checked('0',0,false));

		$this->assertEquals(' selected=\'selected\'', selected(0,0,false));
		$this->assertEquals(' checked=\'checked\'', checked(0,0,false));

		$this->assertEquals(' selected=\'selected\'', selected('',false,false));
		$this->assertEquals(' checked=\'checked\'', checked('',false,false));

		$this->assertEquals(' selected=\'selected\'', selected(false,false,false));
		$this->assertEquals(' checked=\'checked\'', checked(false,false,false));
	}

	function test_notequal() {
		$this->assertEquals('', selected('0','',false));
		$this->assertEquals('', checked('0','',false));

		$this->assertEquals('', selected(0,'',false));
		$this->assertEquals('', checked(0,'',false));

		$this->assertEquals('', selected(0,false,false));
		$this->assertEquals('', checked(0,false,false));
	}
}
