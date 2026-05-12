<?php
/**
 * Extends the native posts REST collection with an `on_this_day` query
 * parameter that filters posts by month and day, regardless of year.
 *
 * The parameter accepts a `MM-DD` string. When present, the controller
 * appends a `date_query` clause to the underlying `WP_Query`, which
 * resolves to an efficient SQL filter on the month and day components
 * of `post_date`.
 *
 * @package gutenberg
 */

/**
 * Pattern enforced on the `on_this_day` REST parameter.
 *
 * Accepts months `01`-`12` and days `01`-`31`. The combination is not
 * calendar-validated here; impossible dates simply return no results.
 */
const GUTENBERG_ON_THIS_DAY_PATTERN = '^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$';

/**
 * Advertises the `on_this_day` parameter on the posts REST collection.
 *
 * @param array $params Collection parameters keyed by name.
 * @return array Collection parameters with `on_this_day` appended.
 */
function gutenberg_on_this_day_register_collection_param( $params ) {
	$params['on_this_day'] = array(
		'description' => __( 'Limit response to posts published on the given month and day (MM-DD), regardless of year.', 'gutenberg' ),
		'type'        => 'string',
		'pattern'     => GUTENBERG_ON_THIS_DAY_PATTERN,
	);

	return $params;
}
add_filter( 'rest_post_collection_params', 'gutenberg_on_this_day_register_collection_param' );

/**
 * Translates the `on_this_day` REST parameter into a `date_query` clause.
 *
 * Skips the translation when the parameter is missing or fails the schema
 * pattern. The schema-level validation in `rest_post_collection_params`
 * normally catches invalid input before this filter runs, but the
 * defensive check keeps the filter safe for callers that bypass the
 * controller's argument validation.
 *
 * @param array           $args    `WP_Query` arguments built by the controller.
 * @param WP_REST_Request $request REST request being handled.
 * @return array `WP_Query` arguments, extended with a `date_query` clause when applicable.
 */
function gutenberg_on_this_day_apply_query( $args, $request ) {
	$value = $request['on_this_day'] ?? null;

	if ( ! is_string( $value ) || ! preg_match( '/' . GUTENBERG_ON_THIS_DAY_PATTERN . '/', $value ) ) {
		return $args;
	}

	[ $month, $day ] = array_map( 'intval', explode( '-', $value ) );

	if ( ! isset( $args['date_query'] ) || ! is_array( $args['date_query'] ) ) {
		$args['date_query'] = array();
	}

	$args['date_query'][] = array(
		'month' => $month,
		'day'   => $day,
	);

	return $args;
}

add_filter( 'rest_post_query', 'gutenberg_on_this_day_apply_query', 10, 2 );
