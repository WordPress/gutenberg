# Get started with wp-env

The [@wordpress/env](https://www.npmjs.com/package/@wordpress/env) package (`wp-env`) lets you set up a local WordPress environment (site) for building and testing plugins and themes, without any additional configuration.

Before following this guide, install [Node.js development tools](/docs/getting-started/devenv#node-js-development-tools) if you have not already done so.

![wp-env basics diagram](https://developer.wordpress.org/files/2023/10/wp-env-diagram.png)

## Quick start
 
1. Download, install, and start [Docker Desktop](https://www.docker.com/products/docker-desktop) following the instructions for your operating system.
2. Run `npm -g install @wordpress/env` in the terminal to install `wp-env` globally.
3. In the terminal, navigate to an existing plugin directory, theme directory, or a new working directory.
4. Run `wp-env start` in the terminal to start the local WordPress environment.
5. After the script runs, navigate to <code>http://localhost:8888/wp-admin</code> and log into the WordPress dashboard using username `admin` and password `password`.

## Set up Docker Desktop

The `wp-env` tool uses [Docker](https://www.docker.com/) to create a virtual machine that runs the local WordPress site. The Docker Desktop application is free for small businesses, personal use, education, and non-commercial open-source projects. See their [FAQ](https://docs.docker.com/desktop/faqs/general/#do-i-need-to-pay-to-use-docker-desktop) for more information.

Use the links below to download and install Docker Desktop for your operating system.

- [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
- [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
- [Docker Desktop for Linux](https://docs.docker.com/desktop/install/linux-install/)

If you are using a version of Ubuntu prior to 20.04.1, see the additional [troubleshooting notes](#ubuntu-docker-setup) below.

After successful installation, start the Docker Desktop application and follow the prompts to get set up. You should generally use the recommended (default) settings, and creating a Docker account is optional.

## Install and run `wp-env`

The `wp-env` tool is used to create a local WordPress environment with Docker. So, after you have set up Docker Desktop, open the terminal and install the `wp-env` by running the command:

```sh
npm -g install @wordpress/env
```

This will install the `wp-env` globally, allowing the tool to be run from any directory. To confirm it's installed and available, run `wp-env --version`, and the version number should appear. 

Next, navigate to an existing plugin directory, theme directory, or a new working directory in the terminal and run:

```sh
wp-env start
```

Once the script completes, you can access the local environment at: <code>http://localhost:8888</code>. Log into the WordPress dashboard using username `admin` and password `password`.

<div class="callout callout-tip">
    Some projects, like Gutenberg, include their own specific <code>wp-env</code> configurations, and the documentation might prompt you to run <code>npm run wp-env start</code> instead.
</div>

For more information on controlling the Docker environment, see the [@wordpress/env package](/packages/env/README.md) readme.

### Where to run `wp-env`

The `wp-env` tool can run from practically anywhere. When using the script while developing a single plugin, `wp-env start` can mount and activate the plugin automatically when run from the directory containing the plugin. This also works for themes when run from the directory in which you are developing the theme.

A generic WordPress environment will be created if you run `wp-env start` from a directory that is not a plugin or theme. The script will display the following warning, but ignore if this is your intention.

```
!! Warning: could not find a .wp-env.json configuration file and could not determine if 'DIR' is a WordPress installation, a plugin, or a theme.
```

You can also use the `.wp-env.json` configuration file to create an environment that works with multiple plugins and/or themes. See the [@wordpress/env package](/packages/env/README.md#wp-envjson) readme for more configuration details.

### Uninstall or reset `wp-env`

Here are a few instructions if you need to start over or want to remove what was installed.

-   If you just want to reset and clean the WordPress database, run `wp-env clean all`
-   To remove the local environment completely for a specific project, run `wp-env destroy`
-   To globally uninstall the `wp-env` tool, run `npm -g uninstall @wordpress/env`

## Troubleshooting

### Common errors

When using `wp-env`, it's common to get the error: `Error while running docker-compose command`

-   Check that Docker Desktop is started and running.
-   Check Docker Desktop dashboard for logs, restart, or remove existing virtual machines.
-   Then try rerunning `wp-env start`.

If you see the error: `Host is already in use by another container`

-   The container you are attempting to start is already running, or another container is. You can stop an existing container by running `wp-env stop` from the directory that you started it in.
-   If you do not remember the directory where you started `wp-env`, you can stop all containers by running `docker stop $(docker ps -q)`. This will stop all Docker containers, so use with caution.
-   Then try rerunning `wp-env start`.

### Ubuntu Docker setup

If you are using a version of Ubuntu prior to 20.04.1, you may encounter errors when setting up a local WordPress environment with `wp-env`. 

To resolve this, start by following the [installation guide](https://docs.docker.com/install/linux/docker-ce/ubuntu/) from Docker. `docker-compose` is also required, which you may need to install separately. Refer to the [Docker compose documentation](https://docs.docker.com/compose/install/).

Once Docker and `wp-env` are installed, and assuming `wp-env` is configured globally, try running `wp-env start` in a directory. If you run into this error:

```
ERROR: Couldn't connect to Docker daemon at http+docker://localhost - is it running?

If it's at a non-standard location, specify the URL with the DOCKER_HOST environment variable.
```

First, make sure Docker is running. You can check by running `ps -ef | grep docker`, which should return something like:

```
/usr/bin/dockerd -H fd:// --containerd=/run/containerd/containerd.sock
```

If Docker is not running, try starting the service by running `sudo systemctl start docker.service`.

If Docker is running, then it is not listening to how the WordPress environment is trying to communicate. Try adding the following service override file to include listening on `tcp`. See [this Docker documentation](https://docs.docker.com/config/daemon/remote-access/) on how to configure remote access for Docker daemon.

```
# /etc/systemd/system/docker.service.d/override.conf
[Service]
ExecStart=
ExecStart=/usr/bin/dockerd -H fd:// -H tcp://0.0.0.0:2376
```

Restart the service from the command-line:

```
sudo systemctl daemon-reload
sudo systemctl restart docker.service
```

After restarting the services, set the environment variable `DOCKER_HOST` and try starting `wp-env` with:

```
export DOCKER_HOST=tcp://127.0.0.1:2376
wp-env start
```

Your environment should now be set up at <code>http://localhost:8888</code>.

## Additional resources

- [@wordpress/env](https://www.npmjs.com/package/@wordpress/env) (Official documentation)
- [Docker Desktop](https://docs.docker.com/desktop) (Official documentation)
- [Quick and easy local WordPress development with wp-env](https://developer.wordpress.org/news/2023/03/quick-and-easy-local-wordpress-development-with-wp-env/) (WordPress Developer Blog)
- [wp-env: Simple Local Environments for WordPress](https://make.wordpress.org/core/2020/03/03/wp-env-simple-local-environments-for-wordpress/) (Make WordPress Core Blog)
- [`wp-env` Basics diagram](https://excalidraw.com/#json=8Tp55B-R6Z6-pNGtmenU6,_DeBR1IBxuHNIKPTVEaseA) (Excalidraw)
