<?php
/**
 * Navigation menus: choosing the menus a page is added to when it is published.
 *
 * A page's publish request can carry a `navigation_menus` field, the IDs of
 * the Navigation Menus to add a link to the page to. It replaces, for that
 * page only, the set of menus the "Auto add new pages" setting would add it to.
 * The editor's pre-publish panel sends it when the author changes a menu's
 * checkbox; a request without the field gets the setting's behavior.
 *
 * @package gutenberg
 */

/**
 * Registers the write-only `navigation_menus` field on pages.
 *
 * The field is read by `gutenberg_navigation_stash_publish_menu_choice()`
 * before the page is saved, so that the choice is in place when the status
 * transition adds the page to menus. It is never part of a response.
 */
function gutenberg_register_navigation_menus_page_field() {
	register_rest_field(
		'page',
		'navigation_menus',
		array(
			'get_callback'    => null,
			'update_callback' => null,
			'schema'          => array(
				'description' => __( 'The IDs of the Navigation Menus to add a link to the page to when it is published. Replaces the menus the "Auto add new pages" setting would add it to.', 'gutenberg' ),
				'type'        => 'array',
				'items'       => array( 'type' => 'integer' ),
				'context'     => array(),
			),
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_register_navigation_menus_page_field' );

/**
 * Stores or returns the menus chosen for a page in the current request.
 *
 * A page created and published in one request has no ID when the choice is
 * stored, so it is kept under the ID 0 and returned for the next page.
 *
 * @param int        $post_id The page ID, or 0 for a page being created.
 * @param int[]|null $menus   Optional. Menu IDs to store for the page. Pass
 *                            null to store nothing and return the stored
 *                            choice; pass an empty array to store "no menu".
 * @return int[]|null The stored menu IDs, or null when there is no choice.
 */
function gutenberg_navigation_publish_menu_choice( $post_id, $menus = null ) {
	static $choices = array();

	if ( null !== $menus ) {
		$choices[ (int) $post_id ] = array_map( 'intval', $menus );
		return $choices[ (int) $post_id ];
	}

	if ( isset( $choices[ (int) $post_id ] ) ) {
		$choice = $choices[ (int) $post_id ];
		unset( $choices[ (int) $post_id ] );
		return $choice;
	}

	if ( isset( $choices[0] ) ) {
		$choice = $choices[0];
		unset( $choices[0] );
		return $choice;
	}

	return null;
}

/**
 * Keeps the `navigation_menus` field of a page request for the status
 * transition that saves the page.
 *
 * @param stdClass        $prepared_post The page about to be saved.
 * @param WP_REST_Request $request       The request.
 * @return stdClass The unchanged page.
 */
function gutenberg_navigation_stash_publish_menu_choice( $prepared_post, $request ) {
	if ( $request->has_param( 'navigation_menus' ) ) {
		gutenberg_navigation_publish_menu_choice(
			empty( $prepared_post->ID ) ? 0 : $prepared_post->ID,
			(array) $request->get_param( 'navigation_menus' )
		);
	}
	return $prepared_post;
}
add_filter( 'rest_pre_insert_page', 'gutenberg_navigation_stash_publish_menu_choice', 10, 2 );

/**
 * Drops a choice the page's save did not use, such as one sent with a draft.
 *
 * @param WP_Post $post The saved page.
 */
function gutenberg_navigation_forget_publish_menu_choice( $post ) {
	gutenberg_navigation_publish_menu_choice( $post->ID );
	gutenberg_navigation_publish_menu_choice( 0 );
}
add_action( 'rest_after_insert_page', 'gutenberg_navigation_forget_publish_menu_choice' );
