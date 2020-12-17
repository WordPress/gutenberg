<?php
/**
 * Large header block pattern.
 *
 * @package gutenberg
 */

return array(
	'title'         => __( 'List with Image', 'gutenberg' ),
	'content'       => '<!-- wp:group {"align":"full","style":{"color":{"background":"#ffffff","text":"#151515"}}} -->
<div class="wp-block-group alignfull has-text-color has-background" style="background-color:#ffffff;color:#151515"><div class="wp-block-group__inner-container"><!-- wp:spacer {"height":64} -->
<div style="height:64px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:columns {"align":"wide"} -->
<div class="wp-block-columns alignwide"><!-- wp:column -->
<div class="wp-block-column"><!-- wp:heading {"style":{"typography":{"fontSize":50,"lineHeight":"1.2"}}} -->
<h2 style="font-size:50px;line-height:1.2">Your membership includes:</h2>
<!-- /wp:heading --></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:list -->
<ul><li>An in-depth, personalized consultation to set goals and establish a plan</li><li>Check-ins with me every 2 weeks</li><li>5 workout regimens a week catered to your goals and progress</li><li>Nutrition recommendations to support your target goals</li></ul>
<!-- /wp:list --></div>
<!-- /wp:column --></div>
<!-- /wp:columns --></div></div>
<!-- /wp:group -->

<!-- wp:spacer {"height":30} -->
<div style="height:30px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:cover {"url":"https://dotcompatterns.files.wordpress.com/2020/10/elena-kloppenburg-eruc4fttcuo-unsplash-2.jpg","id":2720,"dimRatio":0,"focalPoint":{"x":"0.50","y":"0.40"},"minHeight":580,"minHeightUnit":"px","align":"full"} -->
<div class="wp-block-cover alignfull" style="background-image:url(https://dotcompatterns.files.wordpress.com/2020/10/elena-kloppenburg-eruc4fttcuo-unsplash-2.jpg);min-height:580px;background-position:50% 40%"><div class="wp-block-cover__inner-container"></div></div>
<!-- /wp:cover -->', 
	'viewportWidth' => 1000,
	'categories'    => array( 'header' ),
	'description'   => _x( 'A test of the list with image pattern.', 'Block pattern description', 'gutenberg' ),
);
