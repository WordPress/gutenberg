<?php
function foo() {
	$result = do_action( 'some_filter', array() );
	$result = do_action_ref_array( 'some_filter', array() );
	$result = apply_filters( 'some_filter', array() );
	$result = apply_filters_ref_array( 'some_filter', array() );

	/**
	 * @since
	 * 123
	 */
	$result = apply_filters( 'some_filter', array() );

	/**
	 * @since invalid 123
	 */
	$result = apply_filters( 'some_filter', array() );

	/**
	 * @since 123
	 */
	$result = apply_filters( 'some_filter', array() );

	$variable = 'some_value'; /** Some comment @since 123 */

	$result = apply_filters( 'some_filter', array() );

	/** @var This filter is documented in foo.php */
	$result = apply_filters( 'some_filter', array() );

	/**
	 * @since 3.0.0
	 * @since
	 * @since MU (3.0.0)
	 * @since invalid_value
	 * @since
	 */
	$result = apply_filters( 'some_filter', array() );
}

/**
 * @since
 * 123
 */
function bar() {
}

/**
 * @since invalid 123
 */
function baz() {
}

/**
 * @since 123
 */
function qux() {
}

$variable = 'some_value'; /** Some comment @since 123 */

function quux() {
}

/**
 * @since 3.0.0
 * @since
 * @since MU (3.0.0)
 * @since invalid_value
 * @since
 */
function grault() {
}

$result = array_map( function ( $value ) {
	return $value * 2; // Doubling each value
}, array( 1, 2, 3, 4, 5 ) );

class Foo {

	/**
	 * @since
	 * 123
	 */
	public $foo_property;

	/**
	 * @since invalid 123
	 */
	protected $bar_property;

	/**
	 * @since 123
	 */
	public $baz_property;

	public $qux_property = 'some_value'; /** Some comment @since 123 */

	public $quux_property;

	private $corge_property;

	/**
	 * @since 3.0.0
	 * @since
	 * @since MU (3.0.0)
	 * @since invalid_value
	 * @since
	 */
	public $grault_property;

	protected function foobar() {
		$result = do_action( 'some_filter', array() );
		$result = do_action_ref_array( 'some_filter', array() );
		$result = apply_filters( 'some_filter', array() );
		$result = apply_filters_ref_array( 'some_filter', array() );

		/**
		 * @since
		 * 123
		 */
		$result = apply_filters( 'some_filter', array() );

		/**
		 * @since invalid 123
		 */
		$result = apply_filters( 'some_filter', array() );

		/**
		 * @since 123
		 */
		$result = apply_filters( 'some_filter', array() );

		$variable = 'some_value'; /** Some comment @since 123 */

		$result = apply_filters( 'some_filter', array() );

		/** @var This filter is documented in foo.php */
		$result = apply_filters( 'some_filter', array() );
	}

	protected function foobar_1() {}

	/**
	 * @since
	 * 123
	 */
	public function bar() {
	}

	/**
	 * @since invalid 123
	 */
	public function baz() {
	}

	/**
	 * @since 123
	 */
	protected function qux() {
	}

	/** Some comment @since 123 */

	public function quux() {
		$result = array_map( function ( $value ) {
			return $value * 2; // Doubling each value
		}, array( 1, 2, 3, 4, 5 ) );
	}

	private function corge() {
	}

	function no_visibility_modifier() {}

	/**
	 * @since 3.0.0
	 * @since
	 * @since MU (3.0.0)
	 * @since invalid_value
	 * @since
	 */
	public function grault() {
	}
}

/**
 * @since
 * 123
 */
class Foo_1 {
}

/**
 * @since invalid 123
 */
class Foo_2 {
}

/**
 * @since 123
 */
class Foo_3 {
}

$variable = 'some_value'; /** Some comment @since 123 */

class Foo_4 {
}

/**
 * @since 3.0.0
 * @since
 * @since MU (3.0.0)
 * @since invalid_value
 * @since
 */
class Foo_5 {
}

abstract class Bar_Abstract {
	/**
	 * @since
	 * 123
	 */
	public $foo_property;

	/**
	 * @since invalid 123
	 */
	protected $bar_property;

	/**
	 * @since 123
	 */
	public $baz_property;

	public $qux_property = 'some_value'; /** Some comment @since 123 */

	public $quux_property;

	private $corge_property;

	/**
	 * @since 3.0.0
	 * @since
	 * @since MU (3.0.0)
	 * @since invalid_value
	 * @since
	 */
	public $grault_property;

	protected function foobar() {
		$result = do_action( 'some_filter', array() );
		$result = do_action_ref_array( 'some_filter', array() );
		$result = apply_filters( 'some_filter', array() );
		$result = apply_filters_ref_array( 'some_filter', array() );

		/**
		 * @since
		 * 123
		 */
		$result = apply_filters( 'some_filter', array() );

		/**
		 * @since invalid 123
		 */
		$result = apply_filters( 'some_filter', array() );

		/**
		 * @since 123
		 */
		$result = apply_filters( 'some_filter', array() );

		$variable = 'some_value'; /** Some comment @since 123 */

		$result = apply_filters( 'some_filter', array() );

		/** @var This filter is documented in foo.php */
		$result = apply_filters( 'some_filter', array() );
	}

	abstract protected function foo_abstract();

	/**
	 * @since
	 * 123
	 */
	public function apply_filters() {
	}

	/**
	 * @since invalid 123
	 */
	public function baz() {
	}

	/**
	 * @since 123
	 */
	protected function qux() {
	}

	/** Some comment @since 123 */

	public function quux() {
		$result = array_map( function ( $value ) {
			return $value * 2; // Doubling each value
		}, array( 1, 2, 3, 4, 5 ) );
	}

	private function corge() {
	}

	function no_visibility_modifier() {}

	/**
	 * @since 3.0.0
	 * @since
	 * @since MU (3.0.0)
	 * @since invalid_value
	 * @since
	 */
	public function grault() {
	}
}

/**
 * @since
 * 123
 */
abstract class Bar_1 {
}

/**
 * @since invalid 123
 */
abstract class Bar_2 {
}

/**
 * @since 123
 */
abstract class Bar_3 {
}

$variable = 'some_value'; /** Some comment @since 123 */

abstract class Bar_4 {
}

/**
 * @since 3.0.0
 * @since
 * @since MU (3.0.0)
 * @since invalid_value
 * @since
 */
abstract class Bar_5 {
}

Trait Baz {

	/**
	 * @since
	 * 123
	 */
	public $foo_property;

	/**
	 * @since invalid 123
	 */
	protected $bar_property;

	/**
	 * @since 123
	 */
	public $baz_property;

	public $qux_property = 'some_value'; /** Some comment @since 123 */

	public $quux_property;

	private $corge_property;

	/**
	 * @since 3.0.0
	 * @since
	 * @since MU (3.0.0)
	 * @since invalid_value
	 * @since
	 */
	public $grault_property;

	protected function foobar() {
		$result = do_action( 'some_filter', array() );
		$result = do_action_ref_array( 'some_filter', array() );
		$result = apply_filters( 'some_filter', array() );
		$result = apply_filters_ref_array( 'some_filter', array() );

		/**
		 * @since
		 * 123
		 */
		$result = apply_filters( 'some_filter', array() );

		/**
		 * @since invalid 123
		 */
		$result = apply_filters( 'some_filter', array() );

		/**
		 * @since 123
		 */
		$result = apply_filters( 'some_filter', array() );

		$variable = 'some_value'; /** Some comment @since 123 */

		$result = apply_filters( 'some_filter', array() );

		/** @var This filter is documented in foo.php */
		$result = apply_filters( 'some_filter', array() );
	}

	/**
	 * @since
	 * 123
	 */
	public function bar() {
	}

	/**
	 * @since invalid 123
	 */
	public function baz() {
	}

	/**
	 * @since 123
	 */
	protected function qux() {
	}

	/** Some comment @since 123 */

	public function quux() {
		$result = array_map( function ( $value ) {
			return $value * 2; // Doubling each value
		}, array( 1, 2, 3, 4, 5 ) );
	}

	private function corge() {
	}

	function no_visibility_modifier() {}

	/**
	 * @since 3.0.0
	 * @since
	 * @since MU (3.0.0)
	 * @since invalid_value
	 * @since
	 */
	public function grault() {
	}
}

/**
 * @since
 * 123
 */
trait Baz_1 {
}

/**
 * @since invalid 123
 */
trait Baz_2 {
}

/**
 * @since 123
 */
trait Baz_3 {
}

$variable = 'some_value'; /** Some comment @since 123 */

trait Baz_4 {
}

interface Qux {
	public function foobar();

	/**
	 * @since
	 * 123
	 */
	public function bar();

	/**
	 * @since invalid 123
	 */
	public function baz();

	/**
	 * @since 123
	 */
	public function qux();

	/** Some comment @since 123 */

	public function quux();

	/**
	 * @since 3.0.0
	 * @since
	 * @since MU (3.0.0)
	 * @since invalid_value
	 * @since
	 */
	public function grault();
}

/**
 * @since
 * 123
 */
interface Qux_1 {
}

/**
 * @since invalid 123
 */
interface Qux_2 {
}

/**
 * @since 123
 */
interface Qux_3 {
}

$variable = 'some_value'; /** Some comment @since 123 */

interface Qux_4 {
}

$result = do_action( 'some_filter', array() );
$result = do_action_ref_array( 'some_filter', array() );
$result = apply_filters( 'some_filter', array() );
$result = apply_filters_ref_array( 'some_filter', array() );

/**
 * @since
 * 123
 */
$result = apply_filters( 'some_filter', array() );

/**
 * @since invalid 123
 */
$result = apply_filters( 'some_filter', array() );

/**
 * @since 123
 */
$result = apply_filters( 'some_filter', array() );

$variable = 'some_value'; /** Some comment @since 123 */$

$result = apply_filters( 'some_filter', array() );

/** @var This filter is documented in foo.php */
$result = apply_filters( 'some_filter', array() );

/**
 * @since 3.0.0
 * @since
 * @since MU (3.0.0)
 * @since invalid_value
 * @since
 */
$result = apply_filters( 'some_filter', array() );

if ( ! function_exists( 'do_action' ) ) {
	function do_action() {
	}
}

if ( ! function_exists( 'do_action_ref_array' ) ) {
	function do_action_ref_array() {
	}
}

if ( ! function_exists( 'do_action_deprecated' ) ) {
	function do_action_deprecated() {
	}
}

if ( ! function_exists( 'apply_filters' ) ) {
	function apply_filters() {
	}
}

if ( ! function_exists( 'apply_filters_ref_array' ) ) {
	function apply_filters_ref_array() {
	}
}

if ( ! function_exists( 'apply_filters_deprecated' ) ) {
	function apply_filters_deprecated() {
	}
}

$foo = new do_action();
$foo->do_action();
$foo = new do_action_ref_array();
$foo->do_action_ref_array();
$foo = new do_action_deprecated();
$foo->do_action_deprecated();
$foo = new apply_filters();
$foo->apply_filters();
$foo = new apply_filters_ref_array();
$foo->apply_filters_ref_array();
$foo = new apply_filters_deprecated();
$foo->apply_filters_deprecated();
$foo = new non_hook_action();
$foo->non_hook_action();
