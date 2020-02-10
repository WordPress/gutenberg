# Glossary

<dl>
<dt>Attribute sources</dt>
<dd>An object describing the attributes shape of a block. The keys can be named as most appropriate to describe the state of a block type. The value for each key is a function which describes the strategy by which the attribute value should be extracted from the content of a saved post's content. When processed, a new object is created, taking the form of the keys defined in the attribute sources, where each value is the result of the attribute source function.</dd>

<dt>Attributes</dt>
<dd>The object representation of the current state of a block in post content. When loading a saved post, this is determined by the attribute sources for the block type. These values can change over time during an editing session when the user modifies a block, and are used when determining how to serialize the block.</dd>

<dt>Block</dt>
<dd>The abstract term used to describe units of markup that, composed together, form the content or layout of a webpage. The idea combines concepts of what in WordPress today we achieve with shortcodes, custom HTML, and embed discovery into a single consistent API and user experience.</dd>

<dt>Block Categories</dt>
<dd>These are not a WordPress taxonomy, but instead used internally to sort blocks in the Block Inserter.</dd>

<dt>Block Inserter</dt>
<dd>Primary interface for selecting from the available blocks, triggered by plus icon buttons on Blocks or in the top-left of the editor interface.</dd>

<dt>Block name</dt>
<dd>A unique identifier for a block type, consisting of a plugin-specific namespace and a short label describing the block's intent. e.g. <code>core/image</code></dd>

<dt>Block type</dt>
<dd>In contrast with the blocks composing a particular post, a block type describes the blueprint by which any block of that type should behave. So while there may be many images within a post, each behaves consistent with a unified image block type definition.</dd>

<dt>Classic block</dt>
<dd>A block which embeds the TinyMCE editor as a block, TinyMCE was the base of the previous core editor. Older content created prior to the block editor will be loaded in to a single Classic block.</dd>

<dt>Dynamic block</dt>
<dd>A type of block where the content of which may change and cannot be determined at the time of saving a post, instead calculated any time the post is shown on the front of a site. These blocks may save fallback content or no content at all in their JavaScript implementation, instead deferring to a PHP block implementation for runtime rendering.</dd>

<dt>Inspector</dt>
<dd>Deprecated term. See <a href="#settings-sidebar">Settings Sidebar.</a></dd>

<dt>Post settings</dt>
<dd>A sidebar region containing metadata fields for the post, including scheduling, visibility, terms, and featured image.</dd>

<dt>RichText</dt>
<dd>A common component enabling rich content editing including bold, italics, hyperlinks, etc.</dd>

<dt>Reusable block</dt>
<dd>A block that is saved and then can be shared as a reusable, repeatable piece of content.</dd>

<dt id="settings-sidebar">Settings Sidebar</dt>
<dd>The panel on the right that contains the document and block settings. The sidebar is toggled using the Settings gear icon. Block settings are shown when a block is selected, otherwise document settings are shown.</dd>

<dt>Serialization</dt>
<dd>The process of converting a block's attributes object into HTML markup, which occurs each time a block is edited.</dd>

<dt>Static block</dt>
<dd>A type of block where the content of which is known at the time of saving a post. A static block will be saved with HTML markup directly in post content.</dd>

<dt>TinyMCE</dt>
<dd><a href="https://www.tinymce.com/">TinyMCE</a> is a web-based JavaScript WYSIWYG (What You See Is What You Get) editor.</dd>

<dt>Toolbar</dt>
<dd>A set of button controls. In the context of a block, usually referring to the toolbar of block controls shown above the selected block.</dd>

<dt>Template</dt>
<dd> A template is a pre-defined arrangement of blocks, possibly with predefined attributes or placeholder content. You can provide a template for a post type, to give users a starting point when creating a new piece of content, or inside a custom block with the <code>InnerBlocks</code> component. See the templates documentation for more information. See <a href="../../developers/block-api/block-templates/">templates documentation</a> for more information.</dd>

</dl>
