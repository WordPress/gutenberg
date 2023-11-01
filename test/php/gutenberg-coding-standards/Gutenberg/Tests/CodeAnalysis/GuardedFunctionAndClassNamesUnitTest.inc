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