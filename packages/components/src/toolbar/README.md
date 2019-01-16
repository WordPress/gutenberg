# Toolbar

Toolbar can be used to group related options. To emphasize groups of related icon buttons, a toolbar should share a common container.

![Toolbar component above an image block](https://wordpress.org/gutenberg/files/2019/01/s_96EC471FE9C9D91A996770229947AAB54A03351BDE98F444FD3C1BF0CED365EA_1541782974545_ButtonGroup.png)

## Table of contents

1. [Design guidelines](#design-guidelines)
2. [Development guidelines](#development-guidelines)

## Design guidelines

### Usage

#### Selected action

Only one option in a toolbar can be selected and active at a time. Selecting one option deselects any other.

### Best practices

Toolbars should:

- **Clearly communicate that clicking or tapping will trigger an action.**
- **Use established colors appropriately.** For example, only use red for actions that are difficult or impossible to undo.
- When used with a block, have a consistent location above the block. **Otherwise, have a consistent location in the interface.**

![A toolbar attached to the top left side of a block. (1. Toolbar, 2. Block)](https://wordpress.org/gutenberg/files/2019/01/s_D8D19E5A314C2D056B8CCC92B2DB5E27164936A0C5ED98A4C2DFDA650BE2A771_1542388042335_toolbar-block.png)

### States

#### Active and available toolbars
A toolbar’s state makes it clear which icon button is active. Hover and focus states express the available selection options for icon buttons in a toolbar.

![Toolbar component](https://wordpress.org/gutenberg/files/2019/01/s_96EC471FE9C9D91A996770229947AAB54A03351BDE98F444FD3C1BF0CED365EA_1541784539545_ButtonGroup.png)

#### Disabled toolbars
Toolbars that cannot be selected can either be given a disabled state, or be hidden.

## Development guidelines

### Usage

```jsx
import { Toolbar } from '@wordpress/components';
import { withState } from '@wordpress/compose';

const MyToolbar = withState( {
	activeControl: 'up',
} )( ( { activeControl, setState } ) => { 
	function createThumbsControl( thumbs ) {
		return {
			icon: `thumbs-${ thumbs }`,
			title: `Thumbs ${ thumbs }`,
			isActive: activeControl === thumbs,
			onClick: () => setState( { activeControl: thumbs } ),
		};
	}
	
	return (
		<Toolbar controls={ [ 'up', 'down' ].map( createThumbsControl ) } />
	);
} );
```
