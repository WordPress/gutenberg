# `wp-env`

`wp-env` lets you easily set up a local WordPress environment for building and testing plugins and themes. It's simple to install and requires no configuration.

## Quick (tl;dr) instructions

Ensure that Docker is running, then:

```sh
$ cd /path/to/a/wordpress/plugin
$ npm -g i @wordpress/env
$ wp-env start
```

The local environment will be available at http://localhost:8888 (Username: `admin`, Password: `password`).

## Prerequisites

`wp-env` requires Docker to be installed. There are instructions available for installing Docker on [Windows 10 Pro](https://docs.docker.com/docker-for-windows/install/), [all other versions of Windows](https://docs.docker.com/toolbox/toolbox_install_windows/), [macOS](https://docs.docker.com/docker-for-mac/install/), and [Linux](https://docs.docker.com/v17.12/install/linux/docker-ce/ubuntu/#install-using-the-convenience-script).

Node.js and NPM are required. The latest LTS version of Node.js is used to develop `wp-env` and is recommended.

## Installation

### Installation as a global package

After confirming that the prerequisites are installed, you can install `wp-env` globally like so:

```sh
$ npm -g i @wordpress/env
```

You're now ready to use `wp-env`!

### Installation as a local package

If your project already has a package.json, it's also possible to use `wp-env` as a local package. First install `wp-env` locally as a dev dependency:

```sh
$ npm i @wordpress/env --save-dev
```

Then modify your package.json and add an extra command to npm `scripts` (https://docs.npmjs.com/misc/scripts):

```json
"scripts": {
	"wp-env": "wp-env"
}
```

When installing `wp-env` in this way, all `wp-env` commands detailed in these docs must be prefixed with `npm run`, for example:

```sh
$ npm run wp-env start
```

instead of:

```sh
$ wp-env start
```

## Usage

### Starting the environment

First, ensure that Docker is running. You can do this by clicking on the Docker icon in the system tray or menu bar.

Then, change to a directory that contains a WordPress plugin or theme:

```sh
$ cd ~/gutenberg
```

Then, start the local environment:

```sh
$ wp-env start
```

Finally, navigate to http://localhost:8888 in your web browser to see WordPress running with the local WordPress plugin or theme running and activated. Default login credentials are username: `admin` password: `password`.

### Stopping the environment

To stop the local environment:

```sh
$ wp-env stop
```

## Troubleshooting common problems

Many common problems can be fixed by running through the following troubleshooting steps in order:

### 1. Check that `wp-env` is running

First, check that `wp-env` is running. One way to do this is to have Docker print a table with the currently running containers:

```sh
$ docker ps
```

In this table, by default, you should see three entries: `wordpress` with port 8888, `tests-wordpress` with port 8889 and `mariadb` with port 3306.

### 2. Check the port number

By default `wp-env` uses port 8888, meaning that the local environment will be available at http://localhost:8888.

You can configure the port that `wp-env` uses so that it doesn't clash with another server by specifying the `WP_ENV_PORT` environment variable when starting `wp-env`:

```sh
$ WP_ENV_PORT=3333 wp-env start
```

Running `docker ps` and inspecting the `PORTS` column allows you to determine which port `wp-env` is currently using.

You may also specify the port numbers in your `.wp-env.json` file, but the environment variables take precedent.

### 3. Restart `wp-env`

Restarting `wp-env` will restart the underlying Docker containers which can fix many issues.

To restart `wp-env`:

```sh
$ wp-env stop
$ wp-env start
```

### 4. Restart Docker

Restarting Docker will restart the underlying Docker containers and volumes which can fix many issues.

To restart Docker:

1. Click on the Docker icon in the system tray or menu bar.
2. Select _Restart_.

Once restarted, start `wp-env` again:

```sh
$ wp-env start
```

### 5. Reset the database

Resetting the database which the local environment uses can fix many issues, especially when they are related to the WordPress installation.

To reset the database:

**⚠️ WARNING: This will permanently delete any posts, pages, media, etc. in the local WordPress installation.**

```sh
$ wp-env clean all
$ wp-env start
```

### 6. Nuke everything and start again 🔥

When all else fails, you can use `wp-env destroy` to forcibly remove all of the underlying Docker containers and volumes. This will allow you to start from scratch.

To nuke everything:

**⚠️ WARNING: This will permanently delete any posts, pages, media, etc. in the local WordPress installation.**

```sh
$ wp-env destroy
$ wp-env start
```

## Command reference

`wp-env` creates generated files in the `wp-env` home directory. By default, this is `~/.wp-env`. The exception is Linux, where files are placed at `~/wp-env` [for compatibility with Snap Packages](https://github.com/WordPress/gutenberg/issues/20180#issuecomment-587046325). The `wp-env` home directory contains a subdirectory for each project named `/$md5_of_project_path`. To change the `wp-env` home directory, set the `WP_ENV_HOME` environment variable. For example, running `WP_ENV_HOME="something" wp-env start` will download the project files to the directory `./something/$md5_of_project_path` (relative to the current directory).

### `wp-env start [ref]`

```sh
wp-env start

Starts WordPress for development on port 8888 (​http://localhost:8888​)
(override with WP_ENV_PORT) and tests on port 8889 (​http://localhost:8889​)
(override with WP_ENV_TESTS_PORT). The current working directory must be a
WordPress installation, a plugin, a theme, or contain a .wp-env.json file.


Positionals:
  ref  A `https://github.com/WordPress/WordPress` git repo branch or commit for
       choosing a specific version.                 [string] [default: "master"]
```

### `wp-env stop`

```sh
wp-env stop

Stops running WordPress for development and tests and frees the ports.
```

### `wp-env clean [environment]`

```sh
wp-env clean [environment]

Cleans the WordPress databases.

Positionals:
  environment  Which environments' databases to clean.
            [string] [choices: "all", "development", "tests"] [default: "tests"]
```

### `wp-env run [container] [command]`

```sh
wp-env run <container> [command..]

Runs an arbitrary command in one of the underlying Docker containers. For
example, it can be useful for running wp cli commands. You can also use it to
open shell sessions like bash and the WordPress shell in the WordPress instance.
For example, `wp-env run cli bash` will open bash in the development WordPress
instance.

Positionals:
  container  The container to run the command on.            [string] [required]
  command    The command to run.                           [array] [default: []]

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]
  --debug    Enable debug output.                     [boolean] [default: false]
```

For example:

```sh
wp-env run cli wp user list
⠏ Running `wp user list` in 'cli'.

ID      user_login      display_name    user_email      user_registered roles
1       admin   admin   wordpress@example.com   2020-03-05 10:45:14     administrator

✔ Ran `wp user list` in 'cli'. (in 2s 374ms)
```

```sh
wp-env run tests-cli wp shell
ℹ Starting 'wp shell' on the tests-cli container. Exit the WordPress shell with ctrl-c.

Starting 31911d623e75f345e9ed328b9f48cff6_mysql_1 ... done
Starting 31911d623e75f345e9ed328b9f48cff6_tests-wordpress_1 ... done
wp> echo( 'hello world!' );
hello world!
wp> ^C
✔ Ran `wp shell` in 'tests-cli'. (in 16s 400ms)
```

### `wp-env destroy`

```sh
wp-env destroy

Destroy the WordPress environment. Deletes docker containers, volumes, and
networks associated with the WordPress environment and removes local files.
```

### `wp-env logs [environment]`

```sh
wp-env logs

displays PHP and Docker logs for given WordPress environment.

Positionals:
  environment  Which environment to display the logs from.
      [string] [choices: "development", "tests", "all"] [default: "development"]

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]
  --debug    Enable debug output.                     [boolean] [default: false]
  --watch    Watch for logs as they happen.            [boolean] [default: true]
```

## .wp-env.json

You can customize the WordPress installation, plugins and themes that the development environment will use by specifying a `.wp-env.json` file in the directory that you run `wp-env` from.

`.wp-env.json` supports five fields:

| Field         | Type           | Default                                    | Description                                                                                                               |
| ------------- | -------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `"core"`      | `string\|null` | `null`                                     | The WordPress installation to use. If `null` is specified, `wp-env` will use the latest production release of WordPress.  |
| `"plugins"`   | `string[]`     | `[]`                                       | A list of plugins to install and activate in the environment.                                                             |
| `"themes"`    | `string[]`     | `[]`                                       | A list of themes to install in the environment. The first theme in the list will be activated.                            |
| `"port"`      | `integer`      | `8888`                                     | The primary port number to use for the insallation. You'll access the instance through the port: 'http://localhost:8888'. |
| `"testsPort"` | `integer`      | `8889`                                     | The port number to use for the tests instance.                                                                            |
| `"config"`    | `Object`       | `"{ WP_DEBUG: true, SCRIPT_DEBUG: true }"` | Mapping of wp-config.php constants to their desired values.                                                               |
| `"mappings"`  | `Object`       | `"{}"`                                     | Mapping of WordPress directories to local directories to be mounted in the WordPress instance.                            |

_Note: the port number environment variables (`WP_ENV_PORT` and `WP_ENV_TESTS_PORT`) take precedent over the .wp-env.json values._

Several types of strings can be passed into the `core`, `plugins`, `themes`, and `mappings` fields.

| Type              | Format                        | Example(s)                                               |
| ----------------- | ----------------------------- | -------------------------------------------------------- |
| Relative path     | `.<path>\|~<path>`            | `"./a/directory"`, `"../a/directory"`, `"~/a/directory"` |
| Absolute path     | `/<path>\|<letter>:\<path>`   | `"/a/directory"`, `"C:\\a\\directory"`                   |
| GitHub repository | `<owner>/<repo>[#<ref>]`      | `"WordPress/WordPress"`, `"WordPress/gutenberg#master"`  |
| ZIP File          | `http[s]://<host>/<path>.zip` | `"https://wordpress.org/wordpress-5.4-beta2.zip"`        |

Remote sources will be downloaded into a temporary directory located in `~/.wp-env`.

## .wp-env.override.json

Any fields here will take precedence over .wp-env.json. This file is useful, when ignored from version control, to persist local development overrides.

### Examples

#### Latest production WordPress + current directory as a plugin

This is useful for plugin development.

```json
{
	"core": null,
	"plugins": [ "." ]
}
```

#### Latest development WordPress + current directory as a plugin

This is useful for plugin development when upstream Core changes need to be tested.

```json
{
	"core": "WordPress/WordPress#master",
	"plugins": [ "." ]
}
```

#### Local `wordpress-develop` + current directory as a plugin

This is useful for working on plugins and WordPress Core at the same time.

```json
{
	"core": "../wordpress-develop/build",
	"plugins": [ "." ]
}
```

#### A complete testing environment

This is useful for integration testing: that is, testing how old versions of WordPress and different combinations of plugins and themes impact each other.

```json
{
	"core": "WordPress/WordPress#5.2.0",
	"plugins": [ "WordPress/wp-lazy-loading", "WordPress/classic-editor" ],
	"themes": [ "WordPress/theme-experiments" ]
}
```

#### Add mu-plugins and other mapped directories

You can add mu-plugins via the mapping config. The mapping config also allows you to mount a directory to any location in the wordpress install, so you could even mount a subdirectory. Note here that theme-1, will not be activated, despite being the "first" mapped theme.

```json
{
	"plugins": [ "." ],
	"mappings": {
		"wp-content/mu-plugins": "./path/to/local/mu-plugins",
		"wp-content/themes": "./path/to/local/themes",
		"wp-content/themes/specific-theme": "./path/to/local/theme-1"
	}
}
```

#### Avoid activating plugins or themes on the instance

Since all plugins in the `plugins` key are activated by default, you should use the `mappings` key to avoid this behavior. This might be helpful if you have a test plugin that should not be activated all the time. The same applies for a theme which should not be activated.

```json
{
	"plugins": [ "." ],
	"mappings": {
		"wp-content/plugins/my-test-plugin": "./path/to/test/plugin"
	}
}
```

#### Custom Port Numbers

You can tell `wp-env` to use a custom port number so that your instance does not conflict with other `wp-env` instances.

```json
{
	"plugins": [ "." ],
	"port": 4013,
	"testsPort": 4012
}
```

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
