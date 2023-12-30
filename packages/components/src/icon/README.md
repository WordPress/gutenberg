# Icon

Allows you to render a raw icon without any initial styling or wrappers.

## Usage

#### With a Dashicon

```jsx
import { Icon } from '@wordpress/components';

const MyIcon = () => <Icon icon="screenoptions" />;
```

#### With a function

```jsx
import { Icon } from '@wordpress/components';

const MyIcon = () => (
	<Icon
		icon={ () => (
			<svg>
				<path d="M5 4v3h5.5v12h3V7H19V4z" />
			</svg>
		) }
	/>
);
```

#### With a Component

```jsx
import { MyIconComponent } from '../my-icon-component';
import { Icon } from '@wordpress/components';

const MyIcon = () => <Icon icon={ MyIconComponent } />;
```

#### With an SVG

```jsx
import { Icon } from '@wordpress/components';

const MyIcon = () => (
	<Icon
		icon={
			<svg>
				<path d="M5 4v3h5.5v12h3V7H19V4z" />
			</svg>
		}
	/>
);
```

#### Specifying a className

```jsx
import { Icon } from '@wordpress/components';

const MyIcon = () => <Icon icon="screenoptions" className="example-class" />;
```

## Props

The component accepts the following props. Any additional props are passed through to the underlying icon element.

### icon

The icon to render. Supported values are: Dashicons (specified as strings), functions, Component instances and `null`.

-   Type: `String|Function|Component|null`
-   Required: No
-   Default: `null`

### size

The size (width and height) of the icon.

-   Type: `Number`
-   Required: No
-   Default: `20` when a Dashicon is rendered, `24` for all other icons.
