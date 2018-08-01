# MenuItemsChoice

## Usage

```jsx
import { MenuGroup, MenuItemsChoice } from '@wordpress/components';
import { withState } from '@wordpress/compose';

withState( {
	mode: 'visual',
	choices: [
		{
			value: 'visual',
			label: 'Visual Editor',
		},
		{
			value: 'text',
			label: 'Code Editor',
		},
	],
} )( ( { mode, choices, setState } ) => (
	<MenuGroup label="Editor">
		<MenuItemsChoice
			choices={ choices }
			value={ mode }
			onSelect={ mode => setState( { mode } ) }
		/>
	</MenuGroup>
) )
```
