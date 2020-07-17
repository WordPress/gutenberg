<?php
/**
 * Large header block pattern.
 *
 * @package gutenberg
 */

return array(
	'title'         => __( 'Large header', 'gutenberg' ),
	'content'       => "<!-- wp:group {\"align\":\"wide\"} -->\n<div class=\"wp-block-group alignwide\"><div class=\"wp-block-group__inner-container\"><!-- wp:cover {\"customGradient\":\"linear-gradient(135deg,rgb(255,245,204) 0%,rgb(192,255,250) 100%)\",\"contentPosition\":\"center center\",\"align\":\"wide\"} -->\n<div class=\"wp-block-cover alignwide has-background-dim has-background-gradient is-position-center-center\" style=\"background:linear-gradient(135deg,rgb(255,245,204) 0%,rgb(192,255,250) 100%)\"><div class=\"wp-block-cover__inner-container\"><!-- wp:paragraph {\"align\":\"center\",\"placeholder\":\"Write title…\",\"style\":{\"typography\":{\"fontSize\":74,\"lineHeight\":\"1.1\"},\"color\":{\"text\":\"#00000a\"}}} -->\n<p class=\"has-text-align-center has-text-color\" style=\"line-height:1.1;font-size:74px;color:#00000a\"><strong>" . __( 'Devilish Brilliance', 'gutenberg' ) . "</strong></p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph {\"align\":\"center\",\"textColor\":\"black\",\"style\":{\"typography\":{\"fontSize\":18}}} -->\n<p class=\"has-text-align-center has-black-color has-text-color\" style=\"font-size:18px\"><strong>" . __( 'AND BEAUTY OF MANY', 'gutenberg' ) . "</strong></p>\n<!-- /wp:paragraph --></div></div>\n<!-- /wp:cover --></div></div>\n<!-- /wp:group -->",
	'viewportWidth' => 1000,
	'categories'    => array( 'header' ),
);
