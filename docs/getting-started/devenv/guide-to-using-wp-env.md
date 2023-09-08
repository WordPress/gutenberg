# Guide to using wp-env

There are several ways to run WordPress locally on your own computer, or you could even develop on a cloud hosted computer, though this may be slower.

The WordPress [wp-env package](https://www.npmjs.com/package/@wordpress/env) lets you set up a local WordPress environment for building and testing plugins and themes, without any additional configuration.

## Quick start

1. Download, install, and start [Docker Desktop](https://www.docker.com/products/docker-desktop) following the instructions for your operating system.
2. Run `npm -g install @wordpress/env` in the terminal to install `wp-env`.
3. In the terminal, navigate to an existing plugin or theme directory, or a new working directory.
4. Run `wp-env start` in the terminal to start the WordPress environment.
5. Navigating to `http://localhost:8888/wp-admin/` and log into the WordPress dashboard using username `admin` and password `password`.

## Installing Docker

The `wp-env` tool uses Docker to create a virtual machine that runs the WordPress site. There are instructions available for installing Docker on [Windows 10 Pro](https://docs.docker.com/docker-for-windows/install/), [other versions of Windows 10](https://docs.docker.com/docker-for-windows/wsl/), [macOS](https://docs.docker.com/docker-for-mac/install/), and [Linux](https://docs.docker.com/v17.12/install/linux/docker-ce/ubuntu/#install-using-the-convenience-script). If using Ubuntu, see our additional notes for [help installing Docker on Ubuntu](/docs/getting-started/devenv/docker-ubuntu.md).

## Installing `wp-env`

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

### Troubleshooting

A common issue when running `wp-env` is `Error while running docker-compose command.`

-   Check that Docker Desktop is started and running.
-   Check Docker Desktop dashboard for logs, restart, or remove existing VMs.

If you see the error: `Host is already in use by another container`

-   The container is already running, or another one is. You can stop an existing container running use `wp-env stop` from the directory you started it.
-   If you do not remember the directory you started wp-env in, you can stop all containers with `docker stop $(docker ps -q)`. Please note, this will stop all containers, use caution with this command.


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


