#Share your Gutenberg Block with the World
So you’ve created an awesome block have you? Care to share? Here is some basic information on how to submit a block to the Block Directory.

Need help building a block? Check out our block tutorials to get started. 

**Contents**:
1. Help users understand your block
2. Analyze your plugin
3. Zip & Submit


## Step 1: Help users understand your block
Providing straightforward, easy to understand block information is important to the block directory and our end users.

**Guidelines**:

- Name your block based on what it does
- Clearly describe what your block does
- Add Keywords for all contexts
- Choose the right category

### Name your block based on what it does
Users typically search the block directory within gutenberg and do so in the context of a task. For example, when building their post, a user may search the Block Directory for an “image gallery”. Naming your block accordingly will help the Block Directory surface it when it’s needed.

**Not So Good**: WebTeam5 Image Works
**Good**: Responsive Image Slider


**Question**: What happens when there are multiple blocks with similar names?
TODO

### Clearly describe what your block does
The description really helps to communicate what your block does.The quicker a user understands how your block will help them, the more likely it is a user will use your block. Users will be reading your block’s description within Gutenberg where space can be limited. Try to keep it short and concise.

**Not So Good**: The best way to show images on your website using jQuery and CSS.
**Good**: An easy to use, responsive, Image gallery block. 

**Note**: It’s not about marketing your block, in fact we want to avoid marketing in blocks. You can read more about it in the [plugin guidelines]. Stick to being as clear as you can. The block directory will provide metrics to let users know how awesome your block is!

### Add Keywords for broader context
Keywords add extra context to your block and make it more likely to be found in the inserter. 

Examples for an Image Slider block:
- slider
- carousel
- gallery

[Read more]() about keywords.

### Choose the right category
Gutenberg allows you to indicate which category your block fits in. Choosing the right category makes it easy for users to find in the Gutenberg menu.

**Possible Values**:
- Common
-  Formatting
-  Layout
-  Widgets
-  embed

[Read more]() about categories.

Wondering where to input all this information? Read the next section :)


## Step 2: Analyze your plugin

The `block.json` file lives in the root folder of your block and provides the Block Directory and Gutenberg important information about your block. Along with being the place to store contextual information about your block like the: `name`, `description`, `keywords` and `category`, the `block.json` file stores the location of your block’s files.

Double check that the following is true for your block:
`editorScript` is pointing to the JavaScript bundle that includes all the code used in the editor.
`editorStyle` is pointing to the CSS bundle that includes all the css used in the editor.
`script` is pointing to the JavaScript bundle that includes all the code used on the website.
`style` is pointing to the CSS bundle that includes all the code used on the website.
I have included example data (Optional, but useful)

Although it isn’t necessary that you have both an `editorScript/editorStyle` and `script/style` listed in your `block.json` we encourage the separation of code used for editing and code used for displaying your block in order to keep both interfaces running quickly.

The `block.json` file also contains other important properties. Take a look at an example block.json file for reference.


## Step 3: Zip & Submit
The community is ecstatic you made it this far! Time to submit your plugin!

Take a few moments to read the block guidelines (https://github.com/WordPress/wporg-plugin-guidelines/blob/block-guidelines/blocks.md)

TODO - ADD MORE STUFF HERE


