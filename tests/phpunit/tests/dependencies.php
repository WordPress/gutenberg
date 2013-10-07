<?php
/**
 * @group dependencies
 * @group scripts
 */
class Tests_Dependencies extends WP_UnitTestCase {
	function test_add() {
		$dep = new WP_Dependencies;

		$this->assertTrue($dep->add( 'one', '' ));
		$this->assertTrue($dep->add( 'two', '' ));

		$this->assertInstanceOf('_WP_Dependency', $dep->query( 'one' ));
		$this->assertInstanceOf('_WP_Dependency', $dep->query( 'two' ));

		//Cannot reuse names
		$this->assertFalse($dep->add( 'one', '' ));
	}

	function test_remove() {
		$dep = new WP_Dependencies;

		$this->assertTrue($dep->add( 'one', '' ));
		$this->assertTrue($dep->add( 'two', '' ));

		$dep->remove( 'one' );

		$this->assertFalse($dep->query( 'one'));
		$this->assertInstanceOf('_WP_Dependency', $dep->query( 'two' ));

	}

	function test_enqueue() {
		$dep = new WP_Dependencies;

		$this->assertTrue($dep->add( 'one', '' ));
		$this->assertTrue($dep->add( 'two', '' ));

		$this->assertFalse($dep->query( 'one', 'queue' ));
		$dep->enqueue('one');
		$this->assertTrue($dep->query( 'one', 'queue' ));
		$this->assertFalse($dep->query( 'two', 'queue' ));

		$dep->enqueue('two');
		$this->assertTrue($dep->query( 'one', 'queue' ));
		$this->assertTrue($dep->query( 'two', 'queue' ));
	}

	function test_dequeue() {
		$dep = new WP_Dependencies;

		$this->assertTrue($dep->add( 'one', '' ));
		$this->assertTrue($dep->add( 'two', '' ));

		$dep->enqueue('one');
		$dep->enqueue('two');
		$this->assertTrue($dep->query( 'one', 'queue' ));
		$this->assertTrue($dep->query( 'two', 'queue' ));

		$dep->dequeue('one');
		$this->assertFalse($dep->query( 'one', 'queue' ));
		$this->assertTrue($dep->query( 'two', 'queue' ));

		$dep->dequeue('two');
		$this->assertFalse($dep->query( 'one', 'queue' ));
		$this->assertFalse($dep->query( 'two', 'queue' ));
	}

	function test_enqueue_args() {
		$dep = new WP_Dependencies;

		$this->assertTrue($dep->add( 'one', '' ));
		$this->assertTrue($dep->add( 'two', '' ));

		$this->assertFalse($dep->query( 'one', 'queue' ));
		$dep->enqueue('one?arg');
		$this->assertTrue($dep->query( 'one', 'queue' ));
		$this->assertFalse($dep->query( 'two', 'queue' ));
		$this->assertEquals('arg', $dep->args['one']);

		$dep->enqueue('two?arg');
		$this->assertTrue($dep->query( 'one', 'queue' ));
		$this->assertTrue($dep->query( 'two', 'queue' ));
		$this->assertEquals('arg', $dep->args['two']);
	}

	function test_dequeue_args() {
		$dep = new WP_Dependencies;

		$this->assertTrue($dep->add( 'one', '' ));
		$this->assertTrue($dep->add( 'two', '' ));

		$dep->enqueue('one?arg');
		$dep->enqueue('two?arg');
		$this->assertTrue($dep->query( 'one', 'queue' ));
		$this->assertTrue($dep->query( 'two', 'queue' ));
		$this->assertEquals('arg', $dep->args['one']);
		$this->assertEquals('arg', $dep->args['two']);

		$dep->dequeue('one');
		$this->assertFalse($dep->query( 'one', 'queue' ));
		$this->assertTrue($dep->query( 'two', 'queue' ));
		$this->assertFalse(isset($dep->args['one']));

		$dep->dequeue('two');
		$this->assertFalse($dep->query( 'one', 'queue' ));
		$this->assertFalse($dep->query( 'two', 'queue' ));
		$this->assertFalse(isset($dep->args['two']));
	}

	/**
	 * @ticket 21741
	 */
	function test_query_and_registered_enqueued() {
		$dep = new WP_Dependencies;

		$this->assertTrue( $dep->add( 'one', '' ) );
		$this->assertInstanceOf( '_WP_Dependency', $dep->query( 'one' ) );
		$this->assertInstanceOf( '_WP_Dependency', $dep->query( 'one', 'registered' ) );
		$this->assertInstanceOf( '_WP_Dependency', $dep->query( 'one', 'scripts' ) );

		$this->assertFalse( $dep->query( 'one', 'enqueued' ) );
		$this->assertFalse( $dep->query( 'one', 'queue' ) );

		$dep->enqueue( 'one' );

		$this->assertTrue( $dep->query( 'one', 'enqueued' ) );
		$this->assertTrue( $dep->query( 'one', 'queue' ) );

		$dep->dequeue( 'one' );

		$this->assertFalse( $dep->query( 'one', 'queue' ) );
		$this->assertInstanceOf( '_WP_Dependency', $dep->query( 'one' ) );

		$dep->remove( 'one' );
		$this->assertFalse( $dep->query( 'one' ) );

	}
}
