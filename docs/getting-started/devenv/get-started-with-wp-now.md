# Get started with wp-now

The [@wp-now/wp-now](https://www.npmjs.com/package/@wordpress/env) package (`wp-now`) is a lightweight tool powered by [WordPress Playground](https://developer.wordpress.org/playground/) that streamlines setting up a local WordPress environment.

Before following this guide, install [Node.js development tools](/docs/getting-started/devenv#node-js-development-tools) if you have not already done so. It's recommended that you use the latest version of `node`. `wp-now` requires at least `node` v18 and v20 if you intend to use its [Blueprints](https://github.com/WordPress/playground-tools/tree/trunk/packages/wp-now#using-blueprints) feature. 


## Quick start
 
1. In the terminal, navigate to an existing plugin directory, theme directory, or any directory.
2. Run the following command to start the local WordPress environment.

```bash
npx @wp-now/wp-now start
```

3. A fully functional local WordPress site will be automatically opened in your default web browser. 

![wp-now basics diagram](https://raw.githubusercontent.com/WordPress/gutenberg/HEAD/docs/assets/wp-now-basics-diagram.png)

## Install and run `wp-now`

Under the hood, `wp-now` is powered by WordPress Playground and only requires Node.js, unlike `wp-env`, which also requires Docker. 

To run `wp-now` you can use [`npx`](https://docs.npmjs.com/cli/v10/commands/npx) (as shown above: `npx @wp-now/wp-now`).

You can also install `wp-now` globally, to be able to just run `wp-now` from any directory.

```sh
npm -g install @wp-now/wp-now
```

To confirm it's installed and available, run `wp-now --version`, and the version number should appear.

Next, navigate to an existing plugin directory, theme directory, or a new working directory in the terminal and run:

```sh
wp-now start
```

After the script runs, your default web browser will automatically open the new local site, and you'll be logged in with the username `admin` and the password `password`.

<div class="callout callout-tip">
    If you encounter any errors when running <code>wp-now start</code>, make sure that you are using at least <code>node</code> v18, or v20 if you are using the Blueprint feature.
</div>

When running `wp-now` you can also pass arguments that modify the behavior of the WordPress environment. For example, `wp-now start --wp=6.3 --php=8` will start a site running WordPress 6.3 and PHP 8, which can be useful for testing purposes.

Refer to the [@wp-now/wp-now](https://github.com/WordPress/playground-tools/tree/trunk/packages/wp-now) documentation for all available arguments.

### Where to run `wp-now`

The `wp-now` tool can be used practically anywhere and has different modes depending on how the directory is set up when you run `wp-now start`. Despite the many options, when developing for the Block Editor, you will likely use:

- `plugin`, `theme`, or `wp-content`: Loads the project files into a virtual filesystem with WordPress and a SQLite-based database. Everything (including WordPress core files, the database, wp-config.php, etc.) is stored in the user's home directory and loaded into the virtual filesystem. The mode will be determined by:
    - `plugin`: Presence of a PHP file with 'Plugin Name:' in its contents.
    - `theme`: Presence of a `style.css` file with 'Theme Name:' in its contents.
    - `wp-content`: Presence of `/plugins` and `/themes` subdirectories.
- `playground`: If no other mode conditions are matched, `wp-now` launches a completely virtualized WordPress site.

Refer to the [@wp-now/wp-now](https://github.com/WordPress/playground-tools/tree/trunk/packages/wp-now) documentation for a more detailed explanation of all modes.

### Known issues

Since `wp-now` is a relatively new tool, there are a few [known issues](https://github.com/WordPress/playground-tools/tree/trunk/packages/wp-now#known-issues) to be aware of. However, these issues are unlikely to impact most block, theme, or plugin development.

### Uninstall or reset `wp-now`

Here are a few instructions if you need to start over or want to remove what was installed.

-   If you just want to reset and clean the WordPress database, run `wp-now --reset`
-   To globally uninstall the `wp-now` tool, run `npm -g uninstall @wp-now/wp-now`

## Additional resources

-   [@wp-now/wp-now](https://github.com/WordPress/playground-tools/tree/trunk/packages/wp-now) (Official documentation)
-   [WordPress Playground](https://developer.wordpress.org/playground/) (Developer overview)