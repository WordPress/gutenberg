<?php
/**
 * Overrides for the `core/page-fields` field collection.
 *
 * `page` does not register its own collection: the default registrar
 * (`gutenberg_register_default_post_type_field_collections()`) generates one
 * from the post type's `supports`, which already yields the right serializable
 * fields in the right order. This file only tailors what differs from that
 * generic baseline, via the `gutenberg_field_collection_fields` and
 * `gutenberg_field_collection_modules` filters:
 *
 * - The title is always shown (it is the entity's primary column), so its
 *   `enableHiding` is forced off.
 * - The page-specific title behavior (getValue/render) ships in the collocated
 *   `extensions.ts`, exposed as the `@wordpress/field-collections/postType-page`
 *   script module and merged after the default module so it wins.
 *
 * This file is copied to `build/scripts/field-collections/collections/postType-page/fields.php`
 * by the `wpCopyFiles` config in the package's package.json, and required on
 * `init` by `gutenberg_register_core_field_collections()` at priority 10 —
 * before the default registrar runs at priority 100, so these filters are in
 * place when the collection is registered.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

add_filter(
	'gutenberg_field_collection_fields',
	function ( $fields, $id, $kind, $name ) {
		if ( 'postType' !== $kind || 'page' !== $name ) {
			return $fields;
		}

		foreach ( $fields as &$field ) {
			if ( 'title' === $field['id'] ) {
				$field['enableHiding'] = false;
			}
		}
		unset( $field );

		return $fields;
	},
	10,
	4
);

add_filter(
	'gutenberg_field_collection_modules',
	function ( $modules, $id, $kind, $name ) {
		if ( 'postType' === $kind && 'page' === $name ) {
			$modules[] = '@wordpress/field-collections/postType-page';
		}

		return $modules;
	},
	10,
	4
);
