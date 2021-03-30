<?php
/**
 * Two images side by side.
 *
 * @package WordPress
 */

return array(
	'title'       => __( 'Two images side by side' ),
	'categories'  => array( 'gallery' ),
	'content'     => '<!-- wp:gallery {"ids":[259,258],"linkTo":"none","align":"wide"} -->
	<figure class="wp-block-gallery alignwide columns-2 is-cropped"><ul class="blocks-gallery-grid"><li class="blocks-gallery-item"><figure><img src="https://s.w.org/images/core/5.8/nature-above-01.jpg" alt="' . __( 'An aerial view of waves crashing against a shore.' ) . '" data-id="259" data-full-url="https://s.w.org/images/core/5.8/nature-above-01.jpg" data-link="#" class="wp-image-259"/></figure></li><li class="blocks-gallery-item"><figure><img src="https://s.w.org/images/core/5.8/nature-above-02.jpg" alt="' . __( 'An aerial view of a field. A road runs through the upper right corner.' ) . '" data-id="258" data-full-url="https://s.w.org/images/core/5.8/nature-above-02.jpg" data-link="#" class="wp-image-258"/></figure></li></ul></figure>
	<!-- /wp:gallery -->',
	'description' => _x( 'Two images side by side', 'Block pattern description' ),
);
