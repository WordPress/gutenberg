<?php
/**
 * Header: Header with Large Font Size.
 *
 * @package WordPress
 */

return array(
	'title'      => _x( 'Header with Large Font Size', 'Block pattern title', 'gutenberg' ),
	'blockTypes' => array( 'core/template-part/header' ),
	'categories' => array( 'header' ),
	'content'    => '<!-- wp:group {"align":"full","style":{"spacing":{"padding":{"top":"30px","right":"30px","bottom":"30px","left":"30px"}}},"layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"space-between"}} -->
					<div class="wp-block-group alignfull" style="padding-top:30px;padding-right:30px;padding-bottom:30px;padding-left:30px;"><!-- wp:site-title {"style":{"typography":{"fontStyle":"normal","fontWeight":"700"}},"fontSize":"large"} /-->
					
					<!-- wp:navigation {"layout":{"type":"flex","justifyContent":"space-between"},"style":{"spacing":{"blockGap":"30px"}},"fontSize":"large"} /--></div>
					<!-- /wp:group -->',
);
