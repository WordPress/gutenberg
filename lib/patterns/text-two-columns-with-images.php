<?php
/**
 * Two columns of text, each with an image on top block pattern.
 *
 * @package gutenberg
 */

return array(
	'title'      => __( 'Two columns of text with images', 'gutenberg' ),
	'categories' => array( 'columns' ),
	'content'    => "<!-- wp:group -->\n<div class=\"wp-block-group\"><div class=\"wp-block-group__inner-container\"><!-- wp:columns -->\n<div class=\"wp-block-columns\"><!-- wp:column -->\n<div class=\"wp-block-column\"><!-- wp:image {\"width\":250,\"height\":188,\"sizeSlug\":\"large\"} -->\n<figure class=\"wp-block-image size-large is-resized\"><img src=\"https://s.w.org/images/core/5.3/Windbuchencom.jpg\" alt=\"\" width=\"250\" height=\"188\"/></figure>\n<!-- /wp:image -->\n\n<!-- wp:paragraph -->\n<p>" . __( 'I stuffed a shirt or two into my old carpet-bag, tucked it under my arm, and started for Cape Horn and the Pacific. Quitting the good city of old Manhatto, I duly arrived in New Bedford. It was a Saturday night in December. Much was I disappointed upon learning that the little packet for Nantucket had already sailed, and that no way of reaching that place would offer, till the following Monday.', 'gutenberg' ) . "</p>\n<!-- /wp:paragraph --></div>\n<!-- /wp:column -->\n\n<!-- wp:column -->\n<div class=\"wp-block-column\"><!-- wp:image {\"width\":250,\"height\":188,\"sizeSlug\":\"large\"} -->\n<figure class=\"wp-block-image size-large is-resized\"><img src=\"https://s.w.org/images/core/5.3/MtBlanc1.jpg\" alt=\"\" width=\"250\" height=\"188\"/></figure>\n<!-- /wp:image -->\n\n<!-- wp:paragraph -->\n<p>" . __( 'As most young candidates for the pains and penalties of whaling stop at this same New Bedford, thence to embark on their voyage, it may as well be related that I, for one, had no idea of so doing. For my mind was made up to sail in no other than a Nantucket craft, because there was a fine, boisterous something about everything connected with that famous old island, which amazingly pleased me.', 'gutenberg' ) . "</p>\n<!-- /wp:paragraph --></div>\n<!-- /wp:column --></div>\n<!-- /wp:columns --></div></div>\n<!-- /wp:group -->",
);
