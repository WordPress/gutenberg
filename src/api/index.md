# Gutenberg API Prototype

This is proposal for a block API for the new WordPress editor!

Joen Asmussen pointed out that the design of the new editor would be
"block first". This sunk in and spurred this adventure into creating an API that
itself is just a single self referencing "block" that can create other blocks
out of itself.

## Overview

### How does this thing work

While trying to create a block that could make other blocks, which could make
other blocks, with a nice syntax, I settled on the pattern seen in blockType.js
et al. Basically, you have a function, that takes a function of properties and
returns a new reference to a function assigned those properties. This is then
partially applied to return a new function that takes properties. Each time the
function is called a new reference is created to enable the ability for new
entities to be created from a primitive version of itself carrying along its own
properties and at the beginning starting with none.

### Quick intro

`blockType()`, `block()`, `control()`, and `controlType()`, all serve as an independent
tool for building larger pieces. Each are identical other than their name. They
all work from the same fundamental pattern. Let's look at `blockType`, and
`controlType`. These would serve as a way to create factories for `block()` and
control(). A good idea might be to have a `create()` method on a type, which would
create the actual block, or control. Then each block or control would have a
`render()` method which would create an actual representation of that block or
control. `render()` could be used to return React components, DOM, vDOM, HTML,
TinyMCE, whatever is chosen. Let's look at creating a `blockType`.

### Creating a textBlockType

```js
// textBlock would be the block
import textBlock from '../blocks/textBlock'
import blockType from './blockType'

const textBlockTypeProperties = {
	type: 'wp-text',
	title: 'Text',
	controls: [
		[
			controlType( {
				type: 'left-align',
				title: 'Align Left',
				displayArea: 'block'
			} ),
			controlType( {
				type: 'center-align',
				title: 'Center Align',
				displayArea: 'block'
			} ),
			controlType( {
				type: 'right-align',
				title: 'Align Right',
				displayArea: 'block'
			} ),
			controlType( {
				type: 'bold',
				title: 'Make Bold',
				displayArea: 'inline'
			} ),
			controlType( {
				type: 'italics',
				title: 'Italicize',
				displayArea: 'inline'
			} ),
			controlType( {
				type: 'strikethrough',
				title: 'Strikethrough',
				displayArea: 'inline'
			} ),
			controlType( {
				type: 'underline',
				title: 'Underline',
				displayArea: 'inline'
			} )
		]
	]
	create: ( blockType = this ) => textBlock( blockType )
}

const textBlockType = blockType( textBlockTypeProperties )

// Create a text block.
const aTextBlock = textBlockType.create()

// Then grab the DOM node it creates.
const myTextDOMNode = aTextBlock.render( 'Blocks are neat.' )
```

### Creating a textBlock

```js
// Example text block.
const textBlock = blockType => {
    return block ( {
        /**
         * State and props would be objects that would be passed in via data held somewhere. i.e. the UI
         *
         * The render method is defined by you, so you can make it work the way you want it to.
         */
        render: ( state = {}, props = {} ) => {
            // Do some stuff relating to the blockType for this block.

            // Render something. Could be DOM, vDOM, React, TinyMCE, JSON, XML, HTML, whatever you want.
            // Here is DOM:
            if ( typeof document !== 'undefined' ) {
              pElement = document.createElement( 'p' )
              textNode = document.createTextNode( props.text )
              pElement.appendChild( textNode )
              return pElement
            }

            // Here is vDOM:
            if ( typeof h !== 'undefined' ) {
                return h( 'p', '.wp-text', [
                    props.text
                ] )
            }

            // React.js could work something similar to this.
            if ( typeof SomeReactComponent !== 'undefined' ) {
                return <SomeReactComponent state={state} props={props} />
            }
        }
    } )
}
```

Because the blockType is encapsulated within the reference to this block, you
could do interesting things based on properties of the blockType.

### Cool ideas & the importance of separation of the view layer.

```js
// blockProperties would include the render() method.
const textBlock = block( blockProperties )

// textTypeProperties could contain a create method returning textBlock().
const textType = blockType( textTypeProperties )

const aTextBlock = textType.create()
const anotherTextBlock = textType.create( textType( withDifferentPropertiesIfYouWant ) )

// containerTypeProperties's create() method would create the actual block.
const containerType = blockType( containerTypeProperties )

// containerProperties's render() method could provide a way to render both aTextBlock and anotherTextBlock inside of it.
const blockContainer = block( containerProperties )

let container = containerType(
  {
    blocks: [ aTextBlock, anotherTextBlock ],
    create: ( blockType = this ) => {
      return blockContainer( { blockType } )
    }
  }
).create()

// If all of the block render methods are React Components, creating a react version of the editor is simple as this.
import 'render' from 'react-dom'
render(
    container.render(),
    document.getElementById( 'editor' )
)

// Or if everything is DOM...
document.getElementById( 'editor' ).appendChild( container.render() )
```

This means that different view layers could be created in the future as the
latest shiny thing comes out or as the prototype evolves.

## Composability and references taken further.

A blockType can be composed of properties or of other blockTypes references.

```js
const textBlockType = blockType( { type: 'wp-text', controls: [ 'my-control' ] } )

// true
textBlockType.type === 'wp-text'

// true
textBlockType.controls === [ 'my-control' ]

// Lets create a quote type now with the same controls of text type.
const quoteBlockType = textBlockType( { type: 'wp-quote' } )

// true
quoteBlockType.type === 'wp-quote'

// true
quoteBlockType.controls === [ 'my-control' ]

// Create a new textBlockType reference.
let myTextBlockType = textBlockType()

let myTextBlockType.controls = [ 'way-better-control' ]

/**
 * true. If each invocation of a blockType() did not return a new reference, you
 * would have overwritten the controls on textBlockType, which would make this
 * statement false. In fact, blockType itself would be overridden every time
 * which would make this API very fragile and unusable.
 */
myTextBlockType.controls !== textBlockType.controls

// Different syntaxes that essentially all have the same result.
let textType = blockType( { type: 'wp-text' } )( { controls: [ 'woo' ] } )

textType = textType()

textType = blockType( { type: 'wp-text' }, { controls: [ 'woo' ] } )

textType = blockType( {
	type: 'wp-text',
	controls: [ 'woo' ]
} )

textType = textType()()()()()( { type: 'set-new-type' } )( { type: 'wp-text' } )
```

## Pluses & Minuses!

Pluses:
- Incredibly flexible.
- Highly Modular.
- Independent of presentation.
- Extensible.
- "Block" based. ( One little piece is used to create other pieces. )
- Enables the deferment of certain decisions.
- Easy to make changes.

Minuses:
- Some gotchas are present. i.e. Cannot assign properties that are read only on
`Function.prototype`, like `name`.
- JavaScript can be a confusing language and using it this way can potentially
lead to confusion about how this actually works.
- Could become a giant memory hog if not used properly.

## Implementation of Flow.

Eventually all things will be stored into `post_content`. `post_content` needs
to be the single source of truth, or else bad things can happen. How would this
block API be useful if all that is left at the end is HTML? Here is a proposed
flow:

1. Parse HTML to build out a model.
2. Build a representation of that model with this block API.
3. Once the representation has been created pass that off to the DOM, vDOM,
React/Redux, whatever and render that representation content as the UI for the
block editor.
4. Once the editor is initialized with its state from the parsed HTML and block
API, the editor can just run and be independent of this API.

## Next steps.

- Get buy in!
- Create more implementations of blocks.
- Because this API is relatively flexible, best practices should be refined and
documented.
- Improve cross browser compatability, clean up code. This is a hodgepodge of
ES5 JS syntax mixed with ES6 utilities. This library should really be written in
purely ES6 so it becomes easier to read, then transpile it to ES5 or whatever
via Babel or something else.

## Have fun!

Although this is in a sense an API it is also just a way to quickly create
objects and assign properties to them. There is no road, make your own path
create, explore, discover!
