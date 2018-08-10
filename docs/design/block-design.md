# Block Design

Want to design a new block? These recommendations and examples should start you off on the right foot.

## Best Practices

- Blocks should have a simple label for the Inserter. Keep it as short as possible.
- Blocks should have an identifying icon, ideally using a single color. Try to avoid using the same icon used by an existing block. Look to [Dashicons](https://developer.wordpress.org/resource/dashicons/) for style inspiration.
- Blocks should have a instructive placeholder state when they’re first inserted. If the block includes a text input, provide placeholder text. If your block holds media, include buttons for uploading files and accessing media libraries, as well as drop-zones for drag and drop. Keep in mind that in the future, the placeholder state will be used to make page and post templates.
- When unselected, your block should preview its content as closely to the front-end output as possible.
- When selected, your block may surface additional options: input fields or buttons to configure the block directly (if those are necessary for basic operation).
- Every block should include a description in the “Block” tab of the Settings sidebar. The description should explain as clearly as possible what your block does. Keep it to a single sentence.
- Additional block options and configuration can also be added to the “Block” tab of the Settings Sidebar, but keep in mind that a user might dismiss the sidebar and never use it. Do not put critical options there.
- Be sure to consider how your block looks, feels, and works on all sorts of devices and screen sizes.

## Examples

To help demonstrate some of these practices, here are a few annotated examples of default Gutenberg blocks:

### Paragraph

The most basic unit of the editor. The paragraph block is a simple input field.

![Paragraph Block](https://cldup.com/HVJe5bGZ8H-3000x3000.png)

**Placeholder:**

- Simple placeholder text that says “Add text or type / to add content” (This placeholder disappears when the block is selected).

**Selected state:**

- Block Toolbar: Has a switcher to perform transformations to headings, etc.
- Block Toolbar: Has basic text alignments
- Block Toolbar: Has inline formatting options, bold, italic, strikethrough and link

### Image

Basic image block.

![Image Block Placeholder](https://cldup.com/w6FNywNsj1-3000x3000.png)

**Placeholder:**

A generic gray placeholder block with options to upload an image, drop an image directly on it, or choose an image from the media library.

**Selected state:**

- Block Toolbar: Alignments, including wide and full-width (if the theme supports it).
- Block Toolbar: Edit Image (opens the Media Library)
- Block Toolbar: Link button
- When an image is uploaded, a caption input field appears with a “Write caption…” placeholder text below the image:

![Image Block](https://cldup.com/6YYXstl_xX-3000x3000.png)

**Block settings:**

- Has description: “They're worth 1,000 words! Insert a single image.”
- Has options for changing or adding alt text, and adding additional custom CSS classes.

_Future improvements to the Image block could include getting rid of the media modal, in place of letting users select images directly from the placeholder itself. In general, try to avoid modals._

### Latest Post

![Latest Post Block](https://cldup.com/8lyAByDpy_-3000x3000.png)

**Placeholder:**

Has no placeholder, as it works fine upon insertion. The default inserted state shows the last 5 posts.

**Selected state:**

- Block Toolbar: Alignments
- Block Toolbar: Options for picking list view or grid view

_Note that the Block Toolbar does not include the Block Chip in this case, since there are no similar blocks to switch to._

**Block settings:**

- Has description: “Display a list of your most recent posts.”
- Has options for post order, narrowing the list by category, changing the default number of posts to show, and showing the post date.

_Latest Posts is fully functional as soon as it’s inserted, because it comes with good defaults._


