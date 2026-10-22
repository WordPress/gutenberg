<?php
/**
 * The template a template is rendered inside, so that the header, the footer
 * and whatever else surrounds it live in one place instead of being repeated
 * in every template. Its JavaScript parts (`Edit` and `render`) are in
 * `field.tsx`, next to this file.
 *
 * Templates opt out of the `template` field every other post type derives
 * from its supports, see wp_register_core_field_collections(), because that
 * one assigns a post the template that renders it and falls back to the
 * template hierarchy. A template has no such default: it is rendered on its
 * own unless it names one.
 *
 * @package WordPress
 */

return array(
	'type'          => 'text',
	'label'         => __( 'Template' ),
	'enableSorting' => false,
	'filterBy'      => false,
);
