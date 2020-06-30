#Share your Gutenberg Block with the World
So you’ve created an awesome block have you? Care to share? Here is some basic information on how to submit a block to the Block Directory.

**Contents**:
1. Help users understand your block
2. Analyze your plugin
3. Zip & Submit


## Step 1: Help users understand your block
Providing straightforward, easy to understand block information is important to the block directory and our end users.

**Guidelines**:

- Name your block based on what it does
- Clearly describe your block
- Add Keywords for all contexts
- Choose the right category

### Name your block based on what it does
Users typically search the block directory within gutenberg and do so in the context of a task. For example, when building their post, a user may search the Block Directory for an “image gallery”. Naming your block accordingly will help the Block Directory surface it when it's needed.

**Not So Good**: WebTeam5 Image Works
**Good**: Responsive Image Slider by WebTeam5

**Question: What happens when there are multiple blocks with similar names?**
Try your best to make your block's name functional and unique to make it stand out. Look for applicable synonyms or include a prefix if necessary.


### Clearly describe your block
The description really helps to communicate what your block does.The quicker a user understands how your block will help them, the more likely it is a user will use your block. Users will be reading your block's description within Gutenberg where space can be limited. Try to keep it short and concise.

**Not So Good**: The best way to show images on your website using jQuery and CSS.
**Good**: An easy to use, responsive, Image gallery block. 

**Tip**: It’s not about marketing your block, in fact we want to avoid marketing in blocks. You can read more about it in the [plugin guidelines]. Stick to being as clear as you can. The block directory will provide metrics to let users know how awesome your block is!

### Add Keywords for broader context
Keywords add extra context to your block and make it more likely to be found in the inserter. 

Examples for an Image Slider block:
- slider
- carousel
- gallery

[Read more](https://github.com/WordPress/gutenberg/blob/master/docs/rfc/block-registration.md#keyword) about keywords.

### Choose the right category
Gutenberg allows you to indicate which category your block fits in. Choosing the right category makes it easy for users to find in the Gutenberg menu.

**Possible Values**:
- text
- media
- design
- widgets
- embeds

[Read more](https://github.com/WordPress/gutenberg/blob/master/docs/rfc/block-registration.md#category) about categories.

Wondering where to input all this information? Read the next section :)


## Step 2: Analyze your plugin

The `block.json` file lives in the root folder of your block and provides the Block Directory and Gutenberg important information about your block. Along with being the place to store contextual information about your block like the: `name`, `description`, `keywords` and `category`, the `block.json` file stores the location of your block’s files.

Double check that the following is true for your block:
`editorScript` is pointing to the JavaScript bundle that includes all the code used in the **editor**.
`editorStyle` is pointing to the CSS bundle that includes all the css used in the **editor**.
`script` is pointing to the JavaScript bundle that includes all the code used on the **website**.
`style` is pointing to the CSS bundle that includes all the code used on the **website**.
I have included example data (Optional, but useful)

Although it isn’t necessary that you have both an `editorScript/editorStyle` and `script/style` listed in your `block.json` we encourage the separation of code used for editing and code used for displaying your block in order to keep both interfaces running quickly.

The `block.json` file also contains other important properties. Take a look at an [example block.json](https://github.com/WordPress/gutenberg/blob/master/docs/rfc/block-registration.md#registering-a-block-type) file for reference.


## Step 3: Zip & Submit
The community is ecstatic you made it this far! Time to submit your plugin!

Take a few moments to read the block guidelines (https://github.com/WordPress/wporg-plugin-guidelines/blob/block-guidelines/blocks.md)

TODO - ADD MORE STUFF HERE


