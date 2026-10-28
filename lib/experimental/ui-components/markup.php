<?php
/**
 * Renders components whose markup comes from React, for components without a
 * template.
 *
 * The build stores React's render of the component with the default props,
 * plus what each variant value changes: classes, attributes and inline
 * styles, per tag. Content and free-form props are placeholders that say
 * where they are, so they're escaped for that context.
 *
 * @package gutenberg
 */

/**
 * Renders a component from its markup.
 *
 * Internal: called by `gutenberg_get_ui_component()`, which validates the
 * props first. Use that instead.
 *
 * @access private
 *
 * @param array  $component Component from the manifest.
 * @param array  $props     Validated props.
 * @param string $content   Content, as plain text.
 * @return string HTML.
 */
function gutenberg_ui_components_render_markup( $component, $props, $content ) {
	$markup = $component['markup'];
	$key    = array();
	foreach ( $component['props'] as $prop => $schema ) {
		if ( isset( $schema['enum'] ) || 'boolean' === ( $schema['type'] ?? '' ) ) {
			$key[] = $prop . '=' . ( is_bool( $props[ $prop ] ) ? wp_json_encode( $props[ $prop ] ) : $props[ $prop ] );
		}
	}

	if ( isset( $markup['exceptions'][ implode( '&', $key ) ] ) ) {
		$html = $markup['exceptions'][ implode( '&', $key ) ];
	} else {
		$changes_by_tag = array();
		foreach ( $key as $variant ) {
			foreach ( $markup['changes'][ $variant ] ?? array() as $change ) {
				$changes_by_tag[ $change['tag'] ][] = $change;
			}
		}

		$processor = new WP_HTML_Tag_Processor( $markup['base'] );
		$tag       = -1;
		while ( $processor->next_tag() ) {
			++$tag;
			foreach ( $changes_by_tag[ $tag ] ?? array() as $change ) {
				foreach ( $change['removeClass'] ?? array() as $class_name ) {
					$processor->remove_class( $class_name );
				}
				foreach ( $change['addClass'] ?? array() as $class_name ) {
					$processor->add_class( $class_name );
				}
				if ( isset( $change['style'] ) ) {
					$processor->set_attribute( 'style', gutenberg_ui_components_change_style( (string) $processor->get_attribute( 'style' ), $change['style'] ) );
				}
				foreach ( $change['set'] ?? array() as $name => $value ) {
					$processor->set_attribute( $name, $value );
				}
				foreach ( $change['remove'] ?? array() as $name ) {
					$processor->remove_attribute( $name );
				}
			}
		}
		$html = $processor->get_updated_html();
	}

	// Fill every placeholder in one pass, so filled-in values are never read
	// as placeholders themselves.
	$values = array_merge( array_map( 'strval', $props ), array( 'content' => $content ) );
	return preg_replace_callback(
		'/__wpuislot_([a-z0-9_]+?)__(?:attr_([a-z0-9-]+)|text)__/',
		static function ( $placeholder ) use ( $values ) {
			$value = $values[ $placeholder[1] ] ?? '';
			if ( in_array( $placeholder[2] ?? '', array( 'href', 'src', 'action', 'formaction' ), true ) ) {
				return esc_url( $value );
			}
			// React escapes `&`, `<`, `>` and quotes, and never reads entities.
			return htmlspecialchars( $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8' );
		},
		$html
	);
}

/**
 * Sets or removes declarations in an inline style.
 *
 * @access private
 *
 * @param string $style   Inline style.
 * @param array  $changes Value per property, or null to remove it.
 * @return string Inline style.
 */
function gutenberg_ui_components_change_style( $style, $changes ) {
	$declarations = array();
	foreach ( array_filter( explode( ';', $style ) ) as $declaration ) {
		list( $property, $value )          = array_pad( explode( ':', $declaration, 2 ), 2, '' );
		$declarations[ trim( $property ) ] = trim( $value );
	}
	foreach ( $changes as $property => $value ) {
		if ( null === $value ) {
			unset( $declarations[ $property ] );
		} else {
			$declarations[ $property ] = $value;
		}
	}

	$style = array();
	foreach ( $declarations as $property => $value ) {
		$style[] = $property . ':' . $value;
	}
	return implode( ';', $style );
}
