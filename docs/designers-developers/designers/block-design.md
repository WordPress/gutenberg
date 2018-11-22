# Block Design

The following are best practices for designing a new block, with recommendations and detailed descriptions of existing blocks to illustrate our approach to creating blocks.

## Best Practices

### The primary interface for a block is the content area of the block

Since the block itself represents what will actually appear on the site, interaction here hews closest to the principle of direct manipulation and will be most intuitive to the user. This should be thought of as the primary interface for adding and manipulating content and adjusting how it is displayed. There are two ways of interacting here:

1. The placeholder content in the content area of the block can be thought of as a guide or interface for users to follow a set of instructions or “fill in the blanks”. For example, a block that embeds content from a 3rd-party service might contain controls for signing in to that service in the placeholder.
2. After the user has added content, selecting the block can reveal additional controls to adjust or edit that content. For example, a signup block might reveal a control for hiding/showing subscriber count. However, this should be done in minimal ways, so as to avoid dramatically changing the size and display of a block when a user selects it (this could be disorienting or annoying).

### The block toolbar is a secondary place for required options & controls

Basic block settings won’t always make sense in the context of the placeholder/content UI. As a secondary option, options that are critical to the functionality of a block can live in the block toolbar. The block toolbar is still highly contextual and visible on all screen sizes. One notable constraint with the block toolbar is that it is icon-based UI, so any controls that live in the block toolbar need to be ones that can effectively be communicated via an icon or icon group.

### The block sidebar should only be used for advanced, tertiary controls

The sidebar is not visible by default on a small / mobile screen, and may also be collapsed in a desktop view. Therefore, it should not be relied on for anything that is necessary for the basic operation of the block. Pick good defaults, make important actions available in the block toolbar, and think of the sidebar as something that only power users may discover. In addition, use sections and headers in the block sidebar if there are more than a handful of options, in order to allow users to easily scan and understand the options available.

## Do's and Don'ts 

### Blocks

A block should have a straightforward, short name so users can easily find it in the Block Library. A block named "YouTube" is easy to find and understand. The same block, named "Embedded Video (YouTube)", would be less clear and harder to find in the Block Library. 

Blocks should have an identifying icon, ideally using a single color. Try to avoid using the same icon used by an existing block. The core block icons are based on [Material Design Icons](https://material.io/tools/icons/). Look to that icon set, or to [Dashicons](https://developer.wordpress.org/resource/dashicons/) for style inspiration.

![A screenshot of the Block Library with concise block names](https://raw.githubusercontent.com/WordPress/gutenberg/master/docs/designers-developers/designers/assets/blocks-do.png)
**Do:**
Use concise block names.

![A screenshot of the Block Library with long, multi-line block names](https://raw.githubusercontent.com/WordPress/gutenberg/master/docs/designers-developers/designers/assets/blocks-dont.png)
**Don't:**
Avoid long, multi-line block names.

### Block Description

Every block should include a description in the “Block” tab of the Settings sidebar. This description should explain your block's function clearly. Keep it to a single sentence.

![A screenshot of a short block description](https://raw.githubusercontent.com/WordPress/gutenberg/master/docs/designers-developers/designers/assets/block-descriptions-do.png)
**Do:**
Use a short, simple, block description.

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
For controls that are essential the the operation of the block, provide them directly in inside the block edit view.

![A Google Maps block with essential controls moved to the sidebar where they can be contextually hidden](https://raw.githubusercontent.com/WordPress/gutenberg/master/docs/designers-developers/designers/assets/block-controls-dont.png)
**Don't:**
Do not put controls that are essential to the block in the sidebar, or the block will appear non-functional to mobile users, or desktop users who have dismissed the sidebar.

### Advanced Block Settings

The “Block” tab of the Settings Sidebar can contain additional block options and configuration. Keep in mind that a user can dismiss the sidebar and never use it. You should not put critical options in the Sidebar.

![A screenshot of the paragraph block's advanced settings in the sidebar](https://raw.githubusercontent.com/WordPress/gutenberg/master/docs/designers-developers/designers/assets/advanced-settings-do.png)
**Do:**
Because the Drop Cap feature is not necessary for the basic operation of the block, you can put it ub the Block tab as optional configuration.

### Consider mobile

Check how your block looks, feels, and works on as many devices and screen sizes as you can.

## Examples

To demonstrate some of these practices, here are a few annotated examples of default Gutenberg blocks:

### Paragraph

The most basic unit of the editor. The paragraph block is a simple input field.

![Paragraph Block](https://cldup.com/HVJe5bGZ8H-3000x3000.png)

### Placeholder:

- Simple placeholder text that reads “Start writing or type / to choose a block”. The placeholder disappears when the block is selected.

### Selected state:

- Block Toolbar: Has a switcher to perform transformations to headings, etc.
- Block Toolbar: Has basic text alignments
- Block Toolbar: Has inline formatting options, bold, italic, strikethrough and link

### Image

Basic image block.

![Image Block Placeholder](https://cldup.com/w6FNywNsj1-3000x3000.png)

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

_Future improvements to the Image block could include getting rid of the media modal, in place of letting users select images directly from the placeholder itself. In general, try to avoid modals._

### Latest Post

![Latest Post Block](https://cldup.com/8lyAByDpy_-3000x3000.png)

### Placeholder:

Has no placeholder, as it works immediately upon insertion. The default inserted state shows the last 5 posts.

### Selected state:

- Block Toolbar: Alignments
- Block Toolbar: Options for picking list view or grid view

_Note that the Block Toolbar does not include the Block Chip in this case, since there are no similar blocks to switch to._

### Block settings:

- Has description: “Display a list of your most recent posts.”
- Has options for post order, narrowing the list by category, changing the default number of posts to show, and showing the post date.

_Latest Posts is fully functional as soon as it’s inserted, because it comes with good defaults._
