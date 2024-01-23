# `NavigatorProvider`

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

The `NavigatorProvider` component allows rendering nested views/panels/menus (via the [`NavigatorScreen` component](/packages/components/src/navigator/navigator-screen/README.md)) and navigate between these different states (via the [`NavigatorButton`](/packages/components/src/navigator/navigator-button/README.md), [`NavigatorToParentButton`](/packages/components/src/navigator/navigator-to-parent-button/README.md) and [`NavigatorBackButton`](/packages/components/src/navigator/navigator-back-button/README.md) components or the `useNavigator` hook). The Global Styles sidebar is an example of this.

## Usage

```jsx
import {
  __experimentalNavigatorProvider as NavigatorProvider,
  __experimentalNavigatorScreen as NavigatorScreen,
  __experimentalNavigatorButton as NavigatorButton,
  __experimentalNavigatorToParentButton as NavigatorToParentButton,
} from '@wordpress/components';

const MyNavigation = () => (
  <NavigatorProvider initialPath="/">
    <NavigatorScreen path="/">
      <p>This is the home screen.</p>
       <NavigatorButton path="/child">
         Navigate to child screen.
      </NavigatorButton>
    </NavigatorScreen>

    <NavigatorScreen path="/child">
      <p>This is the child screen.</p>
      <NavigatorToParentButton>
        Go back
      </NavigatorToParentButton>
    </NavigatorScreen>
  </NavigatorProvider>
);
```
**Important note**

Parent/child navigation only works if the path you define are hierarchical, following a URL-like scheme where each path segment is separated by the `/` character.
For example:
- `/` is the root of all paths. There should always be a screen with `path="/"`.
- `/parent/child` is a child of `/parent`.
- `/parent/child/grand-child` is a child of `/parent/child`.
- `/parent/:param` is a child of `/parent` as well.

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

- `focusTargetSelector`: `string`. An optional property used to specify the CSS selector used to restore focus on the matching element when navigating back.
- `isBack`: `boolean`. An optional property used to specify whether the navigation should be considered as backwards (thus enabling focus restoration when possible, and causing the animation to be backwards too)

### `goToParent`: `() => void;`

The `goToParent` function allows navigating to the parent screen.

Parent/child navigation only works if the path you define are hierarchical (see note above).

When a match is not found, the function will try to recursively navigate the path hierarchy until a matching screen (or the root `/`) are found.

### `goBack`: `() => void`

The `goBack` function allows navigating to the previous path.

### `location`: `NavigatorLocation`

The `location` object represent the current location, and has a few properties:

- `path`: `string`. The path associated to the location.
- `isBack`: `boolean`. A flag that is `true` when the current location was reached by navigating backwards in the location stack.
- `isInitial`: `boolean`. A flag that is `true` only for the first (root) location in the location stack.

### `params`: `Record< string, string | string[] >`

The parsed record of parameters from the current location. For example if the current screen path is `/product/:productId` and the location is `/product/123`, then `params` will be `{ productId: '123' }`.
