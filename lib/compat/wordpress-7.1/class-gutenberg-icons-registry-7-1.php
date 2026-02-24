<?php

class Gutenberg_Icons_Registry_7_1 extends WP_Icons_Registry {
	/**
	 * Modified to point $manifest_path at Gutenberg packages
	 */
	protected function __construct() {
		$icons_directory = __DIR__ . '/../../../packages/icons/src/';
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

	/*
	 *
	 * THE DEFINITIONS BELOW MAY BE REMOVED IF WP_ICONS_REGISTRY CHANGES
	 * VISIBILITY OF ITS METHODS FROM PRIVATE TO PROTECTED
	 *
	 */

	/**
	 * Redefined to be accessible to `__construct`
	 */
	protected function register( $icon_name, $icon_properties ) {
		if ( ! isset( $icon_name ) || ! is_string( $icon_name ) ) {
			_doing_it_wrong(
				__METHOD__,
				__( 'Icon name must be a string.', 'gutenberg' ),
				'7.0.0'
			);
			return false;
		}

		$allowed_keys = array_fill_keys( array( 'label', 'content', 'filePath' ), 1 );
		foreach ( array_keys( $icon_properties ) as $key ) {
			if ( ! array_key_exists( $key, $allowed_keys ) ) {
				_doing_it_wrong(
					__METHOD__,
					sprintf(
						// translators: %s is the name of any user-provided key
						__( 'Invalid icon property: "%s".', 'gutenberg' ),
						$key
					),
					'7.0.0'
				);
				return false;
			}
		}

		if ( ! isset( $icon_properties['label'] ) || ! is_string( $icon_properties['label'] ) ) {
			_doing_it_wrong(
				__METHOD__,
				__( 'Icon label must be a string.', 'gutenberg' ),
				'7.0.0'
			);
			return false;
		}

		if (
			( ! isset( $icon_properties['content'] ) && ! isset( $icon_properties['filePath'] ) ) ||
			( isset( $icon_properties['content'] ) && isset( $icon_properties['filePath'] ) )
		) {
			_doing_it_wrong(
				__METHOD__,
				__( 'Icons must provide either `content` or `filePath`.', 'gutenberg' ),
				'7.0.0'
			);
			return false;
		}

		if ( isset( $icon_properties['content'] ) ) {
			if ( ! is_string( $icon_properties['content'] ) ) {
				_doing_it_wrong(
					__METHOD__,
					__( 'Icon content must be a string.', 'gutenberg' ),
					'7.0.0'
				);
				return false;
			}

			$sanitized_icon_content = $this->sanitize_icon_content( $icon_properties['content'] );
			if ( empty( $sanitized_icon_content ) ) {
				_doing_it_wrong(
					__METHOD__,
					__( 'Icon content does not contain valid SVG markup.', 'gutenberg' ),
					'7.0.0'
				);
				return false;
			}
		}

		$icon = array_merge(
			$icon_properties,
			array( 'name' => $icon_name )
		);

		$this->registered_icons[ $icon_name ] = $icon;

		return true;
	}

	/**
	 * Redefined to be accessible to `get_registered_icon` and `get_registered_icons`
	 */
	protected function get_content( $icon_name ) {
		if ( ! isset( $this->registered_icons[ $icon_name ]['content'] ) ) {
			$content = file_get_contents(
				$this->registered_icons[ $icon_name ]['filePath']
			);
			$content = $this->sanitize_icon_content( $content );

			if ( empty( $content ) ) {
				wp_trigger_error(
					__METHOD__,
					__( 'Icon content does not contain valid SVG markup.', 'gutenberg' )
				);
				return null;
			}

			$this->registered_icons[ $icon_name ]['content'] = $content;
		}
		return $this->registered_icons[ $icon_name ]['content'];
	}

	/**
	 * Redefined to be accessible to `register` and `get_content`
	 */
	protected function sanitize_icon_content( $icon_content ) {
		$allowed_tags = array(
			'svg'     => array(
				'class'       => true,
				'xmlns'       => true,
				'width'       => true,
				'height'      => true,
				'viewbox'     => true,
				'aria-hidden' => true,
				'role'        => true,
				'focusable'   => true,
			),
			'path'    => array(
				'fill'      => true,
				'fill-rule' => true,
				'd'         => true,
				'transform' => true,
			),
			'polygon' => array(
				'fill'      => true,
				'fill-rule' => true,
				'points'    => true,
				'transform' => true,
				'focusable' => true,
			),
		);
		return wp_kses( $icon_content, $allowed_tags );
	}

	/**
	 * Redefined to access the new `$registered_icons`
	 */
	public function get_registered_icon( $icon_name ) {
		if ( ! $this->is_registered( $icon_name ) ) {
			return null;
		}

		$icon            = $this->registered_icons[ $icon_name ];
		$icon['content'] = $icon['content'] ?? $this->get_content( $icon_name );

		return $icon;
	}

	public function is_registered( $icon_name ) {
		return isset( $this->registered_icons[ $icon_name ] );
	}
}
