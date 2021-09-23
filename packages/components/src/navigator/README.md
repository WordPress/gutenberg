# Navigator

<div class="callout callout-alert">
This feature is still experimental. “Experimental” means this is an early implementation subject to drastic and breaking changes.
</div>

The Navigator components allows rendering nested panels or menus (also called screens) and navigate between these different states. The Global Styles sidebar is an example of this.

The components is not opinionated in terms of UI, it lets compose any UI components to navigate between the nested screens.

## Usage

```jsx
import {
	__experimentalNavigator as Navigator,
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
	<Navigator initialPath="/">
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
	</Navigator>
);
```

## Navigator Props

`Navigator` supports the following props.

### `initialPath`

-   Type: `string`
-   Required: No

The initial active path.

## NavigatorScreen Props

`NavigatorScreen` supports the following props.

### `path`

-   Type: `string`
-   Required: Yes

The path of the current screen.

## The navigator object.

You can retrieve a `navigator` instance by using the `useNavigator` hook.
The navigator offers the following methods:

### `push`

-   Type: `( path: string, options ) => void`

The `push` function allows you to navigate to a given path. The second argument can augment the navigation operations with different options.

The available options are:

 - `isBack` (`boolean): A boolean flag indicating that we're moving back to a previous state.
