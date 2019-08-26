# Block Alignment Toolbar

It's a toolbar which contains control buttons about alignment behavior. 100% customizable.

#### Props

##### value

The active alignment option 

- Type: `string`
- Required: No
- Default: `Undefined`

```es6
<BlockAlignmentToolbar
    value={ 'center' }
/>
```

##### onChange

Callback when the alignment changes.

- Type: `func`
- Required: Yes

```es6
<BlockAlignmentToolbar
    onChange={ ( next ) => alert( next ? `Change to ${ next }` : 'Same one!' ) }
/>
```

Use this callback to apply the desired functionality when the user clicks on the toolbar control buttons.  

##### controls

An array of control buttons to show in the toolbar.

- Type: `array`
- Required: No
- Default: `[ [ 'left', 'center', 'right', 'wide', 'full' ], [ 'fullScreen' ] ]`

Basic buttons setup.
```es6
<BlockAlignmentToolbar
    controls={ [ 'center', 'wide', 'full' ] }
/>
```

Grouped control buttons.

```es6
<BlockAlignmentToolbar
    controls={ [
        [ 'left', 'center', 'right' ],
        [ 'wide', 'full', 'fullScreen' ],
    ] }
/>
```

#### isCollapsed

When it's `true` all toolbar buttons are initially hidden less the default/active button.
Clicking on it will show all buttons in a dropdown.
If `isCollapsed` is false, all buttons are shown in the main toolbar.

- Type: `boolean`
- Required: No
- Default: `true`

#### wideControlsEnabled

If it's true, the _wide_ controls are shown. These are `wide`, `full` and `fullScreen`

- Type: `boolean`
- Required: No
- Default: `false`

### Examples

#### Basic alignment toolbar.
  
```es6
import { BlockAlignmentToolbar } from '@wordpress/block-editor';

<BlockAlignmentToolbar
    value={ 'center' }
    onChange={ ( nextWidth ) => alert( { nextWidth } ) }
    controls={ [ 'center', 'wide', 'full' ] }
/>
```

#### Alignments buttons divided into two groups.

```es6
import { BlockAlignmentToolbar } from '@wordpress/block-editor';

<BlockAlignmentToolbar
    onChange={ ( nextWidth ) => alert( { nextWidth } ) }
    controls={ [
        [ 'left', 'center', 'right' ],
        [ 'wide', 'full', 'fullScreen' ],
    ] }
/>
```
