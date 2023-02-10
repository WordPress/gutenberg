export const textBlocks = `<!-- wp:heading -->
<h2 class="wp-block-heading" id="this-is-an-anchor">What is Gutenberg?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><strong>Bold</strong> <em>Italic</em> <s>Striked</s> Superscript<sup>(1)</sup> Subscript<sub>(2)</sub> <a href="http://www.wordpress.org" target="_blank" rel="noreferrer noopener">Link</a></p>
<!-- /wp:paragraph -->

<!-- wp:heading {"textAlign":"left","level":4,"className":"has-primary-background-color has-background","style":{"typography":{"lineHeight":"2.5"}}} -->
<h4 class="wp-block-heading has-text-align-left has-primary-background-color has-background" style="line-height:2.5">Heading with line-height set</h4>
<!-- /wp:heading -->

<!-- wp:list -->
<ul><!-- wp:list-item -->
<li>First Item</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Second Item</li>
<!-- /wp:list-item -->

<!-- wp:list-item -->
<li>Third Item</li>
<!-- /wp:list-item --></ul>
<!-- /wp:list -->

<!-- wp:quote {"align":"left","className":"is-style-large"} -->
<blockquote class="wp-block-quote has-text-align-left is-style-large"><!-- wp:paragraph -->
<p>"This will make running your own blog a viable alternative again."</p>
<!-- /wp:paragraph --><cite>— <a href="https://twitter.com/azumbrunnen_/status/1019347243084800005">Adrian Zumbrunnen</a></cite></blockquote>
<!-- /wp:quote -->

<!-- wp:pullquote -->
<figure class="wp-block-pullquote"><blockquote><p>One of the hardest things to do in technology is disrupt yourself.</p><cite>Matt Mullenweg</cite></blockquote></figure>
<!-- /wp:pullquote -->

<!-- wp:paragraph {"dropCap":true,"className":"custom-class-1 custom-class-2 has-background has-vivid-red-background-color","fontSize":"large"} -->
<p class="has-drop-cap custom-class-1 custom-class-2 has-background has-vivid-red-background-color has-large-font-size">
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer tempor tincidunt sapien, quis dictum orci sollicitudin quis. Proin sed elit id est pulvinar feugiat vitae eget dolor. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
<!-- /wp:paragraph -->

<!-- wp:preformatted -->
<pre class="wp-block-preformatted">Some <em>preformatted</em> text...<br>And more!</pre>
<!-- /wp:preformatted -->

<!-- wp:code -->
<pre class="wp-block-code"><code>if name == "World":
    return "Hello World"
else:
    return "Hello Pony"</code></pre>
<!-- /wp:code -->

<!-- wp:verse {"textAlign":"center"} -->
<pre class="wp-block-verse has-text-align-center">Come<br>Home.</pre>
<!-- /wp:verse -->`;

export const mediaBlocks = `<!-- wp:image -->
<figure class="wp-block-image"><img alt=""/></figure>
<!-- /wp:image -->

<!-- wp:image -->
<figure class="wp-block-image"><img src="https://cldup.com/cXyG__fTLN.jpg" alt="" aria-describedby="wp-image-caption-383k3k3g3j1q1f1f333c343l3g1e333f3d1f332o3p272v2v362k2c2e1e3a3g37"/><figcaption class="wp-element-caption" id="wp-image-caption-383k3k3g3j1q1f1f333c343l3g1e333f3d1f332o3p272v2v362k2c2e1e3a3g37">Mountain</figcaption></figure>
<!-- /wp:image -->

<!-- wp:video {"id":683} -->
<figure class="wp-block-video"><video controls src="https://i.cloudup.com/YtZFJbuQCE.mov"></video><figcaption class="wp-element-caption">Videos too!</figcaption></figure>
<!-- /wp:video -->

<!-- wp:file /-->

<!-- wp:file {"id":3,"href":"https://wordpress.org/latest.zip"} -->
<div class="wp-block-file"><a href="https://wordpress.org/latest.zip">WordPress.zip</a><a href="https://wordpress.org/latest.zip" class="wp-block-file__button wp-element-button" download>Download</a></div>
<!-- /wp:file -->

<!-- wp:audio /-->

<!-- wp:audio {"id":5} -->
<figure class="wp-block-audio"><audio controls src="https://cldup.com/59IrU0WJtq.mp3"></audio></figure>
<!-- /wp:audio -->

<!-- wp:gallery {"columns":8,"linkTo":"none","className":"alignfull"} -->
<figure class="wp-block-gallery has-nested-images columns-8 is-cropped alignfull"><!-- wp:image {"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon.png" alt="" aria-describedby="wp-image-caption-383k3k3g3j1q1f1f3n3f3i343g3i353j3j1e3f3i371f373l3k353e32353i371f36393c353j1f1i1g1h1o1f1g1n1f223c3f333b1d29333f3e1e3g3e37"/><figcaption class="wp-element-caption" id="wp-image-caption-383k3k3g3j1q1f1f3n3f3i343g3i353j3j1e3f3i371f373l3k353e32353i371f36393c353j1f1i1g1h1o1f1g1n1f223c3f333b1d29333f3e1e3g3e37">Paragraph</figcaption></figure>
<!-- /wp:image -->

<!-- wp:image {"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Heading.png" alt="" aria-describedby="wp-image-caption-383k3k3g3j1q1f1f3n3f3i343g3i353j3j1e3f3i371f373l3k353e32353i371f36393c353j1f1i1g1h1o1f1g1n1f223c3f333b1d29333f3e1d28353134393e371e3g3e37"/><figcaption class="wp-element-caption" id="wp-image-caption-383k3k3g3j1q1f1f3n3f3i343g3i353j3j1e3f3i371f373l3k353e32353i371f36393c353j1f1i1g1h1o1f1g1n1f223c3f333b1d29333f3e1d28353134393e371e3g3e37">Heading</figcaption></figure>
<!-- /wp:image -->

<!-- wp:image {"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Subheading.png" alt="" aria-describedby="wp-image-caption-383k3k3g3j1q1f1f3n3f3i343g3i353j3j1e3f3i371f373l3k353e32353i371f36393c353j1f1i1g1h1o1f1g1n1f223c3f333b1d29333f3e1d2j3l3238353134393e371e3g3e37"/><figcaption class="wp-element-caption" id="wp-image-caption-383k3k3g3j1q1f1f3n3f3i343g3i353j3j1e3f3i371f373l3k353e32353i371f36393c353j1f1i1g1h1o1f1g1n1f223c3f333b1d29333f3e1d2j3l3238353134393e371e3g3e37">Subheading</figcaption></figure>
<!-- /wp:image -->

<!-- wp:image {"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Quote.png" alt="" aria-describedby="wp-image-caption-383k3k3g3j1q1f1f3n3f3i343g3i353j3j1e3f3i371f373l3k353e32353i371f36393c353j1f1i1g1h1o1f1g1n1f223c3f333b1d29333f3e1d2h3l3f3k351e3g3e37"/><figcaption class="wp-element-caption" id="wp-image-caption-383k3k3g3j1q1f1f3n3f3i343g3i353j3j1e3f3i371f373l3k353e32353i371f36393c353j1f1i1g1h1o1f1g1n1f223c3f333b1d29333f3e1d2h3l3f3k351e3g3e37">Quote</figcaption></figure>
<!-- /wp:image -->

<!-- wp:image {"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Image.png" alt="" aria-describedby="wp-image-caption-383k3k3g3j1q1f1f3n3f3i343g3i353j3j1e3f3i371f373l3k353e32353i371f36393c353j1f1i1g1h1o1f1g1n1f223c3f333b1d29333f3e1d293d3137351e3g3e37"/><figcaption class="wp-element-caption" id="wp-image-caption-383k3k3g3j1q1f1f3n3f3i343g3i353j3j1e3f3i371f373l3k353e32353i371f36393c353j1f1i1g1h1o1f1g1n1f223c3f333b1d29333f3e1d293d3137351e3g3e37">Image</figcaption></figure>
<!-- /wp:image -->

<!-- wp:image {"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Gallery.png" alt="" aria-describedby="wp-image-caption-383k3k3g3j1q1f1f3n3f3i343g3i353j3j1e3f3i371f373l3k353e32353i371f36393c353j1f1i1g1h1o1f1g1n1f223c3f333b1d29333f3e1d27313c3c353i3p1e3g3e37"/><figcaption class="wp-element-caption" id="wp-image-caption-383k3k3g3j1q1f1f3n3f3i343g3i353j3j1e3f3i371f373l3k353e32353i371f36393c353j1f1i1g1h1o1f1g1n1f223c3f333b1d29333f3e1d27313c3c353i3p1e3g3e37">Gallery</figcaption></figure>
<!-- /wp:image -->

<!-- wp:image {"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Cover-Image.png" alt="" aria-describedby="wp-image-caption-383k3k3g3j1q1f1f3n3f3i343g3i353j3j1e3f3i371f373l3k353e32353i371f36393c353j1f1i1g1h1o1f1g1n1f223c3f333b1d29333f3e1d233f3m353i1d293d3137351e3g3e37"/><figcaption class="wp-element-caption" id="wp-image-caption-383k3k3g3j1q1f1f3n3f3i343g3i353j3j1e3f3i371f373l3k353e32353i371f36393c353j1f1i1g1h1o1f1g1n1f223c3f333b1d29333f3e1d233f3m353i1d293d3137351e3g3e37">Cover Image</figcaption></figure>
<!-- /wp:image -->

<!-- wp:image {"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Video.png" alt="" aria-describedby="wp-image-caption-383k3k3g3j1q1f1f3n3f3i343g3i353j3j1e3f3i371f373l3k353e32353i371f36393c353j1f1i1g1h1o1f1g1n1f223c3f333b1d29333f3e1d2m3934353f1e3g3e37"/><figcaption class="wp-element-caption" id="wp-image-caption-383k3k3g3j1q1f1f3n3f3i343g3i353j3j1e3f3i371f373l3k353e32353i371f36393c353j1f1i1g1h1o1f1g1n1f223c3f333b1d29333f3e1d2m3934353f1e3g3e37">Video</figcaption></figure>
<!-- /wp:image -->

<!-- wp:image {"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Audio.png" alt="" aria-describedby="wp-image-caption-383k3k3g3j1q1f1f3n3f3i343g3i353j3j1e3f3i371f373l3k353e32353i371f36393c353j1f1i1g1h1o1f1g1n1f223c3f333b1d29333f3e1d213l34393f1e3g3e37"/><figcaption class="wp-element-caption" id="wp-image-caption-383k3k3g3j1q1f1f3n3f3i343g3i353j3j1e3f3i371f373l3k353e32353i371f36393c353j1f1i1g1h1o1f1g1n1f223c3f333b1d29333f3e1d213l34393f1e3g3e37">Audio</figcaption></figure>
<!-- /wp:image -->

<!-- wp:image {"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Column.png" alt="" aria-describedby="wp-image-caption-383k3k3g3j1q1f1f3n3f3i343g3i353j3j1e3f3i371f373l3k353e32353i371f36393c353j1f1i1g1h1o1f1g1n1f223c3f333b1d29333f3e1d233f3c3l3d3e1e3g3e37"/><figcaption class="wp-element-caption" id="wp-image-caption-383k3k3g3j1q1f1f3n3f3i343g3i353j3j1e3f3i371f373l3k353e32353i371f36393c353j1f1i1g1h1o1f1g1n1f223c3f333b1d29333f3e1d233f3c3l3d3e1e3g3e37">Columns</figcaption></figure>
<!-- /wp:image -->

<!-- wp:image {"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-File.png" alt="" aria-describedby="wp-image-caption-383k3k3g3j1q1f1f3n3f3i343g3i353j3j1e3f3i371f373l3k353e32353i371f36393c353j1f1i1g1h1o1f1g1n1f223c3f333b1d29333f3e1d26393c351e3g3e37"/><figcaption class="wp-element-caption" id="wp-image-caption-383k3k3g3j1q1f1f3n3f3i343g3i353j3j1e3f3i371f373l3k353e32353i371f36393c353j1f1i1g1h1o1f1g1n1f223c3f333b1d29333f3e1d26393c351e3g3e37">File</figcaption></figure>
<!-- /wp:image -->

<!-- wp:image {"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Code.png" alt="" aria-describedby="wp-image-caption-383k3k3g3j1q1f1f3n3f3i343g3i353j3j1e3f3i371f373l3k353e32353i371f36393c353j1f1i1g1h1o1f1g1n1f223c3f333b1d29333f3e1d233f34351e3g3e37"/><figcaption class="wp-element-caption" id="wp-image-caption-383k3k3g3j1q1f1f3n3f3i343g3i353j3j1e3f3i371f373l3k353e32353i371f36393c353j1f1i1g1h1o1f1g1n1f223c3f333b1d29333f3e1d233f34351e3g3e37">Code</figcaption></figure>
<!-- /wp:image -->

<!-- wp:image {"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-List.png" alt="" aria-describedby="wp-image-caption-383k3k3g3j1q1f1f3n3f3i343g3i353j3j1e3f3i371f373l3k353e32353i371f36393c353j1f1i1g1h1o1f1g1n1f223c3f333b1d29333f3e1d2c393j3k1e3g3e37"/><figcaption class="wp-element-caption" id="wp-image-caption-383k3k3g3j1q1f1f3n3f3i343g3i353j3j1e3f3i371f373l3k353e32353i371f36393c353j1f1i1g1h1o1f1g1n1f223c3f333b1d29333f3e1d2c393j3k1e3g3e37">List</figcaption></figure>
<!-- /wp:image -->

<!-- wp:image {"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Button.png" alt="" aria-describedby="wp-image-caption-383k3k3g3j1q1f1f3n3f3i343g3i353j3j1e3f3i371f373l3k353e32353i371f36393c353j1f1i1g1h1o1f1g1n1f223c3f333b1d29333f3e1d223l3k3k3f3e1e3g3e37"/><figcaption class="wp-element-caption" id="wp-image-caption-383k3k3g3j1q1f1f3n3f3i343g3i353j3j1e3f3i371f373l3k353e32353i371f36393c353j1f1i1g1h1o1f1g1n1f223c3f333b1d29333f3e1d223l3k3k3f3e1e3g3e37">Button</figcaption></figure>
<!-- /wp:image -->

<!-- wp:image {"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Embeds.png" alt="" aria-describedby="wp-image-caption-383k3k3g3j1q1f1f3n3f3i343g3i353j3j1e3f3i371f373l3k353e32353i371f36393c353j1f1i1g1h1o1f1g1n1f223c3f333b1d29333f3e1d253d3235343j1e3g3e37"/><figcaption class="wp-element-caption" id="wp-image-caption-383k3k3g3j1q1f1f3n3f3i343g3i353j3j1e3f3i371f373l3k353e32353i371f36393c353j1f1i1g1h1o1f1g1n1f223c3f333b1d29333f3e1d253d3235343j1e3g3e37">Embeds</figcaption></figure>
<!-- /wp:image -->

<!-- wp:image {"sizeSlug":"large","linkDestination":"none"} -->
<figure class="wp-block-image size-large"><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-More.png" alt="" aria-describedby="wp-image-caption-383k3k3g3j1q1f1f3n3f3i343g3i353j3j1e3f3i371f373l3k353e32353i371f36393c353j1f1i1g1h1o1f1g1n1f223c3f333b1d29333f3e1d2d3f3i351e3g3e37"/><figcaption class="wp-element-caption" id="wp-image-caption-383k3k3g3j1q1f1f3n3f3i343g3i353j3j1e3f3i371f373l3k353e32353i371f36393c353j1f1i1g1h1o1f1g1n1f223c3f333b1d29333f3e1d2d3f3i351e3g3e37">More</figcaption></figure>
<!-- /wp:image --></figure>
<!-- /wp:gallery -->

<!-- wp:media-text {"isStackedOnMobile":false,"className":"is-stacked-on-mobile"} -->
<div class="wp-block-media-text alignwide is-stacked-on-mobile"><figure class="wp-block-media-text__media"></figure><div class="wp-block-media-text__content"><!-- wp:paragraph {"className":"has-large-font-size"} -->
<p class="has-large-font-size"></p>
<!-- /wp:paragraph --></div></div>
<!-- /wp:media-text -->

<!-- wp:cover {"url":"https://cldup.com/cXyG__fTLN.jpg","id":890,"dimRatio":20,"overlayColor":"luminous-vivid-orange","focalPoint":{"x":"0.63","y":"0.83"},"minHeight":219} -->
<div class="wp-block-cover" style="min-height:219px"><span aria-hidden="true" class="wp-block-cover__background has-luminous-vivid-orange-background-color has-background-dim-20 has-background-dim"></span><img class="wp-block-cover__image-background wp-image-890" alt="" src="https://cldup.com/cXyG__fTLN.jpg" style="object-position:63% 83%" data-object-fit="cover" data-object-position="63% 83%"/><div class="wp-block-cover__inner-container"><!-- wp:paragraph {"align":"center","placeholder":"Write title…","className":"has-text-color has-very-light-gray-color","fontSize":"large"} -->
<p class="has-text-align-center has-text-color has-very-light-gray-color has-large-font-size">Cool cover</p>
<!-- /wp:paragraph --></div></div>
<!-- /wp:cover -->
`;

export const otherBlocks = `
<!-- wp:nextpage -->
<!--nextpage-->
<!-- /wp:nextpage -->

<!-- wp:more -->
<!--more-->
<!-- /wp:more -->

<!-- wp:spacer -->
<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:group -->
<div id="this-is-another-anchor" class="wp-block-group"><!-- wp:paragraph -->
<p>One.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Two</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Three.</p>
<!-- /wp:paragraph --></div>
<!-- /wp:group -->

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

<!-- wp:latest-posts {"displayPostContent":true,"displayPostDate":true} /-->

<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button">Solid Button</a></div>
<!-- /wp:button -->

<!-- wp:button {"gradient":"luminous-vivid-amber-to-luminous-vivid-orange"} -->
<div class="wp-block-button"><a class="wp-block-button__link has-luminous-vivid-amber-to-luminous-vivid-orange-gradient-background has-background wp-element-button">Gradient Button</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons -->

<!-- wp:shortcode -->
[youtube https://www.youtube.com/watch?v=ssfHW5lwFZg]
<!-- /wp:shortcode -->

<!-- wp:rss /-->
`;

export default textBlocks + mediaBlocks + otherBlocks;
