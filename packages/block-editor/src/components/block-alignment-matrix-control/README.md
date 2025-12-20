# Alignment Matrix Control

The alignment matrix control allows users to quickly adjust inner block alignment; this is in contrast to the alignment toolbar that aligns the frame block.

![Button components](https://i.imgur.com/PxYkgL5.png)

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
);
```

### Props

### `label`

-   **Type:** `string`
-   **Default:** `'Change matrix alignment'`

Label for the control.

### `onChange`

-   **Type:** `Function`
-   **Default:** `noop`

Function to execute upon a user's change of the matrix state.

### `value`

-   **Type:** `string`
-   **Default:** `'center'`
-   **Options:** `'center'`, `'center center'`, `'center left'`, `'center right'`, `'top center'`, `'top left'`, `'top right'`, `'bottom center'`, `'bottom left'`, `'bottom right'`

Content alignment location.

### `isDisabled`

-   **Type:** `boolean`
-   **Default:** `false`

Whether the control should be disabled.