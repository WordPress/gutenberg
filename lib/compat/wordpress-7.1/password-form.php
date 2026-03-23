<?php
/**
 * Adds the wp-block-button__link wp-element-button classes to the password form submit button
 * when block themes are active.
 *
 * @param string $content HTML content for password form for password-protected post.
 * @return string HTML content for password form for password-protected post.
 */
function gutenberg_password_form_7_1( $content ) {
	if ( ! wp_is_block_theme() ) {
		return $content;
	}

	$processor = new WP_HTML_Tag_Processor( $content );

	while ( $processor->next_tag( 'input' ) ) {
		if ( 'submit' === $processor->get_attribute( 'type' ) ) {
			$processor->add_class( 'wp-block-button__link' );
			$processor->add_class( wp_theme_get_element_class_name( 'button' ) );
			$content = $processor->get_updated_html();
			break;
		}
	}

	if ( wp_style_is( 'wp-block-button', 'registered' ) ) {
		wp_enqueue_style( 'wp-block-button' );
	}

	return $content;
}
add_filter( 'the_password_form', 'gutenberg_password_form_7_1', PHP_INT_MAX );
