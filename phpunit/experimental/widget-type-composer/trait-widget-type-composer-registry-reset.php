<?php
/**
 * Shared registry-reset helpers for Widget Type Composer test cases.
 *
 * Used by tests that touch either the in-memory code-registered registry or
 * `WP_Widget_Type_Registry`, so each test starts from a known baseline
 * regardless of previous cases.
 *
 * @package gutenberg
 */

/**
 * Provides `reset_widget_def_registry()` and `reset_widget_type_registry()` to
 * test cases.
 *
 * `use Widget_Type_Composer_Registry_Reset` inside a `WP_UnitTestCase` subclass,
 * then call the helpers from `set_up()` and `tear_down()`.
 */
trait Widget_Type_Composer_Registry_Reset {

	/*
	 * Empties the in-memory code-registered registry so tests do not pollute
	 * each other.
	 */
	protected function reset_widget_def_registry() {
		$registry = &gutenberg_get_widget_def_registry_ref();
		$registry = array();
	}

	/*
	 * Resets the `WP_Widget_Type_Registry` singleton via reflection so each test
	 * starts from a clean registry and can re-run the resolver deterministically.
	 *
	 * The class has no public reset; reflection is the cleanest way to give tests
	 * a known baseline without leaking state across cases.
	 */
	protected function reset_widget_type_registry() {
		$instance = new ReflectionProperty( WP_Widget_Type_Registry::class, 'instance' );

		/*
		 * ReflectionProperty::setAccessible is redundant as of PHP 8.1.0 and
		 * deprecated as of 8.5.0, but still needed below 8.1.0 since `instance`
		 * is private.
		 */
		if ( PHP_VERSION_ID < 80100 ) {
			$instance->setAccessible( true );
		}

		$instance->setValue( null, null );
	}
}
