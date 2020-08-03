<?php
/**
 * Large header block pattern.
 *
 * @package gutenberg
 */

return array(
<<<<<<< HEAD
	'title'         => __( 'Large header', 'gutenberg' ),
	'content'       => "<!-- wp:group {\"align\":\"wide\"} -->\n<div class=\"wp-block-group alignwide\"><div class=\"wp-block-group__inner-container\"><!-- wp:cover {\"customGradient\":\"linear-gradient(135deg,rgb(255,245,204) 0%,rgb(182,227,211) 50%,rgb(51,167,182) 100%)\",\"align\":\"wide\"} -->\n<div class=\"wp-block-cover alignwide has-background-dim has-background-gradient\" style=\"background:linear-gradient(135deg,rgb(255,245,204) 0%,rgb(182,227,211) 50%,rgb(51,167,182) 100%)\"><div class=\"wp-block-cover__inner-container\"><!-- wp:paragraph {\"align\":\"center\",\"placeholder\":\"Write title…\",\"style\":{\"typography\":{\"fontSize\":90},\"color\":{\"text\":\"#00000a\"}}} -->\n<p class=\"has-text-align-center has-text-color\" style=\"font-size:90px;color:#00000a\"><strong>" . __( 'Loomings', 'gutenberg' ) . "</strong></p>\n<!-- /wp:paragraph --></div></div>\n<!-- /wp:cover --></div></div>\n<!-- /wp:group -->",
=======
	'title'         => __( 'Large header with a heading', 'gutenberg' ),
	'content'       => "<!-- wp:cover {\"url\":\"https://s.w.org/images/core/5.5/don-quixote-06.jpg\",\"id\":165,\"dimRatio\":15,\"focalPoint\":{\"x\":\"0.40\",\"y\":\"0.26\"},\"minHeight\":375,\"minHeightUnit\":\"px\",\"contentPosition\":\"center center\",\"align\":\"wide\"} -->\n<div class=\"wp-block-cover alignwide has-background-dim-20 has-background-dim is-position-center-center\" style=\"background-image:url(https://s.w.org/images/core/5.5/don-quixote-06.jpg);min-height:375px;background-position:40% 26%\"><div class=\"wp-block-cover__inner-container\"><!-- wp:paragraph {\"align\":\"center\",\"placeholder\":\"" . __( 'Write title…', 'gutenberg' ) . "\",\"style\":{\"typography\":{\"fontSize\":74,\"lineHeight\":\"1.1\"},\"color\":{\"text\":\"#fffffa\"}}} -->\n<p class=\"has-text-align-center has-text-color\" style=\"line-height:1.1;font-size:74px;color:#fffffa\"><strong>" . __( 'Don Quixote', 'gutenberg' ) . "</strong></p>\n<!-- /wp:paragraph --></div></div>\n<!-- /wp:cover -->",
>>>>>>> 244bf26fe7... Block patterns: Fix translatable strings (#24317)
	'viewportWidth' => 1000,
	'categories'    => array( 'header' ),
);
