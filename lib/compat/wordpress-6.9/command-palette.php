<?php
/**
 * Enqueues the assets required for the Command Palette.
 *
 * @global array  $menu
 * @global array  $submenu
 */
function gutenberg_enqueue_command_palette_assets() {
	global $menu, $submenu;

	$command_palette_settings = array(
		'is_network_admin' => is_network_admin(),
	);

	/**
	 * Extracts root-level text nodes from HTML string.
	 *
	 * @ignore
	 * @param string $label HTML string to extract text from.
	 * @return string Extracted text content, trimmed.
	 */
	$extract_root_text = static function ( string $label ): string {
		if ( '' === $label ) {
			return '';
		}

		$processor  = new WP_HTML_Tag_Processor( $label );
		$text_parts = array();
		$depth      = 0;

		while ( $processor->next_token() ) {
			$token_type = $processor->get_token_type();

			if ( '#text' === $token_type ) {
				if ( 0 === $depth ) {
					$text_parts[] = $processor->get_modifiable_text();
				}
				continue;
			}

			if ( '#tag' !== $token_type ) {
				continue;
			}

			if ( $processor->is_tag_closer() ) {
				if ( $depth > 0 ) {
					--$depth;
				}
				continue;
			}

			$token_name = $processor->get_tag();
			if ( $token_name && ! WP_HTML_Processor::is_void( $token_name ) ) {
				++$depth;
			}
		}

		return trim( implode( '', $text_parts ) );
	};

	if ( $menu ) {
		$menu_commands = array();
		foreach ( $menu as $menu_item ) {
			if ( empty( $menu_item[0] ) || ! is_string( $menu_item[0] ) || ! empty( $menu_item[1] ) && ! current_user_can( $menu_item[1] ) ) {
				continue;
			}

			$menu_label = $extract_root_text( $menu_item[0] );
			$menu_url   = '';
			$menu_slug  = $menu_item[2];

			if ( preg_match( '/\.php($|\?)/', $menu_slug ) || wp_http_validate_url( $menu_slug ) ) {
				$menu_url = $menu_slug;
			} elseif ( ! empty( menu_page_url( $menu_slug, false ) ) ) {
				$menu_url = WP_HTML_Decoder::decode_attribute( menu_page_url( $menu_slug, false ) );
			}

			if ( $menu_url ) {
				$menu_commands[] = array(
					'label' => $menu_label,
					'url'   => $menu_url,
					'name'  => $menu_slug,
				);
			}

			if ( array_key_exists( $menu_slug, $submenu ) ) {
				foreach ( $submenu[ $menu_slug ] as $submenu_item ) {
					if ( empty( $submenu_item[0] ) || ! empty( $submenu_item[1] ) && ! current_user_can( $submenu_item[1] ) ) {
						continue;
					}

					$submenu_label = $extract_root_text( $submenu_item[0] );
					$submenu_url   = '';
					$submenu_slug  = $submenu_item[2];

					if ( preg_match( '/\.php($|\?)/', $submenu_slug ) || wp_http_validate_url( $submenu_slug ) ) {
						$submenu_url = $submenu_slug;
					} elseif ( ! empty( menu_page_url( $submenu_slug, false ) ) ) {
						$submenu_url = WP_HTML_Decoder::decode_attribute( menu_page_url( $submenu_slug, false ) );
					}
					if ( $submenu_url ) {
						$menu_commands[] = array(
							'label' => sprintf(
								/* translators: 1: Menu label, 2: Submenu label. */
								__( '%1$s > %2$s' ),
								$menu_label,
								$submenu_label
							),
							'url'   => $submenu_url,
							'name'  => $menu_slug . '-' . $submenu_item[2],
						);
					}
				}
			}
		}
		$command_palette_settings['menu_commands'] = $menu_commands;
	}

	wp_enqueue_script( 'wp-commands' );
	wp_enqueue_style( 'wp-commands' );
	wp_enqueue_script( 'wp-core-commands' );

	wp_add_inline_script(
		'wp-core-commands',
		sprintf(
			'wp.coreCommands.initializeCommandPalette( %s );',
			wp_json_encode( $command_palette_settings, JSON_HEX_TAG | JSON_UNESCAPED_SLASHES )
		)
	);
}

if ( has_filter( 'admin_enqueue_scripts', 'wp_enqueue_command_palette_assets' ) ) {
	remove_filter( 'admin_enqueue_scripts', 'wp_enqueue_command_palette_assets' );
}
add_filter( 'admin_enqueue_scripts', 'gutenberg_enqueue_command_palette_assets', 9 );
