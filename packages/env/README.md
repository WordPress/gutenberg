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

When installing `wp-env` in this way, all `wp-env` commands detailed in these docs must be prefixed with `pnpm`, for example:

```sh
# You must add another dash to pass the "update" flag to wp-env
$ pnpm wp-env start -- --update
```

instead of:

```sh
$ wp-env start --update
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

### 7. Debug mode and inspecting the generated dockerfile.

`wp-env` uses docker behind the scenes. Inspecting the generated docker-compose file can help to understand what's going on.

Start `wp-env` in debug mode

```sh
wp-env start --debug
```

`wp-env` will output its config which includes `dockerComposeConfigPath`.

```sh
ℹ Config:
	...
	"dockerComposeConfigPath": "/Users/$USERNAME/.wp-env/5a619d332a92377cd89feb339c67b833/docker-compose.yml",
	...
```

## Using Xdebug

Xdebug is installed in the wp-env environment, but it is turned off by default. To enable Xdebug, you can use the `--xdebug` flag with the `wp-env start` command. Here is a reference to how the flag works:

```sh
# Sets the Xdebug mode to "debug" (for step debugging):
wp-env start --xdebug

# Sets the Xdebug mode to "off":
wp-env start

# Enables each of the Xdebug modes listed:
wp-env start --xdebug=profile,trace,debug
```

You can see a reference on each of the Xdebug modes and what they do in the [Xdebug documentation](https://xdebug.org/docs/all_settings#mode).

_Since we are only installing Xdebug 3, Xdebug is only supported for PHP versions greater than or equal to 7.2 (the default). Xdebug won't be installed if `phpVersion` is set to a legacy version._

### Xdebug IDE support

To connect to Xdebug from your IDE, you can use these IDE settings. This bit of JSON was tested for VS Code's `launch.json` format (which you can [learn more about here](https://code.visualstudio.com/docs/editor/debugging#_launchjson-attributes)) along with [this PHP Debug extension](https://marketplace.visualstudio.com/items?itemName=felixfbecker.php-debug). Its path mapping also points to a specific plugin -- you should update this to point to the source you are working with inside of the wp-env instance.

You should only have to translate `port` and `pathMappings` to the format used by your own IDE.

```json
{
	"name": "Listen for XDebug",
	"type": "php",
	"request": "launch",
	"port": 9003,
	"pathMappings": {
		"/var/www/html/wp-content/plugins/gutenberg": "${workspaceFolder}/"
	}
}
```

Once your IDEs Xdebug settings have been enabled, you should just have to launch the debugger, put a breakpoint on any line of PHP code, and then refresh your browser!

Here is a summary:

1. Start wp-env with xdebug enabled: `wp-env start --xdebug`
2. Install a suitable Xdebug extension for your IDE if it does not include one already.
3. Configure the IDE debugger to use port `9003` and the correct source files in wp-env.
4. Launch the debugger and put a breakpoint on any line of PHP code.
5. Refresh the URL wp-env is running at and the breakpoint should trigger.

## Command reference

`wp-env` creates generated files in the `wp-env` home directory. By default, this is `~/.wp-env`. The exception is Linux, where files are placed at `~/wp-env` [for compatibility with Snap Packages](https://github.com/WordPress/gutenberg/issues/20180#issuecomment-587046325). The `wp-env` home directory contains a subdirectory for each project named `/$md5_of_project_path`. To change the `wp-env` home directory, set the `WP_ENV_HOME` environment variable. For example, running `WP_ENV_HOME="something" wp-env start` will download the project files to the directory `./something/$md5_of_project_path` (relative to the current directory).

### `wp-env start`

The start command installs and initializes the WordPress environment, which includes downloading any specified remote sources. By default, `wp-env` will not update or re-configure the environment except when the configuration file changes. Tell `wp-env` to update sources and apply the configuration options again with `wp-env start --update`. This will not overwrite any existing content.

```sh
wp-env start

Starts WordPress for development on port 8888 (override with WP_ENV_PORT) and
tests on port 8889 (override with WP_ENV_TESTS_PORT). The current working
directory must be a WordPress installation, a plugin, a theme, or contain a
.wp-env.json file. After first install, use the '--update' flag to download
updates to mapped sources and to re-apply WordPress configuration options.

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]
  --debug    Enable debug output.                     [boolean] [default: false]
  --update   Download source updates and apply WordPress configuration.
                                                      [boolean] [default: false]
  --xdebug   Enables Xdebug. If not passed, Xdebug is turned off. If no modes
             are set, uses "debug". You may set multiple Xdebug modes by passing
             them in a comma-separated list: `--xdebug=develop,coverage`. See
             https://xdebug.org/docs/all_settings#mode for information about
             Xdebug modes.                                              [string]
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

Runs an arbitrary command in one of the underlying Docker containers. The
"container" param should reference one of the underlying Docker services like
"development", "tests", or "cli". To run a wp-cli command, use the "cli" or
"tests-cli" service. You can also use this command to open shell sessions like
bash and the WordPress shell in the WordPress instance. For example, `wp-env run
cli bash` will open bash in the development WordPress instance. When using long
commands with arguments and quotation marks, you need to wrap the "command"
param in quotation marks. For example: `wp-env run tests-cli "wp post create
--post_type=page --post_title='Test'"` will create a post on the tests WordPress
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

#### Displaying the users on the development instance:

```sh
wp-env run cli wp user list
⠏ Running `wp user list` in 'cli'.

ID      user_login      display_name    user_email      user_registered roles
1       admin   admin   wordpress@example.com   2020-03-05 10:45:14     administrator

✔ Ran `wp user list` in 'cli'. (in 2s 374ms)
```

#### Creating a post on the tests instance:

```sh
wp-env run tests-cli "wp post create --post_type=page --post_title='Ready'"

ℹ Starting 'wp post create --post_type=page --post_title='Ready'' on the tests-cli container.

Success: Created post 5.
✔ Ran `wp post create --post_type=page --post_title='Ready'` in 'tests-cli'. (in 3s 293ms)
```

#### Opening the WordPress shell on the tests instance and running PHP commands:

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

#### Installing a plugin or theme on the development instance

```sh
wp-env run cli plugin install custom-post-type-ui

Creating 500cd328b649d63e882d5c4695871d04_cli_run ... done
Installing Custom Post Type UI (1.9.2)
Downloading installation package from https://downloads.wordpress.org/plugin/custom-post-type-ui.zip...
The authenticity of custom-post-type-ui.zip could not be verified as no signature was found.
Unpacking the package...
Installing the plugin...
Plugin installed successfully.
Success: Installed 1 of 1 plugins.
✔ Ran `plugin install custom-post-type-ui` in 'cli'. (in 6s 483ms)
```

**NOTE**: Depending on your host OS, you may experience errors when trying to install plugins or themes (e.g. `Warning: Could not create directory.`). This is typically because the user ID used within the container does not have write access to the mounted directories created by `wp-env`. To resolve this, run the `docker-compose` command directly from the directory created by `wp-env` and add `-u $(id -u)` and `-e HOME=/tmp` the `run` command as options:

```sh
$ cd ~/wp-env/500cd328b649d63e882d5c4695871d04
$ docker-compose run --rm -u $(id -u) -e HOME=/tmp cli [plugin|theme] install <plugin|theme>
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

`.wp-env.json` supports six fields for options applicable to both the tests and development instances.

| Field          | Type           | Default                                | Description                                                                                                                      |
| -------------- | -------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `"core"`       | `string\|null` | `null`                                 | The WordPress installation to use. If `null` is specified, `wp-env` will use the latest production release of WordPress.         |
| `"phpVersion"` | `string\|null` | `null`                                 | The PHP version to use. If `null` is specified, `wp-env` will use the default version used with production release of WordPress. |
| `"plugins"`    | `string[]`     | `[]`                                   | A list of plugins to install and activate in the environment.                                                                    |
| `"themes"`     | `string[]`     | `[]`                                   | A list of themes to install in the environment.                                                                                  |
| `"port"`       | `integer`      | `8888` (`8889` for the tests instance) | The primary port number to use for the installation. You'll access the instance through the port: 'http://localhost:8888'.       |
| `"config"`     | `Object`       | See below.                             | Mapping of wp-config.php constants to their desired values.                                                                      |
| `"mappings"`   | `Object`       | `"{}"`                                 | Mapping of WordPress directories to local directories to be mounted in the WordPress instance.                                   |

_Note: the port number environment variables (`WP_ENV_PORT` and `WP_ENV_TESTS_PORT`) take precedent over the .wp-env.json values._

Several types of strings can be passed into the `core`, `plugins`, `themes`, and `mappings` fields.

| Type              | Format                        | Example(s)                                               |
| ----------------- | ----------------------------- | -------------------------------------------------------- |
| Relative path     | `.<path>\|~<path>`            | `"./a/directory"`, `"../a/directory"`, `"~/a/directory"` |
| Absolute path     | `/<path>\|<letter>:\<path>`   | `"/a/directory"`, `"C:\\a\\directory"`                   |
| GitHub repository | `<owner>/<repo>[#<ref>]`      | `"WordPress/WordPress"`, `"WordPress/gutenberg#trunk"`   |
| ZIP File          | `http[s]://<host>/<path>.zip` | `"https://wordpress.org/wordpress-5.4-beta2.zip"`        |

Remote sources will be downloaded into a temporary directory located in `~/.wp-env`.

Additionally, the key `env` is available to override any of the above options on an individual-environment basis. For example, take the following `.wp-env.json` file:

```json
{
	"plugins": [ "." ],
	"config": {
		"KEY_1": true,
		"KEY_2": false
	},
	"env": {
		"development": {
			"themes": [ "./one-theme" ]
		},
		"tests": {
			"config": {
				"KEY_1": false
			},
			"port": 3000
		}
	}
}
```

On the development instance, `cwd` will be mapped as a plugin, `one-theme` will be mapped as a theme, KEY_1 will be set to true, and KEY_2 will be set to false. Also note that the default port, 8888, will be used as well.

On the tests instance, `cwd` is still mapped as a plugin, but no theme is mapped. Additionally, while KEY_2 is still set to false, KEY_1 is overridden and set to false. 3000 overrides the default port as well.

This gives you a lot of power to change the options applicable to each environment.

## .wp-env.override.json

Any fields here will take precedence over .wp-env.json. This file is useful when ignored from version control, to persist local development overrides. Note that options like `plugins` and `themes` are not merged. As a result, if you set `plugins` in your override file, this will override all of the plugins listed in the base-level config. The only keys which are merged are `config` and `mappings`. This means that you can set your own wp-config values without losing any of the default values.

## Default wp-config values.

On the development instance, these wp-config values are defined by default:

```
WP_DEBUG: true,
SCRIPT_DEBUG: true,
WP_PHP_BINARY: 'php',
WP_TESTS_EMAIL: 'admin@example.org',
WP_TESTS_TITLE: 'Test Blog',
WP_TESTS_DOMAIN: 'http://localhost',
WP_SITEURL: 'http://localhost',
WP_HOME: 'http://localhost',
```

On the test instance, all of the above are still defined, but `WP_DEBUG` and `SCRIPT_DEBUG` are set to false.

Additionally, the values referencing a URL include the specified port for the given environment. So if you set `testsPort: 3000, port: 2000`, `WP_HOME` (for example) will be `http://localhost:3000` on the tests instance and `http://localhost:2000` on the development instance.

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

If you are running a _build_ of `wordpress-develop`, point `core` to the `build` directory.

```json
{
	"core": "../wordpress-develop/build",
	"plugins": [ "." ]
}
```

If you are running `wordpress-develop` in a dev mode (e.g. the watch command `dev` or the dev build `build:dev`), then point `core` to the `src` directory.

```json
{
	"core": "../wordpress-develop/src",
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

You can add mu-plugins via the mapping config. The mapping config also allows you to mount a directory to any location in the wordpress install, so you could even mount a subdirectory. Note here that theme-1, will not be activated.

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

Since all plugins in the `plugins` key are activated by default, you should use the `mappings` key to avoid this behavior. This might be helpful if you have a test plugin that should not be activated all the time.

```json
{
	"plugins": [ "." ],
	"mappings": {
		"wp-content/plugins/my-test-plugin": "./path/to/test/plugin"
	}
}
```

#### Map a plugin only in the tests environment

If you need a plugin active in one environment but not the other, you can use `env.<envName>` to set options specific to one environment. Here, we activate cwd and a test plugin on the tests instance. This plugin is not activated on any other instances.

```json
{
	"plugins": [ "." ],
	"env": {
		"tests": {
			"plugins": [ ".", "path/to/test/plugin" ]
		}
	}
}
```

#### Custom Port Numbers

You can tell `wp-env` to use a custom port number so that your instance does not conflict with other `wp-env` instances.

```json
{
	"plugins": [ "." ],
	"port": 4013,
	"env": {
		"tests": {
			"port": 4012
		}
	}
}
```

#### Specific PHP Version

You can tell `wp-env` to use a specific PHP version for compatibility and testing. This can also be set via the environment variable `WP_ENV_PHP_VERSION`.

```json
{
	"phpVersion": "7.2",
	"plugins": [ "." ]
}
```

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
