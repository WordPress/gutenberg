# Development Environment

This guide is for setting up your local environment for JavaScript development for creating plugins and tools to extend WordPress and the block editor. If you are looking to contribute to Gutenberg project itself, see additional documentation in the [Getting Started guide](/docs/contributors/code/getting-started-with-code-contribution.md).

A development environment is a catch-all term for what you need setup on your computer to work. The three main pieces needed for our development environment are:

1. Node/NPM Development Tools
2. WordPress Development Site
3. Code Editor

## Quick Start

Here is a summary of the guide. See each section for additional details and explanations.

**1. Install Node development tools**

Download and install [Node Version Manager](https://github.com/nvm-sh/nvm) (nvm)

```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
```

Quit and restart terminal
Install Node.js v14.

```
nvm install 14
```

**2. WordPress Development Site**

First download, install, and start [Docker Desktop](https://www.docker.com/products/docker-desktop) following the instructions for your OS.

-   Install WordPress environment tool

```
npm -g install @wordpress/env
```

Start the environment from an existing plugin or theme directory, or a new working directory:

```
wp-env start
```

You will have a full WordPress site installed, navigate to: http://localhost:8888/ using your browser, log in to the WordPress dashboard at http://localhost:8888/wp-admin/ using Username "admin" and Password "password", without the quotes.

**3. Code Editor**

You can use any text editor to write code. For example, [Visual Studio Code](https://code.visualstudio.com/) is a popular open-source editor. You can follow instructions on their site to install it for your OS.

## Node Development Tools

The tools needed for development are **Node** and **NPM**. **Nodejs** is a runtime environment that allows running JavaScript outside of the browser. NPM is the Node Package Manager, it is used for installing dependencies and running scripts. The script `npx` is also installed with Nodejs—this script is used to run packages not yet installed—we will use `npx` to bootstrap a block.

The tools are used to convert the JavaScript we are going to write into a format that browsers can run. This is called transpiling or the build step.

For Mac and Linux, it is recommended to use the [Node Version Manager](https://github.com/nvm-sh/nvm) (nvm). Using `nvm` to install node allows installing specific versions, plus installs locally in your home directory and avoids any global permission issues.

For Windows, or alternative installs, you can [download a Nodejs installer](https://nodejs.org/en/download/) directly from the main Node.js website, v14 is recommended. Installers are available for Windows and Mac, and binaries available for Linux. See Node.js site for additional installation methods.

Here are the quick instructions to install using nvm, see the [full installation instructions](https://github.com/nvm-sh/nvm#installing-and-updating) for additional details.

Run the following on the command-line to install nvm:

```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
```

Note: On macOS, the required developer tools are not installed by default, if not already installed you may be prompted to download the install.

<img src="https://developer.wordpress.org/files/2020/07/git-install-prompt.png" alt="Mac git command requies command line developer tools" width="400" height="195"/>

After installing nvm, you need to use it to install Node.js, to install v14, run:

```sh
nvm install 14
```

If there is an error running the above command, for example a common error that occurs is:

```sh
$ nvm install 14
zsh: command not found: nvm
```

First, try quitting and restarting your terminal to pick up the installed config.

If restarting did not resolve the problem, you might need to create the default profile file.

On macOS Catalina, the default shell is zsh, to create the profile file type `touch ~/.zshrc` on the command-line. It is fine to run if the file already exists. Note, `~/` is a shortcut to your home directory. For Ubuntu, including WSL, the default profile is bash, use `touch ~/.bashrc` to create.

After creating the profile file, re-run the install command:

```sh
nvm install 14
```

The important part after installing is being able to use them in your terminal. Open a terminal command-line and type `node -v` and `npm -v` to confirm they are installed.

```sh
> node -v
v14.18.1

> npm -v
6.14.15
```

Your versions may not match exactly, that is fine. The minimum version for Node.js is >= 12 and for npm >= 6.9, using v14 will be supported until upgrade is required.

## WordPress Development Site

There are several ways to run WordPress locally on your own computer, or you could even develop on a cloud hosted computer, though this may be slower.

The WordPress [wp-env package](https://www.npmjs.com/package/@wordpress/env) lets you set up a local WordPress environment for building and testing plugins and themes, without any additional configuration.

The `wp-env` tool uses Docker to create a virtual machine that runs the WordPress site. There are instructions available for installing Docker on [Windows 10 Pro](https://docs.docker.com/docker-for-windows/install/), [other versions of Windows 10](https://docs.docker.com/docker-for-windows/wsl/), [macOS](https://docs.docker.com/docker-for-mac/install/), and [Linux](https://docs.docker.com/v17.12/install/linux/docker-ce/ubuntu/#install-using-the-convenience-script). If using Ubuntu, see our additional notes for [help installing Docker on Ubuntu](/docs/getting-started/devenv/docker-ubuntu.md).

After you have installed Docker, go ahead and install the `wp-env` tool. This command will install the tool globally, which means you can run it from any directory:

```sh
npm -g install @wordpress/env
```

To confirm it is installed and available, run:

```sh
wp-env --version
> 1.6.0
```

The `wp-env` script is used to create a Docker WordPress environment. You can use this script to start an environment with your plugin activated by running it from the directory containing your plugin. For example if you are following the create block tutorial, this would be in the generated directory like so:

```sh
npx @wordpress/create-block starter-block
cd starter-block
wp-env start
```

You can access your environment in your browser at: [http://localhost:8888/](http://localhost:8888/), the default username is `admin` and default password is `password`. For more information controlling the Docker environment see the [@wordpress/env package readme](/packages/env/README.md).

When using the script while developing a single plugin, `wp-env start` can mount and activate the plugin automatically when run from the directory containing the plugin. Note: This also works for themes when run from the directory in which you are developing the theme.

If you run `wp-env start` from a directory that is not a plugin or theme, a generic WordPress environment will be created. The script will display the following warning, it is fine if this is your intention.

```
!! Warning: could not find a .wp-env.json configuration file and could not determine if 'DIR' is a WordPress installation, a plugin, or a theme.
```

You can use the `.wp-env.json` configuration file to create an environment that works with multiple plugins and/or themes. See the [@wordpress/env package for additional details](/packages/env/README.md#wp-envjson).

#### Troubleshooting

A common issue when running `wp-env` is `Error while running docker-compose command.`

-   Check that Docker Desktop is started and running.
-   Check Docker Desktop dashboard for logs, restart, or remove existing VMs.

If you see the error: `Host is already in use by another container`

-   The container is already running, or another one is. You can stop an existing container running use `wp-env stop` from the directory you started it.
- If you do not remember the directory you started wp-env in, you can stop all containers with `docker stop $(docker ps -q)`. Please note, this will stop all containers, use caution with this command.

### Alternative to Docker

Docker is just one method to run a local WordPress environment. Block development and extending WordPress is done using normal plugins, so any WordPress environment can be used. Here are some alternatives that you can consider which do not require installing Docker.

-   [Local](https://localwp.com/) - Local is a single application you download and install. You will need to know where the plugin directory is located after install. If you create a site called `mywp` typically the plugin directory is installed at `~\Local Sites\mywp\app\public\wp-content\plugins`

-   [WampServer](http://www.wampserver.com/en/) or [MAMP](https://www.mamp.info/) environments, both are quite similar to Local, combining a web server, PHP, and database. However these tools are not WordPress specific, so if you are not already using them, Local might be an easier option.

-   Remote server - you can work on a remote server, most hosts provide a quick WordPress setup. However, this will require additional time thorughout development syncing to the server, or working directly on the remote server.

The important part is having a WordPress site installed, and know where and how to update files in the plugins directory.

## Code Editor

[Visual Studio Code](https://code.visualstudio.com/) is a popular code editor for JavaScript development. It works quite well across the three major platforms (Windows, Linux, and Mac), it is open-source and actively maintained by Microsoft. Plus Visual Studio Code has a vibrant community providing plugins and extensions; it is becoming the defacto standard for web development.

Alternative editors include [Sublime Text](https://www.sublimetext.com/) that is also available across platforms, though is a commercial product; or other free alternatives include [Vim](https://www.vim.org/), [Atom](https://atom.io/), and [Notepad++](https://notepad-plus-plus.org/) all support standard JavaScript style development.

You can use any editor you're comfortable with, it is more a personal preference. The development setup for WordPress block editor is a common JavaScript environment and most editors have plugins and support. The key is having a way to open, edit, and save text files.

## Uninstall - Start Over

Here are a few instructions if you need to start over, or want to remove what was installed.

### Local Environment

-   If you just want to reset and clean the WordPress database:

```
wp-env clean all
```

-   To remove the local environment completely for a specific project:

```
wp-env destroy
```

-   To completely uninstall wp-env tool:

```
npm -g uninstall @wordpress/env
```

-   To uninstall Docker, or Visual Studio Code use your OS method to remove packages. For example, on Windows run "Add or remove programs". You can additionally uninstall from the Docker Desktop app, click the bug icon at the top to switch to this Troubleshoot screen. Click Uninstall or remove.

![Docker Troubleshoot Screenshot](https://developer.wordpress.org/files/2020/08/docker-uninstall-screen.png)

### Uninstall Node/NVM

To uninstall Node/NVM, delete the NVM directory, this is typically installed at `$HOME/.nvm`, delete using

```
rm -rf "$HOME/.nvm"
```

If this does not work and the `$NVM_DIR` environment variable is set you can remove using `rm -rf "$NVM_DIR"`

To clean up any installed JavaScript packages remove the global `.npm` directory at `$HOME/.npm`,

```
rm -rf "$HOME/.npm"
```

Just as you confirmed the installation worked, you can confirm the uninstall worked. First quit and restart terminal and then try to run `npm -v`, `node -v`, and `nvm -v` you should then see a "command not found" error in the terminal.
