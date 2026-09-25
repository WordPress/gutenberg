<?php
/**
 * Plugin Name: Gutenberg Test Fields API
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * Extends the fields of Pages through the fields API, one self-contained
 * function per case. Every case registers its fields on
 * `gutenberg_fields_api_init`, the action the registry fires the first time its
 * fields are read, after `init`, once the default fields are registered:
 *
 * 1. `add_field_declarative`: a declarative field (`menu_order`), plain data,
 *    no JavaScript.
 * 2. `add_field_with_script_module`: a field backed by a script module and a
 *    stylesheet (`reading_time`), its value and render coming from
 *    `fields-api/reading-time.js`. The same module exports a complete
 *    `word_count` field no registration names: the module augments the fields
 *    it was registered with, so the entry is ignored and the field is not
 *    registered.
 * 3. `update_field`: a patch of a default field (`comment_status`), which
 *    becomes sortable and hideable, and gets a render from
 *    `fields-api/comment-status.js`, keeping the rest of its definition.
 * 4. `replace_field`: a substitute for a default field (`author`),
 *    unregistered and registered again as a plain integer with a new label.
 * 5. `add_field_with_data`: a field whose value is data the plugin adds to
 *    the Pages REST endpoint (`subtitle`), a REST field backed by post meta,
 *    readable in the list and writable from the Quick Edit form, which the
 *    function adds the field to.
 *
 * @package gutenberg-test-fields-api
 */

/**
 * Case 1: a declarative field (`menu_order`), whose value is a property of
 * the record. No JavaScript, no styles.
 */
function gutenberg_test_fields_api_add_field_declarative() {
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
}
add_action( 'gutenberg_fields_api_init', 'gutenberg_test_fields_api_add_field_declarative' );

/**
 * Case 2: a field (`reading_time`) whose value and render come from a script
 * module, styled by a stylesheet. Two functions:
 *
 * - The assets, on `init` like any plugin asset. The module is registered,
 *   not enqueued: Gutenberg adds the modules of the registered fields to the
 *   import map of the editor pages. A stylesheet cannot ride along with a
 *   script module, so the function enqueues it on every screen where the
 *   field can show.
 * - The field, on `gutenberg_fields_api_init`. The action fires whenever the
 *   registry is first read, during REST requests too, so its callback
 *   registers the field and nothing else.
 *
 * The module also exports a complete `word_count` field, id and label
 * included, that no `gutenberg_register_fields()` call names. A module only
 * augments the fields it was registered with, so the entry is ignored and
 * the field is not registered.
 */
function gutenberg_test_fields_api_register_reading_time_assets() {
	wp_register_script_module(
		'gutenberg-test-fields-api/reading-time',
		plugins_url( 'fields-api/reading-time.js', __FILE__ ),
		array(),
		filemtime( __DIR__ . '/fields-api/reading-time.js' )
	);

	wp_register_style(
		'gutenberg-test-fields-api-reading-time',
		plugins_url( 'fields-api/reading-time.css', __FILE__ ),
		array(),
		filemtime( __DIR__ . '/fields-api/reading-time.css' )
	);
	$enqueue_style = function () {
		wp_enqueue_style( 'gutenberg-test-fields-api-reading-time' );
	};
	// The post editor and the site editor.
	add_action( 'enqueue_block_editor_assets', $enqueue_style );
	// The extensible site editor renders its own document and exits on
	// `admin_init`, before `enqueue_block_editor_assets` fires, so styles are
	// enqueued from its `{page}_init` action instead.
	add_action( 'site-editor-v2_init', $enqueue_style );
	// The extensible site editor rendered inside the wp-admin chrome.
	add_action( 'site-editor-v2-wp-admin_init', $enqueue_style );
}
add_action( 'init', 'gutenberg_test_fields_api_register_reading_time_assets' );

function gutenberg_test_fields_api_add_field_with_script_module() {
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
		'gutenberg-test-fields-api/reading-time'
	);
}
add_action( 'gutenberg_fields_api_init', 'gutenberg_test_fields_api_add_field_with_script_module' );

/**
 * Case 3: a patch of a default field (`comment_status`). Only the properties
 * given change, and the module applies to the field on top of the modules it
 * has. Hideable, so the field can be shown from the view options.
 *
 * A registration with the id of an existing field patches it, so the patch
 * must come after the default fields, registered on `gutenberg_fields_api_init`
 * at priority 0: the default priority does. A patch registered before would
 * be patched by the default definition in turn. The assets go on `init`,
 * split from the field as in case 2.
 */
function gutenberg_test_fields_api_register_comment_status_assets() {
	wp_register_script_module(
		'gutenberg-test-fields-api/comment-status',
		plugins_url( 'fields-api/comment-status.js', __FILE__ ),
		array(),
		filemtime( __DIR__ . '/fields-api/comment-status.js' )
	);

	wp_register_style(
		'gutenberg-test-fields-api-comment-status',
		plugins_url( 'fields-api/comment-status.css', __FILE__ ),
		array(),
		filemtime( __DIR__ . '/fields-api/comment-status.css' )
	);
	$enqueue_style = function () {
		wp_enqueue_style( 'gutenberg-test-fields-api-comment-status' );
	};
	// The same screens as case 2: see the comments there.
	add_action( 'enqueue_block_editor_assets', $enqueue_style );
	add_action( 'site-editor-v2_init', $enqueue_style );
	add_action( 'site-editor-v2-wp-admin_init', $enqueue_style );
}
add_action( 'init', 'gutenberg_test_fields_api_register_comment_status_assets' );

function gutenberg_test_fields_api_update_field() {
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
		'gutenberg-test-fields-api/comment-status'
	);
}
add_action( 'gutenberg_fields_api_init', 'gutenberg_test_fields_api_update_field' );

/**
 * Case 4: a substitute for a default field (`author`). Unregistering drops
 * its definition and detaches its script modules, so the registration that
 * follows is the whole field. The default priority runs after the default
 * fields: there is nothing to unregister before.
 */
function gutenberg_test_fields_api_replace_field() {
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
add_action( 'gutenberg_fields_api_init', 'gutenberg_test_fields_api_replace_field' );

/**
 * Case 5: a field (`subtitle`) whose value is data the plugin adds to the
 * Pages REST endpoint. Three parts:
 *
 * - A REST field reading and writing post meta the plugin owns, which the
 *   endpoint does not expose otherwise, so the record of every page carries
 *   `subtitle` and a request updating a page can set it. Hooked to
 *   `rest_api_init` on its own: a request to the Pages endpoint does not read
 *   the fields registry, so `gutenberg_fields_api_init` may never fire during it.
 * - A declarative field like case 1. The field API reads the value from the
 *   record and, as the field is not read-only, the Quick Edit form saves the
 *   edits with the record, through the REST field.
 * - An entry in the Quick Edit form of Pages. The form lists its fields
 *   explicitly in the view configuration of the entity, so a new field is
 *   not offered for editing until it is added there. Merging appends the
 *   field to the end of the form. Filtered from the moment the plugin
 *   loads, whenever the view configuration is read.
 */
function gutenberg_test_fields_api_add_field_with_data() {
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
add_action( 'gutenberg_fields_api_init', 'gutenberg_test_fields_api_add_field_with_data' );

add_action(
	'rest_api_init',
	function () {
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
);

add_filter(
	'get_entity_view_config_posttype_page',
	function ( $data ) {
		return $data->merge(
			array(
				'form' => array(
					'fields' => array( 'subtitle' ),
				),
			),
			1
		);
	}
);

/**
 * Registers a submenu rendering the extensible site editor inside the
 * wp-admin chrome, so the `site-editor-v2-wp-admin_init` enqueues above can
 * be exercised. The page has no menu entry of its own.
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
