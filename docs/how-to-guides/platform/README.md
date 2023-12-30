# Development Platform

The Gutenberg Project is not only building a better editor for WordPress, but also creating a platform to build upon. This platform consists of a set of JavaScript packages and tools that you can use in your web application. [View the list of packages available on npm](https://www.npmjs.com/org/wordpress).

## UI components

The [WordPress Components package](/packages/components/README.md) contains a set of UI components you can use in your project. See the [WordPress Storybook site](https://wordpress.github.io/gutenberg/) for an interactive guide to the available components and settings.

Here is a quick example, how to use components in your project.

Install the dependency:

```bash
npm install --save @wordpress/components
```

Usage in React:

```jsx
import { Button } from '@wordpress/components';

function MyApp() {
	return <Button>Hello Button</Button>;
}
```

Many components include CSS to add style, you will need to include for the components to appear correctly. The component stylesheet can be found in `node_modules/@wordpress/components/build-style/style.css`, you can link directly or copy and include it in your project.

## Development scripts

The [`@wordpress/scripts` package](/packages/scripts/README.md) is a collection of reusable scripts for JavaScript development — includes scripts for building, linting, and testing — all with no additional configuration files.

Here is a quick example, on how to use `wp-scripts` tool in your project.

Install the dependency:

```bash
npm install --save-dev @wordpress/scripts
```

You can then add a scripts section to your package.json file, for example:

```json
	"scripts": {
		"build": "wp-scripts build",
		"format": "wp-scripts format",
		"lint:js": "wp-scripts lint-js",
		"start": "wp-scripts start"
	}
```

You can then use `npm run build` to build your project with all the default webpack settings already configured, likewise for formatting and linting. The `start` command is used for development mode. See the [`@wordpress/scripts` package](/packages/scripts/README.md) for full documentation.

For more info, see the [Getting Started with JavaScript tutorial](/docs/how-to-guides/javascript/js-build-setup.md) in the Block Editor Handbook.

## Block Editor

The [`@wordpress/block-editor` package](https://developer.wordpress.org/block-editor/packages/packages-block-editor/) allows you to create and use standalone block editors.

You can learn more by reading the [tutorial "Building a custom block editor"](/docs/how-to-guides/platform/custom-block-editor.md).

