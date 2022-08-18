<?php
/**
 * Header: Simple header with image.
 *
 * @package WordPress
 */

return array(
	'title'      => _x( 'Simple header with image', 'Block pattern title', 'gutenberg' ),
	'blockTypes' => array( 'core/template-part/header' ),
	'categories' => array( 'header' ),
	'content'    => '<!-- wp:group {"align":"full","layout":{"inherit":true}} -->
					<div class="wp-block-group alignfull"><!-- wp:group {"align":"full","style":{"spacing":{"padding":{"bottom":"0em","top":"1em","right":"1em","left":"1em"}}},"layout":{"type":"flex","justifyContent":"space-between"}} -->
					<div class="wp-block-group alignfull" style="padding-top:1em;padding-right:1em;padding-bottom:0em;padding-left:1em"><!-- wp:group {"layout":{"type":"flex"}} -->
					<div class="wp-block-group"><!-- wp:site-logo {"width":60} /-->

					<!-- wp:site-title /--></div>
					<!-- /wp:group -->

					<!-- wp:navigation {"layout":{"type":"flex","setCascadingProperties":true,"justifyContent":"right"}} /--></div>
					<!-- /wp:group -->

					<!-- wp:cover {"url":"https://s.w.org/patterns/files/2022/08/5eca6-header-mountains-scaled-1.jpg","dimRatio":0,"isDark":false,"align":"full"} -->
					<div class="wp-block-cover alignfull is-light"><span aria-hidden="true" class="wp-block-cover__background has-background-dim-0 has-background-dim"></span><img class="wp-block-cover__image-background" alt="" src="https://s.w.org/patterns/files/2022/08/5eca6-header-mountains-scaled-1.jpg" data-object-fit="cover"/><div class="wp-block-cover__inner-container"><!-- wp:paragraph {"align":"center","placeholder":"' . __( 'Write title…', 'gutenberg' ) . '","fontSize":"large"} -->
					<p class="has-text-align-center has-large-font-size"></p>
					<!-- /wp:paragraph --></div></div>
					<!-- /wp:cover --></div>
					<!-- /wp:group -->',
);
