<?php
/**
 * Block patterns registration.
 *
 * @package gutenberg
 */

// Initial Query block patterns.
register_block_pattern(
	'query/large-posts',
	array(
		'title'   => __( 'Large', 'gutenberg' ),
		'scope'   => array(
			'inserter' => false,
			'block'    => array( 'core/query' ),
		),
		'content' => '<!-- wp:post-title {"isLink":true} /-->
						<!-- wp:post-featured-image  {"isLink":true,"align":"wide"} /-->
						<!-- wp:post-excerpt /-->
						<!-- wp:separator -->
						<hr class="wp-block-separator"/>
						<!-- /wp:separator -->
						<!-- wp:post-date /-->',
	)
);

register_block_pattern(
	'query/medium-posts',
	array(
		'title'   => __( 'Medium', 'gutenberg' ),
		'scope'   => array(
			'inserter' => false,
			'block'    => array( 'core/query' ),
		),
		'content' => '<!-- wp:columns {"align":"wide"} -->
						<div class="wp-block-columns alignwide"><!-- wp:column {"width":"66.66%"} -->
						<div class="wp-block-column" style="flex-basis:66.66%"><!-- wp:post-featured-image {"isLink":true} /--></div>
						<!-- /wp:column -->
						<!-- wp:column {"width":"33.33%"} -->
						<div class="wp-block-column" style="flex-basis:33.33%"><!-- wp:post-title {"isLink":true} /-->
						<!-- wp:post-excerpt /--></div>
						<!-- /wp:column --></div>
						<!-- /wp:columns -->',
	)
);

register_block_pattern(
	'query/small-posts',
	array(
		'title'   => __( 'Small', 'gutenberg' ),
		'scope'   => array(
			'inserter' => false,
			'block'    => array( 'core/query' ),
		),
		'content' => '<!-- wp:columns {"verticalAlignment":"center"} -->
						<div class="wp-block-columns are-vertically-aligned-center"><!-- wp:column {"verticalAlignment":"center","width":"25%"} -->
						<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:25%"><!-- wp:post-featured-image {"isLink":true} /--></div>
						<!-- /wp:column -->
						<!-- wp:column {"verticalAlignment":"center","width":"75%"} -->
						<div class="wp-block-column is-vertically-aligned-center" style="flex-basis:75%"><!-- wp:post-title {"isLink":true} /--></div>
						<!-- /wp:column --></div>
						<!-- /wp:columns -->',
	)
);

register_block_pattern(
	'template-part/tt1-header',
	array(
		'title'   => __( 'test-TT1 header', 'gutenberg' ),
		'scope'   => array(
			'inserter'  => false,
			'block'     => array( 'core/template-part' ),
			'variation' => 'header',
		),
		'categories'	=> array( 'core/template-part_header' ),
		'content' => '<!-- wp:spacer {"height":70} -->
						<div style="height:70px" aria-hidden="true" class="wp-block-spacer"></div>
						<!-- /wp:spacer -->

						<!-- wp:columns {"align":"wide"} -->
						<div class="wp-block-columns alignwide"><!-- wp:column -->
						<div class="wp-block-column"><!-- wp:site-title /-->

						<!-- wp:site-tagline /--></div>
						<!-- /wp:column -->

						<!-- wp:column -->
						<div class="wp-block-column">
						<!-- wp:navigation {"orientation":"horizontal","itemsJustification":"right"} /-->
						</div>
						<!-- /wp:column --></div>
						<!-- /wp:columns -->

						<!-- wp:spacer {"height":70} -->
						<div style="height:70px" aria-hidden="true" class="wp-block-spacer"></div>
						<!-- /wp:spacer -->',
	)
);

register_block_pattern(
	'template-part/tt1-footer',
	array(
		'title'   => __( 'test-TT1 footer', 'gutenberg' ),
		'scope'   => array(
			'inserter'  => false,
			'block'     => array( 'core/template-part' ),
			'variation' => 'footer',
		),
		'categories' => array( 'core/template-part_footer' ),
		'content' => '<!-- wp:spacer {"height":70} -->
						<div style="height:70px" aria-hidden="true" class="wp-block-spacer"></div>
						<!-- /wp:spacer -->

						<!-- wp:columns {"align":"wide"} -->
						<div class="wp-block-columns alignwide"><!-- wp:column -->
						<div class="wp-block-column"><!-- wp:paragraph -->
						<p><a href="mailto:#">example@example.com<br></a>T. +00 (0)1 22 33 44 55</p>
						<!-- /wp:paragraph --></div>
						<!-- /wp:column -->
						<!-- wp:column -->
						<div class="wp-block-column"><!-- wp:paragraph {"align":"center"} -->
						<p class="has-text-align-center">2, Rue Louis-Boilly<br>Paris, France</p>
						<!-- /wp:paragraph --></div>
						<!-- /wp:column -->
						<!-- wp:column {"verticalAlignment":"center"} -->
						<div class="wp-block-column is-vertically-aligned-center"><!-- wp:social-links {"align":"right","className":"is-style-twentytwentyone-social-icons-color"} -->
						<ul class="wp-block-social-links alignright is-style-twentytwentyone-social-icons-color"><!-- wp:social-link {"url":"https://wordpress.org","service":"wordpress"} /-->
						<!-- wp:social-link {"url":"https://www.facebook.com/WordPress/","service":"facebook"} /-->
						<!-- wp:social-link {"url":"https://twitter.com/WordPress","service":"twitter"} /-->
						<!-- wp:social-link {"url":"https://www.youtube.com/wordpress","service":"youtube"} /--></ul>
						<!-- /wp:social-links --></div>
						<!-- /wp:column --></div>
						<!-- /wp:columns -->

						<!-- wp:spacer {"height":70} -->
						<div style="height:70px" aria-hidden="true" class="wp-block-spacer"></div>
						<!-- /wp:spacer -->

						<!-- wp:separator {"align":"wide","className":"is-style-twentytwentyone-separator-thick"} -->
						<hr class="wp-block-separator alignwide is-style-twentytwentyone-separator-thick"/>
						<!-- /wp:separator -->

						<!-- wp:columns {"align":"wide"} -->
						<div class="wp-block-columns alignwide"><!-- wp:column {"verticalAlignment":"center"} -->
						<div class="wp-block-column is-vertically-aligned-center"><!-- wp:site-title /--></div>
						<!-- /wp:column -->

						<!-- wp:column {"verticalAlignment":"center"} -->
						<div class="wp-block-column is-vertically-aligned-center"><!-- wp:paragraph {"align":"right"} -->
						<p class="has-text-align-right">Proudly powered by <a href="https://wordpress.org/">WordPress</a>.</p>
						<!-- /wp:paragraph --></div>
						<!-- /wp:column --></div>
						<!-- /wp:columns -->',
	)
);

