# BottomSheet Navigation

We use [`react-navigation`](https://reactnavigation.org/) v5 to handle multiple screens inside the bottom-sheet. We have two components that help use it w/o additional settings.

-   BottomSheet.NavigationContainer
-   BottomSheet.NavigationScreen

## BottomSheet.NavigationContainer

`BottomSheet.NavigationContainer` is a React component to render a Stack Navigator with settings prepared for the Bottom-Sheet. This component also handles the height animation of bottom-sheet when back or pushing a new screen.

**NOTE:** Children of the `BottomSheet.NavigationContainer` can be only `BottomSheet.NavigationScreen`

## BottomSheet.NavigationScreen

`BottomSheet.NavigationScreen` is a React component to render a Screen inside the stack that is passed from parent. This component can be rendered only inside the `BottomSheet.NavigationContainer` and is responsible for handling the hardware back button on Android and setting the correct height of the parent (container).

## Usage

```jsx
import { BottomSheet } from '@wordpress/components';

const BottomSheetWithNavigation = () => (
	<BottomSheet hasNavigation>
		   
		<BottomSheet.NavigationContainer>
			     
			<BottomSheet.NavigationScreen name={ 'Settings' }>
				<InspectorControls.Slot />
			</BottomSheet.NavigationScreen>
			      <BottomSheet.NavigationScreen name={ 'Colors' }>
				<ColorSettings defaultSettings={ settings } />    
			</BottomSheet.NavigationScreen>   
		</BottomSheet.NavigationContainer>
		 
	</BottomSheet>
);
```

## Props

### BottomSheet.NavigationContainer

The component accepts the following props.

### animate

This prop determines if the container height should be animated. It should be set to `true` only for the root container in BottomSheet. In nested `BottomSheet.NavigationContainer` set it to `false`.

-   Type: `Boolean`
-   Required: No
-   Default: `false`

### main

Since we do not wrap the whole editor inside navigation (yet) we need to determine if the container is the very top one (root one). Set it to `true` in only for NOT nested navigation container.

Note: This prop is needed until we wrap the editor inside the navigation container.

-   Type: `Boolean`
-   Required: No
-   Default: `false`

### theme

This prop is to set the theme of navigation containers. Please read: https://reactnavigation.org/docs/themes/

-   Type: `Object`
-   Required: No

### BottomSheet.NavigationScreen

The component accepts the following props. Props not included in this set will be applied to the Stack.Screen from `react-navigation`.

### name

This prop is used as a Screen name.

-   Type: `String`
-   Required: Yes

### children

The component that should be rendered as content.

-   Type: React Element
-   Required: Yes

### isScrollable

This prop determines whether the screen should be wrapped into the ScrollView - this is needed if the screen contains FlatList or any other list inside. Thanks to that we do not nest List into the ScrollView with the same orientation.

-   Type: `Boolean`
-   Required: No

### fullScreen

This prop determines if the screen should have full height of device.

-   Type: `Boolean`
-   Required: No
