<?php
/**
 * Plugin Name: Reproduce Core Data Issue
 * Description: A test plugin to demonstrate issues with @wordpress/core-data
 */

function core_data_issue() {
	?>
	<div id="container">
		<h1>Reproduce Issue with @wordpress/core-data</h1>
		<div id="core-data"></div>
	</div>
	<?php
}

/**
 * Add a menu for the main view, and a submenu item for the Candidates Custom Post Type.
 */
function coredata_issue() {
	add_menu_page(
		'Core data issue',
		'Core data issue',
		'edit_posts',
		'coredata_issue',
		'core_data_issue'
	);
}
add_action( 'admin_menu', 'coredata_issue' );

/**
 * Enqueue our scripts and styles.
 */
function enqueue_scripts() {
	$dependencies_file = plugin_dir_path( __FILE__ ) . '/dist/index.asset.php';
	$script_dependencies = array( 'wp-polyfill' );
	if ( file_exists( $dependencies_file ) ) {
		$asset_manifest      = include $dependencies_file;
		$script_dependencies = $asset_manifest['dependencies'];
	}

	wp_enqueue_script( 'core_data', plugin_dir_url( __FILE__ ) . 'dist/index.js', $script_dependencies );
	wp_enqueue_style( 'core_data', plugin_dir_url( __FILE__ ) . 'style.css' );
}
add_action( 'admin_enqueue_scripts', 'enqueue_scripts', 10 );

/**
 * Register the Book Custom Post Type.
 */
function book_post_type() {

	$labels = array(
		'name'           => _x( 'Books', 'Post Type General Name', 'coredata_issue' ),
		'singular_name'  => _x( 'Book', 'Post Type Singular Name', 'coredata_issue' ),
		'menu_name'      => __( 'My Books', 'coredata_issue' ),
		'name_admin_bar' => __( 'Books', 'coredata_issue' ),
		'archives'       => __( 'Book Archives', 'coredata_issue' ),
		'attributes'     => __( 'Book Attributes', 'coredata_issue' ),
		'all_items'      => __( 'All books', 'coredata_issue' ),
		'add_new'        => __( 'Add New', 'coreddata_issue' ),
	);
	$args   = array(
		'label'               => __( 'Book', 'coredata_issue' ),
		'description'         => __( 'Book', 'coredata_issue' ),
		'labels'              => $labels,
		'supports'            => array( 'title' ),
		'hierarchical'        => false,
		'public'              => true,
		'publicly_queryable'  => true,
		'show_ui'             => true,
		'show_in_menu'        => false,
		'menu_position'       => 5,
		'exclude_from_search' => false,
		'searchable'          => true,
		'publicly_queryable'  => true,
		'rewrite'             => false,
		'capability_type'     => 'post',
		'show_in_rest'        => true,
		'rest_base'           => 'books',
	);
	register_post_type( 'book', $args );

	register_rest_field(
		'book',
		'json',
		[
			'get_callback'    =>
			function( $object = '', $field_name = '', $request = array() ) {
				return get_post_meta( $object['id'], $field_name, true );
			},
			'update_callback' =>
			function( $value, $object, $field_name ) {
				return update_post_meta( $object->ID, $field_name, $value );
			},
		]
	);

}
add_action( 'init', 'book_post_type' );

/**
 * Increase REST API per page value.
 *
 * @param array $params Default API paramaters.
 *
 * @return array Filtered API parameters.
 */
function change_per_page( $params ) {
	if ( isset( $params['per_page'] ) ) {
		$params['per_page']['maximum'] = 9999;
	}
	return $params;
}
add_filter( 'rest_candidate_collection_params', 'change_per_page', 10, 1 );

/**
 * Import books from books json.
 */
function import_fixtures() {
	if (get_option( 'fixtures_imported', '0' ) == '1') {
		return;
	}

	// Dummy data
	$books = <<<JSON
[
	{
		"title": "In Search of Lost Time",
		"isFavouriteBook": false
	},
	{
		"title": "Ulysses",
		"isFavouriteBook": false
	},
	{
		"title": "Don Quixote",
		"isFavouriteBook": false
	},
	{
		"title": "The Great Gatsby",
		"isFavouriteBook": false
	},
	{
		"title": "Book5",
		"isFavouriteBook": false
	},
	{
		"title": "Book6",
		"isFavouriteBook": false
	},
	{
		"title": "Book7",
		"isFavouriteBook": false
	},
	{
		"title": "Book8",
		"isFavouriteBook": false
	},
	{
		"title": "Book9",
		"isFavouriteBook": false
	},
	{
		"title": "Book10",
		"isFavouriteBook": false
	},
	{
		"title": "Book11",
		"isFavouriteBook": false
	}
]
JSON;

	$json = json_decode($books);
	foreach ( $json as $c ) {
		$post_id = wp_insert_post(
			[
				'post_title'  => $c->title,
				'post_type'   => 'book',
				'post_status' => 'publish',
			]
		);
		$result  = update_post_meta( $post_id, 'json', $c );
	}

	update_option('fixtures_imported', '1');
}

add_action('init', 'import_fixtures');




