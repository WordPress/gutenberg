NavigableToolbar
================

NavigableToolbar is a set of components which renders a toolbar menu and coordinates focus to and from the toolbar by contextual keyboard shortcuts.

While focused within the scope of a `NavigableToolbar.KeybindScope` component, pressing <kbd>Alt + F10</kbd> will direct focus to the corresponding toolbar by scope identifier. Pressing <kbd>Escape</kbd> while in a toolbar will return focus to the element which had focus at the time of the <kbd>Alt + F10</kbd> key combination, if applicable.

## Usage

Render a `NavigableToolbar` with an assigned scopeId. Elsewhere, render one or more `NavigableToolbar.KeybindScope` wrapping the context(s) in which the toolbar's keyboard shortcut should be observed.

```jsx
import { NavigableToolbar } from '@wordpress/editor';
import { Toolbar } from '@wordpress/components';
import { Fragment } from '@wordpress/element';

function MyNavigableToolbar() {
	return (
		<Fragment>
			<NavigableToolbar scopeId="my-toolbar">
				<Toolbar controls={ [ /* ... */ ] } />
			</NavigableToolbar>
			<NavigableToolbar.KeybindScope scopeId="my-toolbar">
				<textarea />
			</NavigableToolbar.KeybindScope>
		</Fragment>
	);
}
```
