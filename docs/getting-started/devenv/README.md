# Development Environment

This guide is for setting up your local environment for JavaScript development for creating plugins and tools to extend WordPress and the Block Editor. 

If you are looking to contribute to Gutenberg project itself, see additional documentation in the code contribution [Getting Started](/docs/contributors/code/getting-started-with-code-contribution.md) guide.

A development environment is a catch-all term for what you need setup on your computer to work. The three main pieces needed for our development environment are:

1. Node/NPM Development Tools
2. Code Editor
3. WordPress Development Site

## Install Node.js development tools

[Node.js](https://nodejs.org/en) (`node`) is a runtime environment that allows you to run JavaScript outside of the browser. Node Package Manager (`npm`) is used for installing dependencies and running scripts. You will need both installed on your machine. 

The tools are used to convert the JavaScript we are going to write into a format that browsers can run. This is called transpiling or the build step.

Note that the script `npx` will be automattically installed with `node`. This script is used to run packages not yet installed, and is commonly used when scaffolding blocks with the `create-block` package.

### Mac and Linux

For Mac and Linux, it's recommended to use [Node Version Manager](https://github.com/nvm-sh/nvm) (`nvm`). This allows you to install specific versions of `node`, which are installed locally in your home directory avoiding any global permission issues.

Here are the quick instructions to install using nvm, see the [full installation instructions](https://github.com/nvm-sh/nvm#installing-and-updating) for additional details.

1. Open the terminal and run the following to install `nvm`. On macOS, the required developer tools are not installed by default. Install them if prompted.

```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
```

2. Quit and restart the terminal.
3. Run `nvm install 18` in the terminal to install `node` v18.
4. Run `node -v` and `npm -v` in the terminal to confirm `node` v18+ and `npm` v9+ are installed.
5. (Optional) If needed, you can install additional versions of `node` on your machine. Switch between them by running `nvm use [version-number]`.

If you encounter the error `zsh: command not found: nvm` when attempting to install `node`, you might need to create the default profile file. 

The default shell is `zsh` on macOS, so create the profile file by running `touch ~/.zshrc` in the terminal. It's fine to run if the file already exists. For Ubuntu, including WSL, the default profile is `bash`, so use `touch ~/.bashrc` instead. Then repeat steps 2-4.

### Windows or alternative installs

You can [download a Node.js installer](https://nodejs.org/en/download/) directly from the main Node.js website, v18 is recommended. Installers are available for Windows and Mac, and binaries available for Linux.

## Choose a code editor

You can generally use any code editor you're most comfortable with. The key is having a way to open, edit, and save text files.

If you do not already have a preferred code editor, [Visual Studio Code](https://code.visualstudio.com/) (VS Code) is a popular choice for JavaScript development among Core contributors. It works well across the three major platforms (Windows, Linux, and Mac) and is open-source and actively maintained by Microsoft. VS Code also has a vibrant community providing plugins and extensions, including many for WordPress development. 

## Set up a local WordPress environment

There are many tools available for setting up a local WordPress environment. The Block Editor Handbook covers `wp-env` and `wp-now`, both of which are open-source and maintained by the WordPress project itself. 

[Need a brief explanation on the differences between the two]

Refer to the individual guides below for set up instuctions.

-   Guide to using `wp-env`
-   Guide to using `wp-now`
