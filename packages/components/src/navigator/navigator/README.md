# `Navigator`

The `Navigator` component allows rendering nested views/panels/menus (via the [`Navigator.Screen` component](/packages/components/src/navigator/navigator-screen/README.md)) and navigate between these different states (via the [`Navigator.Button`](/packages/components/src/navigator/navigator-button/README.md) and [`Navigator.BackButton`](/packages/components/src/navigator/navigator-back-button/README.md) components or the `useNavigator` hook).

## Usage

```jsx
import { Navigator } from '@wordpress/components';

const MyNavigation = () => (
	<Navigator initialPath="/">
		<Navigator.Screen path="/">
			<p>This is the home screen.</p>
			<Navigator.Button path="/child">
				Navigate to child screen.
			</Navigator.Button>
		</Navigator.Screen>
		*<Navigator.Screen path="/child">
			<p>This is the child screen.</p>
			<Navigator.BackButton>Go back</Navigator.BackButton>
		</Navigator.Screen>
	</Navigator>
);
```

### Hierarchical `path`s

`Navigator` assumes that screens are organized hierarchically according to their `path`, which should follow a URL-like scheme where each path segment starts with and is separated by the `/` character.

`Navigator` will treat "back" navigations as going to the parent screen — it is therefore responsibility of the consumer of the component to create the correct screen hierarchy.

For example:

-   `/` is the root of all paths. There should always be a screen with `path="/"`.
-   `/parent/child` is a child of `/parent`.
-   `/parent/child/grand-child` is a child of `/parent/child`.
-   `/parent/:param` is a child of `/parent` as well.
-   if the current screen has a `path` with value `/parent/child/grand-child`, when going "back" `Navigator` will try to recursively navigate the path hierarchy until a matching screen (or the root `/`) is found.

### Height and animations

Due to how `NavigatorScreen` animations work, it is recommended that the `NavigatorProvider` component is assigned a `height` to prevent some potential UI jumps while moving across screens.

## Props

The component accepts the following props:

### `initialPath`: `string`

The initial active path.

-   Required: No

## The `navigator` object

You can retrieve a `navigator` instance by using the `useNavigator` hook.

The `navigator` instance has a few properties:

### `goTo`: `( path: string, options: NavigateOptions ) => void`

The `goTo` function allows navigating to a given path. The second argument can augment the navigation operations with different options.

The available options are:

-   `focusTargetSelector`: `string`. An optional property used to specify the CSS selector used to restore focus on the matching element when navigating back;
-   `isBack`: `boolean`. An optional property used to specify whether the navigation should be considered as backwards (thus enabling focus restoration when possible, and causing the animation to be backwards too);
-   `skipFocus`: `boolean`. An optional property used to opt out of `Navigator`'s focus management, useful when the consumer of the component wants to manage focus themselves;

### `goBack`: `( path: string, options: NavigateOptions ) => void`

The `goBack` function allows navigating to the parent screen. Parent/child navigation only works if the paths you define are hierarchical (see note above).

When a match is not found, the function will try to recursively navigate the path hierarchy until a matching screen (or the root `/`) are found.

The available options are the same as for the `goTo` method, except for the `isBack` property, which is not available for the `goBack` method.

### `location`: `NavigatorLocation`

The `location` object represent the current location, and has a few properties:

-   `path`: `string`. The path associated to the location.
-   `isBack`: `boolean`. A flag that is `true` when the current location was reached by navigating backwards.
-   `isInitial`: `boolean`. A flag that is `true` only for the initial location.

### `params`: `Record< string, string | string[] >`

The parsed record of parameters from the current location. For example if the current screen path is `/product/:productId` and the location is `/product/123`, then `params` will be `{ productId: '123' }`.
