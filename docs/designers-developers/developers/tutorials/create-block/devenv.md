
# Create Block: Developer Environment

The three main pieces needed for the development environment are:

1. Node/NPM Development Tools
2. WordPress Development Site
3. Code Editor

## Development Tools

The tools needed for development are **Node** and **NPM**. **Nodejs** is a runtime environment that allows running JavaScript outside of the browser. NPM is the Node Package Manager, it is used for installing dependencies and running scripts. The script `npx` is installed with `npm` and is used to run packages not yet installed, we will use this to bootstrap a block.

The tools are used to take the JavaScript we are going to write, which is in a syntax that the browser can not run, and transpile it into a syntax it can. This is called the build step.

You can [download Nodejs](https://nodejs.org/) directly from the main website and install. It also packaged for most package managers.

On Mac, I recommend using [Homebrew package tool](https://brew.sh/) and install is: `brew install node`js

On Windows, you can use Chocolatey package manager and install using: `choco install nodejs`

NPM usually comes bundled with the above installs. On Ubuntu, or Debian, NPM is bundled separately and you can install using: `apt install nodejs npm`

However you install Nodejs, the important part is being able to use them in your terminal. Open a terminal command-line and be able to run `node -v` and `npm -v` to confirm they are installed.


## WordPress Development Site

There are several ways to run WordPress locally on your own computer, or you could even develop on a cloud hosted computer, though this may be slower.

The WordPress [wp-env package](https://www.npmjs.com/package/@wordpress/env) lets you set up a local WordPress environment for building and testing plugins and themes, without any additional configuration.

The `wp-env` package requires Docker to be installed. There are instructions available for installing Docker on [Windows 10 Pro](https://docs.docker.com/docker-for-windows/install/), [all other versions of Windows](https://docs.docker.com/toolbox/toolbox_install_windows/), [macOS](https://docs.docker.com/docker-for-mac/install/), and [Linux](https://docs.docker.com/v17.12/install/linux/docker-ce/ubuntu/#install-using-the-convenience-script).


After confirming that the prerequisites are installed, you can install wp-env globally from the command-line running:

```bash
npm -g install @wordpress/env
```

### Alternatives

If you are just starting out, using [Local by Flywheel](https://localbyflywheel.com/) might be easier, since it does not require the additional Docker install and setup. Local is a single application you download and install and tends to be much simpler than alternatives. You will need to know where the plugin directory is installed. If you create a site called `mywp` typically the plugin directory is installed at `~\Local Sites\mywp\app\public\wp-content\plugins`

You can use [WampServer](http://www.wampserver.com/en/) or
[MAMP](https://www.mamp.info/) environments, both are quite similar to
Local, combining a web server, PHP, and database. However these tools
are not WordPress specific, so if you are not already using them, you might as
well use Local.

You can also work remotely on a server, this might be easy to setup the server since most hosts have a WordPress already installed. However, this may require development time since it may require syncing files, or editing the directly on the server.

The important part is having a WordPress site installed, and know where and how to update files in the plugins directory.

## Code Editor

[Visual Studio Code](https://code.visualstudio.com/) is a popular code editor for JavaScript development. It works quite well, open-source, actively maintained by Microsoft, and a vibrant community providing plugins and extensions; it is becoming the defacto standard for web development.

You can use any editor you're comfortable with, it is more a personal preference. The development setup for WordPress block editor is a common JavaScript environment and most editors have plugins and suppport. The key is having a way to open, edit, and save text files.
