<?php
/**
 * Large header and a paragraph block pattern.
 *
 * @package gutenberg
 */

return array(
	'title'         => __( 'Large header and a paragraph', 'gutenberg' ),
	'content'       => "<!-- wp:group {\"align\":\"wide\"} -->\n<div class=\"wp-block-group alignwide\"><div class=\"wp-block-group__inner-container\"><!-- wp:cover {\"customOverlayColor\":\"#02314e\",\"contentPosition\":\"center center\",\"align\":\"wide\"} -->\n<div class=\"wp-block-cover alignwide has-background-dim is-position-center-center\" style=\"background-color:#02314e\"><div class=\"wp-block-cover__inner-container\"><!-- wp:paragraph {\"align\":\"left\",\"placeholder\":\"Write title…\",\"textColor\":\"white\",\"style\":{\"typography\":{\"fontSize\":72,\"lineHeight\":\"1\"}}} -->\n<p class=\"has-text-align-left has-white-color has-text-color\" style=\"line-height:1;font-size:72px\">" . __( 'Years ago...', 'gutenberg' ) . "</p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph {\"align\":\"left\",\"textColor\":\"white\",\"style\":{\"typography\":{\"lineHeight\":\"1.5\",\"fontSize\":18}}} -->\n<p class=\"has-text-align-left has-white-color has-text-color\" style=\"line-height:1.6;font-size:18px\">" . __( 'I am tormented with an everlasting itch for things remote.<br>I love to sail forbidden seas, and land on barbarous coasts.', 'gutenberg' ) . "</p>\n<!-- /wp:paragraph --></div></div>\n<!-- /wp:cover --></div></div>\n<!-- /wp:group -->",
	'viewportWidth' => 1000,
	'categories'    => array( 'header' ),
);
