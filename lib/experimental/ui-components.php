<?php
/**
 * Experimental: server-side rendering for `@wordpress/ui` components.
 *
 * Proof of concept. Renders design-system components in non-React (PHP) contexts
 * by reusing the exact hashed class names and stylesheet produced by the React
 * build (see `packages/ui/bin/build-php-artifacts.mjs`). The hashed class names
 * are an internal, unstable implementation detail shared between React and PHP.
 * The public contract is the function signature, never the class names.
 *
 * @package gutenberg
 */

if ( ! function_exists( '_wp_ui_load_artifact' ) ) {
	/**
	 * Loads and caches a JSON artifact emitted for the `@wordpress/ui` PHP renderer.
	 *
	 * @param string $name Artifact file name, e.g. `button.classmap.json`.
	 * @return array Decoded artifact, or an empty array when unavailable.
	 */
	function _wp_ui_load_artifact( $name ) {
		static $cache = array();

		if ( ! array_key_exists( $name, $cache ) ) {
			$file           = gutenberg_dir_path() . 'packages/ui/build-php/' . $name;
			$cache[ $name ] = is_readable( $file )
				? json_decode( file_get_contents( $file ), true )
				: array();
		}

		return $cache[ $name ];
	}
}

if ( ! function_exists( '_wp_ui_resolve_recipe' ) ) {
	/**
	 * Resolves a recipe's variant matrix to a list of semantic class name keys.
	 *
	 * Mirrors `resolveRecipeClasses()` in `packages/ui/src/utils/recipe.ts` so that
	 * React and PHP compose an identical set of classes from the same recipe.
	 *
	 * @param array $recipe Decoded recipe with `variants` and `defaultVariants`.
	 * @param array $props  Selected value for each variant dimension.
	 * @return string[] The semantic class name keys for the selected variants.
	 */
	function _wp_ui_resolve_recipe( $recipe, $props ) {
		$keys     = array();
		$variants = isset( $recipe['variants'] ) ? $recipe['variants'] : array();
		$defaults = isset( $recipe['defaultVariants'] ) ? $recipe['defaultVariants'] : array();

		foreach ( $variants as $dimension => $values ) {
			if ( isset( $props[ $dimension ] ) && null !== $props[ $dimension ] ) {
				$value = $props[ $dimension ];
			} elseif ( isset( $defaults[ $dimension ] ) ) {
				$value = $defaults[ $dimension ];
			} else {
				continue;
			}

			if ( isset( $values[ $value ] ) ) {
				$keys = array_merge( $keys, $values[ $value ] );
			}
		}

		return $keys;
	}
}

if ( ! function_exists( '_wp_ui_hashed_classes' ) ) {
	/**
	 * Translates semantic class name keys to their hashed class names.
	 *
	 * @param string[] $keys     Semantic class name keys.
	 * @param array    $classmap Semantic → hashed class-name map.
	 * @return string[] The hashed class names, in order.
	 */
	function _wp_ui_hashed_classes( $keys, $classmap ) {
		$classes = array();

		foreach ( $keys as $key ) {
			if ( isset( $classmap[ $key ] ) ) {
				$classes[] = $classmap[ $key ];
			}
		}

		return $classes;
	}
}

if ( ! function_exists( 'wp_ui_button' ) ) {
	/**
	 * Renders a WordPress Design System Button as an HTML string.
	 *
	 * Pure input to output: this returns markup and prints nothing. `echo` the
	 * result where you need it.
	 *
	 * The composed markup mirrors `packages/ui/src/button/button.tsx`. Interactive
	 * behavior that the React component derives from Base UI (focus management,
	 * loading announcements) is out of scope; this renders the visual, native-HTML
	 * button that non-React admin screens can use for visual coherence.
	 *
	 * @param string $content Button label. Rendered as escaped text.
	 * @param array  $args {
	 *     Optional. Button options.
	 *
	 *     @type string $tone     Tone: 'brand' or 'neutral'. Default 'brand'.
	 *     @type string $variant  Variant: 'solid', 'outline', 'minimal', or
	 *                            'unstyled'. Default 'solid'.
	 *     @type string $size     Size: 'default', 'small', or 'compact'. Default
	 *                            'default'.
	 *     @type bool   $loading  Whether to render the loading state. Default false.
	 *     @type bool   $disabled Whether the button is disabled. Default false.
	 *     @type string $type     Native button type when not a link. Default 'button'.
	 *     @type string $href     If set, renders an `<a>` anchor instead of a button.
	 *     @type string $class    Extra class names appended to the element.
	 * }
	 * @return string HTML for the button.
	 */
	function wp_ui_button( $content, $args = array() ) {
		$args = wp_parse_args(
			$args,
			array(
				'tone'     => 'brand',
				'variant'  => 'solid',
				'size'     => 'default',
				'loading'  => false,
				'disabled' => false,
				'type'     => 'button',
				'href'     => '',
				'class'    => '',
			)
		);

		$classmap = _wp_ui_load_artifact( 'button.classmap.json' );
		$recipe   = _wp_ui_load_artifact( 'button.recipe.json' );

		// Compose semantic class keys, mirroring button.tsx. The base `button`
		// class is structural and applied unless the button is unstyled; the
		// recipe drives the tone/variant/size matrix; `is-loading` is a boolean.
		$keys = array();
		if ( 'unstyled' !== $args['variant'] ) {
			$keys[] = 'button';
		}
		$keys = array_merge(
			$keys,
			_wp_ui_resolve_recipe(
				$recipe,
				array(
					'tone'    => $args['tone'],
					'variant' => $args['variant'],
					'size'    => $args['size'],
				)
			)
		);
		if ( $args['loading'] ) {
			$keys[] = 'is-loading';
		}

		$classes = _wp_ui_hashed_classes( $keys, $classmap );
		if ( '' !== $args['class'] ) {
			$classes[] = $args['class'];
		}

		// State is expressed through `data-disabled`, matching the attribute
		// selectors the shared stylesheet keys off of.
		$is_disabled = $args['loading'] || $args['disabled'];
		$attributes  = array( 'class' => implode( ' ', $classes ) );
		if ( $is_disabled ) {
			$attributes['data-disabled'] = '';
		}

		if ( '' !== $args['href'] ) {
			$tag                = 'a';
			$attributes['href'] = $args['href'];
			if ( $is_disabled ) {
				$attributes['aria-disabled'] = 'true';
			}
		} else {
			$tag                = 'button';
			$attributes['type'] = $args['type'];
			if ( $args['disabled'] && ! $args['loading'] ) {
				$attributes['disabled'] = 'disabled';
			}
		}

		$rendered_attributes = '';
		foreach ( $attributes as $name => $value ) {
			if ( '' === $value ) {
				$rendered_attributes .= ' ' . $name;
				continue;
			}
			$escaped              = 'href' === $name ? esc_url( $value ) : esc_attr( $value );
			$rendered_attributes .= sprintf( ' %s="%s"', $name, $escaped );
		}

		return sprintf(
			'<%1$s%2$s>%3$s</%1$s>',
			$tag,
			$rendered_attributes,
			esc_html( $content )
		);
	}
}

if ( ! function_exists( 'wp_ui_enqueue_button_style' ) ) {
	/**
	 * Registers and enqueues the shared `@wordpress/ui` Button stylesheet in the admin.
	 *
	 * This is the same hashed CSS the React build injects at runtime, so PHP- and
	 * React-rendered buttons are visually identical. It depends on `wp-theme` for
	 * design-token values but bakes in fallbacks, so it also renders correctly on
	 * its own.
	 */
	function wp_ui_enqueue_button_style() {
		$relative_path = 'packages/ui/build-php/button.css';
		$absolute_path = gutenberg_dir_path() . $relative_path;

		if ( ! is_readable( $absolute_path ) ) {
			return;
		}

		wp_register_style(
			'wp-ui-button',
			gutenberg_url( $relative_path ),
			array( 'wp-theme' ),
			filemtime( $absolute_path )
		);
		wp_enqueue_style( 'wp-ui-button' );
	}
	add_action( 'admin_enqueue_scripts', 'wp_ui_enqueue_button_style' );
}
