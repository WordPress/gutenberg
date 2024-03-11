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

/**
 * @since 0.0.0
 */
function baz() {
}

function qux() {
}

function spam() {
}

class Foo {
	public function bar() {
	}
}

interface Baz {
	public function bar();
}

trait Spam {
	public function bar() {
	}
}
