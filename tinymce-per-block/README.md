"TinyMCE Per Block" Prototype
=============================

This is a WordPress editor technical prototype to explore the feasability of decorating blocks as editable, initializing TinyMCE on only those blocks for which it is required.

## Demo

https://wordpress.github.io/gutenberg/tinymce-per-block/

## Background

This prototype implements ideas explored in the Make WordPress Core's [Editor Technical Overview](https://make.wordpress.org/core/2017/01/17/editor-technical-overview/) blog post. Instead of expecting TinyMCE to manage the entire markup of a post, this prototype instead uses a [formal post grammar](https://github.com/Automattic/wp-post-grammar) to parse a post's content in the browser client. The JavaScript data structure of the post content is then used to render a set of controls which form the visual representation of the editor. The look and feel of these controls can be extended through an included block registration API, with backwards compatibility for posts preserved by either a generic block type or automated migration (a solution is yet to be decided).

Examples:

- [Text Block](./src/blocks/text-block)
- [Image Block](./src/blocks/image-block)

## Data Flow

![TinyMCE per block Data Flow](./doc/data-flow.png)

## Block API

### Registering a block
We do so by calling `wpblocks.registerBlock` with a name and an object defining the block to be registered. This object has the following attributes:

 * title: A string representing the label of the block
 * icon: The wpblocks component to display the icon of the block
 * form: The wpblocks component to display the block form (controls and contenteditables)
 * parse: A function that takes a raw grammar block as argument and returns the parsed block (if this function returns `false` we fallback to an HTML block)
 * serialize: The opposite of `parse`, transforms the current block to a raw grammar block
 * create: A function that returns an empty block object
 * transformations: An array of possible transformations. A transformation is the ability for a block to be switched to another block (for example, transforming a heading block to a text block)
 * merge: When the user hits backspace at the beginning of the blocks, the current block needs to be merged with the previous blocks. This attribute is an array of possible merge functions depending on the blockType.


### The Block Form component

It’s a wpblocks component (Abstraction of React for now, could be any vdom library) responsible of rendering the block form to edit the content of the blocks.

For example, a text block can show a TinyMCE instance. A quote block can render a TinyMCE instance for the content and a simple textarea for the cite etc…
Editor commands

The form component can trigger commands in response to any user event. For now the editor can handle these type of commands: change, append, remove, mergeWithPrevious, focus, moveCurosrUp, moveCurosrDown, moveBlockUp, moveBlockDown, select, unselect, hover, unhover.

#### Commands

The form receives an `api` object as a prop containing the different commands callbacks.

*change:* This command is triggered when the block changes, for example when the user type into the tinymce instance of a text block, or any attribute change.

*appendBlock:* This command should be triggered to append a new block right after the current block, for example when hitting “Enter” on a paragraph block

*remove:* This command should be triggered to remove the current block, for example when typing “backspace” on an empty paragraph block

*mergeWithPrevious:* This command should be triggered to ask for a merging the current block with the previous one. For example when we hit “backspace” and we’re focusing the beginning of a block paragraph

*focus:* This command should be triggered to focus the current block, the focus config is a free object passed as an argument to this helper, it contains all the data necessary to focus the current block at the right position.

*moveCursorUp:* This command should be triggered to ask for moving the cursor to the previous block for example when we hit the “up” arrow and we’re focusing the beginning of a block paragraph.

*moveCursorDown:* This command should be triggered to ask for moving the cursor to the next block for example when we hit the “down” arrow and we’re focusing the end of a block paragraph.
Block form interface
A block form should also implement some functions in response to other block commands:

*moveBlockUp:* Moves the block up

*moveBlockDown:* Moves the block down

*select:* Selects the current block

*unselect:* Unselects the current block

*hover:* to be called when the current block is hovered

*unhover:* to be called when the current block is "unhovered"

#### Form Props

The form also receives the following props:

*isFocused and focusConfig:* A block form should watch changes to these props and focus in consequence.
Utils

*isSelected:* Whether the block is selected

*isHovevered:* Whether the block is hovered

To ease writing block forms in the context of this prototype, we could reuse the two generic components:

#### Helpers

**EditableComponent:** which is an enhanced TinyMCE wrapper to catch different events (moveUp, moveDown, remove, mergeWithPrevious …)

**EnhancedInputComponent:** which is an autogrowing textarea wrapper. It also catches the different events (moveUp, moveDown, removePrevious, ….)


## Development

You must first [download and install Node.js](https://nodejs.org/en/download/) before you can build or develop this prototype. Next, in your terminal, navigate to the project directory and install dependencies:

```
npm install
```

**To develop with automatic recompilation:**

```
npm run dev
```

You can now visit [http://localhost:8081](http://localhost:8081) in your browser.

**To compile changes for commit:**

```
npm run build
```
