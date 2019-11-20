# `@wordpress/env`

> A zero-config, self contained local WordPress environment for development and testing.

## Usage

```sh
$ npm -g i @wordpress/env

$ cd path/to/plugin-or-theme # WordPress install will be in path/to/plugin-or-theme-wordpress.

$ wp-env --help

wp-env <command>

Commands:
  wp-env start [ref]          Starts WordPress for development on port 8888
                              (​http://localhost:8888​) (override with
                              WP_ENV_PORT) and tests on port 8889
                              (​http://localhost:8889​) (override with
                              WP_ENV_TESTS_PORT). If the current working
                              directory is a plugin and/or has e2e-tests with
                              plugins and/or mu-plugins, they will be mounted
                              appropriately.
  wp-env stop                 Stops running WordPress for development and tests
                              and frees the ports.
  wp-env clean [environment]  Cleans the WordPress databases.

Options:
  --help     Show help                                                 [boolean]
  --version  Show version number                                       [boolean]
```

### `$ wp-env start --help`

```sh
wp-env start [ref]

Starts WordPress for development on port 8888 (​http://localhost:8888​)
(override with WP_ENV_PORT) and tests on port 8889 (​http://localhost:8889​)
(override with WP_ENV_TESTS_PORT). If the current working directory is a plugin
and/or has e2e-tests with plugins and/or mu-plugins, they will be mounted
appropriately.

Positionals:
  ref  A `https://github.com/WordPress/WordPress` git repo branch or commit for
       choosing a specific version.                 [string] [default: "master"]
```

### `$ wp-env stop --help`

```sh
wp-env stop

Stops running WordPress for development and tests and frees the ports.
```

### `$ wp-env clean --help`

```sh
wp-env clean [environment]

Cleans the WordPress databases.

Positionals:
  environment  Which environments' databases to clean.
            [string] [choices: "all", "development", "tests"] [default: "tests"]
```

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>

## The Configuration File

You may also specify a configuration file for `wp-env`. This can be useful for loading other themes and plugins that you are developing simultaneously. The script will attach the specified theme and plugin directories as volumes on the docker container so that changes you make to them exist in the WordPress instance.

### Example:
The config file is plain JSON with the name `wp-env.json`. The format of the file looks like this:

`wp-env.json`
```json
{
  "themes": [
    "../path/to/theme/dir"
  ],
  "plugins": [
    "../path/to/plugin/dir"
  ]
}
```

### Specifc Usage:

This file should be located in the same directory from which you run `wp-env` commands for a project. So if you are running `wp-env` in the root directory of a plugin, `wp-env.json` should also be located there. 

Each item in the `themes` or `plugins` array should be an absolute or relative path to the root of a different theme or plugin directory. Relative paths will be resolved from the current working directory of the script, which means they are resolved from the location of the `wp-env.json` file.