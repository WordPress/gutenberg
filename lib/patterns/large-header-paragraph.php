<?php
/**
 * Large header and a paragraph block pattern.
 *
 * @package gutenberg
 */

return array(
	'title'         => __( 'Large header and a paragraph', 'gutenberg' ),
	'content'       => "<!-- wp:group {\"align\":\"wide\"} -->\n<div class=\"wp-block-group alignwide\"><div class=\"wp-block-group__inner-container\"><!-- wp:cover {\"customGradient\":\"radial-gradient(rgb(122,220,179) 0%,rgb(0,208,131) 100%)\",\"contentPosition\":\"center center\",\"align\":\"wide\"} -->\n<div class=\"wp-block-cover alignwide has-background-dim has-background-gradient is-position-center-center\" style=\"background:radial-gradient(rgb(122,220,179) 0%,rgb(0,208,131) 100%)\"><div class=\"wp-block-cover__inner-container\"><!-- wp:paragraph {\"align\":\"center\",\"placeholder\":\"Write title…\",\"style\":{\"typography\":{\"fontSize\":90,\"lineHeight\":\"1.2\"},\"color\":{\"text\":\"#00000a\"}}} -->\n<p class=\"has-text-align-center has-text-color\" style=\"line-height:1.2;font-size:90px;color:#00000a\"><strong>" . __( 'As for me', 'gutenberg' ) . "</strong></p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph {\"align\":\"center\",\"style\":{\"typography\":{\"fontSize\":24,\"lineHeight\":1.4},\"color\":{\"text\":\"#00000a\"}}} -->\n<p class=\"has-text-align-center has-text-color\" style=\"line-height:1.4;font-size:24px;color:#00000a\">" . __( 'I am tormented with an everlasting itch for things remote. I love to sail forbidden seas, and land on barbarous coasts.', 'gutenberg' ) . "</p>\n<!-- /wp:paragraph --></div></div>\n<!-- /wp:cover --></div></div>\n<!-- /wp:group -->",
	'viewportWidth' => 1000,
	'categories'    => array( 'header' ),
);
