<?php
/**
 * Header: Simple header inside image.
 *
 * @package WordPress
 */

return array(
	'title'      => _x( 'Simple header inside image', 'Block pattern title', 'gutenberg' ),
	'blockTypes' => array( 'core/template-part/header' ),
	'categories' => array( 'header' ),
	'content'    => '<!-- wp:group {"align":"full","layout":{"inherit":true}} -->
					<div class="wp-block-group alignfull"><!-- wp:cover {"url":"https://s.w.org/patterns/files/2022/08/5eca6-header-mountains-scaled-1.jpg","id":57,"dimRatio":0,"minHeight":680,"contentPosition":"center center","isDark":false,"align":"full"} -->
					<div class="wp-block-cover alignfull is-light" style="min-height:680px"><span aria-hidden="true" class="has-background-dim-0 wp-block-cover__gradient-background has-background-dim"></span><img class="wp-block-cover__image-background wp-image-57" alt="" src="https://s.w.org/patterns/files/2022/08/5eca6-header-mountains-scaled-1.jpg" data-object-fit="cover"/><div class="wp-block-cover__inner-container"><!-- wp:columns {"verticalAlignment":null,"isStackedOnMobile":false} -->
					<div class="wp-block-columns is-not-stacked-on-mobile"><!-- wp:column {"verticalAlignment":"center"} -->
					<div class="wp-block-column is-vertically-aligned-center"><!-- wp:group {"layout":{"type":"flex"}} -->
					<div class="wp-block-group"><!-- wp:site-logo {"width":60} /-->
					
					<!-- wp:site-title /--></div>
					<!-- /wp:group --></div>
					<!-- /wp:column -->
					
					<!-- wp:column {"verticalAlignment":"center"} -->
					<div class="wp-block-column is-vertically-aligned-center"><!-- wp:navigation {"layout":{"type":"flex","setCascadingProperties":true,"justifyContent":"right"}} /-->
					</div>
					<!-- /wp:column --></div>
					<!-- /wp:columns -->
					
					<!-- wp:spacer {"height":"480px"} -->
					<div style="height:480px" aria-hidden="true" class="wp-block-spacer"></div>
					<!-- /wp:spacer --></div></div>
					<!-- /wp:cover --></div>
					<!-- /wp:group -->',
);
