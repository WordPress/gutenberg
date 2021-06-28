# Glossary

<dl>
<dt>Attribute sources</dt>
<dd>An object describing the attributes shape of a block. The keys can be named as most appropriate to describe the state of a block type. The value for each key is a function which describes the strategy by which the attribute value should be extracted from the content of a saved post's content. When processed, a new object is created, taking the form of the keys defined in the attribute sources, where each value is the result of the attribute source function.</dd>

<dt>Attributes</dt>
<dd>The object representation of the current state of a block in post content. When loading a saved post, this is determined by the attribute sources for the block type. These values can change over time during an editing session when the user modifies a block, and are used when determining how to serialize the block.</dd>

<dt>Block</dt>
<dd>The abstract term used to describe units of markup that, composed together, form the content or layout of a webpage. The idea combines concepts of what in WordPress today we achieve with shortcodes, custom HTML, and embed discovery into a single consistent API and user experience.</dd>

<dt>Block Theme</dt>
<dd>A theme built in block forward way that allows Full Site Editing to work. The core of a block theme are its block templates and block template parts. To date, block theme templates have been HTML files of block markup that map to templates from the standard WordPress template hierarchy. </dd>

<dt>Block categories</dt>
<dd>These are not a WordPress taxonomy, but instead used internally to sort blocks in the Block Library.</dd>

<dt>Block ~Inserter~ Library</dt>
<dd>Primary interface for selecting from the available blocks, triggered by plus icon buttons on Blocks or in the top-left of the editor interface.</dd>

<dt>Block name</dt>
<dd>A unique identifier for a block type, consisting of a plugin-specific namespace and a short label describing the block's intent. e.g. <code>core/image</code></dd>

<dt>Block Templates</dt>
<dd> A template is a pre-defined arrangement of blocks, possibly with predefined attributes or placeholder content. You can provide a template for a post type, to give users a starting point when creating a new piece of content, or inside a custom block with the <code>InnerBlocks</code> component. At their core, templates are simply HTML files of block markup that map to templates from the standard WordPress template hierarchy, for example index, single or archive. This helps control the front-end defaults of a site that are not edited via the Page Editor or the Post Editor. See the <a href="../../developers/block-api/block-templates/">templates documentation</a> for more information. </dd>

<dt>Block Template Parts</dt>
<dd>Building on Block Templates, these parts help set structure for reusable items like a Footer or Header that one typically sees in a WordPress site. They are primarily site structure and are never to be mixed with the post content editor. With Full Site Editing and block based themes, users can create their own arbitrary Template Parts, save those in the database for their site, and re-use them throughout their site. Template parts are equivalent – in blocks – of theme template parts. They are generally defined by a theme first, carry some semantic meaning (could be swapped between themes such as a header), and can only be inserted in the site editor context (within “templates”). </dd>

<dt>Patterns</dt>
<dd>Patterns are predefined layouts of blocks that can be inserted as starter content that are meant to be changed by the user every time. Once inserted, they exist as a local save and are not global.</dd>

<dt>Block type</dt>
<dd>In contrast with the blocks composing a particular post, a block type describes the blueprint by which any block of that type should behave. So while there may be many images within a post, each behaves consistent with a unified image block type definition.</dd>

<dt>Classic block</dt>
<dd>A block which embeds the TinyMCE editor as a block, TinyMCE was the base of the previous core editor. Older content created prior to the block editor will be loaded in to a single Classic block.</dd>

<dt>Dynamic block</dt>
<dd>A type of block where the content of which may change and cannot be determined at the time of saving a post, instead calculated any time the post is shown on the front of a site. These blocks may save fallback content or no content at all in their JavaScript implementation, instead deferring to a PHP block implementation for runtime rendering.</dd>

<dt>Full Site Editing </dt>
<dd>This refers to a collection of features that ultimately allows users to edit their entire website using blocks as the starting point. This feature set includes everything from block patterns to global styles to templates to design tools for blocks (and more). Currently, it's still in an experimental phase.</dd>

<dt>Inspector</dt>
<dd>Deprecated term. See <a href="#settings-sidebar">Settings Sidebar.</a></dd>

<dt>Navigation Block</dt>
<dd>A block that allows you to edit a site's navigation menu, both in terms of structure and design.</a></dd>

<dt>Post settings</dt>
<dd>A sidebar region containing metadata fields for the post, including scheduling, visibility, terms, and featured image.</dd>

<dt>Query Block</dt>
<dd>A block that replicates the classic WP_Query and allows for further customization with additional functionality.</dd>

<dt>RichText</dt>
<dd>A common component enabling rich content editing including bold, italics, hyperlinks, etc.</dd>

<dt>Reusable block</dt>
<dd>A block that is saved and then can be shared as a reusable, repeatable piece of content.</dd>

<dt id="settings-sidebar">Settings Sidebar</dt>
<dd>The panel on the right that contains the document and block settings. The sidebar is toggled using the Settings gear icon. Block settings are shown when a block is selected, otherwise document settings are shown.</dd>

<dt>Serialization</dt>
<dd>The process of converting a block's attributes object into HTML markup, which occurs each time a block is edited.</dd>

<dt>Site Editor</dt>
<dd>The cohesive experience that allows you to directly edit and navigate between various templates, template parts, styling options, and more. </dd>

<dt>Static block</dt>
<dd>A type of block where the content of which is known at the time of saving a post. A static block will be saved with HTML markup directly in post content.</dd>

<dt>Template Editing Mode</dt>
<dd>A scaled down direct editing experience allowing you to edit/change/create the template a post/page uses. </dd>

<dt>Theme Blocks</dt>
<dd>Blocks that accomplish everything possible in traditional templates using template tags (ex: Post Author Block). A full list can be found [here](https://github.com/WordPress/gutenberg/issues/22724).</dd>

<dt>TinyMCE</dt>
<dd><a href="https://www.tinymce.com/">TinyMCE</a> is a web-based JavaScript WYSIWYG (What You See Is What You Get) editor.</dd>

<dt>Toolbar</dt>
<dd>A set of button controls. In the context of a block, usually referring to the toolbar of block controls shown above the selected block.</dd>

</dl>
