<?php

class Gutenberg_Icons_Registry_7_1 extends WP_Icons_Registry {
	/**
	 * Modified to point $manifest_path to Gutenberg packages
	 */
	protected function __construct() {
		$icons_directory = gutenberg_dir_path() . 'packages/icons/src';
		$icons_directory = trailingslashit( $icons_directory );
		$manifest_path   = $icons_directory . 'manifest.php';

		if ( ! is_readable( $manifest_path ) ) {
			wp_trigger_error(
				__METHOD__,
				__( 'Core icon collection manifest is missing or unreadable.', 'gutenberg' )
			);
			return;
		}

		$collection = include $manifest_path;

		if ( empty( $collection ) ) {
			wp_trigger_error(
				__METHOD__,
				__( 'Core icon collection manifest is empty or invalid.', 'gutenberg' )
			);
			return;
		}

		foreach ( $collection as $icon_name => $icon_data ) {
			if (
				empty( $icon_data['filePath'] )
				|| ! is_string( $icon_data['filePath'] )
			) {
				_doing_it_wrong(
					__METHOD__,
					__( 'Core icon collection manifest must provide valid a "filePath" for each icon.', 'gutenberg' ),
					'7.0.0'
				);
				return;
			}

			$this->register(
				'core/' . $icon_name,
				array(
					'label'    => $icon_data['label'],
					'filePath' => $icons_directory . $icon_data['filePath'],
				)
			);
		}
	}

	/**
	 * Modified to also search in icon labels
	 */
	public function get_registered_icons( $search = '' ) {
		$icons = array();

		foreach ( $this->registered_icons as $icon ) {
			if ( ! empty( $search )
				&& false === stripos( $icon['name'], $search )
				&& false === stripos( $icon['label'], $search )
			) {
				continue;
			}

			$icon['content'] = $icon['content'] ?? $this->get_content( $icon['name'] );
			$icons[]         = $icon;
		}

		return $icons;
	}

	/**
	 * Redefined to break away from base class.
	 */
	protected static $instance = null;

	/**
	 * Redefined to access new `$instance`
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}
}

/**
 * Forces Gutenberg_Icons_Registry_7_1 instantiation and overrides WP_Icons_Registry
 * so that all code using WP_Icons_Registry::{method_name}() receives the Gutenberg
 * registry.
 */
function gutenberg_override_wp_icons_registry_7_1() {
	$reflection = new ReflectionClass( WP_Icons_Registry::class );
	$property   = $reflection->getProperty( 'instance' );
	$property->setAccessible( true );
	$original_registry  = $property->getValue( null );
	$gutenberg_registry = Gutenberg_Icons_Registry_7_1::get_instance();

	// If the original registry was already instantiated, replay any icons outside
	// the `core/` namespace onto the Gutenberg registry so they are not lost.
	if ( null !== $original_registry ) {
		$register_method = new ReflectionMethod( Gutenberg_Icons_Registry_7_1::class, 'register' );
		$register_method->setAccessible( true );
		foreach ( $original_registry->get_registered_icons() as $icon ) {
			if ( strpos( $icon['name'], 'core/' ) === 0 ) {
				continue;
			}
			$icon_properties = array( 'label' => $icon['label'] );
			if ( ! empty( $icon['content'] ) ) {
				$icon_properties['content'] = $icon['content'];
			} elseif ( ! empty( $icon['filePath'] ) ) {
				$icon_properties['filePath'] = $icon['filePath'];
			} else {
				continue;
			}
			$register_method->invoke( $gutenberg_registry, $icon['name'], $icon_properties );
		}
	}
	$property->setValue( null, $gutenberg_registry );
}
add_action( 'init', 'gutenberg_override_wp_icons_registry_7_1', 1 );
