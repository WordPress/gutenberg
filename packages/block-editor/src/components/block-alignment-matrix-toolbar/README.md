# Alignment Matrix Toolbar
The alignment matrix allows users the ability to change text alignment quickly and intuitively.

![Button components](https://i.imgur.com/PxYkgL5.png)

## Table of contents

- [Alignment Matrix Toolbar](#alignment-matrix-toolbar)
  - [Table of contents](#table-of-contents)
  - [Design guidelines](#design-guidelines)
    - [Usage](#usage)
    - [Best practices](#best-practices)
  - [Development guidelines](#development-guidelines)
    - [Usage](#usage-1)
    - [Props](#props)

## Design guidelines

### Usage

The alignment matrix is a specialized tool, and it's used in the cover block.

![Cover](https://i.imgur.com/nJjqen8.png)

As an example, here's the matrix alignment tool in action.

![center](https://i.imgur.com/0Ce1fZm.png)


![rop_right](https://i.imgur.com/yGGf6IP.png)

### Best practices

The matrix alignment tool should:

- **Folow graphic design alignment guidelines** ; text alignment is important in graphic design. You can find tutorials online about alignment principles in graphic design, but [here](https://www.printwand.com/blog/basic-alignment-principles-in-graphic-design-with-examples) is an example.


## Development guidelines

### Usage

```jsx
// This is a paraphrased example from the cover block
import { 
    BlockControls,
    __experimentalBlockAlignmentMatrixToolbar as BlockAlignmentMatrixToolbar
} from "@wordpress/block-editor";

const controls = (
  <>
    <BlockControls>
      <BlockAlignmentMatrixToolbar
        label={ __( 'Change content position' ) }
        value={ contentPosition }
        onChange={ ( nextPosition ) =>
          setAttributes( { contentPosition: nextPosition } )
        }
              />
          </BlockControls>
      </>
}
```

### Props


Name | Type | Default | Description
--- | --- | --- | ---
`label` | `string` | `Change matrix alignment` | concise description of tool's functionality.
`onChange` | `function` | `noop` | the function to execute upon a user's change of the matrix state
`value` | `string` | `center` | describes the content alignment location and can be `top`, `right`, `bottom`, `left`, `topRight`, `bottomRight`, `bottomLeft`, `topLeft`

