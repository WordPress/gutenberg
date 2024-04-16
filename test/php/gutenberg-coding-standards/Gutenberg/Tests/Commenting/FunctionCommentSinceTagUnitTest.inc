<?php
/**
 * @since 1.2.3
 */
function foo() {
}

/**
 * @since invalid value
 */
function bar() {
}

$result = array_map( function ( $value ) {
	return $value * 2; // Doubling each value
}, array( 1, 2, 3, 4, 5 ) );

/**
 * @since 0.0
 */
function qux() {
}

function spam() {
}

class Foo {
	public function bar() {
	}
}

interface Bar {
	public function bar();
}

trait Baz {
	public function bar() {
	}
}
