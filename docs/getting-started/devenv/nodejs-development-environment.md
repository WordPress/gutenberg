# Node.js development environment

When developing for the Block Editor, you will need [Node.js](https://nodejs.org/en) development tools along with a code editor and a local WordPress environment (see [Block Development Environment](/docs/getting-started/devenv/README.md)). Node.js (`node`) is an open-source runtime environment that allows you to execute JavaScript code from the terminal (also known as a command-line interface, CLI, or shell)

Installing `node` will automatically include the Node Package Manager (`npm`) and the Node Package eXecute (`npx`), two tools you will frequently use in block and plugin development.

Node Package Manager ([`npm`](https://docs.npmjs.com/cli/v10/commands/npm)) serves multiple purposes, including dependency management and script execution. It's the recommended package manager and is extensively featured in all documentation.

The Node Package eXecute ([`npx`](https://docs.npmjs.com/cli/v10/commands/npx)) tool is used to run commands from packages without installing them globally and is commonly used when scaffolding blocks with the [`create-block`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-create-block/) package.


## Node.js installation on Mac and Linux (with `nvm`)

It's recommended that you use [Node Version Manager](https://github.com/nvm-sh/nvm) (`nvm`) to install Node.js. This allows you to install and manage specific versions of `node`, which are installed locally in your home directory, avoiding any global permission issues.

Here are the quick instructions for installing `node` using `nvm` and setting the recommended Node.js version for block development. See the [complete installation guide](https://github.com/nvm-sh/nvm#installing-and-updating) for more details.

1. Open the terminal and run the following to install `nvm`. On macOS, the required developer tools are not installed by default. Install them if prompted.

```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
```

2. Quit and restart the terminal.
3. Run `nvm install --lts` in the terminal to install the latest [LTS](https://nodejs.org/en/about/previous-releases) (Long Term Support) version of Node.js.
4. Run `node -v` and `npm -v` in the terminal to verify the installed `node` and `npm` versions.

If needed, you can also install specific versions of `node`. For example, install version 18 by running `nvm install 18`, and switch between different versions by running `nvm use [version-number]`. See the `nvm` [usage guide](https://github.com/nvm-sh/nvm#usage) for more details.

Some projects, like Gutenberg, include an [`.nvmrc`](https://github.com/WordPress/gutenberg/blob/trunk/.nvmrc) file which specifies the version of `node` that should be used. In this case, running `nvm use` will automatically select the correct version. If the version is not yet installed, you will get an error that tells you what version needs to be added. Run `nvm install [version-number]` followed by `nvm use`.

## Node.js installation on Windows and others

You can [download a Node.js installer](https://nodejs.org/en/download/) directly from the main Node.js website. The latest version is recommended. Installers are available for Windows and Mac, and binaries are available for Linux. 

Microsoft also provides a [detailed guide](https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-windows#install-nvm-windows-nodejs-and-npm) on how to install `nvm` and Node.js on Windows and WSL.

## Troubleshooting

If you encounter the error `zsh: command not found: nvm` when attempting to install `node`, you might need to create the default profile file. 

The default shell is `zsh` on macOS, so create the profile file by running `touch ~/.zshrc` in the terminal. It's fine to run if the file already exists. The default profile is `bash` for Ubuntu, including WSL, so use `touch ~/.bashrc` instead. Then repeat steps 2-4.

The latest `node` version should work for most development projects, but be aware that some packages and tools have specific requirements. If you encounter issues, you might need to install and use a previous `node` version. Also, make sure to check if the project has an `.nvmrc` and use the `node` version indicated.

## Additional resources

-   [Node.js](https://nodejs.org/en) (Official documentation)
-   [Node Version Manager](https://github.com/nvm-sh/nvm) (Official documentation)
-   [Installing Node.js and npm for local WordPress development](https://learn.wordpress.org/tutorial/installing-node-js-and-npm-for-local-wordpress-development/) (Learn WordPress tutorial)