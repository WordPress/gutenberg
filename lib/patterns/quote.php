<?php
/**
 * Quote block pattern.
 *
 * @package gutenberg
 */

return array(
	'title'         => __( 'Quote', 'gutenberg' ),
<<<<<<< HEAD
	'content'       => "<!-- wp:quote {\"className\":\"is-style-large\"} -->\n<blockquote class=\"wp-block-quote is-style-large\"><p>" . __( '"I know not all that may be coming, but be it what it will, I\'ll go to it laughing."', 'gutenberg' ) . '</p><cite>' . __( '— Herman Melville, Moby-Dick (1851)', 'gutenberg' ) . "</cite></blockquote>\n<!-- /wp:quote -->",
=======
	'content'       => "<!-- wp:group -->\n<div class=\"wp-block-group\"><div class=\"wp-block-group__inner-container\"><!-- wp:image {\"align\":\"center\",\"width\":164,\"height\":164,\"sizeSlug\":\"large\",\"className\":\"is-style-rounded\"} -->\n<div class=\"wp-block-image is-style-rounded\"><figure class=\"aligncenter size-large is-resized\"><img src=\"https://s.w.org/images/core/5.5/don-quixote-03.jpg\" alt=\"" . __( 'Pencil drawing of Don Quixote', 'gutenberg' ) . "\" width=\"164\" height=\"164\"/></figure></div>\n<!-- /wp:image -->\n\n<!-- wp:quote {\"align\":\"center\",\"className\":\"is-style-large\"} -->\n<blockquote class=\"wp-block-quote has-text-align-center is-style-large\"><p>" . __( '"Do you see over yonder, friend Sancho, thirty or forty hulking giants? I intend to do battle with them and slay them."', 'gutenberg' ) . '</p><cite>' . __( '— Don Quixote', 'gutenberg' ) . "</cite></blockquote>\n<!-- /wp:quote -->\n\n<!-- wp:separator {\"className\":\"is-style-dots\"} -->\n<hr class=\"wp-block-separator is-style-dots\"/>\n<!-- /wp:separator --></div></div>\n<!-- /wp:group -->",
>>>>>>> 244bf26fe7... Block patterns: Fix translatable strings (#24317)
	'viewportWidth' => 800,
	'categories'    => array( 'text' ),
);
