<?php
/**
 * Compatibility shims for the `transforms` field of block types, for WordPress 7.2.
 *
 * The change proposed for WordPress 7.2 reads a block type's `transforms` from
 * `block.json`, sends the field to the editor with the other server-side block
 * settings and exposes it on the block types REST endpoint. The versions the
 * plugin still supports do none of that, so this file does it for them; each
 * function steps aside once `WP_Block_Type` declares the property.
 *
 * See https://github.com/WordPress/gutenberg/issues/13163.
 *
 * @package gutenberg
 */

/**
 * Passes a block type's `transforms` through to its server-side registration.
 *
 * `register_block_type_from_metadata()` copies a fixed list of `block.json`
 * fields onto the block type. This adds `transforms` to it for the WordPress
 * versions the plugin supports that do not copy the field themselves.
 *
 * @param array $settings Block type settings.
 * @param array $metadata Raw `block.json` metadata.
 * @return array Filtered block type settings.
 */
function gutenberg_register_block_transforms_from_metadata( $settings, $metadata ) {
	// Core copies the field itself once `WP_Block_Type` declares it.
	if ( property_exists( 'WP_Block_Type', 'transforms' ) ) {
		return $settings;
	}

	return gutenberg_add_declared_block_transforms( $settings, $metadata );
}
add_filter( 'block_type_metadata_settings', 'gutenberg_register_block_transforms_from_metadata', 10, 2 );

/**
 * Adds a block's declared transforms to its registration settings.
 *
 * Settings passed to `register_block_type()` win over the declaration, as they
 * do for every field core reads from `block.json` itself: the arguments are
 * merged over the metadata before the filter this serves runs, so a transform
 * registered from PHP — one carrying an `isMatch` closure, say — is kept
 * rather than replaced by the declared list.
 *
 * @param array $settings Block type settings.
 * @param array $metadata Raw `block.json` metadata.
 * @return array Settings carrying the declared transforms, unless they already carried some.
 */
function gutenberg_add_declared_block_transforms( $settings, $metadata ) {
	if ( isset( $settings['transforms'] ) ) {
		return $settings;
	}

	if ( isset( $metadata['transforms'] ) && is_array( $metadata['transforms'] ) ) {
		$settings['transforms'] = $metadata['transforms'];
	}

	return $settings;
}

/**
 * Sends the transforms block types declare to the editor.
 *
 * `get_block_editor_server_block_settings()` picks a fixed list of block type
 * fields and offers no filter, so the field travels in a bootstrap call of its
 * own. The block store keeps the definition it already has and takes only what
 * it lacks from a later call, which leaves everything core sent untouched. A
 * core that declares `WP_Block_Type::$transforms` sends the field in its own
 * bootstrap, so this one is skipped rather than shipping the payload twice.
 *
 * @return void
 */
function gutenberg_bootstrap_block_transforms() {
	if ( property_exists( 'WP_Block_Type', 'transforms' ) ) {
		return;
	}

	$definitions = array();

	foreach ( WP_Block_Type_Registry::get_instance()->get_all_registered() as $block_type ) {
		if ( ! empty( $block_type->transforms ) && is_array( $block_type->transforms ) ) {
			$definitions[ $block_type->name ] = array(
				'transforms' => gutenberg_prepare_transforms_for_editor( $block_type->transforms ),
			);
		}
	}

	if ( empty( $definitions ) ) {
		return;
	}

	wp_add_inline_script(
		'wp-blocks',
		'wp.blocks.unstable__bootstrapServerSideBlockDefinitions(' . wp_json_encode( $definitions, JSON_HEX_TAG | JSON_UNESCAPED_SLASHES ) . ');'
	);
}
add_action( 'enqueue_block_editor_assets', 'gutenberg_bootstrap_block_transforms' );

/**
 * Keeps the parts of a block type's transforms the editor can read.
 *
 * A block registered from PHP may attach `isMatch` and `transform` callables,
 * which JSON cannot express: `wp_json_encode()` writes a closure as `{}`, and
 * the editor, handed `{}` where it expects a function, would throw on every
 * paste. The callables stay server-side, where they run; only data travels.
 *
 * @param array $transforms Transforms declaration.
 * @return array The declaration with everything JSON cannot express removed.
 */
function gutenberg_prepare_transforms_for_editor( $transforms ) {
	foreach ( array( 'from', 'to' ) as $direction ) {
		if ( ! isset( $transforms[ $direction ] ) || ! is_array( $transforms[ $direction ] ) ) {
			continue;
		}

		foreach ( $transforms[ $direction ] as $at => $transform ) {
			// Only an array can describe a transform; anything else is noise
			// the editor would otherwise have to guard against.
			if ( ! is_array( $transform ) ) {
				unset( $transforms[ $direction ][ $at ] );
				continue;
			}

			/*
			 * An `enter`, `files` or `prefix` transform is nothing without
			 * its `transform` function, and a function cannot travel: sending
			 * the husk would leave editor code that calls it unguarded — the
			 * file-drop handler, the input rules — holding a non-function.
			 */
			if ( isset( $transform['type'] ) && in_array( $transform['type'], array( 'enter', 'files', 'prefix' ), true ) ) {
				unset( $transforms[ $direction ][ $at ] );
				continue;
			}

			unset( $transform['isMatch'], $transform['transform'] );

			// A schema can only be declared as an object; a string names a
			// PHP callable, which stays server-side like the rest.
			if ( isset( $transform['schema'] ) && is_string( $transform['schema'] ) ) {
				unset( $transform['schema'] );
			}

			// A `shortcode` reader on an attribute definition is the
			// JavaScript API's function spelling; declared attributes use
			// `source` instead.
			if ( isset( $transform['attributes'] ) && is_array( $transform['attributes'] ) ) {
				foreach ( $transform['attributes'] as $name => $definition ) {
					if ( is_array( $definition ) ) {
						unset( $transform['attributes'][ $name ]['shortcode'] );
					}
				}
			}

			$transforms[ $direction ][ $at ] = gutenberg_remove_transform_objects( $transform );
		}

		$transforms[ $direction ] = array_values( $transforms[ $direction ] );
	}

	return $transforms;
}

/**
 * Removes the object values JSON cannot carry from transform data.
 *
 * A list stays a list: removing an entry from the middle of one would leave
 * a gap that `wp_json_encode()` turns into an object.
 *
 * @param array $value Transform data.
 * @return array The data without objects or closures.
 */
function gutenberg_remove_transform_objects( $value ) {
	$is_list = array_keys( $value ) === range( 0, count( $value ) - 1 );

	foreach ( $value as $key => $entry ) {
		if ( is_object( $entry ) ) {
			unset( $value[ $key ] );
		} elseif ( is_array( $entry ) ) {
			$value[ $key ] = gutenberg_remove_transform_objects( $entry );
		}
	}

	return $is_list ? array_values( $value ) : $value;
}

/**
 * Exposes a block type's transforms on the block types REST endpoint.
 *
 * `WP_REST_Block_Types_Controller` reads a fixed list of block type fields, so
 * a client building an editor from `/wp/v2/block-types` — a mobile app, a
 * headless front end — would never see a declared transform. The field is
 * registered as an additional one, which puts it in the response and in the
 * schema, until core's controller carries it itself.
 *
 * @return void
 */
function gutenberg_register_block_type_transforms_rest_field() {
	if ( property_exists( 'WP_Block_Type', 'transforms' ) ) {
		return;
	}

	register_rest_field(
		'block-type',
		'transforms',
		array(
			'get_callback' => 'gutenberg_get_block_type_transforms_for_rest',
			'schema'       => array(
				'description' => __( 'Transforms describing how the block converts to and from other content.', 'gutenberg' ),
				'type'        => array( 'object', 'null' ),
				'properties'  => array(
					'from' => array(
						'description' => __( 'Transforms that produce the block from other content.', 'gutenberg' ),
						'type'        => 'array',
						'items'       => array( 'type' => 'object' ),
					),
					'to'   => array(
						'description' => __( 'Transforms that convert the block into other content.', 'gutenberg' ),
						'type'        => 'array',
						'items'       => array( 'type' => 'object' ),
					),
				),
				'default'     => null,
				'context'     => array( 'embed', 'view', 'edit' ),
				'readonly'    => true,
			),
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_register_block_type_transforms_rest_field' );

/**
 * Reads the transforms of the block type a REST response describes.
 *
 * The response data names the block unless `_fields` left `name` out, in
 * which case a request for a single block type still names it in its route.
 *
 * @param array           $item    Prepared block type response data.
 * @param string          $field   Field name.
 * @param WP_REST_Request $request Request.
 * @return array|null The transforms in the shape the editor reads, or null when the block declares none.
 */
function gutenberg_get_block_type_transforms_for_rest( $item, $field, $request ) {
	$name = null;

	if ( isset( $item['name'] ) ) {
		$name = $item['name'];
	} elseif ( isset( $request['namespace'], $request['name'] ) ) {
		$name = $request['namespace'] . '/' . $request['name'];
	}

	$block_type = null === $name ? null : WP_Block_Type_Registry::get_instance()->get_registered( $name );

	if ( ! $block_type instanceof WP_Block_Type || empty( $block_type->transforms ) || ! is_array( $block_type->transforms ) ) {
		return null;
	}

	return gutenberg_prepare_transforms_for_editor( $block_type->transforms );
}
