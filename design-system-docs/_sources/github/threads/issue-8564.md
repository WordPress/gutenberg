---
number: 8564
type: issue
state: CLOSED
url: https://github.com/WordPress/gutenberg/issues/8564
matched_labels: ["[Package] Components"]
all_labels: ["[Type] Bug","Good First Issue","[Feature] UI Components","[Package] Components","CSS Styling"]
---

# Issue #8564: Placeholder: Width exceeds the width of the parent

- URL: https://github.com/WordPress/gutenberg/issues/8564
- Author: mmtr
- Created: 2018-08-05T21:38:43Z
- Updated: 2020-09-21T08:53:10Z
- Comments: 1 of 1

## Body

**Describe the bug**
When rendering a `Placeholder` component outside Gutenberg, its width exceeds the width of the parent element.

It's caused by a [padding of 1em](https://github.com/WordPress/gutenberg/blob/3450273fe7522101e3809b270c80a7b9a3ebcf3a/packages/components/src/placeholder/style.scss#L6) that is added to the width because `box-sizing` is not `border-box`.

**To Reproduce**
Execute the code below in a new React project after installing `@wordpress/components`.

```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import { Placeholder } from '@wordpress/components';

import '@wordpress/components/build-style/styles.css';

const MyPlaceholder = () => (
	<div style={ { border: 1px solid black; } }>
		<Placeholder
			icon="wordpress-alt"
			label="Placeholder"
		/>
	</div>
);

ReactDOM.render(
	<MyPlaceholder />,
	document.getElementById( 'root' )
);
```

**Expected behavior**
The placeholder doesn't exceed the width of the parent.

**Screenshots**
![screen shot 2018-08-05 at 23 36 58](https://user-images.githubusercontent.com/1233880/43690320-80b2f794-9908-11e8-8ddb-77f022ad5130.png)

**Desktop:**
 - OS: macOS High Sierra
 - Browser: Chrome
 - Version: 67

**Additional context**
Issue found while working on #8338 and Automattic/wp-calypso#26367

## Issue comments

### youknowriad on 2019-10-29T14:03:04Z

URL: https://github.com/WordPress/gutenberg/issues/8564#issuecomment-547435259

We should just add an explicit border-box box sizing property. Ideally all components work properly without global resets.

