# `NavigatorProvider`

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

The `NavigatorProvider` component allows rendering nested panels or menus (via the [`NavigatorScreen` component](/packages/components/src/navigator/navigator-screen/README.md)) and navigate between these different states (via the `useNavigator` hook). The Global Styles sidebar is an example of this.

## Usage

```jsx
import {
	__experimentalNavigatorProvider as NavigatorProvider,
	__experimentalNavigatorScreen as NavigatorScreen,
	__experimentalUseNavigator as useNavigator,
} from '@wordpress/components';

function NavigatorButton( { path, ...props } ) {
	const { push } = useNavigator();
	return (
		<Button
		 variant="primary"
		 onClick={ () => push( path ) }
		 { ...props }
	 />
 );
}

function NavigatorBackButton( props ) {
	const { pop } = useNavigator();
	return <Button variant="secondary" onClick={ () => pop() } { ...props } />;
}

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
			<NavigatorBackButton>Go back</NavigatorBackButton>
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

### `push`: `( path: string, options: NavigateOptions ) => void`

The `push` function allows navigating to a given path. The second argument can augment the navigation operations with different options.

There currently aren't any available options.

### `pop`: `() => void`

The `pop` function allows navigating to the previous path.

### `location`: `NavigatorLocation`

The `location` object represent the current location, and has a few properties:

- `path`: `string`. The path associated to the location.
- `isBack`: `boolean`. A flag that is `true` when the current location was reached by navigating backwards in the location stack.
- `isInitial`: `boolean`. A flag that is `true` only for the first (root) location in the location stack.
