# Development Environment

The development environment setup guide is for setting up your local development environment for JavaScript development; creating plugins and tools for extending WordPress and the block editor.

A development environment is a catch-all term for the setup on your computer to work. The three main pieces needed for our development environment are:

1. Node/NPM Development Tools
2. WordPress Development Site
3. Code Editor

## Development Tools

The tools needed for development are **Node** and **NPM**. **Nodejs** is a runtime environment that allows running JavaScript outside of the browser. NPM is the Node Package Manager, it is used for installing dependencies and running scripts. The script `npx` is also installed with Nodejs—this script is used to run packages not yet installed—we will use `npx` to bootstrap a block.

The tools are used to convert the JavaScript we are going to write into a format that browsers can run. This is called transpiling or the build step.

For Mac and Linux, it is recommended to use the [Node Version Manager](https://github.com/nvm-sh/nvm) (nvm). Using `nvm` to install node allows installing specific versions, plus installs locally in your home directory and avoids any global permission issues.

For Windows, or alternative installs, you can [download a Nodejs installer](https://nodejs.org/en/download/) directly from the main Node.js website, the long term support (LTS) version is recommeneded. Installers are available for Windows and Mac, and binaries available for Linux. See Node.js site for additional installation methods.

Here are the quick instructions to install using nvm, see the [full installation instructions](https://github.com/nvm-sh/nvm#installing-and-updating) for additional details.

Run the following on the command-line to install nvm:

```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash
```

Note: On macOS, the required developer tools are not installed by default, if not already installed you may be prompted to download the install.

<img src="https://developer.wordpress.org/files/2020/07/git-install-prompt.png" alt="Mac git command requies command line developer tools" width="400" height="195"/>

After installing nvm, you need to use it to install node, to install the LTS version of node, run:

```sh
nvm install --lts
```

If there is an error running the above command, for example a common error that occurs is:

```sh
$ nvm install --lts
zsh: command not found: nvm
```

First, try quitting and restarting your terminal to pick up the installed config.

If restarting did not resolve the problem, you might need to create the default profile file.

On macOS Catalina, the default shell is zsh, to create the profile file type `touch ~/.zshrc` on the command-line. It is fine to run if the file already exists. Note, `~/` is a shortcut to your home directory. For Ubuntu, including WSL, the default profile is bash, use `touch ~/.bashrc` to create.

After creating the profile file, re-run the install command:

```sh
nvm install --lts
```

The important part after installing is being able to use them in your terminal. Open a terminal command-line and type `node -v` and `npm -v` to confirm they are installed.

```sh
> node -v
v12.18.0

> npm -v
6.14.4
```

Your versions may not match exactly, that is fine. The minimum version for node is >= 10.x and for npm >= 6.9x, using the current LTS version will always be supported.

## WordPress Development Site

There are several ways to run WordPress locally on your own computer, or you could even develop on a cloud hosted computer, though this may be slower.

The WordPress [wp-env package](https://www.npmjs.com/package/@wordpress/env) lets you set up a local WordPress environment for building and testing plugins and themes, without any additional configuration.

The `wp-env` package requires Docker to be installed. There are instructions available for installing Docker on [Windows 10 Pro](https://docs.docker.com/docker-for-windows/install/), [all other versions of Windows](https://docs.docker.com/toolbox/toolbox_install_windows/), [macOS](https://docs.docker.com/docker-for-mac/install/), and [Linux](https://docs.docker.com/v17.12/install/linux/docker-ce/ubuntu/#install-using-the-convenience-script).

After you have installed Docker, go ahead and install `wp-env` globally from the command-line using:

```sh
npm -g install @wordpress/env
```

To confirm it is installed and available, run:

```sh
wp-env --version
> 1.6.0
```

The `wp-env` script is used to create a Docker WordPress environment, to use start from your plugin directory—if you are following the create block tutorial, this would be in the generated directory.

```sh
wp-env start
```

You can access your environment in your browser at: [http://localhost:8888/](http://localhost:8888/), the default username is `admin` and default password is `password`. For more information controlling the Docker environment see the [@wordpress/env package readme](/packages/env/README.md).

If you are developing a single plugin, you should run `wp-env start` from that plugin working directory—it will mount and activate the plugin automatically. Note: This also works for themes, run from the directory you are developing the theme.

If you want a single environment for all your plugins/themes, you need to create a `.wp-env.json` in a working directory and add the plugins/themes to it. You then run `wp-env start` from the same directory as that config file. See the [@wordpress/env package for additional details](/packages/env/README.md#wp-envjson).

### Alternative to Docker

A block is just a plugin, so any WordPress environment can be used for development. A couple of alternatives that might be easier, since they do not require Docker install and setup.

-   [Local by Flywheel](https://localbyflywheel.com/) - Local is a single application you download and install. You will need to know where the plugin directory is located after install. If you create a site called `mywp` typically the plugin directory is installed at `~\Local Sites\mywp\app\public\wp-content\plugins`

-   [WampServer](http://www.wampserver.com/en/) or [MAMP](https://www.mamp.info/) environments, both are quite similar to Local, combining a web server, PHP, and database. However these tools are not WordPress specific, so if you are not already using them, Local might be an easier option

-   Remote server - you could work on remote server that is easy to setup, since most hosts have a standard WordPress install. However, this may require additonal development time to sync to the server.

The important part is having a WordPress site installed, and know where and how to update files in the plugins directory.

## Code Editor

[Visual Studio Code](https://code.visualstudio.com/) is a popular code editor for JavaScript development. It works quite well across the three major platforms (Windows, Linux, and Mac), it is open-source and actively maintained by Microsoft. Plus Visual Studio Code has a vibrant community providing plugins and extensions; it is becoming the defacto standard for web development.

Alternative editors include [Sublime Text](https://www.sublimetext.com/) that is also available across platforms, though is a commercial product; or other free alternatives include [Vim](https://www.vim.org/), [Atom](https://atom.io/), and [Notepad++](https://notepad-plus-plus.org/) all support standard JavaScript style development.

You can use any editor you're comfortable with, it is more a personal preference. The development setup for WordPress block editor is a common JavaScript environment and most editors have plugins and suppport. The key is having a way to open, edit, and save text files.
