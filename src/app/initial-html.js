/**
 * @format
 * @flow
 */

export default `
<!-- wp:paragraph -->
<p>Hello! This is frontenberg, a frontend instance of Gutenberg by Tom J Nowell with some restrictions so that anybody can test it out.</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>You can edit this post, but you can't save</li><li>No image uploading sadly</li><li>Category blocks don't work yet</li><li>Preview doesn't work ( if it did it'd be the same anyway, the entire theme is gutenberg )</li></ul>
<!-- /wp:list -->

<!-- wp:paragraph -->
<p>The rest is fair game! I've put the demo post content below. <a href="https://tomjn.com/2018/01/22/how-frontenberg-works/">Interested in how this is built</a>? <a href="https://frontenberg.tomjn.com/2017/11/04/hello-world/">Or who built it</a>?</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Curious what this means for post types that have no content area? <a href="https://frontenberg.tomjn.com/frontenberg_demo_pro/parachute/">Here's a basic example using the GCF plugin.</a></p>
<!-- /wp:paragraph -->

<!-- wp:cover {"url":"https://cldup.com/Fz-ASbo2s3.jpg","align":"full"} -->
<div class="wp-block-cover has-background-dim alignfull" style="background-image:url(https://cldup.com/Fz-ASbo2s3.jpg)"><p class="wp-block-cover-text">Of Mountains &amp; Printing Presses</p></div>
<!-- /wp:cover -->

<!-- wp:paragraph -->
<p>The goal of this new editor is to make adding rich content to WordPress simple and enjoyable. This whole post is composed of <em>pieces of content</em>—somewhat similar to LEGO bricks—that you can move around and interact with. Move your cursor around and you'll notice the different blocks light up with outlines and arrows. Press the arrows to reposition blocks quickly, without fearing about losing things in the process of copying and pasting.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>What you are reading now is a <strong>text block</strong>, the most basic block of all. The text block has its own controls to be moved freely around the post...</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"align":"right"} -->
<p style="text-align:right">... like this one, which is right aligned.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Headings are separate blocks as well, which helps with the outline and organization of your content.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>A Picture is worth a Thousand Words</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Handling images and media with the utmost care is a primary focus of the new editor. Hopefully, you'll find aspects of adding captions or going full-width with your pictures much easier and robust than before.</p>
<!-- /wp:paragraph -->

<!-- wp:image {"align":"center"} -->
<div class="wp-block-image"><figure class="aligncenter"><img src="https://cldup.com/cXyG__fTLN.jpg" alt="Beautiful landscape"/><figcaption>Give it a try. Press the "wide" button on the image toolbar.</figcaption></figure></div>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>Try selecting and removing or editing the caption, now you don't have to be careful about selecting the image or other text by mistake and ruining the presentation.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>The <em>Inserter</em> Tool</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>Imagine everything that WordPress can do is available to you quickly and in the same place on the interface. No need to figure out HTML tags, classes, or remember complicated shortcode syntax. That's the spirit behind the inserter—the <code>(+)</code> button you'll see around the editor—which allows you to browse all available content blocks and add them into your post. Plugins and themes are able to register their own, opening up all sort of possibilities for rich editing and publishing.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Go give it a try, you may discover things WordPress can already add into your posts that you didn't know about. Here's a short list of what you can currently find there:</p>
<!-- /wp:paragraph -->

<!-- wp:list -->
<ul><li>Text &amp; Headings</li><li>Images &amp; Videos</li><li>Galleries</li><li>Embeds, like YouTube, Tweets, or other WordPress posts.</li><li>Layout blocks, like Buttons, Hero Images, Separators, etc.</li><li>And <em>Lists</em> like this one of course :)</li></ul>
<!-- /wp:list -->

<!-- wp:separator -->
<hr class="wp-block-separator"/>
<!-- /wp:separator -->

<!-- wp:heading -->
<h2>Visual Editing</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>A huge benefit of blocks is that you can edit them in place and manipulate your content directly. Instead of having fields for editing things like the source of a quote, or the text of a button, you can directly change the content. Try editing the following quote:</p>
<!-- /wp:paragraph -->

<!-- wp:quote -->
<blockquote class="wp-block-quote"><p>The editor will endeavour to create a new page and post building experience that makes writing rich posts effortless, and has “blocks” to make it easy what today might take shortcodes, custom HTML, or “mystery meat” embed discovery.</p><cite>Matt Mullenweg, 2017</cite></blockquote>
<!-- /wp:quote -->

<!-- wp:paragraph -->
<p>The information corresponding to the source of the quote is a separate text field, similar to captions under images, so the structure of the quote is protected even if you select, modify, or remove the source. It's always easy to add it back.</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Blocks can be anything you need. For instance, you may want to add a subdued quote as part of the composition of your text, or you may prefer to display a giant stylized one. All of these options are available in the inserter.</p>
<!-- /wp:paragraph -->

<!-- wp:gallery {"ids":[null,null,null],"columns":2,"className":"alignnone"} -->
<ul class="wp-block-gallery columns-2 is-cropped alignnone"><li class="blocks-gallery-item"><figure><img src="https://cldup.com/n0g6ME5VKC.jpg" alt=""/></figure></li><li class="blocks-gallery-item"><figure><img src="https://cldup.com/ZjESfxPI3R.jpg" alt=""/></figure></li><li class="blocks-gallery-item"><figure><img src="https://cldup.com/EKNF8xD2UM.jpg" alt=""/></figure></li></ul>
<!-- /wp:gallery -->

<!-- wp:paragraph -->
<p>You can change the amount of columns in your galleries by dragging a slider in the block inspector in the sidebar.</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2>Media Rich</h2>
<!-- /wp:heading -->

<!-- wp:paragraph -->
<p>If you combine the new <strong>wide</strong> and <strong>full-wide</strong> alignments with galleries, you can create a very media rich layout, very quickly:</p>
<!-- /wp:paragraph -->

<!-- wp:image {"align":"full"} -->
<figure class="wp-block-image alignfull"><img src="https://cldup.com/8lhI-gKnI2.jpg" alt="Accessibility is important don't forget image alt attribute"/></figure>
<!-- /wp:image -->

<!-- wp:paragraph -->
<p>Sure, the full-wide image can be pretty big. But sometimes the image is worth it.</p>
<!-- /wp:paragraph -->

<!-- wp:gallery {"ids":[null,null],"align":"wide","className":"alignwide"} -->
<ul class="wp-block-gallery alignwide columns-2 is-cropped"><li class="blocks-gallery-item"><figure><img src="https://cldup.com/_rSwtEeDGD.jpg" alt=""/></figure></li><li class="blocks-gallery-item"><figure><img src="https://cldup.com/L-cC3qX2DN.jpg" alt=""/></figure></li></ul>
<!-- /wp:gallery -->

<!-- wp:paragraph -->
<p>The above is a gallery with just two images. It's an easier way to create visually appealing layouts, without having to deal with floats. You can also easily convert the gallery back to individual images again, by using the block switcher.&nbsp;</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph -->
<p>Any block can opt into these alignments. The embed block has them also, and is responsive out of the box:</p>
<!-- /wp:paragraph -->

<!-- wp:core-embed/vimeo {"url":"https://vimeo.com/22439234","type":"video","providerNameSlug":"vimeo","className":"wp-has-aspect-ratio wp-embed-aspect-16-9"} -->
<figure class="wp-block-embed-vimeo wp-block-embed is-type-video is-provider-vimeo wp-has-aspect-ratio wp-embed-aspect-16-9"><div class="wp-block-embed__wrapper">
https://vimeo.com/22439234
</div></figure>
<!-- /wp:core-embed/vimeo -->

<!-- wp:paragraph -->
<p>You can build any block you like, static or dynamic, decorative or plain. Here's a pullquote block:</p>
<!-- /wp:paragraph -->

<!-- wp:pullquote {"className":"alignnone"} -->
<figure class="wp-block-pullquote alignnone"><blockquote><p>Code is Poetry</p><cite>The WordPress community</cite></blockquote></figure>
<!-- /wp:pullquote -->

<!-- wp:paragraph {"align":"center"} -->
<p style="text-align:center"><em>If you want to learn more about how to build additional blocks, or if you are interested in helping with the project, head over to the <a href="https://github.com/WordPress/gutenberg">GitHub repository</a>.</em></p>
<!-- /wp:paragraph -->

<!-- wp:button {"align":"center"} -->
<div class="wp-block-button aligncenter"><a class="wp-block-button__link" href="https://github.com/WordPress/gutenberg">Help build Gutenberg</a></div>
<!-- /wp:button -->

<!-- wp:separator -->
<hr class="wp-block-separator"/>
<!-- /wp:separator -->

<!-- wp:paragraph {"align":"center"} -->
<p style="text-align:center">Thanks for testing Gutenberg!</p>
<!-- /wp:paragraph -->

<!-- wp:paragraph {"customTextColor":"#6c7781","customFontSize":17} -->
<p style="color:#6c7781;font-size:17px" class="has-text-color"><em>It’s a whole new way to use WordPress. Try it right here!</em></p>
<!-- /wp:paragraph -->

<!-- wp:image {"id":97629,"align":"full"} -->
<figure class="wp-block-image alignfull"><img src="https://wordpress.org/gutenberg/files/2018/07/Screenshot-4-1.png" alt="" class="wp-image-97629"/></figure>
<!-- /wp:image -->

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
<h2 style="text-align:left">Meet your new best friends, Blocks</h2>
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
<h2 style="text-align:left">Be your own builder</h2>
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
<h2 style="text-align:left">Gutenberg ❤️ Developers</h2>
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
<h2 style="text-align:left">The editor is just the beginning</h2>
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
<h2 style="text-align:left">Dig in deeper</h2>
<!-- /wp:heading -->

<!-- wp:list -->
<ul><li><a href="https://make.wordpress.org/core/2017/01/17/editor-technical-overview">Gutenberg Editor Technical Overview</a></li><li><a href="https://wordpress.org/gutenberg/handbook/reference/design-principles/">Gutenberg Design Principles</a></li><li><a href="https://make.wordpress.org/core/tag/gutenberg/">Development updates on make.wordpress.org</a></li><li><a href="https://wordpress.tv/?s=gutenberg">WordPress.tv Talks about Gutenberg</a></li><li><a href="https://wordpress.org/gutenberg/handbook/reference/faq/">FAQs</a></li></ul>
<!-- /wp:list -->
`;
