<?php

if ( class_exists( 'Foo' ) ) {
	return;
}

class Foo {
}

if ( ! class_exists( 'Bar' ) ) {
	class Bar {
		public function baz() {
		}
	}
}

class Baz {
}

if ( ! function_exists( 'quux' ) ) {
	function quux() {
	}
}

function blarg() {
}

class Gutenberg_Class {

}

class Class_Gutenberg {
}

class Class_Gutenberg_With_Some_Postifx {
}

function gutenberg_function() {
}

function _gutenberg_function() {
}
