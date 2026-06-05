<?php
/**
 * Modifies the wp_kses_allowed_html array.
 *
 * @package gutenberg
 */

/**
 * Add the form elements to the allowed tags array.
 *
 * @param array $allowedtags The allowed tags.
 *
 * @return array The allowed tags.
 */
function gutenberg_kses_allowed_html( $allowedtags ) {
	if ( ! gutenberg_is_experiment_enabled( 'gutenberg-form-blocks' ) ) {
		return $allowedtags;
	}

	$allowedtags['input'] = array(
		'type'          => array(),
		'name'          => array(),
		'value'         => array(),
		'checked'       => array(),
		'required'      => array(),
		'aria-required' => array(),
		'class'         => array(),
	);

	$allowedtags['label'] = array(
		'for'   => array(),
		'class' => array(),
	);

	$allowedtags['textarea'] = array(
		'name'          => array(),
		'required'      => array(),
		'aria-required' => array(),
		'class'         => array(),
	);
	return $allowedtags;
}
add_filter( 'wp_kses_allowed_html', 'gutenberg_kses_allowed_html' );

/**
 * Add the dialog element to the allowed tags array.
 *
 * @param array $allowedtags The allowed tags.
 *
 * @return array The allowed tags.
 */
function gutenberg_kses_allow_dialog( $allowedtags ) {
	if ( ! gutenberg_is_experiment_enabled( 'gutenberg-block-experiments' ) ) {
		return $allowedtags;
	}

	$allowedtags['dialog'] = array(
		'id'                                    => array(),
		'class'                                 => array(),
		'style'                                 => array(),
		'role'                                  => array(),
		'aria-modal'                            => array(),
		'aria-labelledby'                       => array(),
		'open'                                  => array(),
		// Interactivity API directives.
		'data-wp-interactive'                   => array(),
		'data-wp-class--active'                 => array(),
		'data-wp-class--show-closing-animation' => array(),
		'data-wp-on--click'                     => array(),
		'data-wp-init--on-auto-activation'      => array(),
		'data-wp-on-document--keydown'          => array(),
		'data-wp-watch--on-dialog-open'         => array(),
		'data-wp-watch--on-dialog-close'        => array(),
	);
	return $allowedtags;
}
add_filter( 'wp_kses_allowed_html', 'gutenberg_kses_allow_dialog' );
