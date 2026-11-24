<?php
/**
 * REST API: Gutenberg_REST_View_Config_Controller_7_3 class
 *
 * @package gutenberg
 */

/**
 * Controller which provides a REST endpoint for retrieving the default
 * view configuration for a given entity type.
 *
 * Extends the 7.2 controller to add the item count of each view in the `page`
 * view list.
 *
 * @since 7.3.0
 *
 * @see Gutenberg_REST_View_Config_Controller_7_2
 */
class Gutenberg_REST_View_Config_Controller_7_3 extends Gutenberg_REST_View_Config_Controller_7_2 {

	/**
	 * Returns the view configuration for the given entity type.
	 *
	 * Adds the item count of each view in the `page` view list. The counts are
	 * added here rather than through the view config filter, so that they are
	 * computed from the view list after every filter has changed it.
	 *
	 * @since 7.3.0
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		$response = parent::get_items( $request );
		if ( is_wp_error( $response ) || 'postType' !== $request->get_param( 'kind' ) || 'page' !== $request->get_param( 'name' ) ) {
			return $response;
		}

		// Skip the counting when the request leaves out the view list, such as
		// the editor's request for the form alone.
		if ( ! rest_is_field_included( 'view_list', $this->get_fields_for_response( $request ) ) ) {
			return $response;
		}

		$data = $response->get_data();
		if ( is_array( $data['view_list'] ) ) {
			$data['view_list'] = $this->add_counts_to_view_list( 'page', $data['view_list'], $data['default_view'], $data['default_layouts'] );
			$response->set_data( $data );
		}

		return $response;
	}

	/**
	 * Retrieves the view configuration schema, conforming to JSON Schema.
	 *
	 * Adds the `count` of each entry in the view list, which get_items()
	 * provides.
	 *
	 * @since 7.3.0
	 *
	 * @return array Item schema data.
	 */
	public function get_item_schema() {
		$schema = parent::get_item_schema();

		$schema['properties']['view_list']['items']['properties']['count'] = array(
			'description' => __( 'Number of items the view holds.', 'gutenberg' ),
			'type'        => 'integer',
			'readonly'    => true,
		);

		return $schema;
	}

	/**
	 * Adds the item count of each view to a post type's view list.
	 *
	 * Runs on the view list as the client receives it, after every view config
	 * filter, so a count always describes the view it sits on. Only a view whose
	 * total a status count answers gets one: a view without filters, which lists
	 * every status but trash, and a view whose only filter is on the status. A view
	 * narrowed by anything else, such as a date filter a plugin added, is left
	 * without a count rather than showing a total it does not hold. That includes
	 * filters a view inherits from the default view or from the defaults of any
	 * layout it can be shown in.
	 *
	 * `wp_count_posts()` answers every view from one cached query, and its
	 * `readable` permission argument keeps private posts the current user cannot
	 * read out of the totals.
	 *
	 * @since 7.3.0
	 *
	 * @param string       $post_type       The post type the view list belongs to.
	 * @param array        $view_list       The view list.
	 * @param array|object $default_view    The default view the views inherit from.
	 * @param array|object $default_layouts The default view properties of each layout.
	 * @return array The view list, with a count on each view a status total answers.
	 */
	protected function add_counts_to_view_list( $post_type, $view_list, $default_view = array(), $default_layouts = array() ) {
		$counts = (array) wp_count_posts( $post_type, 'readable' );

		foreach ( $view_list as $index => $entry ) {
			$statuses = $this->get_view_list_entry_statuses( $entry, $default_view, $default_layouts );
			if ( null === $statuses ) {
				continue;
			}

			$count = 0;
			foreach ( $statuses as $status ) {
				$count += isset( $counts[ $status ] ) ? (int) $counts[ $status ] : 0;
			}
			$view_list[ $index ]['count'] = $count;
		}

		return $view_list;
	}

	/**
	 * Returns the statuses a view list entry lists, when the status is all it
	 * filters by in every layout it can be shown in.
	 *
	 * The user can switch a view to any layout on offer, and each layout's defaults
	 * can bring filters of their own. The server cannot see which layout the user
	 * picked, so a count has to hold in all of them: when the layouts disagree, the
	 * entry gets none.
	 *
	 * The entry and defaults come from view config filters, so their shape is not
	 * trusted.
	 *
	 * @since 7.3.0
	 *
	 * @param mixed        $entry           A view list entry.
	 * @param array|object $default_view    The default view the entry inherits from.
	 * @param array|object $default_layouts The default view properties of each layout.
	 * @return string[]|null The statuses, or null when the view filters by anything
	 *                       else in some layout or its shape is not recognized.
	 */
	protected function get_view_list_entry_statuses( $entry, $default_view = array(), $default_layouts = array() ) {
		if ( ! is_array( $entry ) ) {
			return null;
		}

		$view            = isset( $entry['view'] ) ? (array) $entry['view'] : array();
		$default_view    = (array) $default_view;
		$default_layouts = (array) $default_layouts;

		// Without layouts on offer, no layout defaults apply.
		$layouts = empty( $default_layouts ) ? array( array() ) : $default_layouts;

		$statuses = null;
		foreach ( $layouts as $layout_defaults ) {
			$layout_statuses = $this->get_layered_view_statuses(
				array( $default_view, (array) $layout_defaults, $view )
			);
			if ( null === $layout_statuses || ( null !== $statuses && $layout_statuses !== $statuses ) ) {
				return null;
			}
			$statuses = $layout_statuses;
		}

		return $statuses;
	}

	/**
	 * Returns the statuses a view lists, when the status is all it filters by.
	 *
	 * Resolves the view's filters out of its layers as the client does: a later
	 * layer that sets them replaces them outright rather than adding to them. A
	 * `search` in a layer is ignored, as the client drops it from the config and
	 * takes the search from the URL instead.
	 *
	 * @since 7.3.0
	 *
	 * @param array[] $layers The view's layers, lowest first.
	 * @return string[]|null The statuses, or null when the view filters by anything
	 *                       else or its shape is not recognized.
	 */
	protected function get_layered_view_statuses( $layers ) {
		$filters = array();
		foreach ( $layers as $layer ) {
			if ( array_key_exists( 'filters', $layer ) ) {
				$filters = $layer['filters'];
			}
		}

		if ( ! is_array( $filters ) ) {
			return null;
		}
		if ( empty( $filters ) ) {
			// Every status but trash, matching what a view without filters queries.
			return array( 'publish', 'future', 'draft', 'pending', 'private' );
		}
		if ( 1 !== count( $filters ) ) {
			return null;
		}

		$filter = (array) reset( $filters );
		if (
			! isset( $filter['field'], $filter['operator'], $filter['value'] ) ||
			'status' !== $filter['field'] ||
			! in_array( $filter['operator'], array( 'is', 'isAny' ), true )
		) {
			return null;
		}

		$values   = is_array( $filter['value'] ) ? $filter['value'] : array( $filter['value'] );
		$statuses = array();
		foreach ( $values as $value ) {
			if ( ! is_string( $value ) ) {
				return null;
			}

			// The REST API also accepts several statuses in one value, separated by
			// commas or spaces, and parses them the same way.
			foreach ( wp_parse_slug_list( $value ) as $status ) {
				if ( 'any' === $status ) {
					// As in WP_Query, `any` is every status not excluded from search.
					$statuses = array_merge( $statuses, array_values( get_post_stati( array( 'exclude_from_search' => false ) ) ) );
				} else {
					$statuses[] = $status;
				}
			}
		}

		// A status listed twice is still queried once.
		return array_values( array_unique( $statuses ) );
	}
}
