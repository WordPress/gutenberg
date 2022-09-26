# Share your Block with the World

So you've created an awesome block? Care to share?

**Contents**:

1. Help users understand your block
2. Analyze your plugin
3. Zip & Submit

## Step 1: Help users understand your block

It is important to the Block Directory and our end users to provide easy to understand information on how your block was created.

**Guidelines**:

-   Name your block based on what it does
-   Clearly describe your block
-   Add Keywords for all contexts
-   Choose the right category

### Name your block based on what it does

Users typically search the Block Directory within the Block Editor and do so in the context of a task. For example, when building their post, a user may search the Block Directory for an “image gallery”. Naming your block accordingly will help the Block Directory surface it when it's needed.

**Not So Good**: WebTeam5 Image Works
**Good**: Responsive Image Slider by WebTeam5

**Question: What happens when there are multiple blocks with similar names?**
Try your best to make your block's name functional and unique to make it stand out. Look for applicable synonyms or include a prefix if necessary.

### Clearly describe your block

The description really helps to communicate what your block does.The quicker a user understands how your block will help them, the more likely it is a user will use your block. Users will be reading your block's description within the Block Editor where space can be limited. Try to keep it short and concise.

**Not So Good**: The best way to show images on your website using jQuery and CSS.
**Good**: A responsive image gallery block.

**Tip**: It’s not about marketing your block, in fact we want to avoid marketing in blocks. You can read more about it in the [plugin guidelines]. Stick to being as clear as you can. The Block Directory will provide metrics to let users know how awesome your block is!

### Add Keywords for broader context

Keywords add extra context to your block and make it more likely to be found in the inserter.

Examples for an Image Slider block:

-   slider
-   carousel
-   gallery

[Read more about keywords.](/docs/reference-guides/block-api/block-metadata.md#keywords)

### Choose the right category

The Block Editor allows you to indicate the category your block belongs in, making it easier for users to locate your block in the menu.

**Possible Values**:

-   text
-   media
-   design
-   widgets
-   theme
-   embed

[Read more about categories.](/docs/reference-guides/block-api/block-metadata.md#category)

Wondering where to input all this information? Read the next section :)

## Step 2: Analyze your plugin

Each block in your plugin should have a corresponding `block.json` file with the [block metadata](/docs/reference-guides/block-api/block-metadata.md). This file provides the Block Directory important information about your block. Along with being the place to store contextual information about your block like the: `name`, `description`, `keywords` and `category`, the `block.json` file stores the location of your block’s files.

Block plugins submitted to the Block Directory can contain mutliple blocks only if they are children of a single parent/ancestor. There should only be one main block. For example, a list block can contain list-item blocks. Children blocks must set the `parent` property in their `block.json` file.

Double check that the following is true for your block:

-   `editorScript` is pointing to the JavaScript bundle that includes all the code used in the **editor**.
-   `editorStyle` is pointing to the CSS bundle that includes all the css used in the **editor**.
-   `script` is pointing to the JavaScript bundle that includes all the code used on the **website**.
-   `style` is pointing to the CSS bundle that includes all the code used on the **website**.

We encourage the separation of code by using both editorScript/editorStyle and script/style files listed in your block.json to keep the backend and frontend interfaces running smoothly. Even though only one file is required.

Here is an example of a basic block.json file.

```json
{
	"name": "plugin-slug/image-slider",
	"title": "Responsive Image Slider",
	"description": "A responsive and easy to use image gallery block.",
	"keywords": [ "slider", "carousel", "gallery" ],
	"category": "media",
	"editorScript": "file:./dist/editor.js"
}
```

The `block.json` file also contains other important properties. Take a look at an [example block.json](/docs/reference-guides/block-api/block-metadata.md) for additional properties to be included in the block.json file.

## Step 3: Zip & Submit

The community is thankful for your contribution. It is time to submit your plugin.

Go through [the block guidelines](https://github.com/WordPress/wporg-plugin-guidelines/blob/block-guidelines/blocks.md). Create a zip file of your block and go to the [block plugin validator](https://wordpress.org/plugins/developers/block-plugin-validator/) and upload your plugin.
