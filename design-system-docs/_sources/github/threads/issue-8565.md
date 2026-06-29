---
number: 8565
type: issue
state: CLOSED
url: https://github.com/WordPress/gutenberg/issues/8565
matched_labels: ["[Package] Components"]
all_labels: ["[Type] Bug","[Package] Components"]
---

# Issue #8565: SandBox: Content not displayed

- URL: https://github.com/WordPress/gutenberg/issues/8565
- Author: mmtr
- Created: 2018-08-05T21:44:08Z
- Updated: 2019-05-04T09:18:39Z
- Comments: 1 of 1

## Body

**Describe the bug**
When rendering a `SandBox` component outside Gutenberg, its content is not displayed because the iframe has a width set to 0.

**To Reproduce**
Execute the code below in a new React project after installing `@wordpress/components`.

```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import { SandBox } from '@wordpress/components';

import '@wordpress/components/build-style/styles.css';

const MySandBox = () => (
	<SandBox
		html="<p>Content</p>"
		title="Sandbox"
		type="embed"
	/>
);

ReactDOM.render(
	<MySandBox />,
	document.getElementById( 'root' )
);
```

**Expected behavior**
The sandbox content is displayed.

**Screenshots**
![screen shot 2018-08-05 at 23 42 56](https://user-images.githubusercontent.com/1233880/43690392-5f4496d4-9909-11e8-8b0c-95fc69bd3574.png)

**Desktop:**
 - OS: macOS High Sierra
 - Browser: Chrome
 - Version: 67

**Additional context**
Issue found while working on #8338 and Automattic/wp-calypso#26367

## Issue comments

### jorgefilipecosta on 2019-04-22T11:22:42Z

URL: https://github.com/WordPress/gutenberg/issues/8565#issuecomment-485395630

Thank you for reporting this bug @mmtr, I was able to reproduce this problem.

