# Alignment Matrix Control

The alignment matrix control allows users to quickly adjust inner block alignment; this is in contrast to the alignment toolbar that aligns the frame block.

![Button components](https://i.imgur.com/PxYkgL5.png)

## Table of contents

-   [Alignment Matrix Control](#alignment-matrix-control)
    -   [Table of contents](#table-of-contents)
    -   [Design guidelines](#design-guidelines)
        -   [Usage](#usage)
    -   [Development guidelines](#development-guidelines)
        -   [Usage](#usage-1)
        -   [Props](#props)

## Design guidelines

### Usage

The alignment matrix is a specialized tool, and it's used in the cover block.

![Cover](https://i.imgur.com/nJjqen8.png)

As an example, here's the matrix alignment tool in action.

![center](https://i.imgur.com/0Ce1fZm.png)

![rop_right](https://i.imgur.com/yGGf6IP.png)

## Development guidelines

### Usage

```jsx
// This is a paraphrased example from the cover block
import {
    BlockControls,
    __experimentalBlockAlignmentMatrixControl as BlockAlignmentMatrixControl
} from "@wordpress/block-editor";

const controls = (
  <>
    <BlockControls>
      <BlockAlignmentMatrixControl
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

| Name       | Type       | Default                   | Description                                                                                                                              |
| ---------- | ---------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `label`    | `string`   | `Change matrix alignment` | concise description of tool's functionality.                                                                                             |
| `onChange` | `function` | `noop`                    | the function to execute upon a user's change of the matrix state                                                                         |
| `value`    | `string`   | `center`                  | describes the content alignment location and can be `top`, `right`, `bottom`, `left`, `topRight`, `bottomRight`, `bottomLeft`, `topLeft` |
