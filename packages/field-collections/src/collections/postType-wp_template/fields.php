<?php
/**
 * Overrides for the `core/wp_template-fields` field collection.
 *
 * `wp_template` does not register its own collection: the default registrar
 * (`gutenberg_register_default_post_type_field_collections()`) generates one
 * from the post type's `supports`. As a design post type it omits the date,
 * excerpt, and content-info fields, leaving the author, status, slug, template,
 * password, and title fields this collection needs. This file only tailors
 * what differs from that baseline, via the `gutenberg_field_collection_fields`
 * and `gutenberg_field_collection_modules` filters:
 *
 * - The title is relabeled "Template" and always shown (its `enableHiding` is
 *   forced off).
 * - The template-specific title behavior (getValue/render) ships in the
 *   collocated `extensions.ts`, exposed as the
 *   `@wordpress/field-collections/postType-wp_template` script module and merged
 *   after the default module so it wins.
 *
 * This file is copied to `build/scripts/field-collections/collections/postType-wp_template/fields.php`
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
		if ( 'postType' !== $kind || 'wp_template' !== $name ) {
			return $fields;
		}

		foreach ( $fields as &$field ) {
			if ( 'title' === $field['id'] ) {
				$field['label']        = __( 'Template', 'gutenberg' );
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
		if ( 'postType' === $kind && 'wp_template' === $name ) {
			$modules[] = '@wordpress/field-collections/postType-wp_template';
		}

		return $modules;
	},
	10,
	4
);
