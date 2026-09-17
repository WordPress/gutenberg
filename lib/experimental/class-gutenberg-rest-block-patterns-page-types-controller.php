<?php
/**
 * Adds prototype page layout categories to the block patterns REST endpoint.
 *
 * @package gutenberg
 */

/**
 * Extends the core block patterns controller with a `page_types` field.
 *
 * The Extensible Site Editor's "Add page" flow groups starter patterns by the
 * kind of page they produce. Core patterns carry no such grouping yet, so this
 * controller exposes one for the prototype to read.
 */
class Gutenberg_REST_Block_Patterns_Page_Types_Controller extends WP_REST_Block_Patterns_Controller {

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
	 * Adds the page layout categories to the prepared pattern.
	 *
	 * @param array           $item    Raw pattern as registered.
	 * @param WP_REST_Request $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $item, $request ) {
		$response = parent::prepare_item_for_response( $item, $request );
		$fields   = $this->get_fields_for_response( $request );

		if ( ! rest_is_field_included( 'page_types', $fields ) ) {
			return $response;
		}

		$page_types = isset( $item['pageTypes'] )
			? $item['pageTypes']
			: $this->get_temporary_twenty_twenty_five_page_types( $item );

		if ( empty( $page_types ) ) {
			return $response;
		}

		$data               = $response->get_data();
		$data['page_types'] = $page_types;
		$response->set_data( $data );

		return $response;
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
			'description' => __( 'Page layout categories for this pattern.', 'gutenberg' ),
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

/**
 * Registers the block patterns routes with the page types field.
 */
function gutenberg_register_block_patterns_page_types_controller() {
	$controller = new Gutenberg_REST_Block_Patterns_Page_Types_Controller();
	$controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_block_patterns_page_types_controller' );
