<?php
/**
 * Temporary compatibility shims for pattern APIs present in Gutenberg.
 *
 * @package gutenberg
 */

register_block_pattern(
	'gutenberg/get-in-touch',
	array(
		'title'      => esc_html__( 'Get In Touch', 'default' ),
		'categories' => array( 'call-to-action' ),
		'content'    => implode(
			'',
			array(
				'<!-- wp:paragraph {"fontSize":"huge"} -->',
				'<p class="has-huge-font-size">' . esc_html__( 'Get In Touch', 'default' ) . '</p>',
				'<!-- /wp:paragraph -->',
				'<!-- wp:columns -->',
				'<div class="wp-block-columns"><!-- wp:column -->',
				'<div class="wp-block-column"><!-- wp:paragraph -->',
				'<p>' . esc_html__( '20 Cooper Avenue', 'default' ) . '<br>' . esc_html__( 'New York, New York 10023', 'default' ) . '</p>',
				'<!-- /wp:paragraph --></div>',
				'<!-- /wp:column -->',
				'<!-- wp:column -->',
				'<div class="wp-block-column"><!-- wp:paragraph -->',
				'<p>' . esc_html__( '(555) 555-5555', 'default' ) . '<br><a href="mailto:example@example.com">' . esc_html__( 'example@example.com', 'default' ) . '</a></p>',
				'<!-- /wp:paragraph --></div>',
				'<!-- /wp:column --></div>',
				'<!-- /wp:columns -->',
				'<!-- wp:buttons -->',
				'<div class="wp-block-buttons"><!-- wp:button {"backgroundColor":"dark-gray"} -->',
				'<div class="wp-block-button"><a class="wp-block-button__link has-dark-gray-background-color has-background">' . esc_html__( 'Contact Us', 'default' ) . '</a></div>',
				'<!-- /wp:button --></div>',
				'<!-- /wp:buttons -->',
			)
		),
	)
);
