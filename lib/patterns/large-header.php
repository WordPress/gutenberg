<?php
/**
 * Large header block pattern.
 *
 * @package gutenberg
 */

return array(
	'title'         => __( 'Large header', 'gutenberg' ),
	'content'       => "<!-- wp:group {\"align\":\"wide\"} -->\n<div class=\"wp-block-group alignwide\"><div class=\"wp-block-group__inner-container\"><!-- wp:cover {\"customGradient\":\"linear-gradient(135deg,rgb(255,245,204) 0%,rgb(182,227,211) 50%,rgb(51,167,182) 100%)\",\"align\":\"wide\"} -->\n<div class=\"wp-block-cover alignwide has-background-dim has-background-gradient\" style=\"background:linear-gradient(135deg,rgb(255,245,204) 0%,rgb(182,227,211) 50%,rgb(51,167,182) 100%)\"><div class=\"wp-block-cover__inner-container\"><!-- wp:paragraph {\"align\":\"center\",\"placeholder\":\"Write title…\",\"style\":{\"typography\":{\"fontSize\":90},\"color\":{\"text\":\"#00000a\"}}} -->\n<p class=\"has-text-align-center has-text-color\" style=\"font-size:90px;color:#00000a\"><strong>" . __( 'Loomings', 'gutenberg' ) . "</strong></p>\n<!-- /wp:paragraph --></div></div>\n<!-- /wp:cover --></div></div>\n<!-- /wp:group -->",
	'viewportWidth' => 1000,
	'categories'    => array( 'header' ),
);
