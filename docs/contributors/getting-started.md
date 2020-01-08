# Getting Started

Gutenberg is a Node.js-based project, built primarily in JavaScript.

The first step is to install the [latest active LTS release](https://github.com/nodejs/Release#release-schedule) of Node. The easiest way (on macOS, Linux, or Windows 10 with the Linux Subsystem) is by installing and running [nvm]. Once `nvm` is installed, you can install the correct version of Node by running `nvm install` in the Gutenberg directory.

Once you have Node installed, run these scripts from within your local Gutenberg repository:

Note: The install scripts require [Python](https://www.python.org/) to be installed and in the path of the local system.

```
npm install
npm run build
```

This will build Gutenberg, ready to be used as a WordPress plugin!

If you don't have a local WordPress environment to load Gutenberg in, we can help get that up and running, too.

## Local Environment

### Step 1: Installing a Local Environment
#### Quickest Method: Using Docker

The quickest way to get up and running is to use the provided Docker setup. If you don't already have it, you'll need to install Docker and Docker Compose.

To install Docker, follow their instructions here for [Windows 10 Pro](https://docs.docker.com/docker-for-windows/install/), [all other version of Windows](https://docs.docker.com/toolbox/toolbox_install_windows/), [macOS](https://docs.docker.com/docker-for-mac/install/), or [Linux](https://docs.docker.com/v17.12/install/linux/docker-ce/ubuntu/#install-using-the-convenience-script). If running Ubuntu, see these [extended instructions for help and troubleshooting](/docs/contributors/env-ubuntu.md).

To install Docker Compose, [follow their instructions here](https://docs.docker.com/compose/install/), be sure to select your operating system for proper instructions.

Once Docker is installed and running, run this script to install WordPress, and build your local environment:

```
npm run env install
```

#### Alternative Method: Using an Existing Local WordPress Install
WordPress will be installed in the `wordpress` directory, if you need to access WordPress core files directly, you can find them there.

If you already have WordPress checked out in a different directory, you can use that installation, instead, by running these commands:

```
export WP_DEVELOP_DIR=/path/to/wordpress-develop
npm run env connect
```

This will use WordPress' own local environment, and mount your Gutenberg directory as a volume there.

In Windows, you can set the `WP_DEVELOP_DIR` environment variable using the appropriate method for your shell:

    CMD: set WP_DEVELOP_DIR=/path/to/wordpress-develop
    PowerShell: $env:WP_DEVELOP_DIR = "/path/to/wordpress-develop"
	
### Step 2: Accessing and Configuring the Local WordPress Install
#### Accessing the Local WordPress Install

Whether you decided to use Docker or an existing local WordPress install, the WordPress installation should now be available at `http://localhost:8889` (**Username**: `admin`, **Password**: `password`).
If this port is in use, you can override it using the `LOCAL_PORT` environment variable. For example running the below command on your computer will change the URL to
`http://localhost:7777` .

Linux/macOS: `export LOCAL_PORT=7777`
Windows using Command Prompt: `setx LOCAL_PORT "7777"`
Windows using PowerShell: `$env:LOCAL_PORT = "7777"`

If you're running [e2e tests](/docs/contributors/testing-overview.md#end-to-end-testing), this change will be used correctly.

To shut down this local WordPress instance run `npm run env stop`. To start it back up again, run `npm run env start`.

#### Toggling Debug Systems

WordPress comes with specific [debug systems](https://wordpress.org/support/article/debugging-in-wordpress/) designed to simplify the process as well as standardize code across core, plugins and themes. It is possible to use environment variables (`LOCAL_WP_DEBUG` and `LOCAL_SCRIPT_DEBUG`) to update a site's configuration constants located in `wp-config.php` file. Both flags can be disabled at any time by running the following command:

Example on Linux/MacOS:
```
LOCAL_SCRIPT_DEBUG=false LOCAL_WP_DEBUG=false npm run env install
```
By default, both flags will be set to `true`.

#### Troubleshooting

You might find yourself stuck on a screen stating that "you are running WordPress without JavaScript and CSS files". If you tried installing WordPress via `npm run env install`, it probably means that something went wrong during the process. To fix it, try removing the `/wordpress` folder and running `npm run env install` again.

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

To use Prettier, you should install the [Prettier - Code formatter extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) in Visual Studio Code. You can then configure it to be the default formatter and to automatically fix issues on save, by adding the following to your settings.

```json
"[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
},
```

This will use the `.prettierrc.js` file in the root folder of the Gutenberg repository and the version of Prettier that is installed in the root `node_modules` folder. To test it out prior to PR #18048 being merged, you should:

1. git switch add/prettier
2. npm ci
3. Edit a JavaScript file and on save it will format it as defined

### TypeScript

**TypeScript** is a typed superset of JavaScript language. The Gutenberg project uses TypeScript via JSDoc to [type check JavaScript files](https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html). If you use Visual Studio Code, TypeScript support is built-in, otherwise see [TypeScript Editor Support](https://github.com/Microsoft/TypeScript/wiki/TypeScript-Editor-Support) for editor integrations.
