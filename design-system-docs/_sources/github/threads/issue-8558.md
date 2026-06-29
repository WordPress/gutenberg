---
number: 8558
type: issue
state: CLOSED
url: https://github.com/WordPress/gutenberg/issues/8558
matched_labels: ["[Package] Components"]
all_labels: ["[Type] Bug","[Feature] UI Components","[Package] Components"]
---

# Issue #8558: ColorPalette: Custom color picker is wrong positioned

- URL: https://github.com/WordPress/gutenberg/issues/8558
- Author: mmtr
- Created: 2018-08-05T20:40:19Z
- Updated: 2018-10-27T21:34:14Z
- Comments: 1 of 1

## Body

**Describe the bug**
When rendering a `ColorPalette` component outside Gutenberg, the custom color picker is wrong positioned. 

**To Reproduce**
Execute the code below in a new React project after installing `@wordpress/components` and `@wordpress/compose`.

```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import { ColorPalette } from '@wordpress/components';
import { withState } from '@wordpress/compose';

import '@wordpress/components/build-style/styles.css';

const MyColorPalette = withState( {
	color: '#f00',
} )( ( { color, setState } ) => { 
	const colors = [ 
		{ name: 'red', color: '#f00' }, 
		{ name: 'white', color: '#fff' }, 
		{ name: 'blue', color: '#00f' }, 
	];
	
	return ( 
		<ColorPalette 
			colors={ colors } 
			value={ color }
			onChange={ ( color ) => setState( { color } ) } 
		/>
	) 
} );

ReactDOM.render(
	<MyColorPalette />,
	document.getElementById( 'root' )
);
```

**Expected behavior**
The custom color picker should be displayed below the custom color icon.

**Screenshots**
![screen shot 2018-08-05 at 22 37 25](https://user-images.githubusercontent.com/1233880/43689826-2f834df4-9900-11e8-9bab-d2a94f32d381.png)

**Desktop:**
 - OS: macOS High Sierra
 - Browser Chrome
 - Version 67

**Additional context**
Issue found while working on #8338 and Automattic/wp-calypso#26367

## Issue comments

### mtias on 2018-10-27T21:34:13Z

URL: https://github.com/WordPress/gutenberg/issues/8558#issuecomment-433656903

Closing as duplicate of #8559.

