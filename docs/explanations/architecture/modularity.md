# Modularity

The WordPress block editor is based around the idea that you can combine independent blocks together to write your post or build your page. Blocks can also use and interact with each other. This makes it very modular and flexible.

But the Block Editor does not embrace modularity for its behavior and output only. The Gutenberg repository is also built from the ground up as several reusable and independent modules or packages, that, combined together, lead to the application and interface we all know. These modules are known as [WordPress packages](https://www.npmjs.com/org/wordpress) and are published and updated regularly on the npm package repository.

These packages are used to power the Block Editor, but they can be used to power any page in the WordPress Admin or outside.

## Why?

Using a modular architecture has several benefits for all the actors involved:

-   Each package is an independent unit and has a well defined public API that is used to interact with other packages and third-party code. This makes it easier for **Core Contributors** to reason about the codebase. They can focus on a single package at a time, understand it and make updates while knowing exactly how these changes could impact all the other parts relying on the given package.
-   A module approach is also beneficial to the **end-user**. It allows to selectively load scripts on different WordPress Admin pages while keeping the bundle size contained. For instance, if we use the components package to power our plugin's settings page, there's no need to load the block-editor package on that page.
-   This architecture also allows **third-party developers** to reuse these packages inside and outside the WordPress context by using these packages as npm or WordPress script dependencies.

## Types of packages

Almost everything in the Gutenberg repository is built into a package. We can split these packages into two different types:

### Production packages

These are the packages that ship in WordPress itself as JavaScript scripts. These constitute the actual production code that runs on your browsers. As an example, there's a `components` package serving as a reusable set of React components used to prototype and build interfaces quickly. There's also an `api-fetch` package that can be used to call WordPress Rest APIs.

Third-party developers can use these production packages in two different ways:

-   If you're building a JavaScript application, website, page that runs outside of the context of WordPress, you can consume these packages like any other JavaScript package in the npm registry.

```
npm install @wordpress/components
```

```js
import { Button } from '@wordpress/components';

function MyApp() {
	return <Button>Nice looking button</Button>;
}
```

-   If you're building a plugin that runs on WordPress, you'd probably prefer consuming the package that ships with WordPress itself. This allows multiple plugins to reuse the same packages and avoid code duplication. In WordPress, these packages are available as WordPress scripts with a handle following this format `wp-package-name` (e.g. `wp-components`). Once you add the script to your own WordPress plugin scripts dependencies, the package will be available on the `wp` global variable.

```php
// myplugin.php
// Example of script registration depending on the "components" and "element packages.
wp_register_script( 'myscript', 'pathtomyscript.js', array ('wp-components', "react" ) );
```

```js
// Using the package in your scripts
const { Button } = wp.components;

function MyApp() {
	return <Button>Nice looking button</Button>;
}
```

Script dependencies definition can be a tedious task for developers. Mistakes and oversight can happen easily. If you want to learn how you can automate this task. Check the [@wordpress/scripts](https://developer.wordpress.org/block-editor/packages/packages-scripts/#build) and [@wordpress/dependency-extraction-webpack-plugin](https://developer.wordpress.org/block-editor/packages/packages-dependency-extraction-webpack-plugin/) documentation.

#### Packages with stylesheets

Some production packages provide stylesheets to function properly.

-   If you're using the package as an npm dependency, the stylesheets will be available on the `build-style` folder of the package. Make sure to load this style file on your application.
-   If you're working in the context of WordPress, you'll have to enqueue these stylesheets or add them to your stylesheets dependencies. The stylesheet handles are the same as the script handles.

In the context of existing WordPress pages, if you omit to define the scripts or styles dependencies properly, your plugin might still work properly if these scripts and styles are already loaded there by WordPress or by other plugins, but it's highly recommended to define all your dependencies exhaustively if you want to avoid potential breakage in future versions.

#### Packages with data stores

Some WordPress production packages define data stores to handle their state. These stores can also be used by third-party plugins and themes to retrieve data and to manipulate it. The name of these data stores is also normalized following this format `core/package-name` (E.g. the `@wordpress/block-editor` package defines and uses the `core/block-editor` data store).

If you're using one of these stores to access and manipulate WordPress data in your plugins, don't forget to add the corresponding WordPress script to your own script dependencies for your plugin to work properly. (For instance, if you're retrieving data from the `core/block-editor` store, you should add the `wp-block-editor` package to your script dependencies like shown above).

### Development packages

These are packages used in development mode to help developers with daily tasks to develop, build and ship JavaScript applications, WordPress plugins and themes. They include tools for linting your codebase, building it, testing it...

## Editor packages

![Post Editor Modules Architecture](https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/explanations/architecture/assets/modules.png)

### What's the difference between the different editor packages? What's the purpose of each package?

It's often surprising to new contributors to discover that the post editor is constructed as a layered abstraction of three separate packages `@wordpress/edit-post`, `@wordpress/editor`, and `@wordpress/block-editor`.

The above [Why?](#why) section should provide some context for how individual packages aim to satisfy specific requirements. That applies to these packages as well:

-   `@wordpress/block-editor` provides components for implementing a block editor, operating on a primitive value of an array of block objects. It makes no assumptions for how this value is saved, and has no awareness (or requirement) of a WordPress site.
-   `@wordpress/editor` is the enhanced version of the block editor for WordPress posts. It utilizes components from the `@wordpress/block-editor` package. Having an awareness of the concept of a WordPress post, it associates the loading and saving mechanism of the value representing blocks to a post and its content. It also provides various components relevant for working with a post object in the context of an editor (e.g., a post title input component). This package can support editing posts of any post type and does not assume that rendering happens in any particular WordPress screen or layout arrangement.
-   `@wordpress/edit-post` is the implementation of the "New Post" ("Edit Post") screen in the WordPress admin. It is responsible for the layout of the various components provided by `@wordpress/editor` and `@wordpress/block-editor`, with full awareness of how it is presented in the specific screen in the WordPress administrative dashboard.

Structured this way, these packages can be used in a variety of combinations outside the use-case of the "New Post" screen:

-   A `@wordpress/edit-site` or `@wordpress/edit-widgets` package can serve as similar implementations of a "Site Editor" or "Widgets Editor", in much the same way as `@wordpress/edit-post`.
-   `@wordpress/editor` could be used in the implementation of the "Reusable Block" block, since it is essentially a nested block editor associated with the post type `wp_block`.
-   `@wordpress/block-editor` could be used independently from WordPress, or with a completely different save mechanism. For example, it could be used for a comments editor for posts of a site.

## Going further

-   [Package Reference](/docs/reference-guides/packages.md)
