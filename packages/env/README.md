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

The database credentials are: user `root`, password `password`. For a comprehensive guide on connecting directly to the database, refer to [Accessing the MySQL Database](https://github.com/WordPress/gutenberg/blob/trunk/docs/contributors/code/getting-started-with-code-contribution.md#accessing-the-mysql-database).

## Prerequisites

`wp-env` relies on a few commonly used developer tools:

-   **Docker**. `wp-env` is powered by Docker. There are instructions available for installing Docker on [Windows](https://docs.docker.com/desktop/install/windows-install/) (we recommend the WSL2 backend), [macOS](https://docs.docker.com/docker-for-mac/install/), and [Linux](https://docs.docker.com/desktop/install/linux-install/).
-   **Node.js**. `wp-env` is written as a Node script. We recommend using a Node version manager like [nvm](https://github.com/nvm-sh/nvm) to install the latest LTS version. Alternatively, you can [download it directly here](https://nodejs.org/en/download).
-   **git**. Git is used for downloading software from source control, such as WordPress, plugins, and themes. [You can find the installation instructions here.](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git)

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

If you have also installed `wp-env` globally, running it will automatically execute the local, project-level package. Alternatively, you can execute `wp-env` via [`npx`](https://www.npmjs.com/package/npx), a utility automatically installed with `npm`.`npx` finds binaries like `wp-env` installed through node modules. As an example: `npx wp-env start --update`.

If you don't wish to use the global installation or `npx`, modify your `package.json` and add an extra command to npm `scripts` (https://docs.npmjs.com/misc/scripts):

```json
"scripts": {
	"wp-env": "wp-env"
}
```

When installing `wp-env` in this way, all `wp-env` commands detailed in these docs must be prefixed with `npm run`, for example:

```sh
# You must add another double dash to pass flags to the script (wp-env) rather than to npm itself
$ npm run wp-env start -- --update
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

You may also specify the port numbers in your `.wp-env.json` file, but the environment variables will take precedence.

### 3. Restart `wp-env` with updates

Restarting `wp-env` will restart the underlying Docker containers which can fix many issues.

To restart `wp-env`, just run `wp-env start` again. It will automatically stop and start the container. If you also pass the `--update` argument, it will download updates and configure WordPress again.

```sh
$ wp-env start --update
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

### 6. Destroy everything and start again 🔥

When all else fails, you can use `wp-env destroy` to forcibly remove all of the underlying Docker containers, volumes, and files. This will allow you to start from scratch.

To do so:

**⚠️ WARNING: This will permanently delete any posts, pages, media, etc. in the local WordPress installation.**

```sh
$ wp-env destroy
# This new instance is a fresh start with no existing data:
$ wp-env start
```

## Using included WordPress PHPUnit test files

Out of the box `wp-env` includes the [WordPress' PHPUnit test files](https://develop.svn.wordpress.org/trunk/tests/phpunit/) corresponding to the version of WordPress installed. There is an environment variable, `WP_TESTS_DIR`, which points to the location of these files within each container. By including these files in the environment, we remove the need for you to use a package or install and mount them yourself. If you do not want to use these files, you should ignore the `WP_TESTS_DIR` environment variable and load them from the location of your choosing.

### Customizing the `wp-tests-config.php` file

While we do provide a default `wp-tests-config.php` file within the environment, there may be cases where you want to use your own. WordPress provides a `WP_TESTS_CONFIG_FILE_PATH` constant that you can use to change the `wp-config.php` file used for testing. Set this to a desired path in your `bootstrap.php` file and the file you've chosen will be used instead of the one included in the environment.

## Using `composer`, `phpunit`, and `wp-cli` tools.

For ease of use, Composer, PHPUnit, and wp-cli are available for in the environment. To run these executables, use `wp-env run <env> <tool> <command>`. For example, `wp-env run cli composer install`, or `wp-env run tests-cli phpunit`. You can also access various shells like `wp-env run cli bash` or `wp-env run cli wp shell`.

For the `env` part, `cli` and `wordpress` share a database and mapped volumes, but more tools are available in the cli environment. You should use the `tests-cli` / `tests-wordpress` environments for a separate testing database.

By default, the cwd of the run command is the root of the WordPress install. If you're working on a plugin, you likely need to pass `--env-cwd` to make sure composer/phpunit commands are executed relative to the plugin you're working on. For example, `wp-env run cli --env-cwd=wp-content/plugins/gutenberg composer install`.

To make this easier, it's often helpful to add scripts in your `package.json` file:

```json
{
	"scripts": {
		"composer": "wp-env run cli --env-cwd=wp-content/plugins/gutenberg composer"
	}
}
```

Then, `npm run composer install` would run composer install in the environment. You could also do this for phpunit, wp-cli, etc.

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

When you're running `wp-env` using `npm run`, like when working in the Gutenberg repo or when `wp-env` is a local project dependency, don't forget to add an extra double dash before the `--xdebug` command:

```sh
npm run wp-env start -- --xdebug
# Alternatively, use npx:
npx wp-env start --xdebug
```

If you forget about that, the `--xdebug` parameter will be passed to npm instead of the `wp-env start` command and it will be ignored.

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

After you create a `.vscode/launch.json` file in your repository, you probably want to add it to your [global gitignore file](https://docs.github.com/en/get-started/getting-started-with-git/ignoring-files#configuring-ignored-files-for-all-repositories-on-your-computer) so that it stays private for you and is not committed to the repository.

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

Starts WordPress for development on port 8888 (​http://localhost:8888​)
(override with WP_ENV_PORT) and tests on port 8889 (​http://localhost:8889​)
(override with WP_ENV_TESTS_PORT). The current working directory must be a
WordPress installation, a plugin, a theme, or contain a .wp-env.json file. After
first install, use the '--update' flag to download updates to mapped sources and
to re-apply WordPress configuration options.

Options:
  --debug    Enable debug output.                     [boolean] [default: false]
  --update   Download source updates and apply WordPress configuration.
                                                      [boolean] [default: false]
  --xdebug   Enables Xdebug. If not passed, Xdebug is turned off. If no modes
             are set, uses "debug". You may set multiple Xdebug modes by passing
             them in a comma-separated list: `--xdebug=develop,coverage`. See
             https://xdebug.org/docs/all_settings#mode for information about
             Xdebug modes.                                              [string]
  --scripts  Execute any configured lifecycle scripts. [boolean] [default: true]
```

### `wp-env stop`

```sh
wp-env stop

Stops running WordPress for development and tests and frees the ports.

Options:
  --debug            Enable debug output.             [boolean] [default: false]
```

### `wp-env clean [environment]`

```sh
wp-env clean [environment]

Cleans the WordPress databases.

Positionals:
  environment  Which environments' databases to clean.
            [string] [choices: "all", "development", "tests"] [default: "tests"]

Options:
  --debug    Enable debug output.                     [boolean] [default: false]
  --scripts  Execute any configured lifecycle scripts. [boolean] [default: true]
```

### `wp-env run <container> [command...]`

The run command can be used to open shell sessions, invoke WP-CLI commands, or run any arbitrary commands inside of a container.

<div class="callout callout-alert">
<p>
In some cases <code class="language-sh">wp-env run</code> may conflict with options that you are passing to the container.
When this happens, <code class="language-sh">wp-env</code> will treat the option as its own and take action accordingly.
For example, if you try <code class="language-sh">wp-env run cli php --help</code>, you will receive the <code class="language-sh">wp-env</code> help text.
</p>

<p>
You can get around this by passing any conflicting options after a double dash. <code class="language-sh">wp-env</code> will not process anything after
the double dash and will simply pass it on to the container. To get the PHP help text you would use <code class="language-sh">wp-env run cli php -- --help</code>.
</p>
</div>

```sh
wp-env run <container> [command...]

Runs an arbitrary command in one of the underlying Docker containers. A double
dash can be used to pass arguments to the container without parsing them. This
is necessary if you are using an option that is defined below. You can use
`bash` to open a shell session and both `composer` and `phpunit` are available
in all WordPress and CLI containers. WP-CLI is also available in the CLI
containers.

Positionals:
  container  The Docker service to run the command on.
              [string] [required] [choices: "mysql", "tests-mysql", "wordpress",
                   "tests-wordpress", "cli", "tests-cli", "composer", "phpunit"]
  command    The command to run.                                      [required]

Options:
  --debug    Enable debug output.                     [boolean] [default: false]
  --env-cwd  The command's working directory inside of the container. Paths
             without a leading slash are relative to the WordPress root.
                                                         [string] [default: "."]
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
wp-env run cli wp plugin install custom-post-type-ui

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

#### Changing the permalink structure

You might want to do this to enable access to the REST API (`wp-env/wp/v2/`) endpoint in your wp-env environment. The endpoint is not available with plain permalinks.

**Examples**

To set the permalink to just the post name:

```
wp-env run cli "wp rewrite structure /%postname%/"
```

To set the permalink to the year, month, and post name:

```
wp-env run cli "wp rewrite structure /%year%/%monthnum%/%postname%/"
```

### `wp-env destroy`

```sh
wp-env destroy

Destroy the WordPress environment. Deletes docker containers, volumes, and
networks associated with the WordPress environment and removes local files.

Options:
  --debug    Enable debug output.                     [boolean] [default: false]
  --scripts  Execute any configured lifecycle scripts. [boolean] [default: true]
```

### `wp-env logs [environment]`

```sh
wp-env logs

displays PHP and Docker logs for given WordPress environment.

Positionals:
  environment  Which environment to display the logs from.
      [string] [choices: "development", "tests", "all"] [default: "development"]

Options:
  --debug    Enable debug output.                     [boolean] [default: false]
  --watch    Watch for logs as they happen.            [boolean] [default: true]
```

### `wp-env install-path`

Get the path where all of the environment files are stored. This includes the Docker files, WordPress, PHPUnit files, and any sources that were downloaded.

Example:

```sh
$ wp-env install-path

/home/user/.wp-env/63263e6506becb7b8613b02d42280a49
```

## .wp-env.json

You can customize the WordPress installation, plugins and themes that the development environment will use by specifying a `.wp-env.json` file in the directory that you run `wp-env` from.

`.wp-env.json` supports fields for options applicable to both the tests and development instances.

| Field          | Type           | Default                                | Description                                                                                                                      |
|----------------|----------------|----------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| `"core"`       | `string\|null` | `null`                                 | The WordPress installation to use. If `null` is specified, `wp-env` will use the latest production release of WordPress.         |
| `"phpVersion"` | `string\|null` | `null`                                 | The PHP version to use. If `null` is specified, `wp-env` will use the default version used with production release of WordPress. |
| `"plugins"`    | `string[]`     | `[]`                                   | A list of plugins to install and activate in the environment.                                                                    |
| `"themes"`     | `string[]`     | `[]`                                   | A list of themes to install in the environment.                                                                                  |
| `"port"`       | `integer`      | `8888` (`8889` for the tests instance) | The primary port number to use for the installation. You'll access the instance through the port: 'http://localhost:8888'.       |
| `"testsPort"`  | `integer`      | `8889`                                 | The port number for the test site. You'll access the instance through the port: 'http://localhost:8889'.                         |
| `"config"`     | `Object`       | See below.                             | Mapping of wp-config.php constants to their desired values.                                                                      |
| `"mappings"`   | `Object`       | `"{}"`                                 | Mapping of WordPress directories to local directories to be mounted in the WordPress instance.                                   |
| `"mysqlPort"`  | `integer`      | `null` (randomly assigned)             | The MySQL port number to expose. The setting is only available in the `env.development` and `env.tests` objects.                 |

_Note: the port number environment variables (`WP_ENV_PORT` and `WP_ENV_TESTS_PORT`) take precedent over the .wp-env.json values._

Several types of strings can be passed into the `core`, `plugins`, `themes`, and `mappings` fields.

| Type              | Format                                       | Example(s)                                                                                                                         |
| ----------------- | -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Relative path     | `.<path>\|~<path>`                           | `"./a/directory"`, `"../a/directory"`, `"~/a/directory"`                                                                           |
| Absolute path     | `/<path>\|<letter>:\<path>`                  | `"/a/directory"`, `"C:\\a\\directory"`                                                                                             |
| GitHub repository | `<owner>/<repo>[#<ref>]`                     | `"WordPress/WordPress"`, `"WordPress/gutenberg#trunk"`, if no branch is provided wp-env will fall back to the repos default branch |
| SSH repository    | `ssh://user@host/<owner>/<repo>.git[#<ref>]` | `"ssh://git@github.com/WordPress/WordPress.git"`                                                                                   |
| ZIP File          | `http[s]://<host>/<path>.zip`                | `"https://wordpress.org/wordpress-5.4-beta2.zip"`                                                                                  |

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
			"port": 3000,
			"mysqlPort": 13306
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
WP_TESTS_DOMAIN: 'localhost',
WP_SITEURL: 'http://localhost',
WP_HOME: 'http://localhost',
```

On the test instance, all of the above are still defined, but `WP_DEBUG` and `SCRIPT_DEBUG` are set to false.

These can be overridden by setting a value within the `config` configuration. Setting it to `null` will prevent the constant being defined entirely.

Additionally, the values referencing a URL include the specified port for the given environment. So if you set `testsPort: 3000, port: 2000`, `WP_HOME` (for example) will be `http://localhost:3000` on the tests instance and `http://localhost:2000` on the development instance.

## Lifecycle Scripts

Using the `lifecycleScripts` option in `.wp-env.json` will allow you to set arbitrary commands to be executed at certain points in the lifecycle. This configuration
can also be overridden using `WP_ENV_LIFECYCLE_SCRIPT_{LIFECYCLE_EVENT}` environment variables, with the remainder being the all-caps snake_case name of the option, for
example, `WP_ENV_LIFECYCLE_SCRIPT_AFTER_START`. Keep in mind that these will be executed on both fresh and existing environments, so, ensure any commands you
build won't break on subsequent executions.

* `afterStart`: Runs after `wp-env start` has finished setting up the environment.
* `afterClean`: Runs after `wp-env clean` has finished cleaning the environment.
* `afterDestroy`: Runs after `wp-env destroy` has destroyed the environment.

## Examples

### Latest stable WordPress + current directory as a plugin

This is useful for plugin development.

```json
{
	"core": null,
	"plugins": [ "." ]
}
```

### Latest development WordPress + current directory as a plugin

This is useful for plugin development when upstream Core changes need to be tested. This can also be set via the environment variable `WP_ENV_CORE`.

```json
{
	"core": "WordPress/WordPress#master",
	"plugins": [ "." ]
}
```

### Local `wordpress-develop` + current directory as a plugin

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

### A complete testing environment

This is useful for integration testing: that is, testing how old versions of WordPress and different combinations of plugins and themes impact each other.

```json
{
	"core": "WordPress/WordPress#5.2.0",
	"plugins": [ "WordPress/wp-lazy-loading", "WordPress/classic-editor" ],
	"themes": [ "WordPress/theme-experiments" ]
}
```

### Add mu-plugins and other mapped directories

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

### Avoid activating plugins or themes on the instance

Since all plugins in the `plugins` key are activated by default, you should use the `mappings` key to avoid this behavior. This might be helpful if you have a test plugin that should not be activated all the time.

```json
{
	"plugins": [ "." ],
	"mappings": {
		"wp-content/plugins/my-test-plugin": "./path/to/test/plugin"
	}
}
```

### Map a plugin only in the tests environment

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

### Custom Port Numbers

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

These can also be set via the environment variables `WP_ENV_PORT`, `WP_ENV_TESTS_PORT`, `WP_ENV_MYSQL_PORT` and `WP_ENV_TESTS_MYSQL_PORT`.

### Specific PHP Version

You can tell `wp-env` to use a specific PHP version for compatibility and testing. This can also be set via the environment variable `WP_ENV_PHP_VERSION`.

```json
{
	"phpVersion": "7.2",
	"plugins": [ "." ]
}
```

### Node Lifecycle Script

This is useful for performing some actions after setting up the environment, such as bootstrapping an E2E test environment.

```json
{
	"lifecycleScripts": {
		"afterStart": "node tests/e2e/bin/setup-env.js"
	}
}
```

### Advanced PHP settings

You can set PHP settings by mapping an `.htaccess` file. This maps an `.htaccess` file to the WordPress root (`/var/www/html`) from the directory in which you run `wp-env`.

```json
{
	"mappings": {
		".htaccess": ".htaccess"
	}
}
```

Then, your .htaccess file can contain various settings like this:

```
# Note: the default upload value is 1G.
php_value post_max_size 2G
php_value upload_max_filesize 2G
php_value memory_limit 2G
```

This is useful if there are options you'd like to add to `php.ini`, which is difficult to access in this environment.

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
