<?php
/**
 * Two columns of Text block pattern.
 *
 * @package gutenberg
 */

return array(
	'title'      => __( 'Two columns of text', 'gutenberg' ),
	'categories' => array( 'columns' ),
	'content'    => "<!-- wp:group -->\n<div class=\"wp-block-group\"><div class=\"wp-block-group__inner-container\"><!-- wp:heading -->\n<h2><strong>" . __( 'CHAPTER 1. Loomings', 'gutenberg' ) . "</strong></h2>\n<!-- /wp:heading -->\n\n<!-- wp:columns -->\n<div class=\"wp-block-columns\"><!-- wp:column -->\n<div class=\"wp-block-column\"><!-- wp:paragraph -->\n<p>" . __( 'Call me Ishmael. Some years ago —never mind how long precisely— having little or no money in my purse, and nothing particular to interest me on shore, I thought I would sail about a little and see the watery part of the world. It is a way I have of driving off the spleen and regulating the circulation. I find myself growing grim about the mouth; whenever it is a damp, drizzly November in my soul.', 'gutenberg' ) . "</p>\n<!-- /wp:paragraph --></div>\n<!-- /wp:column -->\n\n<!-- wp:column -->\n<div class=\"wp-block-column\"><!-- wp:paragraph -->\n<p>" . __( 'Whenever I find myself pausing before coffin warehouses, and bringing up the rear of every funeral I meet; and especially whenever my hypos get such an upper hand of me, that it requires a strong moral principle to prevent me from deliberately stepping into the street, and methodically knocking people’s hats off—then, I account it high time to get to sea as soon as I can.', 'gutenberg' ) . "</p>\n<!-- /wp:paragraph --></div>\n<!-- /wp:column --></div>\n<!-- /wp:columns --></div></div>\n<!-- /wp:group -->",
);
