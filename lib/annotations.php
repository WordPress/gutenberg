<?php
/**
 * Annotations API: Functions
 *
 * @package gutenberg
 * @since [version]
 */

// Dependencies.
require dirname( __FILE__ ) . '/class-wp-annotation-utils.php';
require dirname( __FILE__ ) . '/class-wp-annotation-caps.php';
require dirname( __FILE__ ) . '/class-wp-annotation.php';
require dirname( __FILE__ ) . '/class-wp-annotation-selector.php';

/**
 * Gets an annotation.
 *
 * @since [version]
 *
 * @param WP_Annotation|WP_Comment|string|int $comment Annotation, comment, or ID.
 * @param string                              $output  The required return type.
 *  One of `OBJECT`, `ARRAY_A`, or `ARRAY_N`, which correspond to an object,
 *  an associative array, or a numeric array, respectively.
 *
 * @return WP_Annotation|array|null                    Depends on `$output` value.
 */
function get_annotation( $comment = null, $output = OBJECT ) {
	if ( null === $comment && isset( $GLOBALS['comment'] ) ) {
		$comment = $GLOBALS['comment'];
	}

	if ( $comment instanceof WP_Annotation ) {
		$annotation = $comment;
	} else {
		$annotation = WP_Annotation::get_instance( $comment );
	}

	if ( ! $annotation ) {
		return null;
	}

	/**
	 * Fires after an annotation is retrieved.
	 *
	 * @since [version]
	 *
	 * @param WP_Annotation $annotation Annotation.
	 */
	$annotation = apply_filters( 'get_annotation', $annotation );

	if ( OBJECT === $output ) {
		return $annotation;
	} elseif ( ARRAY_A === $output ) {
		return $annotation->to_array();
	} elseif ( ARRAY_N === $output ) {
		return array_values( $annotation->to_array() );
	}

	return $annotation;
}

/**
 * Gets annotation comment types.
 *
 * @since [version]
 *
 * @return string[] Annotation comment types.
 */
function get_annotation_types() {
	$types = array( get_default_annotation_type() );

	/**
	 * Filters annotation comment types.
	 *
	 * @since [version]
	 *
	 * @param string[] $types Annotation comment types.
	 */
	$types = apply_filters( 'get_annotation_types', $types );

	return $types;
}

/**
 * Gets default annotation comment type.
 *
 * @since [version]
 *
 * @return string Default annotation comment type.
 */
function get_default_annotation_type() {
	$type = 'annotation';

	/**
	 * Filters default annotation comment type.
	 *
	 * @since [version]
	 *
	 * @param string $type Default annotation comment type.
	 */
	$type = apply_filters( 'get_default_annotation_type', $type );

	return $type;
}

/**
 * Gets annotation comment statuses.
 *
 * @since [version]
 *
 * @param  bool $filter One of `built_in`, `custom`.
 *                      Default is `''` (all statuses).
 *
 * @return string[]     Annotation comment statuses.
 */
function get_annotation_statuses( $filter = '' ) {
	$built_in = array(
		'approved',
		'approve',
		'1',
		'hold',
		'0',
		'spam',
		'trash',
	);

	if ( 'built_in' === $filter ) {
		return $built_in;
	}

	$custom   = array(
		'resolve', // Archived as resolved.
		'reject',  // Archived as rejected.
		'archive', // Archived for another reason.
	);
	$statuses = array_merge( $built_in, $custom );

	/**
	 * Filters annotation comment statuses.
	 *
	 * @since [version]
	 *
	 * @param string[] $statuses Annotation comment statuses.
	 */
	$statuses = apply_filters( 'get_annotation_statuses', $statuses );

	if ( 'custom' === $filter ) {
		$statuses = array_diff( $statuses, $built_in );
	}

	return $statuses;
}

/**
 * Gets default annotation comment status.
 *
 * @since [version]
 *
 * @return string Default annotation comment status.
 */
function get_default_annotation_status() {
	$status = 'approve';

	/**
	 * Filters default annotation comment status.
	 *
	 * @since [version]
	 *
	 * @param string $type Default annotation comment status.
	 */
	$status = apply_filters( 'get_default_annotation_status', $status );

	return $status;
}
