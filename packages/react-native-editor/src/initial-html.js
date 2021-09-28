export default `
<!-- wp:heading -->
<h2>Text Blocks</h2>
<!-- /wp:heading -->

<!-- wp:heading -->
<h2 id="this-is-an-anchor">What is Gutenberg?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><strong>Bold</strong> <em>Italic</em> <s>Striked</s> Superscript<sup>(1)</sup> Subscript<sub>(2)</sub> <a href="http://www.wordpress.org" target="_blank" rel="noreferrer noopener">Link</a></p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":4} -->
<h4>List</h4>
<!-- /wp:heading -->

<!-- wp:list -->
<ul><li>First Item</li><li>Second Item</li><li>Third Item</li></ul>
<!-- /wp:list -->

<!-- wp:heading {"level":4} -->
<h4>Quote</h4>
<!-- /wp:heading -->

<!-- wp:quote {"align":"left","className":"is-style-large"} -->
<blockquote class="wp-block-quote has-text-align-left is-style-large"><p>"This will make running your own blog a viable alternative again."</p><cite>— <a href="https://twitter.com/azumbrunnen_/status/1019347243084800005">Adrian Zumbrunnen</a></cite></blockquote>
<!-- /wp:quote -->

<!-- wp:pullquote -->
<figure class="wp-block-pullquote"><blockquote><p>One of the hardest things to do in technology is disrupt yourself.</p><cite>Matt Mullenweg</cite></blockquote></figure>
<!-- /wp:pullquote -->

<!-- wp:heading {"level":4} -->
<h4>Style Paragraph</h4>
<!-- /wp:heading -->

<!-- wp:paragraph {"dropCap":true,"className":"custom-class-1 custom-class-2 has-background has-vivid-red-background-color","fontSize":"large"} -->
<p class="has-drop-cap custom-class-1 custom-class-2 has-background has-vivid-red-background-color has-large-font-size">
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer tempor tincidunt sapien, quis dictum orci sollicitudin quis. Proin sed elit id est pulvinar feugiat vitae eget dolor. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
<!-- /wp:paragraph -->

<!-- wp:heading {"level":4} -->
<h4>Pre formatted</h4>
<!-- /wp:heading -->

<!-- wp:preformatted -->
<pre class="wp-block-preformatted">Some <em>preformatted</em> text...<br>And more!</pre>
<!-- /wp:preformatted -->

<!-- wp:heading {"level":4} -->
<h4>Code</h4>
<!-- /wp:heading -->

<!-- wp:code -->
<pre class="wp-block-code"><code>if name == "World":
    return "Hello World"
else:
    return "Hello Pony"</code></pre>
<!-- /wp:code -->

<!-- wp:heading {"level":4} -->
<h4>Verse</h4>
<!-- /wp:heading -->

<!-- wp:verse {"textAlign":"center"} -->
<pre class="wp-block-verse has-text-align-center">Come<br>Home.</pre>
<!-- /wp:verse -->

<!-- wp:heading -->
<h2>Media</h2>
<!-- /wp:heading -->

<!-- wp:heading {"level":4} -->
<h4>Images</h4>
<!-- /wp:heading -->

<!-- wp:image -->
<figure class="wp-block-image"><img alt=""/></figure>
<!-- /wp:image -->

<!-- wp:image -->
<figure class="wp-block-image"><img src="https://cldup.com/cXyG__fTLN.jpg" alt=""/><figcaption>Mountain</figcaption></figure>
<!-- /wp:image -->

<!-- wp:heading {"level":4} -->
<h4>Video</h4>
<!-- /wp:heading -->

<!-- wp:video {"autoplay":false,"id":683,"loop":false,"muted":false,"playsInline":false,"src":"https://i.cloudup.com/YtZFJbuQCE.mov"} -->
<figure class="wp-block-video"><video controls src="https://i.cloudup.com/YtZFJbuQCE.mov"></video><figcaption>Videos too!</figcaption></figure>
<!-- /wp:video -->

<!-- wp:heading {"level":4} -->
<h4>File</h4>
<!-- /wp:heading -->

<!-- wp:file /-->

<!-- wp:file {"id":3,"href":"https://wordpress.org/latest.zip"} -->
<div class="wp-block-file"><a href="https://wordpress.org/latest.zip">WordPress.zip</a><a href="https://wordpress.org/latest.zip" class="wp-block-file__button" download>Download</a></div>
<!-- /wp:file -->

<!-- wp:heading {"level":4} -->
<h4>Audio</h4>
<!-- /wp:heading -->

<!-- wp:audio /-->

<!-- wp:audio {"id":5} -->
<figure class="wp-block-audio"><audio controls src="https://cldup.com/59IrU0WJtq.mp3"></audio></figure>
<!-- /wp:audio -->

<!-- wp:heading {"level":4} -->
<h4>Gallery</h4>
<!-- /wp:heading -->

<!-- wp:gallery {"columns":8,"className":"alignfull"} -->
<figure class="wp-block-gallery columns-8 is-cropped alignfull"><ul class="blocks-gallery-grid"><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon.png" alt=""/><figcaption class="blocks-gallery-item__caption">Paragraph</figcaption></figure></li><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Heading.png" alt=""/><figcaption class="blocks-gallery-item__caption">Heading</figcaption></figure></li><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Subheading.png" alt=""/><figcaption class="blocks-gallery-item__caption">Subheading</figcaption></figure></li><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Quote.png" alt=""/><figcaption class="blocks-gallery-item__caption">Quote</figcaption></figure></li><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Image.png" alt=""/><figcaption class="blocks-gallery-item__caption">Image</figcaption></figure></li><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Gallery.png" alt=""/><figcaption class="blocks-gallery-item__caption">Gallery</figcaption></figure></li><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Cover-Image.png" alt=""/><figcaption class="blocks-gallery-item__caption">Cover Image</figcaption></figure></li><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Video.png" alt=""/><figcaption class="blocks-gallery-item__caption">Video</figcaption></figure></li><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Audio.png" alt=""/><figcaption class="blocks-gallery-item__caption">Audio</figcaption></figure></li><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Column.png" alt=""/><figcaption class="blocks-gallery-item__caption">Columns</figcaption></figure></li><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-File.png" alt=""/><figcaption class="blocks-gallery-item__caption">File</figcaption></figure></li><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Code.png" alt=""/><figcaption class="blocks-gallery-item__caption">Code</figcaption></figure></li><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-List.png" alt=""/><figcaption class="blocks-gallery-item__caption">List</figcaption></figure></li><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Button.png" alt=""/><figcaption class="blocks-gallery-item__caption">Button</figcaption></figure></li><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Embeds.png" alt=""/><figcaption class="blocks-gallery-item__caption">Embeds</figcaption></figure></li><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-More.png" alt=""/><figcaption class="blocks-gallery-item__caption">More</figcaption></figure></li></ul></figure>
<!-- /wp:gallery -->

<!-- wp:heading -->
<h2>Separators</h2>
<!-- /wp:heading -->

<!-- wp:nextpage -->
<!--nextpage-->
<!-- /wp:nextpage -->

<!-- wp:more -->
<!--more-->
<!-- /wp:more -->

<!-- wp:spacer -->
<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:heading -->
<h2>Layout</h2>
<!-- /wp:heading -->

<!-- wp:heading {"level":4} -->
<h4>Group</h4>
<!-- /wp:heading -->

<!-- wp:group -->
<div id="this-is-another-anchor" class="wp-block-group"><div class="wp-block-group__inner-container"><!-- wp:paragraph -->
<p>One.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Two</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Three.</p>
<!-- /wp:paragraph --></div></div>
<!-- /wp:group -->

<!-- wp:heading {"level":4} -->
<h4>Columns</h4>
<!-- /wp:heading -->

<!-- wp:columns {"className":"gutenberg-landing\u002d\u002ddevelopers-columns has-2-columns"} -->
<div class="wp-block-columns gutenberg-landing--developers-columns has-2-columns"><!-- wp:column -->
<div class="wp-block-column"><!-- wp:paragraph {"align":"left"} -->
<p class="has-text-align-left"><strong>Built with modern technology.</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"align":"left"} -->
<p class="has-text-align-left">Gutenberg was developed on GitHub using the WordPress REST API, JavaScript, and React.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"align":"left","fontSize":"small"} -->
<p class="has-text-align-left has-small-font-size"><a href="https://wordpress.org/gutenberg/handbook/language/">Learn more</a></p>
<!-- /wp:paragraph --></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:paragraph {"align":"left"} -->
<p class="has-text-align-left"><strong>Designed for compatibility.</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"align":"left"} -->
<p class="has-text-align-left">We recommend migrating features to blocks, but support for existing WordPress functionality remains. There will be transition paths for shortcodes, meta-boxes, and Custom Post Types.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"align":"left","fontSize":"small"} -->
<p class="has-text-align-left has-small-font-size"><a href="https://wordpress.org/gutenberg/handbook/reference/faq/">Learn more</a></p>
<!-- /wp:paragraph --></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->

<!-- wp:heading {"level":4} -->
<h4>Media Text</h4>
<!-- /wp:heading -->

<!-- wp:media-text {"isStackedOnMobile":false,"className":"is-stacked-on-mobile"} -->
<div class="wp-block-media-text alignwide is-stacked-on-mobile"><figure class="wp-block-media-text__media"></figure><div class="wp-block-media-text__content"><!-- wp:paragraph {"className":"has-large-font-size"} -->
<p class="has-large-font-size"></p>
<!-- /wp:paragraph --></div></div>
<!-- /wp:media-text -->

<!-- wp:heading {"level":4} -->
<h4>Cover</h4>
<!-- /wp:heading -->

<!-- wp:cover {"url":"https://cldup.com/cXyG__fTLN.jpg","id":890,"dimRatio":20,"overlayColor":"luminous-vivid-orange","focalPoint":{"x":"0.63","y":"0.83"},"minHeight":219} -->
<div class="wp-block-cover has-background-dim-20 has-luminous-vivid-orange-background-color has-background-dim" style="background-image:url(https://cldup.com/cXyG__fTLN.jpg);background-position:63% 83%;min-height:219px"><div class="wp-block-cover__inner-container"><!-- wp:paragraph {"align":"center","placeholder":"Write title…","className":"has-text-color has-very-light-gray-color","fontSize":"large"} -->
<p class="has-text-align-center has-text-color has-very-light-gray-color has-large-font-size">Cool cover</p>
<!-- /wp:paragraph --></div></div>
<!-- /wp:cover -->

<!-- wp:heading -->
<h2>Dynamic Blocks</h2>
<!-- /wp:heading -->

<!-- wp:latest-posts {"displayPostContent":true,"displayPostDate":true} /-->

<!-- wp:heading -->
<h2>Buttons</h2>
<!-- /wp:heading -->

<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link">Solid Button</a></div>
<!-- /wp:button -->

<!-- wp:button {"gradient":"luminous-vivid-amber-to-luminous-vivid-orange"} -->
<div class="wp-block-button"><a class="wp-block-button__link has-luminous-vivid-amber-to-luminous-vivid-orange-gradient-background has-background">Gradient Button</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons -->

<!-- wp:heading -->
<h2>Legacy</h2>
<!-- /wp:heading -->

<!-- wp:shortcode -->
[youtube https://www.youtube.com/watch?v=ssfHW5lwFZg]
<!-- /wp:shortcode -->

<!-- wp:heading -->
<h2>Unsupported</h2>
<!-- /wp:heading -->

<!-- wp:rss /-->

<!-- wp:heading {"align":"left","level":4,"className":"has-primary-background-color has-background","style":{"typography":{"lineHeight":"2.5"}}} -->
<h4 class="has-text-align-left has-primary-background-color has-background" style="line-height:2.5">Heading with line-height set</h4>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>This block is used in initial HTML e2e tests and should be kept as the last block.</p>
<!-- /wp:paragraph -->
`;
