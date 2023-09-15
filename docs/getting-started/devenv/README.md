# Block Development Environment

This guide will help you set up a local environment for JavaScript development, which can be used to create blocks and other plugins that extend and modify the Block Editor in WordPress.

To contribute to the Gutenberg project itself, refer to the additional documentation in the code contribution [Getting Started](/docs/contributors/code/getting-started-with-code-contribution.md) guide.

A development environment includes the tools you need on your computer to successfully develop for the Block Editor. The three essential components are:

1.  Code editor
2.  Node.js development tools
3.  Local WordPress environment (site)

## Choosing a code editor

A code editor is used to write code, and you can use whichever editor you're most comfortable with. The key is having a way to open, edit, and save text files.

If you do not already have a preferred code editor, [Visual Studio Code](https://code.visualstudio.com/) (VS Code) is a popular choice for JavaScript development among Core contributors. It works well across the three major platforms (Windows, Linux, and Mac) and is open-source and actively maintained by Microsoft. VS Code also has a vibrant community providing plugins and extensions, including many for WordPress development.

## Installing Node.js development tools

Node.js (`node`) is an open-source runtime environment that allows you to execute JavaScript outside of the web browser. While Node.js is not required for all WordPress JavaScript development, it's essential when working with modern JavaScript tools and developing for the Block Editor.

Node.js and its accompanying developer tools allow you to:

-   Install and run WordPress packages needed for Block Editor development, such as `wp-scripts`
-   Setup local WordPress environments with `wp-env` and `wp-now`
-   Use the latest ECMAScript features and write code in ESNext
-   Lint, format, and test JavaScript code
-   Scaffold custom blocks with the `create-block` package

The list goes on. While modern JavaScript development can be challenging, WordPress provides several tools, like [`wp-scripts`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-scripts/) and [`create-block`](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-create-block/), that streamline the process, all made possible by Node.js developer tools.

If you are already familiar with `node`, it's recommended that you use the [LTS](https://nodejs.dev/en/about/releases/) (Long Term Support) version, and you will also need Node Package Manager (`npm`), the `npx` script, and Node Version Manager (`nvm`).

To install Node.js developer tools and learn more about each, refer to the links below.

-   [Install Node.js for Mac and Linux](/docs/getting-started/devenv/nodejs-development-tools.md#mac-and-linux-installations)
-   [Install Node.js for Windows](/docs/getting-started/devenv/nodejs-development-tools.md#windows-or-alternative-installs)

## Setting up a local WordPress environment

A local WordPress environment (site) provides a controlled, efficient, and secure space for development, allowing you to build and test your code before deploying it to a production site. The [same requirements](https://en-gb.wordpress.org/about/requirements/) for WordPress apply to local sites.

Many tools are available for setting up a local WordPress environment on your computer. The Block Editor Handbook covers `wp-env` and `wp-now`, both of which are open-source and maintained by the WordPress project itself. 

Refer to the individual guides below for setup instructions.

-   [Get started with `wp-env`](/docs/getting-started/devenv/get-started-with-wp-env.md)
-   [Get started with `wp-now`](/docs/getting-started/devenv/get-started-with-wp-now.md)

Of the two, `wp-env` is the more robust and complete solution. It's also the recommended tool for Gutenberg development. On the other hand, `wp-now` offers a simplified setup and does not require Docker. Both are valid approaches, so the choice is yours.
