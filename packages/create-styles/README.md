# Create Styles

> Creates the style system. Powered (under the hood) by Emotion

## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

-   [Usage](#usage)
-   [Demo](#demo)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Usage

```jsx
import React from 'react';
import { createStyleSystem } from '@wp-g2/create-styles';

const baseStyles = {
	background: 'dodgerblue',
	margin: 0,
};

// Values for your system
const config = {};
// Dark mode values for your system
const darkModeConfig = {};
// High contrast mode values for your system
const highContrastModeConfig = {};
// Dark High contrast mode values for your system
const darkHighContrastModeConfig = {};

const styleSystemProps = {
	baseStyles,
	config,
	darkModeConfig,
	highContrastModeConfig,
	darkHighContrastModeConfig,
};

const {
	// A collection of styled elements. (core.div)
	core,
	// The custom Emotion instance.
	compiler,
	// Getter for configs (CSS Variables).
	get,
	// Styled components. (styled.div)
	styled,
	// The base View.
	View,
} = createStyleSystem(styleSystemProps);

export default function App() {
	return (
		<View className="App">
			<View as="h1">Hello CodeSandbox</View>
			<View as="h2">Start editing to see some magic happen!</View>
		</View>
	);
}
```

## Demo

CodeSandbox Demo:
[https://codesandbox.io/s/wp-g2-create-styles-demo-4tv4k](https://codesandbox.io/s/wp-g2-create-styles-demo-4tv4k)
