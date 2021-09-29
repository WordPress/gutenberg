# `NavigatorProvider`

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

The `NavigatorProvider` component allows rendering nested panels or menus (via the [`NavigatorScreen` component](/packages/components/src/navigator/navigator-screen/README.md)) and navigate between these different states (via the `useNavigator` hook). The Global Styles sidebar is an example of this.

The `Navigator*` family of components is _not_ opinionated in terms of UI, and can be composed with any UI components to navigate between the nested screens.

## Usage

```jsx
import {
	__experimentalNavigatorProvider as NavigatorProvider,
	__experimentalNavigatorScreen as NavigatorScreen,
	__experimentalUseNavigator as useNavigator,
} from '@wordpress/components';

function NavigatorButton( {
	path,
	isBack = false,
	...props
} ) {
	const navigator = useNavigator();
	return (
		<Button
			onClick={ () => navigator.push( path, { isBack } ) }
			{ ...props }
		/>
	);
}

const MyNavigation = () => (
	<NavigatorProvider initialPath="/">
		<NavigatorScreen path="/">
			<p>This is the home screen.</p>
			<NavigatorButton isPrimary path="/child">
				Navigate to child screen.
			</NavigatorButton>
		</NavigatorScreen>

		<NavigatorScreen path="/child">
			<p>This is the child screen.</p>
			<NavigatorButton isPrimary path="/" isBack>
				Go back
			</NavigatorButton>
		</NavigatorScreen>
	</NavigatorProvider>
);
```

## Props

The component accepts the following props:

### `initialPath`: `string`

The initial active path.

-   Required: No


## The navigator object

You can retrieve a `navigator` instance by using the `useNavigator` hook.

The hook offers the following methods:

### `push`: `( path: string, options ) => void`

The `push` function allows you to navigate to a given path. The second argument can augment the navigation operations with different options.

The available options are:

- `isBack` (`boolean): A boolean flag indicating that we're moving back to a previous state. -->
