# Admin UI

Generic components to be used to build the Admin UI.

## Installation

Install the module

```bash
npm install @wordpress/admin-ui --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for such language features and APIs, you should include [the polyfill shipped in `@wordpress/babel-preset-default`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/babel-preset-default#polyfill) in your code._

## Stylesheet Dependencies

AdminUI depends on stylesheets `@wordpress/theme`. In a WordPress admin page context, these are loaded automatically. For applications outside WordPress, you will need to include this stylesheet:

```bash
npm install @wordpress/theme
```

```tsx
import '@wordpress/theme/design-tokens.css';
```

## Usage

The primay container for all admin-ui componentry is the `Page` component:

```jsx
import { Page, Breadcrumbs } from '@wordpress/admin-ui';

export default function MyAdminPage() {
	return (
		<Page title="My Admin">
			<div>Page content goes here</div>
		</Page>
	);
}
```

## Components

### Breadcrumbs

A component for displaying breadcrumb navigation trails.

#### Usage

```jsx
import { Breadcrumbs } from '@wordpress/admin-ui';

function MyComponent() {
	const items = [
		{ label: 'Home', to: '/' },
		{ label: 'Products', to: '/products' },
		{ label: 'Product Details' },
	];

	return <Breadcrumbs items={ items } />;
}
```

#### Props

##### `items`: `BreadcrumbItem[]`

An array of breadcrumb items to display in the breadcrumb trail. The last item is considered the current item.

-   Type: `Array` of objects
-   Required

Each `BreadcrumbItem` object contains:

-   `label`: `string` - The label text for the breadcrumb item. (Required)
-   `to`: `string` - The router path that the breadcrumb item should link to. Optional because the current item does not have a link.

Example:

```jsx
const items = [
	{ label: 'Dashboard', to: '/' },
	{ label: 'Posts', to: '/posts' },
	{ label: 'Edit Post' }, // Current item without link
];
```

##### `showCurrentItem`: `boolean`

A boolean to show/hide the current item in the trail. Note that when `false` the current item is only visually hidden.

-   Type: `boolean`
-   Optional

#### Usage with Page

Breadcrumbs are meant to be paired with the `Page` component:

```jsx
import { Page, Breadcrumbs } from '@wordpress/admin-ui';

function MyAdminPage() {
	const breadcrumbItems = [
		{ label: 'Home', to: '/' },
		{ label: 'Settings' },
	];

	return (
		<Page
			subTitle="Configure your site's general settings"
			breadcrumbs={ <Breadcrumbs items={ breadcrumbItems } /> }
			hasPadding
		>
			<div>Your page content goes here</div>
		</Page>
	);
}
```

Current usage does not support using `title` and `breadcrumbs` together.

### NavigableRegion

A wrapper component that creates an accessible navigable region. This is useful for defining major sections of a page that users can navigate to using keyboard shortcuts.

#### Usage

```jsx
import { NavigableRegion } from '@wordpress/admin-ui';

function MyComponent() {
	return (
		<NavigableRegion ariaLabel="Main content" className="my-region">
			<div>Content goes here</div>
		</NavigableRegion>
	);
}
```

#### Props

##### `children`: `React.ReactNode`

The content to be rendered inside the navigable region.

-   Type: `React.ReactNode`
-   Required

##### `ariaLabel`: `string`

An accessible label for the region. This label is announced by screen readers when users navigate to this region.

-   Type: `string`
-   Required

##### `className`: `string`

Additional CSS class names to apply to the region.

-   Type: `string`
-   Optional

##### `as`: `React.ElementType`

The HTML element type to render. Defaults to `'div'`.

-   Type: `React.ElementType`
-   Optional
-   Default: `'div'`

Example:

```jsx
<NavigableRegion ariaLabel="Settings section" as="section">
	<div>Settings content</div>
</NavigableRegion>
```

### Page

A component for creating consistent page layouts in the WordPress admin UI. It provides a standardized structure with header, breadcrumbs, title, actions, and content areas.

#### Usage

```jsx
import { Page, Breadcrumbs } from '@wordpress/admin-ui';
import { Button } from '@wordpress/components';

function MyAdminPage() {
	return (
		<Page
			subTitle="Configure your site's general settings"
			title="Settings"
			actions={
				<>
					<Button variant="secondary">Cancel</Button>
					<Button variant="primary">Save</Button>
				</>
			}
			hasPadding
		>
			<div>Your page content goes here</div>
		</Page>
	);
}
```

#### Props

##### `children`: `React.ReactNode`

The main content of the page.

-   Type: `React.ReactNode`
-   Required

##### `title`: `React.ReactNode`

The title of the page, displayed in the header.

-   Type: `React.ReactNode`
-   Optional

Example:

```jsx
<Page title="My Settings Page">
	<div>Content</div>
</Page>
```

##### `subTitle`: `React.ReactNode`

A subtitle or description displayed below the title in the header.

-   Type: `React.ReactNode`
-   Optional

##### `breadcrumbs`: `React.ReactNode`

Breadcrumb navigation to be displayed in the header. Typically a `Breadcrumbs` component.

-   Type: `React.ReactNode`
-   Optional

See "Breadcrumbs" component usage section for more details.

##### `badges`: `React.ReactNode`

Badges or status indicators to be displayed in the header, typically after the title.

-   Type: `React.ReactNode`
-   Optional

##### `actions`: `React.ReactNode`

Action buttons or controls to be displayed in the header (typically on the right side).

-   Type: `React.ReactNode`
-   Optional

Example:

```jsx
<Page
	title="Settings"
	actions={
		<>
			<Button variant="secondary">Cancel</Button>
			<Button variant="primary">Save Changes</Button>
		</>
	}
>
	<div>Content</div>
</Page>
```

##### `className`: `string`

Additional CSS class names to apply to the page container.

-   Type: `string`
-   Optional

##### `ariaLabel`: `string`

An accessible label for the page region. If not provided, falls back to the `title` prop (if it's a string).

-   Type: `string`
-   Optional

##### `hasPadding`: `boolean`

Whether to apply default padding to the page content area.

-   Type: `boolean`
-   Optional
-   Default: `false`

##### `showSidebarToggle`: `boolean`

Whether to show the sidebar toggle button in the header.

-   Type: `boolean`
-   Optional
-   Default: `true`

#### Slot/Fill Components

##### `Page.SidebarToggleFill`

A Fill component that allows you to inject a sidebar toggle button into the Page header. This uses WordPress's Slot/Fill pattern.

Example:

```jsx
import { Page } from '@wordpress/admin-ui';
import { Button } from '@wordpress/components';
import { menu } from '@wordpress/icons';

function MySidebarToggle() {
	return (
		<Page.SidebarToggleFill>
			<Button icon={ menu } onClick={ toggleSidebar }>
				Toggle Sidebar
			</Button>
		</Page.SidebarToggleFill>
	);
}

function MyPage() {
	return (
		<Page title="My Page">
			<MySidebarToggle />
			<div>Page content</div>
		</Page>
	);
}
```

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
