# Development Environment

This guide will help you set up a local environment for JavaScript development, which can be used to create blocks and other plugins that extend and modify the Block Editor in WordPress.

To contribute to the Gutenberg project itself, refer to the additional documentation in the code contribution [Getting Started](/docs/contributors/code/getting-started-with-code-contribution.md) guide.

A development environment includes the tools you need on your computer to successfully develop for the Block Editor. The three essential components are:

1.  Code editor
2.  Node.js development tools
3.  Local WordPress environment (site)

## Choose a code editor

Use any code editor that you're most comfortable with. The key is having a way to open, edit, and save text files.

If you do not already have a preferred code editor, [Visual Studio Code](https://code.visualstudio.com/) (VS Code) is a popular choice for JavaScript development among Core contributors. It works well across the three major platforms (Windows, Linux, and Mac) and is open-source and actively maintained by Microsoft. VS Code also has a vibrant community providing plugins and extensions, including many for WordPress development.

## Install Node.js development tools

[Node.js](https://nodejs.org/en) (`node`) is a runtime environment that allows you to run JavaScript outside of the browser. Node Package Manager (`npm`) is used for installing dependencies and running scripts. You will need both installed on your computer. 

These tools are used to convert the JavaScript you will write into a format browsers can run. This is called transpiling or the build step.

Note that the script `npx` will be automatically installed with `node`. This script is used to run packages not yet installed and is commonly used when scaffolding blocks with the [`create-block`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-create-block/) package.

### Mac and Linux

For Mac and Linux, it's recommended to use [Node Version Manager](https://github.com/nvm-sh/nvm) (`nvm`). This allows you to install specific versions of `node`, which are installed locally in your home directory, avoiding any global permission issues.

Here are the quick instructions for installing `node` using `nvm`. See the [complete installation guide](https://github.com/nvm-sh/nvm#installing-and-updating) for more details.

1. Open the terminal and run the following to install `nvm`. On macOS, the required developer tools are not installed by default. Install them if prompted.

```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
```

2. Quit and restart the terminal.
3. Run `nvm install node` in the terminal to install the latest `node` version.
4. Run `node -v` and `npm -v` in the terminal to verify the installed `node` and `npm` versions.

If needed, you can also install specific versions of `node`. For example, install v18 by running `nvm install 18`, and switch between different versions by running `nvm use [version-number]`. See the `nvm` [usage guide](https://github.com/nvm-sh/nvm#usage) for more details.

### Windows or alternative installs

You can [download a Node.js installer](https://nodejs.org/en/download/) directly from the main Node.js website. The latest version is recommended. Installers are available for Windows and Mac, and binaries are available for Linux.

### Troubleshooting

If you encounter the error `zsh: command not found: nvm` when attempting to install `node`, you might need to create the default profile file. 

The default shell is `zsh` on macOS, so create the profile file by running `touch ~/.zshrc` in the terminal. It's fine to run if the file already exists. The default profile is `bash` for Ubuntu, including WSL, so use `touch ~/.bashrc` instead. Then repeat steps 2-4.

The latest `node` version should work for most development projects, but be aware that some packages and tools have specific requirements. If you encounter issues, you might need to install and use a previous `node` version.

## Set up a local WordPress environment

Many tools are available for setting up a local WordPress environment (site) on your computer. The Block Editor Handbook covers `wp-env` and `wp-now`, both of which are open-source and maintained by the WordPress project itself. 

Refer to the individual guides below for setup instuctions.

-   [Guide to using `wp-env`](/docs/getting-started/devenv/guide-to-using-wp-env.md)
-   [Guide to using `wp-now`](/docs/getting-started/devenv/guide-to-using-wp-now.md)

Of the two, `wp-env` is the more robust and complete solution. It's also the recommended tool for Gutenberg development. On the other hand, `wp-now` offers a simplified setup and does not require Docker. Both are valid approaches, so the choice is yours.

## Additional resources

-   [Node.js](https://nodejs.org/en) (Official documentation)
-   [Node Version Manager](https://github.com/nvm-sh/nvm) (Official documentation)
-   [Installing Node.js and npm for local WordPress development](https://learn.wordpress.org/tutorial/installing-node-js-and-npm-for-local-wordpress-development/) (Learn WordPress tutorial)