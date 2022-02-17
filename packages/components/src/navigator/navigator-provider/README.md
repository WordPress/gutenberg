# `NavigatorProvider`

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

The `NavigatorProvider` component allows rendering nested views/panels/menus (via the [`NavigatorScreen` component](/packages/components/src/navigator/navigator-screen/README.md)) and navigate between these different states (via the [`NavigatorButton`](/packages/components/src/navigator/navigator-button/README.md) and [`NavigatorBackButton`](/packages/components/src/navigator/navigator-back-button/README.md) components or the `useNavigator` hook). The Global Styles sidebar is an example of this.

## Usage

```jsx
import {
  __experimentalNavigatorProvider as NavigatorProvider,
  __experimentalNavigatorScreen as NavigatorScreen,
  __experimentalNavigatorButton as NavigatorButton,
  __experimentalNavigatorBackButton as NavigatorBackButton,
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
      <NavigatorBackButton>
        Go back
      </NavigatorBackButton>
    </NavigatorScreen>
  </NavigatorProvider>
);
```

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

### `goBack`: `() => void`

The `goBack` function allows navigating to the previous path.

### `location`: `NavigatorLocation`

The `location` object represent the current location, and has a few properties:

- `path`: `string`. The path associated to the location.
- `isBack`: `boolean`. A flag that is `true` when the current location was reached by navigating backwards in the location stack.
- `isInitial`: `boolean`. A flag that is `true` only for the first (root) location in the location stack.
