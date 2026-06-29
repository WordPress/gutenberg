---
number: 8559
type: issue
state: CLOSED
url: https://github.com/WordPress/gutenberg/issues/8559
matched_labels: ["[Package] Components"]
all_labels: ["[Type] Bug","Good First Issue","[Status] In Progress","[Feature] UI Components","Needs Dev","[Package] Components"]
---

# Issue #8559: Dropdown: Popover content is wrong positioned

- URL: https://github.com/WordPress/gutenberg/issues/8559
- Author: mmtr
- Created: 2018-08-05T20:50:30Z
- Updated: 2023-10-24T15:54:39Z
- Comments: 3 of 3

## Body

**Describe the bug**
When rendering a `Dropdown` component outside Gutenberg, the popover content is wrong positioned. 

**To Reproduce**
Execute the code below in a new React project after installing `@wordpress/components`.

```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import { Button, Dropdown } from '@wordpress/components';

import '@wordpress/components/build-style/styles.css';

const MyDropdown = () => (
	<Dropdown
		position="bottom right"
		renderToggle={ ( { isOpen, onToggle } ) => (
			<Button isPrimary onClick={ onToggle } aria-expanded={ isOpen }>
				Toggle Popover!
			</Button>
		) }
		renderContent={ () => (
			<div>
				This is the content of the popover.
			</div>
		) }
	/>
);

ReactDOM.render(
	<MyDropdown />,
	document.getElementById( 'root' )
);
```

**Expected behavior**
The popover content should be displayed below the button.

**Screenshots**
![screen shot 2018-08-05 at 22 49 24](https://user-images.githubusercontent.com/1233880/43689937-d7201140-9901-11e8-8306-f4a8fdb513eb.png)

**Desktop:**
 - OS: macOS High Sierra
 - Browser Chrome
 - Version 67

**Additional context**
Issue found while working on #8338 and Automattic/wp-calypso#26367

## Issue comments

### youknowriad on 2018-12-25T10:55:23Z

URL: https://github.com/WordPress/gutenberg/issues/8559#issuecomment-449839805

I'm not certain this is an issue. 

In this particular example if you give a className to the dropdown component and display it as an "inline-block" it will show up properly. The idea is that the popover shows up centered within the Dropdown component's container.

Should we make the dropdown's container always `inline-block` by default? Maybe, but we should be careful about the consequences.

### rmorse on 2021-02-19T10:17:49Z

URL: https://github.com/WordPress/gutenberg/issues/8559#issuecomment-781979783

In case it helps anyone, I've been having some similar issues with this, and the color picker tooltips in standalone React apps.

If you are making applications outside of Block Editor and want to use these features, make sure to add a 

`<SlotFillProvider />` and a `<Popopver.Slot />`

So your app could look something like this:

    <SlotFillProvider>
    	<YourApp />
    	<Popover.Slot />
    </SlotFillProvider>

### dlxsnippets on 2023-10-24T15:54:39Z

URL: https://github.com/WordPress/gutenberg/issues/8559#issuecomment-1777538372

> 
> If you are making applications outside of Block Editor and want to use these features, make sure to add a
> 
> `<SlotFillProvider />` and a `<Popopver.Slot />`
> 
> So your app could look something like this:
> 
> ```
> <SlotFillProvider>
> 	<YourApp />
> 	<Popover.Slot />
> </SlotFillProvider>
> ```

@rmorse This is AMAZING. I've been debugging this now for a few hours and you got it on the nose. Thanks so much.

