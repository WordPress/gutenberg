<?php
/**
 * REST API: Gutenberg_REST_Block_Patterns_Controller_7_0 class
 *
 * @package gutenberg
 */

/**
 * Core class used to access block patterns via the REST API.
 *
 * @see WP_REST_Block_Patterns_Controller
 */
class Gutenberg_REST_Block_Patterns_Controller_7_0 extends WP_REST_Block_Patterns_Controller {
	public function __construct() {
		parent::__construct();
	}

	/**
	 * Checks whether a string contains any value from a list.
	 *
	 * This avoids using str_contains() because Gutenberg still supports older PHP
	 * versions than PHP 8.
	 *
	 * @param string $haystack The string to search.
	 * @param array  $needles  The substrings to find.
	 * @return bool Whether a substring was found.
	 */
	private function contains_any( $haystack, $needles ) {
		foreach ( $needles as $needle ) {
			if ( false !== strpos( $haystack, $needle ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Temporarily maps Twenty Twenty-Five starter page patterns to the prototype
	 * page layout categories.
	 *
	 * This is intentionally not a long-term API. It lets the Extensible Site Editor
	 * prototype demonstrate the categorized Add Page flow with today's bundled
	 * theme patterns. Future themes should provide `pageTypes` directly when
	 * registering patterns, which will bypass this compatibility mapping.
	 *
	 * @param array $item Raw pattern as registered.
	 * @return array Page type slugs for the prototype picker.
	 */
	private function get_temporary_twenty_twenty_five_page_types( $item ) {
		$pattern_name  = isset( $item['name'] ) ? strtolower( $item['name'] ) : '';
		$pattern_title = isset( $item['title'] )
			? strtolower( wp_strip_all_tags( $item['title'] ) )
			: '';
		$pattern_text  = $pattern_name . ' ' . $pattern_title;

		if ( false === strpos( $pattern_name, 'twentytwentyfive/' ) ) {
			return array();
		}

		if (
			$this->contains_any(
				$pattern_text,
				array(
					'event-rsvp',
					'event rsvp',
					'landing-event',
					'landing page for event',
				)
			)
		) {
			return array( 'event' );
		}

		if (
			$this->contains_any(
				$pattern_text,
				array(
					'link-in-bio',
					'link in bio',
				)
			)
		) {
			return array( 'link-in-bio' );
		}

		if (
			$this->contains_any(
				$pattern_text,
				array(
					'coming-soon',
					'coming soon',
				)
			)
		) {
			return array( 'coming-soon' );
		}

		if (
			$this->contains_any(
				$pattern_text,
				array(
					'cv-bio',
					'cv/bio',
					'cv bio',
				)
			)
		) {
			return array( 'personal' );
		}

		if (
			$this->contains_any(
				$pattern_text,
				array(
					'business-home',
					'business homepage',
					'portfolio-home',
					'portfolio homepage',
					'shop-home',
					'shop homepage',
				)
			)
		) {
			return array( 'homepage' );
		}

		if (
			$this->contains_any(
				$pattern_text,
				array(
					'landing-book',
					'landing page for book',
					'landing-podcast',
					'landing page for podcast',
				)
			)
		) {
			return array( 'landing-page' );
		}

		return array();
	}

	/**
	 * Note: no changes have been made to this class.
	 * This class extension exists only to override the core route,
	 * and to ensure the gutenberg_resolve_pattern_blocks function is used in the prepare_item_for_response method.
	 * See: https://github.com/WordPress/gutenberg/pull/72988
	 *
	 * @since 6.0.0
	 */
	public function register_routes() {
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base,
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( $this, 'get_items' ),
					'permission_callback' => array( $this, 'get_items_permissions_check' ),
				),
				'schema' => array( $this, 'get_public_item_schema' ),
			),
			true // Override the core route.
		);
	}

	/**
	 * Note: no changes have been made to this class.
	 * This class extension exists only to override the core route,
	 * and to ensure the gutenberg_resolve_pattern_blocks function is used in the prepare_item_for_response method.
	 * See: https://github.com/WordPress/gutenberg/pull/72988
	 *
	 * @since 6.0.0
	 * @since 6.3.0 Added `source` property.
	 *
	 * @param array           $item    Raw pattern as registered, before any changes.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function prepare_item_for_response( $item, $request ) {
		$blocks          = parse_blocks( $item['content'] );
		$blocks          = gutenberg_resolve_pattern_blocks( $blocks );
		$item['content'] = serialize_blocks( $blocks );

		if ( ! isset( $item['pageTypes'] ) ) {
			$temporary_page_types = $this->get_temporary_twenty_twenty_five_page_types( $item );
			if ( ! empty( $temporary_page_types ) ) {
				$item['pageTypes'] = $temporary_page_types;
			}
		}

		$fields = $this->get_fields_for_response( $request );
		$keys   = array(
			'name'          => 'name',
			'title'         => 'title',
			'content'       => 'content',
			'description'   => 'description',
			'viewportWidth' => 'viewport_width',
			'inserter'      => 'inserter',
			'categories'    => 'categories',
			'keywords'      => 'keywords',
			'blockTypes'    => 'block_types',
			'postTypes'     => 'post_types',
			'templateTypes' => 'template_types',
			'pageTypes'     => 'page_types',
			'source'        => 'source',
		);
		$data   = array();
		foreach ( $keys as $item_key => $rest_key ) {
			if ( isset( $item[ $item_key ] ) && rest_is_field_included( $rest_key, $fields ) ) {
				$data[ $rest_key ] = $item[ $item_key ];
			}
		}

		$context = ! empty( $request['context'] ) ? $request['context'] : 'view';
		$data    = $this->add_additional_fields_to_object( $data, $request );
		$data    = $this->filter_response_by_context( $data, $context );
		return rest_ensure_response( $data );
	}

	/**
	 * Extends the REST schema with the prototype page layout category metadata.
	 *
	 * The client receives this as `pageTypes` after core-data camel-cases REST
	 * responses, matching existing pattern properties such as `blockTypes`.
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		$schema = parent::get_item_schema();

		$schema['properties']['page_types'] = array(
			'description' => __(
				'Page layout categories for this pattern.',
				'gutenberg'
			),
			'type'        => 'array',
			'context'     => array( 'view', 'edit', 'embed' ),
			'readonly'    => true,
			'items'       => array(
				'type' => 'string',
			),
		);

		return $schema;
	}
}
