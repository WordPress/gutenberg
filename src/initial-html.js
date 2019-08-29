/**
 * @format
 * @flow
 */

export default `
<!-- wp:image -->
<figure class="wp-block-image"><img alt=""/></figure>
<!-- /wp:image -->

<!-- wp:image -->
<figure class="wp-block-image"><img src="https://cldup.com/cXyG__fTLN.jpg" alt=""/></figure>
<!-- /wp:image -->

<!-- wp:title -->
Hello World
<!-- /wp:title -->

<!-- wp:heading {"level": 2} -->
<h2>What is Gutenberg?</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p><b>Hello</b> World!</p>
<!-- /wp:paragraph -->

<!-- wp:nextpage -->
<!--nextpage-->
<!-- /wp:nextpage -->

<!-- wp:paragraph {"dropCap":true,"backgroundColor":"vivid-red","fontSize":"large","className":"custom-class-1 custom-class-2"} -->
<p class="has-background has-drop-cap has-large-font-size has-vivid-red-background-color custom-class-1 custom-class-2">
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer tempor tincidunt sapien, quis dictum orci sollicitudin quis. Proin sed elit id est pulvinar feugiat vitae eget dolor. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
<!-- /wp:paragraph -->


<!-- wp:code -->
<pre class="wp-block-code"><code>if name == "World":
    return "Hello World"
else:
    return "Hello Pony"</code></pre>
<!-- /wp:code -->

<!-- wp:more -->
<!--more-->
<!-- /wp:more -->

<!-- wp:p4ragraph -->
Лорем ипсум долор сит амет, адиписци трацтатос еа еум. Меа аудиам малуиссет те, хас меис либрис елеифенд ин. Нец ех тота деленит сусципит. Яуас порро инструцтиор но нец.
<!-- /wp:p4ragraph -->

<!-- wp:paragraph {"customTextColor":"#6c7781","customFontSize":17} -->
<p style="color:#6c7781;font-size:17px" class="has-text-color"><em>It’s a whole new way to use WordPress. Try it right here!</em></p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":97629,"align":"full"} -->
<figure class="wp-block-image alignfull"><img src="https://wordpress.org/gutenberg/files/2018/07/Screenshot-4-1.png" alt="" class="wp-image-97629"/></figure>
<!-- /wp:image -->

<!-- wp:video {"id":683} -->
<figure class="wp-block-video"><video controls src="https://i.cloudup.com/YtZFJbuQCE.mov"></video></figure>
<!-- /wp:video -->

<!-- wp:paragraph {"align":"left"} -->
<p style="text-align:left">We call the new editor Gutenberg. The entire editing experience has been rebuilt for media rich pages and posts. Experience the flexibility that blocks will bring, whether you are building your first site, or write code for a living.</p>
<!-- /wp:paragraph -->

<!-- wp:gallery {"ids":[null,null,null,null],"columns":4,"align":"wide","className":"alignwide gutenberg-landing\u002d\u002dfeatures-grid"} -->
<ul class="wp-block-gallery alignwide columns-4 is-cropped gutenberg-landing--features-grid"><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Plugin-1-1.gif" alt=""/><figcaption>Do more with fewer plugins.</figcaption></figure></li><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Layout-3.gif" alt=""/><figcaption>Create modern, multimedia-heavy layouts.</figcaption></figure></li><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Devices-1-1.gif" alt=""/><figcaption>Work across all screen sizes and devices.</figcaption></figure></li><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Visual-1.gif" alt=""/><figcaption>Trust that your editor looks like your website.</figcaption></figure></li></ul>
<!-- /wp:gallery -->

<!-- wp:spacer -->
<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:wporg/download-button -->
<div class="wp-block-wporg-download-button wp-block-button aligncenter"><a class="wp-block-button__link has-background has-strong-blue-background-color" href="https://wordpress.org/plugins/gutenberg/" style="background-color:rgb(0,115,170)">Download Gutenberg Today</a></div>
<!-- /wp:wporg/download-button -->

<!-- wp:paragraph {"align":"center","fontSize":"small","className":"gutenberg-landing\u002d\u002dbutton-disclaimer"} -->
<p style="text-align:center" class="has-small-font-size gutenberg-landing--button-disclaimer"><em>Gutenberg is available as a plugin now, and soon by default in version 5.0 of WordPress. The <a href="https://wordpress.org/plugins/classic-editor/">classic editor</a> will be available as a plugin if needed.</em></p>
<!-- /wp:paragraph -->

<!-- wp:spacer -->
<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:heading {"align":"left"} -->
<h2 class="has-text-align-left">Meet your new best friends, Blocks</h2>
<!-- /wp:heading -->

<!-- wp:paragraph {"align":"left"} -->
<p style="text-align:left">Blocks are a great new tool for building engaging content. With blocks, you can insert, rearrange, and style multimedia content with very little technical knowledge. Instead of using custom code, you can add a block and focus on your content.</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":358} -->
<figure class="wp-block-image"><img src="https://wordpress.org/gutenberg/files/2018/07/Insert-Block-2-1.gif" alt="" class="wp-image-358"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph {"align":"left"} -->
<p style="text-align:left">Without being an expert developer, you can build your own custom posts and pages. Here’s a selection of the default blocks included with Gutenberg:</p>
<!-- /wp:paragraph -->

<!-- wp:gallery {"ids":[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],"columns":8,"align":"full","className":"alignfull"} -->
<ul class="wp-block-gallery alignfull columns-8 is-cropped"><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon.png" alt=""/><figcaption>Paragraph</figcaption></figure></li><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Heading.png" alt=""/><figcaption>Heading</figcaption></figure></li><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Subheading.png" alt=""/><figcaption>Subheading</figcaption></figure></li><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Quote.png" alt=""/><figcaption>Quote</figcaption></figure></li><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Image.png" alt=""/><figcaption>Image</figcaption></figure></li><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Gallery.png" alt=""/><figcaption>Gallery</figcaption></figure></li><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Cover-Image.png" alt=""/><figcaption>Cover Image</figcaption></figure></li><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Video.png" alt=""/><figcaption>Video</figcaption></figure></li><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Audio.png" alt=""/><figcaption>Audio</figcaption></figure></li><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Column.png" alt=""/><figcaption>Columns</figcaption></figure></li><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-File.png" alt=""/><figcaption>File</figcaption></figure></li><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Code.png" alt=""/><figcaption>Code</figcaption></figure></li><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-List.png" alt=""/><figcaption>List</figcaption></figure></li><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Button.png" alt=""/><figcaption>Button</figcaption></figure></li><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-Embeds.png" alt=""/><figcaption>Embeds</figcaption></figure></li><li class="blocks-gallery-item"><figure><img src="https://wordpress.org/gutenberg/files/2018/07/Block-Icon-More.png" alt=""/><figcaption>More</figcaption></figure></li></ul>
<!-- /wp:gallery -->

<!-- wp:spacer -->
<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:heading {"align":"left"} -->
<h2 class="has-text-align-left">Be your own builder</h2>
<!-- /wp:heading -->

<!-- wp:paragraph {"align":"left"} -->
<p style="text-align:left">A single block is nice—reliable, clear, distinct. Discover the flexibility to use media and content, side by side, driven by your vision.</p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":98363} -->
<figure class="wp-block-image"><img src="https://wordpress.org/gutenberg/files/2018/08/Builder.gif" alt="" class="wp-image-98363"/></figure>
<!-- /wp:image -->

<!-- wp:spacer -->
<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:heading {"align":"left"} -->
<h2 class="has-text-align-left">Gutenberg ❤️ Developers</h2>
<!-- /wp:heading -->

<!-- wp:columns {"className":"gutenberg-landing\u002d\u002ddevelopers-columns"} -->
<div class="wp-block-columns has-2-columns gutenberg-landing--developers-columns"><!-- wp:column -->
<div class="wp-block-column"><!-- wp:paragraph {"align":"left"} -->
<p style="text-align:left"><strong>Built with modern technology.</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"align":"left"} -->
<p style="text-align:left">Gutenberg was developed on GitHub using the WordPress REST API, JavaScript, and React.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"align":"left","fontSize":"small"} -->
<p style="text-align:left" class="has-small-font-size"><a href="https://wordpress.org/gutenberg/handbook/language/">Learn more</a></p>
<!-- /wp:paragraph --></div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column"><!-- wp:paragraph {"align":"left"} -->
<p style="text-align:left"><strong>Designed for compatibility.</strong></p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"align":"left"} -->
<p style="text-align:left">We recommend migrating features to blocks, but support for existing WordPress functionality remains. There will be transition paths for shortcodes, meta-boxes, and Custom Post Types.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"align":"left","fontSize":"small"} -->
<p style="text-align:left" class="has-small-font-size"><a href="https://wordpress.org/gutenberg/handbook/reference/faq/">Learn more</a></p>
<!-- /wp:paragraph --></div>
<!-- /wp:column --></div>
<!-- /wp:columns -->

<!-- wp:spacer -->
<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:heading {"align":"left"} -->
<h2 class="has-text-align-left">The editor is just the beginning</h2>
<!-- /wp:heading -->

<!-- wp:paragraph {"align":"left"} -->
<p style="text-align:left">Gutenberg is more than an editor. It’s also the foundation that’ll revolutionize customization and site building in WordPress.</p>
<!-- /wp:paragraph -->

<!-- wp:quote {"align":"left","className":"is-style-large"} -->
<blockquote style="text-align:left" class="wp-block-quote is-style-large"><p>"This will make running your own blog a viable alternative again."</p><cite>— <a href="https://twitter.com/azumbrunnen_/status/1019347243084800005">Adrian Zumbrunnen</a></cite></blockquote>
<!-- /wp:quote -->

<!-- wp:quote {"align":"left","className":"is-style-large"} -->
<blockquote style="text-align:left" class="wp-block-quote is-style-large"><p>"The web up until this point has been confined to some sort of rectangular screen. But that is not how it’s going to be. Gutenberg has the potential of moving us into the next time."</p><cite>— <a href="https://wordpress.tv/2017/12/10/morten-rand-hendriksen-gutenberg-and-the-wordpress-of-tomorrow/">Morten Rand-Hendriksen</a></cite></blockquote>
<!-- /wp:quote -->

<!-- wp:quote {"align":"left","className":"is-style-large"} -->
<blockquote style="text-align:left" class="wp-block-quote is-style-large"><p>"The Gutenberg editor has some great assets that could genuinely help people to write better texts."</p><cite>— <a href="https://yoast.com/writing-with-gutenberg/">Marieke van de Rakt</a></cite></blockquote>
<!-- /wp:quote -->

<!-- wp:spacer -->
<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:wporg/download-button -->
<div class="wp-block-wporg-download-button wp-block-button aligncenter"><a class="wp-block-button__link has-background has-strong-blue-background-color" href="https://wordpress.org/plugins/gutenberg/" style="background-color:rgb(0,115,170)">Download Gutenberg Today</a></div>
<!-- /wp:wporg/download-button -->

<!-- wp:paragraph {"align":"center","fontSize":"small","className":"gutenberg-landing\u002d\u002dbutton-disclaimer"} -->
<p style="text-align:center" class="has-small-font-size gutenberg-landing--button-disclaimer"><em>Gutenberg is available as a plugin today, and will be included in version 5.0 of WordPress. The <a href="https://wordpress.org/plugins/classic-editor/">classic editor</a> will be available as a plugin if needed.</em></p>
<!-- /wp:paragraph -->

<!-- wp:spacer -->
<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:heading {"align":"left"} -->
<h2 class="has-text-align-left">Dig in deeper</h2>
<!-- /wp:heading -->

<!-- wp:list -->
<ul><li><a href="https://make.wordpress.org/core/2017/01/17/editor-technical-overview">Gutenberg Editor Technical Overview</a></li><li><a href="https://wordpress.org/gutenberg/handbook/reference/design-principles/">Gutenberg Design Principles</a></li><li><a href="https://make.wordpress.org/core/tag/gutenberg/">Development updates on make.wordpress.org</a></li><li><a href="https://wordpress.tv/?s=gutenberg">WordPress.tv Talks about Gutenberg</a></li><li><a href="https://wordpress.org/gutenberg/handbook/reference/faq/">FAQs</a></li></ul>
<!-- /wp:list -->
`;
