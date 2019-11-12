# Block Design

The following are best practices for designing a new block, with recommendations and detailed descriptions of existing blocks to illustrate our approach to creating blocks.

## Best Practices

### The primary interface for a block is the content area of the block

Since the block itself represents what will actually appear on the site, interaction here hews closest to the principle of direct manipulation and will be most intuitive to the user. This should be thought of as the primary interface for adding and manipulating content and adjusting how it is displayed. There are two ways of interacting here:

1. The placeholder content in the content area of the block can be thought of as a guide or interface for users to follow a set of instructions or “fill in the blanks”. For example, a block that embeds content from a 3rd-party service might contain controls for signing in to that service in the placeholder.
2. After the user has added content, selecting the block can reveal additional controls to adjust or edit that content. For example, a signup block might reveal a control for hiding/showing subscriber count. However, this should be done in minimal ways, so as to avoid dramatically changing the size and display of a block when a user selects it (this could be disorienting or annoying).

### The Block Toolbar is a secondary place for required options & controls

Basic block settings won’t always make sense in the context of the placeholder/content UI. As a secondary option, options that are critical to the functionality of a block can live in the block toolbar. The Block Toolbar is still highly contextual and visible on all screen sizes. One notable constraint with the Block Toolbar is that it is icon-based UI, so any controls that live in the Block Toolbar need to be ones that can effectively be communicated via an icon or icon group.

### The Settings Sidebar should only be used for advanced, tertiary controls

The Settings Sidebar is not visible by default on a small / mobile screen, and may also be collapsed in a desktop view. Therefore, it should not be relied on for anything that is necessary for the basic operation of the block. Pick good defaults, make important actions available in the block toolbar, and think of the Settings Sidebar as something that most users should not need to open.

In addition, use sections and headers in the Settings Sidebar if there are more than a handful of options, in order to allow users to easily scan and understand the options available.

Each Settings Sidebar comes with an "Advanced" section by default. This area houses an "Additional CSS Class" field, and should be used to house other power user controls.

## Setup state vs. live preview state

Setup states, sometimes referred to as "placeholders", can be used to walk users through an initial process before showing the live preview state of the block. The setup process gathers information from the user that is needed to render the block. A block’s setup state is indicated with a grey background to provide clear differentiation for the user. Not all blocks have setup states — for example, the Paragraph block.

![An example of a gallery block’s setup state on a grey background](https://make.wordpress.org/design/files/2018/12/gallery-setup.png)

A setup state is **not** necessary if:

- You can provide good default content in the block that will meet most people’s needs.
- That default content is easy to edit and customize.

Use a setup state if:

- There isn’t a clear default state that would work for most users.
- You need to gather input from the user that doesn’t have a 1-1 relationship with the live preview of the block (for example, if you need the user to input an API key to render content).
- You need more information from the user in order to render useful default content.

For blocks that do have setup states, once the user has gone through the setup process, the placeholder is replaced with the live preview state of that block.

![An example of the image gallery’s live preview state](https://make.wordpress.org/design/files/2018/12/gallery-live-preview.png)

When the block is selected, additional controls may be revealed to customize the block’s contents. For example, when the image gallery is selected, it reveals controls to remove or add images.

![An example of additional controls being revealed on selection of a block.](https://make.wordpress.org/design/files/2018/12/gallery-additional-controls.png)

In most cases, a block’s setup state is only shown once and then further customization is done via the live preview state. However, in some cases it might be desirable to allow the user to return to the setup state — for example, if all the block content has been deleted or via a link from the block’s toolbar or sidebar.

## Do's and Don'ts

### Block Identification

A block should have a straightforward, short name so users can easily find it in the Block Library. A block named "YouTube" is easy to find and understand. The same block, named "Embedded Video (YouTube)", would be less clear and harder to find in the Block Library.

When referring to a block in documentation or UI, use title case for the block title and lowercase for the "block" descriptor. For example:

- Paragraph block
- Latest Posts block
- Media & Text block

Blocks should have an identifying icon, ideally using a single color. Try to avoid using the same icon used by an existing block. The core block icons are based on [Material Design Icons](https://material.io/tools/icons/). Look to that icon set, or to [Dashicons](https://developer.wordpress.org/resource/dashicons/) for style inspiration.

![A screenshot of the Block Library with concise block names](https://raw.githubusercontent.com/WordPress/gutenberg/master/docs/designers-developers/designers/assets/blocks-do.png)
**Do:**
Use concise block names.

![A screenshot of the Block Library with long, multi-line block names](https://raw.githubusercontent.com/WordPress/gutenberg/master/docs/designers-developers/designers/assets/blocks-dont.png)
**Don't:**
Avoid long, multi-line block names.

### Block Description

Every block should include a description that clearly explains the block's function. The description will display in the Settings Sidebar.

You can add a description by using the description attribute in the [registerBlockType function](/docs/designers-developers/developers/block-api/block-registration/). 

Stick to a single imperative sentence with an action + subject format. Examples:

- Start with the building block of all narrative.
- Introduce new sections and organize content to help visitors (and search engines) understand the structure of your content.
- Create a bulleted or numbered list.

![A screenshot of a short block description](https://raw.githubusercontent.com/WordPress/gutenberg/master/docs/designers-developers/designers/assets/block-descriptions-do.png)
**Do:**
Use a short, simple block description.

![A screenshot of a long block description that includes branding](https://raw.githubusercontent.com/WordPress/gutenberg/master/docs/designers-developers/designers/assets/block-descriptions-dont.png)
**Don't:**
Avoid long descriptions and branding.

### Placeholders

If your block requires a user to configure some options before you can display it, you should provide an instructive placeholder state.

![A screenshot of the Gallery block's placeholder](https://raw.githubusercontent.com/WordPress/gutenberg/master/docs/designers-developers/designers/assets/placeholder-do.png)
**Do:**
Provide an instructive placeholder state.

![An example Gallery block placeholder but with intense, distracting colors and no instructions](https://raw.githubusercontent.com/WordPress/gutenberg/master/docs/designers-developers/designers/assets/placeholder-dont.png)
**Don't:**
Avoid branding and relying on the title alone to convey instructions.

### Selected and Unselected States

When unselected, your block should preview its content as closely to the front-end output as possible.

When selected, your block may surface additional options like input fields or buttons to configure the block directly, especially when they are necessary for basic operation.

![A Google Maps block with inline, always-accessible controls required for the block to function](https://raw.githubusercontent.com/WordPress/gutenberg/master/docs/designers-developers/designers/assets/block-controls-do.png)
**Do:**
For controls that are essential for the operation of the block, provide them directly inside the block edit view.

![A Google Maps block with essential controls moved to the sidebar where they can be contextually hidden](https://raw.githubusercontent.com/WordPress/gutenberg/master/docs/designers-developers/designers/assets/block-controls-dont.png)
**Don't:**
Do not put controls that are essential to the block in the sidebar, otherwise the block will appear non-functional to mobile users or desktop users who have dismissed the sidebar.

### Advanced Block Settings

The “Block” tab of the Settings Sidebar can contain additional block options and configuration. Keep in mind that a user can dismiss the sidebar and never use it. You should not put critical options in the Sidebar.

![A screenshot of the Paragraph block's advanced settings in the sidebar](https://raw.githubusercontent.com/WordPress/gutenberg/master/docs/designers-developers/designers/assets/advanced-settings-do.png)
**Do:**
Because the Drop Cap feature is not necessary for the basic operation of the block, you can put it to the Block tab as optional configuration.

### Consider mobile

Check how your block looks, feels, and works on as many devices and screen sizes as you can.

### Support Gutenberg's dark background editor scheme

Check how your block looks with [dark backgrounds](/docs/designers-developers/developers/themes/theme-support.md#dark-backgrounds) in the editor.

## Examples

To demonstrate some of these practices, here are a few annotated examples of default Gutenberg blocks:

### Paragraph

The most basic unit of the editor. The Paragraph block is a simple input field.

![Paragraph block](https://cldup.com/HVJe5bGZ8H-3000x3000.png)

### Placeholder:

- Simple placeholder text that reads “Start writing or type / to choose a block”. The placeholder disappears when the block is selected.

### Selected state:

- Block Toolbar: Has a switcher to perform transformations to headings, etc.
- Block Toolbar: Has basic text alignments
- Block Toolbar: Has inline formatting options, bold, italic, strikethrough, and link

### Image

Basic image block.

![Image block placeholder](https://cldup.com/w6FNywNsj1-3000x3000.png)

### Placeholder:

- A generic gray placeholder block with options to upload an image, drag and drop an image directly on it, or pick an image from the media library.

### Selected state:

- Block Toolbar: Alignments, including wide and full-width if the theme supports it.
- Block Toolbar: Edit Image, to open the Media Library
- Block Toolbar: Link button
- When an image is uploaded, a caption input field appears with a “Write caption…” placeholder text below the image:

![Image Block](https://cldup.com/6YYXstl_xX-3000x3000.png)

### Block settings:

- Has description: “They're worth 1,000 words! Insert a single image.”
- Has options for changing or adding alt text and adding additional custom CSS classes.

_Future improvements to the Image block could include getting rid of the media modal in place of letting users select images directly from the placeholder itself. In general, try to avoid modals._

### Latest Post

![Latest Post Block](https://cldup.com/8lyAByDpy_-3000x3000.png)

### Placeholder:

Has no placeholder as it works immediately upon insertion. The default inserted state shows the last 5 posts.

### Selected state:

- Block Toolbar: Alignments
- Block Toolbar: Options for picking list view or grid view

_Note that the Block Toolbar does not include the Block Chip in this case, since there are no similar blocks to switch to._

### Block settings:

- Has description: “Display a list of your most recent posts.”
- Has options for post order, narrowing the list by category, changing the default number of posts to show, and showing the post date.

_Latest Posts is fully functional as soon as it’s inserted because it comes with good defaults._
