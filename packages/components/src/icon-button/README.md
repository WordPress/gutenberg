# IconButton

Icon buttons tell users what actions they can take and give them a way to interact with the interface. You’ll find them throughout a UI, particularly in places like:

- Button groups
- Toolbars

![IconButton component](https://wordpress.org/gutenberg/files/2018/12/s_1D98B71431B26D39301DAD9ADD4189EA9DDF0B98AC93C77E7DE58172FFC06323_1541793686578_IconButton.png)

![Toolbar component composed of attached IconButtons](https://wordpress.org/gutenberg/files/2018/12/s_1D98B71431B26D39301DAD9ADD4189EA9DDF0B98AC93C77E7DE58172FFC06323_1541793628237_Toolbar.png) 

## Table of contents

1. [Design guidelines](#design-guidelines)
2. [Development guidelines](#development-guidelines)
3. [Related components](#related-components)

# Design guidelines

## Best practices

Icon buttons should:

- **Choose a clear and accurate icon to represent the action.**
- **Clearly communicate that clicking or tapping will trigger an action.**
- **Use established colors appropriately.** For example, only use red buttons for actions that are difficult or impossible to undo.
- **Have consistent locations in the interface.**

## Anatomy

Icon buttons have low emphasis. They don’t stand out much on the page, so they’re used for less-important actions. What’s less important can vary based on context, but it’s usually a supplementary action to the main action we want someone to take. Icon buttons are also useful when you don’t want to distract from the content.

# Development guidelines

##  Usage

```jsx
import { IconButton } from '@wordpress/components';

const MyIconButton = () => (
	<IconButton
		icon="ellipsis"
		label="More"
	/>
);
```

# Related components

- The `Toolbar` component is composed of  `IconButton` components.
