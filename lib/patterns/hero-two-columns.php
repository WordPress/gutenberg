<?php
/**
 * Hero Two Columns block pattern.
 *
 * @package gutenberg
 */

return array(
	'title'      => __( 'Hero Two Columns', 'gutenberg' ),
	'categories' => array( 'columns' ),
	'content'    => "<!-- wp:group {\"customBackgroundColor\":\"#d1cfcb\",\"align\":\"wide\"} -->\n<div class=\"wp-block-group alignwide has-background\" style=\"background-color:#d1cfcb\"><div class=\"wp-block-group__inner-container\"><!-- wp:paragraph {\"align\":\"center\",\"customTextColor\":\"#3c0c0f\"} -->\n<p style=\"color:#3c0c0f\" class=\"has-text-color has-text-align-center\"><em>Enjoy a wide variety of</em></p>\n<!-- /wp:paragraph -->\n\n<!-- wp:paragraph {\"align\":\"center\",\"customTextColor\":\"#830c08\",\"customFontSize\":60} -->\n<p style=\"color:#830c08;font-size:60px\" class=\"has-text-color has-text-align-center\"><strong>Custom Designs</strong></p>\n<!-- /wp:paragraph -->\n\n<!-- wp:columns {\"align\":\"full\"} -->\n<div class=\"wp-block-columns alignfull\"><!-- wp:column -->\n<div class=\"wp-block-column\"><!-- wp:paragraph {\"customTextColor\":\"#000000\"} -->\n<p style=\"color:#000000\" class=\"has-text-color\">Extend it with over 54,000 plugins to help your website meet your needs. Add an online store, galleries, mailing lists, forums, analytics, and much more. Hundreds of thousands of developers and site owners trust it worldwide.</p>\n<!-- /wp:paragraph --></div>\n<!-- /wp:column -->\n\n<!-- wp:column -->\n<div class=\"wp-block-column\"><!-- wp:paragraph -->\n<p>Hundreds of thousands of developers and site owners trust it worldwide. Extend it with over 54,000 plugins to help your website meet your needs. Add an online store, galleries, mailing lists, forums, analytics, and much more.</p>\n<!-- /wp:paragraph --></div>\n<!-- /wp:column --></div>\n<!-- /wp:columns --></div></div>\n<!-- /wp:group -->",
);
