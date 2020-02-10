# Getting Started

Gutenberg is a Node.js-based project, built primarily in JavaScript.

The first step is to install the [latest active LTS release](https://github.com/nodejs/Release#release-schedule) of Node. The easiest way (on macOS, Linux, or Windows 10 with the Linux Subsystem) is by installing and running [nvm]. Once `nvm` is installed, you can install the correct version of Node by running `nvm install` in the Gutenberg directory.

Once you have Node installed, run these scripts from within your local Gutenberg repository:

Note: The install scripts require [Python](https://www.python.org/) to be installed and in the path of the local system.

```bash
npm install
npm run build
```

This will build Gutenberg, ready to be used as a WordPress plugin!

If you don't have a local WordPress environment to load Gutenberg in, we can help get that up and running, too.

## Local Environment

### Step 1: Installing a Local Environment

The quickest way to get up and running is to use the [`wp-env` command](https://github.com/WordPress/gutenberg/tree/master/packages/env), which is developed within the Gutenberg source repository, and published as `@wordpress/env` to npm. In its default mode, it'll install and run a local WordPress environment for you; however, it's also possible to [configure](https://github.com/WordPress/gutenberg/blob/master/packages/env/README.md#wp-envjson) it to use a pre-existing local WordPress installation.

If you don't already have it, you'll need to install Docker and Docker Compose in order to use `wp-env`.

To install Docker, follow their instructions here for [Windows 10 Pro](https://docs.docker.com/docker-for-windows/install/), [all other version of Windows](https://docs.docker.com/toolbox/toolbox_install_windows/), [macOS](https://docs.docker.com/docker-for-mac/install/), or [Linux](https://docs.docker.com/v17.12/install/linux/docker-ce/ubuntu/#install-using-the-convenience-script). If running Ubuntu, see these [extended instructions for help and troubleshooting](/docs/contributors/env-ubuntu.md).

To install Docker Compose, [follow their instructions here](https://docs.docker.com/compose/install/), be sure to select your operating system for proper instructions.

Once Docker is installed and running, run this script to install WordPress, and build your local environment:

```bash
npx wp-env start
```

### Step 2: Accessing and Configuring the Local WordPress Install

#### Accessing the Local WordPress Install

The WordPress installation should now be available at `http://localhost:8888` (**Username**: `admin`, **Password**: `password`).
If this port is in use, you can override it using the `WP_ENV_PORT` environment variable. For more information, consult the `wp-env` [README](https://github.com/WordPress/gutenberg/blob/master/packages/env/README.md).

To shut down this local WordPress instance run `npx wp-env stop`. To start it back up again, run `npx wp-env start` again.

#### Toggling Debug Systems

WordPress comes with specific [debug systems](https://wordpress.org/support/article/debugging-in-wordpress/) designed to simplify the process as well as standardize code across core, plugins and themes. In order to use with `wp-env,` you'll have to edit your local WordPress install's `wp-config.php`.

#### Troubleshooting

See the [relevant section in `wp-env` docs](https://github.com/WordPress/gutenberg/tree/master/packages/env#troubleshooting-common-problems).

## On A Remote Server

Open a terminal (or if on Windows, a command prompt) and navigate to the repository you cloned. Now type `npm install` to get the dependencies all set up. Once that finishes, you can type `npm run build`. You can now upload the entire repository to your `wp-content/plugins` directory on your web server and activate the plugin from the WordPress admin.

You can also type `npm run package-plugin` which will run the two commands above and create a zip file automatically for you which you can use to install Gutenberg through the WordPress admin.

[npm]: https://www.npmjs.com/
[nvm]: https://github.com/creationix/nvm

## Storybook

> Storybook is an open source tool for developing UI components in isolation for React, React Native and more. It makes building stunning UIs organized and efficient.

The Gutenberg repository also includes [Storybook] integration that allows testing and developing in a WordPress-agnostic context. This is very helpful for developing reusable components and trying generic JavaScript modules without any backend dependency.

You can launch Storybook by running `npm run storybook:dev` locally. It will open in your browser automatically.

You can also test Storybook for the current `master` branch on GitHub Pages: [https://wordpress.github.io/gutenberg/](https://wordpress.github.io/gutenberg/)

[Storybook]: https://storybook.js.org/

## Developer Tools

We recommend configuring your editor to automatically check for syntax and lint errors. This will help you save time as you develop by automatically fixing minor formatting issues. Here are some directions for setting up Visual Studio Code, a popular editor used by many of the core developers, these tools are also available for other editors.

### EditorConfig

[EditorConfig](https://editorconfig.org/) defines a standard configuration for setting up your editor, for example using tabs instead of spaces. You should install the [EditorConfig for VS Code](https://marketplace.visualstudio.com/items?itemName=editorconfig.editorconfig) extension and it will automatically configure your editor to match the rules defined in [.editorconfig](https://github.com/WordPress/gutenberg/blob/master/.editorconfig).

### ESLint

[ESLint](https://eslint.org/) statically analyzes the code to find problems. The lint rules are integrated in the continuous integration process and must pass to be able to commit. You should install the [ESLint Extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) for Visual Studio Code, see eslint docs for [more editor integrations](https://eslint.org/docs/user-guide/integrations).

With the extension installed, ESLint will use the [.eslintrc.js](https://github.com/WordPress/gutenberg/blob/master/.eslintrc.js) file in the root of the Gutenberg repository for formatting rules. It will highlight issues as you develop, you can also set the following preference to fix lint rules on save.

```json
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
    },
```

### Prettier

[Prettier](https://prettier.io/) is a tool that allows you to define an opinionated format, and automate fixing the code to match that format. Prettier and ESlint are similar, Prettier is more about formatting and style, while ESlint is for detecting coding errors.

To use Prettier with Visual Studio Code, you should install the [Prettier - Code formatter extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode). You can then configure it to be the default formatter and to automatically fix issues on save, by adding the following to your settings.

```json
"[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
},
```

This will use the `.prettierrc.js` file included in the root of the Gutenberg repository.

If you only want to use this configuration with the Gutenberg project, create a directory called .vscode at the top-level of Gutenberg, and place your settings in a settings.json there. Visual Studio Code refers to this as Workplace Settings, and only apply to the project.

For other editors, see [Prettier's Editor Integration docs](https://prettier.io/docs/en/editors.html)

### TypeScript

**TypeScript** is a typed superset of JavaScript language. The Gutenberg project uses TypeScript via JSDoc to [type check JavaScript files](https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html). If you use Visual Studio Code, TypeScript support is built-in, otherwise see [TypeScript Editor Support](https://github.com/Microsoft/TypeScript/wiki/TypeScript-Editor-Support) for editor integrations.
