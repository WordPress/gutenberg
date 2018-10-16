# RawIcon

Allows you to render a raw icon without any initial styling or wrappers.

## Usage

#### With a Dashicon

```jsx
import { RawIcon } from '@wordpress/components';

const MyIcon = () => (
	<RawIcon icon="screenoptions" />
);
```

#### With a function

```jsx
import { RawIcon } from '@wordpress/components';

const MyIcon = () => (
	<RawIcon icon={ () => <svg><path d="M5 4v3h5.5v12h3V7H19V4z" /></svg> } />
);
```

#### With a Component

```jsx
import { MyIconComponent } from '../my-icon-component';
import { RawIcon } from '@wordpress/components';

const MyIcon = () => (
	<RawIcon icon={ MyIconComponent } />
);
```

#### With an SVG

```jsx
import { RawIcon } from '@wordpress/components';

const MyIcon = () => (
	<RawIcon icon={ <svg><path d="M5 4v3h5.5v12h3V7H19V4z" /></svg> } />
);
```

#### Specifying a className

```jsx
import { RawIcon } from '@wordpress/components';

const MyIcon = () => (
	<RawIcon icon="screenoptions" className="example-class" />
);
```

## Props

The component accepts the following props:

### icon

The icon to render. Supported values are: Dashicons (specified as strings), functions, WPComponent instances and `null`.

- Type: `String|Function|WPComponent|null`
- Required: No
- Default: `null`

### size

The size (width and height) of the icon.

- Type: `Number`
- Required: No
- Default: `24`

### className

An optional additional class name to apply to the rendered icon.

- Type: `String`
- Required: No
- Default: `null`
