---
number: 8566
type: issue
state: CLOSED
url: https://github.com/WordPress/gutenberg/issues/8566
matched_labels: ["[Package] Components"]
all_labels: ["[Type] Bug","[Package] Components"]
---

# Issue #8566: Spinner: Nothing is displayed

- URL: https://github.com/WordPress/gutenberg/issues/8566
- Author: mmtr
- Created: 2018-08-05T21:48:42Z
- Updated: 2018-08-13T08:01:33Z
- Comments: 1 of 1

## Body

**Describe the bug**
When rendering a `Spinner` component outside Gutenberg, nothing is displayed. Actually, a `div` with the `spinner` and `is-active` classes is rendered, but these classes are not giving any style at all.

**To Reproduce**
Execute the code below in a new React project after installing `@wordpress/components`.

```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import { Spinner } from '@wordpress/components';

import '@wordpress/components/build-style/styles.css';

const MySpinner = () => (
	<Spinner />
);

ReactDOM.render(
	<MySpinner />,
	document.getElementById( 'root' )
);
```

**Expected behavior**
A spinner should appear.

**Desktop:**
 - OS: macOS High Sierra
 - Browser: Chrome
 - Version: 67

**Additional context**
Issue found while working on #8338 and Automattic/wp-calypso#26367

## Issue comments

### youknowriad on 2018-08-06T09:50:15Z

URL: https://github.com/WordPress/gutenberg/issues/8566#issuecomment-410652725

I think we should do the same we did for the button component: Avoid relying on WordPress Core Styles for the spinner component and copy those styles to Gutenberg itself.

