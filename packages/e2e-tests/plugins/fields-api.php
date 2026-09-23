<?php
/**
 * Plugin Name: Gutenberg Test Fields API
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * Extends the fields of Pages through the fields API, one case per hook:
 *
 * 1. A declarative field (`menu_order`): plain data, no JavaScript.
 * 2. A field backed by a script module and a stylesheet (`reading_time`):
 *    its value and render come from `fields-api/page-fields.js`.
 * 3. A patch of a default field (`comment_status`): it becomes sortable and
 *    hideable, and gets a render from the same module, keeping the rest of
 *    its definition.
 * 4. A substitute for a default field (`author`): unregistered and registered
 *    again as a plain integer with a new label.
 * 5. A field whose value is data the plugin adds to the Pages REST endpoint
 *    (`subtitle`): a REST field backed by post meta, readable in the list and
 *    writable from the Quick Edit form, which the plugin adds the field to.
 *
 * @package gutenberg-test-fields-api
 */

/**
 * Registers the new fields: a declarative one and one backed by a script
 * module.
 */
function gutenberg_test_fields_api_register_fields() {
	// Case 1: a declarative field, whose value is a property of the record.
	gutenberg_register_fields(
		'postType',
		'page',
		array(
			array(
				'id'            => 'menu_order',
				'type'          => 'integer',
				'label'         => 'Order',
				'description'   => 'Position of the page among its siblings.',
				'enableSorting' => false,
				'filterBy'      => false,
			),
		)
	);

	// Case 2: a field whose value and render come from a script module. The
	// module is registered, not enqueued: Gutenberg adds the modules of the
	// registered fields to the import map of the editor pages.
	wp_register_script_module(
		'gutenberg-test-fields-api/page-fields',
		plugins_url( 'fields-api/page-fields.js', __FILE__ ),
		array(),
		filemtime( __DIR__ . '/fields-api/page-fields.js' )
	);
	gutenberg_register_fields(
		'postType',
		'page',
		array(
			array(
				'id'            => 'reading_time',
				'type'          => 'integer',
				'label'         => 'Reading time',
				'enableSorting' => false,
				'filterBy'      => false,
				'readOnly'      => true,
			),
		),
		'gutenberg-test-fields-api/page-fields'
	);

	// The stylesheet of cases 2 and 3, enqueued below on every screen where
	// the fields can show: a script module cannot declare a stylesheet.
	wp_register_style(
		'gutenberg-test-fields-api',
		plugins_url( 'fields-api/page-fields.css', __FILE__ ),
		array(),
		filemtime( __DIR__ . '/fields-api/page-fields.css' )
	);
}
add_action( 'init', 'gutenberg_test_fields_api_register_fields' );

/**
 * Alters the default fields. The default fields are registered on `init` at
 * priority 99, and a registration with the id of an existing field patches
 * it, so a plugin altering them hooks `init` later: a patch registered
 * before would be patched by the default definition in turn.
 */
function gutenberg_test_fields_api_alter_default_fields() {
	// Case 3: a patch of a default field. Only the properties given change,
	// and the module applies to the field on top of the modules it has.
	// Hideable, so the field can be shown from the view options.
	gutenberg_register_fields(
		'postType',
		'page',
		array(
			array(
				'id'            => 'comment_status',
				'enableSorting' => true,
				'enableHiding'  => true,
			),
		),
		'gutenberg-test-fields-api/page-fields'
	);

	// Case 4: a substitute for a default field. Unregistering drops its
	// definition and detaches its script modules, so the registration that
	// follows is the whole field.
	gutenberg_unregister_fields( 'postType', 'page', array( 'author' ) );
	gutenberg_register_fields(
		'postType',
		'page',
		array(
			array(
				'id'       => 'author',
				'type'     => 'integer',
				'label'    => 'Written by',
				'filterBy' => false,
			),
		)
	);
}
add_action( 'init', 'gutenberg_test_fields_api_alter_default_fields', 200 );

/**
 * Adds the `subtitle` property to the Pages REST endpoint.
 *
 * Case 5, first half: the value comes from post meta the plugin owns, which
 * the endpoint does not expose otherwise. The REST field reads and writes
 * it, so the record of every page carries `subtitle` and a request updating
 * a page can set it.
 */
function gutenberg_test_fields_api_register_rest_field() {
	register_rest_field(
		'page',
		'subtitle',
		array(
			'schema'          => array(
				'description' => 'A secondary title shown under the title.',
				'type'        => 'string',
				'context'     => array( 'view', 'edit' ),
			),
			'get_callback'    => function ( $item ) {
				return (string) get_post_meta( $item['id'], '_gutenberg_test_subtitle', true );
			},
			'update_callback' => function ( $value, $post ) {
				update_post_meta( $post->ID, '_gutenberg_test_subtitle', sanitize_text_field( $value ) );
				return true;
			},
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_test_fields_api_register_rest_field' );

/**
 * Registers the field reading the `subtitle` property.
 *
 * Case 5, second part: a declarative field like case 1. The field API reads
 * the value from the record and, as the field is not read-only, the Quick
 * Edit form saves the edits with the record, through the REST field above.
 */
function gutenberg_test_fields_api_register_rest_backed_field() {
	gutenberg_register_fields(
		'postType',
		'page',
		array(
			array(
				'id'            => 'subtitle',
				'type'          => 'text',
				'label'         => 'Subtitle',
				'description'   => 'A secondary title shown under the title.',
				'enableSorting' => false,
				'filterBy'      => false,
			),
		)
	);
}
add_action( 'init', 'gutenberg_test_fields_api_register_rest_backed_field' );

/**
 * Adds the `subtitle` field to the Quick Edit form of Pages.
 *
 * Case 5, last part: the form lists its fields explicitly in the view
 * configuration of the entity, so a new field is not offered for editing
 * until it is added there. Merging appends the field to the end of the form.
 *
 * @param Gutenberg_View_Config_Data $data The Pages view configuration.
 * @return Gutenberg_View_Config_Data The updated view configuration.
 */
function gutenberg_test_fields_api_add_field_to_form( $data ) {
	return $data->merge(
		array(
			'form' => array(
				'fields' => array( 'subtitle' ),
			),
		),
		1
	);
}
add_filter( 'get_entity_view_config_posttype_page', 'gutenberg_test_fields_api_add_field_to_form' );

/**
 * Enqueues the stylesheet of the fields.
 */
function gutenberg_test_fields_api_enqueue_styles() {
	wp_enqueue_style( 'gutenberg-test-fields-api' );
}
// The post editor and the site editor.
add_action( 'enqueue_block_editor_assets', 'gutenberg_test_fields_api_enqueue_styles' );
// The extensible site editor renders its own document and exits on
// `admin_init`, before `enqueue_block_editor_assets` fires, so styles are
// enqueued from its `{page}_init` action instead.
add_action( 'site-editor-v2_init', 'gutenberg_test_fields_api_enqueue_styles' );
// The extensible site editor rendered inside the wp-admin chrome.
add_action( 'site-editor-v2-wp-admin_init', 'gutenberg_test_fields_api_enqueue_styles' );

/**
 * Registers a submenu rendering the extensible site editor inside the
 * wp-admin chrome, so the `site-editor-v2-wp-admin_init` case above can be
 * exercised. The page has no menu entry of its own.
 */
function gutenberg_test_fields_api_register_embedded_page() {
	if ( ! function_exists( 'gutenberg_site_editor_v2_wp_admin_render_page' ) ) {
		return;
	}
	add_submenu_page(
		'themes.php',
		'Pages (embedded)',
		'Pages (embedded)',
		'edit_theme_options',
		'site-editor-v2-wp-admin',
		'gutenberg_site_editor_v2_wp_admin_render_page'
	);
}
add_action( 'admin_menu', 'gutenberg_test_fields_api_register_embedded_page' );
